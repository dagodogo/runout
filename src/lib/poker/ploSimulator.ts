import { freshDeck, shuffled, type Card } from './cards';
import { compareHandScore, CATEGORY_NAME } from './evaluator';
import { evaluatePLOBest } from './ploEvaluator';
import { estimatePloEquity } from './ploEquity';
import { ploHandScore, ploHandDescription } from './ploHands';
import { classifyBoard, detectDraws } from './boardTexture';
import { evOfBet, evOfCall } from './odds';
import { positionsForSize, type Position, type RfiPosition, type TableSize } from './ranges';
import { handCategoryLabel, pickExplanation } from './scenarioGenerator';
import type { SimStreet, SimAction, LogEntry, HeroOption, HeroFeedback } from './simTypes';

export type { SimStreet, SimAction, LogEntry, HeroOption, HeroFeedback };

export interface PloSimPlayer {
  position: Position;
  isHero: boolean;
  cards: Card[];
  folded: boolean;
  committed: number;
  committedStreet: number;
}

export interface PloHandSim {
  tableSize: TableSize;
  players: PloSimPlayer[];
  deck: Card[];
  board: Card[];
  street: SimStreet;
  pot: number;
  currentBet: number;
  openRaiserPosition: RfiPosition | null;
  threeBetHappened: boolean;
  queue: Position[];
  log: LogEntry[];
  heroTurn: boolean;
  heroOptions: HeroOption[];
  handOver: boolean;
  lastFeedback: HeroFeedback | null;
  result?: {
    winners: Position[];
    wonByFold: boolean;
    heroNet: number;
    summary: string;
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function activePlayers(sim: PloHandSim): PloSimPlayer[] {
  return sim.players.filter((p) => !p.folded);
}

function getPlayer(sim: PloHandSim, pos: Position): PloSimPlayer {
  return sim.players.find((p) => p.position === pos)!;
}

/** Pot-limit betting: the maximum you can raise TO is your own call amount
 * plus the size the pot would be immediately after that call — poker's
 * standard pot-limit formula. Preflop opens and postflop bets both use the
 * same rule with an empty "call" (currentBet stays put, call amount is 0). */
function potLimitMaxRaiseTo(sim: PloHandSim, player: PloSimPlayer): number {
  const callAmt = Math.max(0, sim.currentBet - player.committedStreet);
  const potAfterCall = sim.pot + callAmt;
  return Math.round((sim.currentBet + potAfterCall) * 10) / 10;
}

function potLimitMaxOpenBet(sim: PloHandSim): number {
  return Math.round(sim.pot * 10) / 10;
}

function startingHandScore(cards: Card[]): number {
  return ploHandScore(cards);
}

/** Starts a fresh hand: deals every seat four cards, posts blinds, and runs
 * the simulation forward to either the hero's first decision or an
 * uncontested walk. */
export function startPloHand(tableSize: TableSize): PloHandSim {
  const order = positionsForSize(tableSize);
  const deck = shuffled(freshDeck());
  const heroPosition = pick(order);
  let cursor = 0;
  const players: PloSimPlayer[] = order.map((position) => {
    const cards = deck.slice(cursor, cursor + 4);
    cursor += 4;
    return { position, isHero: position === heroPosition, cards, folded: false, committed: 0, committedStreet: 0 };
  });
  const sb = players.find((p) => p.position === 'SB')!;
  const bb = players.find((p) => p.position === 'BB')!;
  sb.committed = 0.5;
  sb.committedStreet = 0.5;
  bb.committed = 1;
  bb.committedStreet = 1;

  const sim: PloHandSim = {
    tableSize,
    players,
    deck: deck.slice(cursor),
    board: [],
    street: 'preflop',
    pot: 1.5,
    currentBet: 1,
    openRaiserPosition: null,
    threeBetHappened: false,
    queue: [...order],
    log: [],
    heroTurn: false,
    heroOptions: [],
    handOver: false,
    lastFeedback: null,
  };
  return advance(sim);
}

/** PLO hands run much closer together than hold'em, so opening/continuing
 * thresholds are heuristic percentile bands over the 0-100 strength score
 * rather than a solved-mix lookup table. Later positions get to open wider
 * since fewer players remain to wake up with a big double-suited hand.
 * Thresholds are calibrated against the actual score distribution (median
 * ~12, p75 ~20, p90 ~30 over random 4-card hands) so opening frequencies
 * land in a realistic range instead of folding almost everything. */
function openThreshold(position: RfiPosition): number {
  const order: RfiPosition[] = ['UTG', 'UTG1', 'UTG2', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB'];
  const idx = order.indexOf(position);
  return 24 - idx * 1.6;
}

const CONTINUE_THRESHOLD = 13;
const RAISE_THRESHOLD = 30;

function botPreflopDecision(sim: PloHandSim, player: PloSimPlayer): { action: SimAction; amount?: number } {
  const strength = startingHandScore(player.cards);
  const potRaise = potLimitMaxOpenBet(sim) > 0 ? Math.round((sim.pot + 1) * 10) / 10 : 3.5;

  if (sim.openRaiserPosition === null) {
    if (player.position === 'BB') return { action: 'check' };
    const threshold = openThreshold(player.position as RfiPosition);
    return strength >= threshold ? { action: 'raise', amount: Math.min(potLimitMaxRaiseTo(sim, player), potRaise + 2) } : { action: 'fold' };
  }

  const callAmt = sim.currentBet - player.committedStreet;
  if (strength < CONTINUE_THRESHOLD) return { action: 'fold' };
  if (strength >= RAISE_THRESHOLD && !sim.threeBetHappened && Math.random() < 0.4) {
    return { action: 'raise', amount: potLimitMaxRaiseTo(sim, player) };
  }
  return callAmt > 0 ? { action: 'call' } : { action: 'check' };
}

function botPostflopDecision(sim: PloHandSim, player: PloSimPlayer): { action: SimAction; amount?: number } {
  const score = evaluatePLOBest(player.cards, sim.board);
  const equityResult = estimatePloEquity({ heroCards: player.cards, board: sim.board, iterations: 150 });
  const equity = equityResult.equity;
  const texture = classifyBoard(sim.board);
  const feBase = clamp(0.35 - texture.wetness * 0.2, 0.08, 0.5);
  const facingBet = sim.currentBet > player.committedStreet;

  if (!facingBet) {
    const sizePct = Math.random() < 0.5 ? 0.5 : 1;
    const betSize = Math.min(Math.max(1, Math.round(sim.pot * sizePct)), potLimitMaxOpenBet(sim));
    const evBet = evOfBet(Math.max(0.05, equity - 0.08), sim.pot, betSize, feBase);
    const evCheck = equity * sim.pot;
    if (evBet > evCheck) return { action: 'bet', amount: betSize };
    return { action: 'check' };
  }

  const callAmt = sim.currentBet - player.committedStreet;
  const evCall = evOfCall(equity, sim.pot, callAmt);
  // PLO hands need to actually be strong (or have huge redraws) to keep raising —
  // equities run closer, so the bar for continuing is higher than in hold'em.
  if (evCall <= 0 && equity < 0.42) return { action: 'fold' };
  if (score.category >= 5 && Math.random() < 0.35) {
    return { action: 'raise', amount: potLimitMaxRaiseTo(sim, player) };
  }
  return { action: 'call' };
}

function applyAction(sim: PloHandSim, position: Position, decision: { action: SimAction; amount?: number }): PloHandSim {
  const players = sim.players.map((p) => ({ ...p }));
  const player = players.find((p) => p.position === position)!;
  let pot = sim.pot;
  let currentBet = sim.currentBet;
  let openRaiserPosition = sim.openRaiserPosition;
  let threeBetHappened = sim.threeBetHappened;
  let queue = sim.queue;

  if (decision.action === 'fold') {
    player.folded = true;
  } else if (decision.action === 'check') {
    // no chip movement
  } else if (decision.action === 'call') {
    const delta = currentBet - player.committedStreet;
    player.committedStreet = currentBet;
    player.committed += delta;
    pot += delta;
  } else {
    const amount = decision.amount!;
    const delta = amount - player.committedStreet;
    player.committedStreet = amount;
    player.committed += delta;
    pot += delta;
    const wasOpen = sim.street === 'preflop' && openRaiserPosition === null;
    currentBet = amount;
    if (sim.street === 'preflop') {
      if (wasOpen) openRaiserPosition = position as RfiPosition;
      else threeBetHappened = true;
    }
    const others = players.filter((p) => p.position !== position && !p.folded).map((p) => p.position);
    queue = others;
  }

  const log: LogEntry[] = [...sim.log, { street: sim.street, position, action: decision.action, amount: decision.amount, isHero: player.isHero }];

  return { ...sim, players, pot, currentBet, openRaiserPosition, threeBetHappened, queue, log };
}

function heroOptionsFor(sim: PloHandSim, player: PloSimPlayer): HeroOption[] {
  const maxRaise = potLimitMaxRaiseTo(sim, player);
  if (sim.street === 'preflop') {
    if (sim.openRaiserPosition === null) {
      const openTo = Math.min(3.5, maxRaise);
      return [
        { id: 'raise', label: `Raise to ${openTo}bb (pot)`, amount: openTo },
        { id: 'fold', label: 'Fold' },
      ];
    }
    const callAmt = sim.currentBet - player.committedStreet;
    const opts: HeroOption[] = [];
    if (!sim.threeBetHappened) opts.push({ id: 'raise', label: `Raise to ${maxRaise}bb (pot)`, amount: maxRaise });
    opts.push({ id: 'call', label: `Call ${callAmt}bb` });
    opts.push({ id: 'fold', label: 'Fold' });
    return opts;
  }
  const facingBet = sim.currentBet > player.committedStreet;
  if (!facingBet) {
    const half = Math.min(Math.max(1, Math.round(sim.pot * 0.5)), maxRaise);
    const full = Math.min(Math.max(2, Math.round(sim.pot)), maxRaise);
    const opts: HeroOption[] = [{ id: 'check', label: 'Check' }, { id: 'bet', label: `Bet ${half}bb (half pot)`, amount: half }];
    if (full > half) opts.push({ id: 'bet', label: `Bet ${full}bb (pot)`, amount: full });
    return opts;
  }
  const callAmt = sim.currentBet - player.committedStreet;
  return [
    { id: 'fold', label: 'Fold' },
    { id: 'call', label: `Call ${callAmt}bb` },
    { id: 'raise', label: `Raise to ${maxRaise}bb (pot)`, amount: maxRaise },
  ];
}

function buildFeedback(sim: PloHandSim, player: PloSimPlayer, chosen: { action: SimAction; amount?: number }): HeroFeedback {
  const score = evaluatePLOBest(player.cards, sim.board);
  const shape = ploHandDescription(player.cards);
  const handLabel = sim.street === 'preflop' ? shape : handCategoryLabel(score, [], sim.board);

  if (sim.street === 'preflop') {
    const strength = startingHandScore(player.cards);
    let bestId: SimAction;
    let explanation: string;
    if (sim.openRaiserPosition === null) {
      const threshold = player.position === 'BB' ? 0 : openThreshold(player.position as RfiPosition);
      bestId = player.position === 'BB' ? 'check' : strength >= threshold ? 'raise' : 'fold';
      explanation =
        strength >= threshold
          ? `This hand is ${shape} — strong enough to open. All four cards work together instead of one riding along as a dangler, which is what actually matters in PLO since only two of them end up in your final hand.`
          : `This hand is ${shape} — in PLO that usually means at least one card almost never contributes to your best five-card hand, so opening here just builds a pot with a hand that plays worse than its four cards suggest.`;
    } else {
      bestId = strength >= RAISE_THRESHOLD ? 'raise' : strength >= CONTINUE_THRESHOLD ? 'call' : 'fold';
      explanation =
        bestId === 'fold'
          ? `Facing a raise with ${shape}, there isn't enough synergy between the four cards to continue — PLO punishes hands that can't turn into the nuts on a good runout.`
          : bestId === 'raise'
            ? `${shape} is strong enough to reraise here — premium PLO hands want to build the pot before the flop while they're a bigger favorite than they'll often be by the river.`
            : `${shape} has real playability — enough connectivity and suitedness to see a flop profitably — without being strong enough to drive the betting yet.`;
    }
    return {
      chosenId: chosen.action,
      bestId,
      equityPct: Math.round(strength * 10) / 10,
      handLabel,
      concept: sim.openRaiserPosition === null ? 'Opening range' : 'Preflop continuing range',
      explanation,
    };
  }

  const equityResult = estimatePloEquity({ heroCards: player.cards, board: sim.board, iterations: 300 });
  const equity = equityResult.equity;
  const texture = classifyBoard(sim.board);
  const feBase = clamp(0.35 - texture.wetness * 0.2, 0.08, 0.5);
  const facingBet = sim.currentBet > player.committedStreet;

  let bestId: SimAction;
  if (!facingBet) {
    const betSize = Math.max(1, Math.round(sim.pot * 0.66));
    const evBet = evOfBet(Math.max(0.05, equity - 0.08), sim.pot, betSize, feBase);
    const evCheck = equity * sim.pot;
    bestId = evBet > evCheck ? 'bet' : 'check';
  } else {
    const callAmt = sim.currentBet - player.committedStreet;
    const evCall = evOfCall(equity, sim.pot, callAmt);
    bestId = evCall > 0 || equity > 0.42 ? 'call' : 'fold';
  }

  const concept = facingBet ? 'Bluff-catching' : 'Continuation betting';
  const isAggressor = sim.openRaiserPosition === player.position;
  const draws = sim.street !== 'river' ? detectDraws(player.cards.slice(0, 2) as [Card, Card], sim.board) : { flushDraw: false, straightDraw: false, comboDraw: false };
  const hasDraw = draws.flushDraw || draws.straightDraw || draws.comboDraw;
  const line = pickExplanation(facingBet ? 'facing-bet' : 'checked', bestId, texture, isAggressor, score.category, hasDraw);
  const nutsNote = score.category >= 5 ? " In PLO, made hands need to be nutty or close to it — a hand this strong is exactly the kind that wants to charge everyone drawing behind it." : " Remember that PLO boards run multiple players into real equity far more often than hold'em — a hand that would be comfortably ahead heads-up can easily be a coinflip or worse here.";
  const explanation =
    chosen.action === bestId
      ? `With ${handLabel} and ${Math.round(equity * 100)}% equity on a ${texture.summary} board, ${bestId} is the solid play here. ${line}${nutsNote}`
      : `With ${handLabel} and ${Math.round(equity * 100)}% equity on a ${texture.summary} board, the stronger line was ${bestId} rather than ${chosen.action}. ${line}${nutsNote}`;

  return { chosenId: chosen.action, bestId, equityPct: Math.round(equity * 1000) / 10, handLabel, concept, explanation };
}

/** Runs the simulation forward: bots act automatically until it's the
 * hero's turn, the street needs to advance, or the hand ends. */
export function advance(sim: PloHandSim): PloHandSim {
  let s = sim;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const active = activePlayers(s);
    if (active.length === 1) {
      return resolveByFold(s, active[0].position);
    }

    if (s.queue.length === 0) {
      if (s.street === 'river') return resolveShowdown(s);
      s = dealNextStreet(s);
      continue;
    }

    const [nextPos, ...rest] = s.queue;
    const player = getPlayer(s, nextPos);
    if (player.folded) {
      s = { ...s, queue: rest };
      continue;
    }
    if (s.street === 'preflop' && s.currentBet <= player.committedStreet && !(player.position === 'BB' && s.openRaiserPosition === null)) {
      s = { ...s, queue: rest };
      continue;
    }

    if (player.isHero) {
      return { ...s, queue: rest, heroTurn: true, heroOptions: heroOptionsFor(s, player) };
    }

    const decision = s.street === 'preflop' ? botPreflopDecision(s, player) : botPostflopDecision(s, player);
    s = applyAction({ ...s, queue: rest }, nextPos, decision);
  }
}

function postflopOrder(sim: PloHandSim): Position[] {
  const order = positionsForSize(sim.tableSize);
  const sbIdx = order.indexOf('SB');
  const rotated = [...order.slice(sbIdx), ...order.slice(0, sbIdx)];
  return rotated.filter((pos) => !getPlayer(sim, pos).folded);
}

function dealNextStreet(sim: PloHandSim): PloHandSim {
  const nextStreet: SimStreet = sim.street === 'preflop' ? 'flop' : sim.street === 'flop' ? 'turn' : sim.street === 'turn' ? 'river' : 'showdown';
  const need = sim.street === 'preflop' ? 3 : 1;
  const board = [...sim.board, ...sim.deck.slice(0, need)];
  const deck = sim.deck.slice(need);
  const players = sim.players.map((p) => ({ ...p, committedStreet: 0 }));
  return {
    ...sim,
    street: nextStreet,
    board,
    deck,
    players,
    currentBet: 0,
    openRaiserPosition: sim.openRaiserPosition,
    threeBetHappened: sim.threeBetHappened,
    queue: postflopOrder({ ...sim, players }),
  };
}

function resolveByFold(sim: PloHandSim, winner: Position): PloHandSim {
  const heroPlayer = sim.players.find((p) => p.isHero)!;
  const heroWon = heroPlayer.position === winner;
  const heroNet = heroWon ? sim.pot - heroPlayer.committed : -heroPlayer.committed;
  return {
    ...sim,
    handOver: true,
    heroTurn: false,
    result: {
      winners: [winner],
      wonByFold: true,
      heroNet: Math.round(heroNet * 10) / 10,
      summary: heroWon ? `Everyone folded — you win the ${sim.pot.toFixed(1)}bb pot.` : `${winner} wins the ${sim.pot.toFixed(1)}bb pot uncontested.`,
    },
  };
}

function resolveShowdown(sim: PloHandSim): PloHandSim {
  const active = activePlayers(sim);
  const scored = active.map((p) => ({ p, score: evaluatePLOBest(p.cards, sim.board) }));
  scored.sort((a, b) => compareHandScore(b.score, a.score));
  const bestScore = scored[0].score;
  const winners = scored.filter((s) => compareHandScore(s.score, bestScore) === 0).map((s) => s.p.position);
  const heroPlayer = sim.players.find((p) => p.isHero)!;
  const heroWon = winners.includes(heroPlayer.position);
  const share = sim.pot / winners.length;
  const heroNet = (heroWon ? share : 0) - heroPlayer.committed;
  const winLabel = CATEGORY_NAME[bestScore.category];
  return {
    ...sim,
    street: 'showdown',
    handOver: true,
    heroTurn: false,
    result: {
      winners,
      wonByFold: false,
      heroNet: Math.round(heroNet * 10) / 10,
      summary:
        winners.length > 1
          ? `Split pot between ${winners.join(', ')} with ${winLabel}.`
          : `${winners[0]} wins the ${sim.pot.toFixed(1)}bb pot with ${winLabel}.`,
    },
  };
}

/** Applies only the hero's own action — no bot cascade yet — so the UI can
 * show their card/chip update and feedback before revealing what everyone
 * else does. Call `advance()` on the result (e.g. on a "Continue" click) to
 * play the rest of the street/hand forward. */
export function applyHeroAction(sim: PloHandSim, chosen: { action: SimAction; amount?: number }): PloHandSim {
  const heroPlayer = sim.players.find((p) => p.isHero)!;
  const feedback = buildFeedback(sim, heroPlayer, chosen);
  const applied = applyAction(sim, heroPlayer.position, chosen);
  return { ...applied, lastFeedback: feedback, heroTurn: false, heroOptions: [] };
}
