import { freshDeck, shuffled, type Card } from './cards';
import { evaluateBest, compareHandScore, CATEGORY_NAME } from './evaluator';
import { estimateEquity } from './equity';
import { classifyBoard, detectDraws } from './boardTexture';
import { evOfBet, evOfCall } from './odds';
import { ALL_HANDS, RANKS, scoreOf, type HandCell } from './hands';
import { positionsForSize, rfiMix, defendMix, type Position, type RfiPosition, type TableSize } from './ranges';
import { handCategoryLabel, pickExplanation } from './scenarioGenerator';
import { explainPreflopDecision } from './preflopExplain';
import type { SimStreet, SimAction, LogEntry, HeroOption, HeroFeedback } from './simTypes';

export type { SimStreet, SimAction, LogEntry, HeroOption, HeroFeedback };

export interface SimPlayer {
  position: Position;
  isHero: boolean;
  cards: [Card, Card];
  folded: boolean;
  committed: number;
  committedStreet: number;
}

export interface HandSim {
  tableSize: TableSize;
  players: SimPlayer[];
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

function handCellFor(cards: [Card, Card]): HandCell {
  const [a, b] = cards;
  const suited = a.suit === b.suit;
  const hi = a.rank >= b.rank ? a : b;
  const lo = a.rank >= b.rank ? b : a;
  const hiChar = RANKS[14 - hi.rank];
  const loChar = RANKS[14 - lo.rank];
  const label = hi.rank === lo.rank ? `${hiChar}${loChar}` : `${hiChar}${loChar}${suited ? 's' : 'o'}`;
  return ALL_HANDS.find((h) => h.label === label)!;
}

function rangeLabelsAbove(threshold: number): Set<string> {
  const set = new Set<string>();
  for (const hand of ALL_HANDS) if (scoreOf(hand) >= threshold) set.add(hand.label);
  return set;
}

const GENERIC_RANGE = rangeLabelsAbove(4);

function activePlayers(sim: HandSim): SimPlayer[] {
  return sim.players.filter((p) => !p.folded);
}

function getPlayer(sim: HandSim, pos: Position): SimPlayer {
  return sim.players.find((p) => p.position === pos)!;
}

/** Starts a fresh hand: deals every seat two cards, posts blinds, and runs
 * the simulation forward to either the hero's first decision or an
 * uncontested walk. */
export function startHand(tableSize: TableSize): HandSim {
  const order = positionsForSize(tableSize);
  const deck = shuffled(freshDeck());
  const heroPosition = pick(order);
  let cursor = 0;
  const players: SimPlayer[] = order.map((position) => {
    const cards: [Card, Card] = [deck[cursor], deck[cursor + 1]];
    cursor += 2;
    return { position, isHero: position === heroPosition, cards, folded: false, committed: 0, committedStreet: 0 };
  });
  const sb = players.find((p) => p.position === 'SB')!;
  const bb = players.find((p) => p.position === 'BB')!;
  sb.committed = 0.5;
  sb.committedStreet = 0.5;
  bb.committed = 1;
  bb.committedStreet = 1;

  const sim: HandSim = {
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

function openSizeFor(): number {
  return 2.5;
}

function botPreflopDecision(sim: HandSim, player: SimPlayer): { action: SimAction; amount?: number } {
  const hand = handCellFor(player.cards);
  if (sim.openRaiserPosition === null) {
    if (player.position === 'BB') return { action: 'check' };
    const mix = rfiMix(player.position as RfiPosition, hand);
    return Math.random() < mix.raise ? { action: 'raise', amount: openSizeFor() } : { action: 'fold' };
  }
  const mix = defendMix(hand, sim.openRaiserPosition, player.position);
  const roll = Math.random();
  let action: SimAction = roll < mix.raise ? 'raise' : roll < mix.raise + mix.call ? 'call' : 'fold';
  if (action === 'raise' && sim.threeBetHappened) action = 'call';
  if (action === 'raise') return { action, amount: Math.round(sim.currentBet * 3 * 10) / 10 };
  return { action };
}

function botPostflopDecision(sim: HandSim, player: SimPlayer): { action: SimAction; amount?: number } {
  const score = evaluateBest([...player.cards, ...sim.board]);
  const equityResult = estimateEquity({ heroCards: player.cards, board: sim.board, villainRangeLabels: GENERIC_RANGE, iterations: 200 });
  const equity = equityResult.equity;
  const texture = classifyBoard(sim.board);
  const feBase = clamp(0.42 - texture.wetness * 0.25, 0.1, 0.62);
  const facingBet = sim.currentBet > player.committedStreet;

  if (!facingBet) {
    const sizePct = Math.random() < 0.5 ? 0.33 : 0.7;
    const betSize = Math.max(1, Math.round(sim.pot * sizePct));
    const evBet = evOfBet(Math.max(0.05, equity - 0.06), sim.pot, betSize, feBase);
    const evCheck = equity * sim.pot;
    if (evBet > evCheck || (score.category === 0 && Math.random() < 0.12)) {
      return { action: 'bet', amount: betSize };
    }
    return { action: 'check' };
  }

  const callAmt = sim.currentBet - player.committedStreet;
  const evCall = evOfCall(equity, sim.pot, callAmt);
  if (evCall <= 0 && equity < 0.35 && Math.random() > 0.1) return { action: 'fold' };
  if (score.category >= 3 && sim.currentBet < sim.pot * 1.5 && Math.random() < 0.3) {
    return { action: 'raise', amount: sim.currentBet + callAmt * 2 };
  }
  return { action: 'call' };
}

function applyAction(sim: HandSim, position: Position, decision: { action: SimAction; amount?: number }): HandSim {
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
    // bet or raise
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

function heroOptionsFor(sim: HandSim, player: SimPlayer): HeroOption[] {
  if (sim.street === 'preflop') {
    if (sim.openRaiserPosition === null) {
      return [
        { id: 'raise', label: `Raise to ${openSizeFor()}bb`, amount: openSizeFor() },
        { id: 'fold', label: 'Fold' },
      ];
    }
    const raiseTo = Math.round(sim.currentBet * 3 * 10) / 10;
    const callAmt = sim.currentBet - player.committedStreet;
    const opts: HeroOption[] = [];
    if (!sim.threeBetHappened) opts.push({ id: 'raise', label: `Raise to ${raiseTo}bb`, amount: raiseTo });
    opts.push({ id: 'call', label: `Call ${callAmt}bb` });
    opts.push({ id: 'fold', label: 'Fold' });
    return opts;
  }
  const facingBet = sim.currentBet > player.committedStreet;
  if (!facingBet) {
    const small = Math.max(1, Math.round(sim.pot * 0.33));
    const big = Math.max(2, Math.round(sim.pot * 0.75));
    return [
      { id: 'check', label: 'Check' },
      { id: 'bet', label: `Bet ${small}bb (33% pot)`, amount: small },
      { id: 'bet', label: `Bet ${big}bb (75% pot)`, amount: big },
    ];
  }
  const callAmt = sim.currentBet - player.committedStreet;
  const raiseTo = sim.currentBet + callAmt * 2;
  return [
    { id: 'fold', label: 'Fold' },
    { id: 'call', label: `Call ${callAmt}bb` },
    { id: 'raise', label: `Raise to ${raiseTo}bb`, amount: raiseTo },
  ];
}

function buildFeedback(sim: HandSim, player: SimPlayer, chosen: { action: SimAction; amount?: number }): HeroFeedback {
  const score = evaluateBest([...player.cards, ...sim.board]);
  const handLabel = sim.street === 'preflop' ? handCellFor(player.cards).label : handCategoryLabel(score, player.cards, sim.board);

  if (sim.street === 'preflop') {
    const hand = handCellFor(player.cards);
    const mix = sim.openRaiserPosition === null ? { raise: rfiMix(player.position as RfiPosition, hand).raise, call: 0, fold: 1 - rfiMix(player.position as RfiPosition, hand).raise } : defendMix(hand, sim.openRaiserPosition, player.position);
    const bestId: SimAction = mix.raise >= mix.call && mix.raise >= mix.fold ? 'raise' : mix.call >= mix.fold ? 'call' : 'fold';
    return {
      chosenId: chosen.action,
      bestId,
      equityPct: Math.round(mix.raise * 1000) / 10,
      handLabel,
      concept: sim.openRaiserPosition === null ? 'Opening range' : 'Big blind defense',
      explanation: explainPreflopDecision(player.position, hand, bestId, mix),
    };
  }

  const equityResult = estimateEquity({ heroCards: player.cards, board: sim.board, villainRangeLabels: GENERIC_RANGE, iterations: 300 });
  const equity = equityResult.equity;
  const texture = classifyBoard(sim.board);
  const feBase = clamp(0.42 - texture.wetness * 0.25, 0.1, 0.62);
  const facingBet = sim.currentBet > player.committedStreet;

  let bestId: SimAction;
  if (!facingBet) {
    const betSize = Math.max(1, Math.round(sim.pot * 0.5));
    const evBet = evOfBet(Math.max(0.05, equity - 0.06), sim.pot, betSize, feBase);
    const evCheck = equity * sim.pot;
    bestId = evBet > evCheck ? 'bet' : 'check';
  } else {
    const callAmt = sim.currentBet - player.committedStreet;
    const evCall = evOfCall(equity, sim.pot, callAmt);
    bestId = evCall > 0 || equity > 0.35 ? 'call' : 'fold';
  }

  const concept = facingBet ? 'Bluff-catching' : 'Continuation betting';
  const isAggressor = sim.openRaiserPosition === player.position;
  const draws = sim.street !== 'river' ? detectDraws(player.cards, sim.board) : { flushDraw: false, straightDraw: false, comboDraw: false };
  const hasDraw = draws.flushDraw || draws.straightDraw || draws.comboDraw;
  const line = pickExplanation(facingBet ? 'facing-bet' : 'checked', bestId, texture, isAggressor, score.category, hasDraw);
  const explanation =
    chosen.action === bestId
      ? `With ${handLabel} and ${Math.round(equity * 100)}% equity on a ${texture.summary} board, ${bestId} is the solid play here. ${line}`
      : `With ${handLabel} and ${Math.round(equity * 100)}% equity on a ${texture.summary} board, the stronger line was ${bestId} rather than ${chosen.action}. ${line}`;

  return { chosenId: chosen.action, bestId, equityPct: Math.round(equity * 1000) / 10, handLabel, concept, explanation };
}

/** Runs the simulation forward: bots act automatically until it's the
 * hero's turn, the street needs to advance, or the hand ends. */
export function advance(sim: HandSim): HandSim {
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
    // preflop: player already matches current bet and isn't the BB-with-option case → skip
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

function postflopOrder(sim: HandSim): Position[] {
  const order = positionsForSize(sim.tableSize);
  const sbIdx = order.indexOf('SB');
  const rotated = [...order.slice(sbIdx), ...order.slice(0, sbIdx)];
  return rotated.filter((pos) => !getPlayer(sim, pos).folded);
}

function dealNextStreet(sim: HandSim): HandSim {
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

function resolveByFold(sim: HandSim, winner: Position): HandSim {
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

function resolveShowdown(sim: HandSim): HandSim {
  const active = activePlayers(sim);
  const scored = active.map((p) => ({ p, score: evaluateBest([...p.cards, ...sim.board]) }));
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
export function applyHeroAction(sim: HandSim, chosen: { action: SimAction; amount?: number }): HandSim {
  const heroPlayer = sim.players.find((p) => p.isHero)!;
  const feedback = buildFeedback(sim, heroPlayer, chosen);
  const applied = applyAction(sim, heroPlayer.position, chosen);
  return { ...applied, lastFeedback: feedback, heroTurn: false, heroOptions: [] };
}
