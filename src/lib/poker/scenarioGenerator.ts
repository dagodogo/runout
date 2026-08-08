import { freshDeck, removeCards, shuffled, cardDisplay, type Card } from './cards';
import { evaluateBest, CATEGORY_NAME } from './evaluator';
import { estimateEquity, combosForHand } from './equity';
import { classifyBoard, detectDraws, type BoardTexture } from './boardTexture';
import { evOfBet, evOfCall } from './odds';
import { ALL_HANDS } from './hands';
import { defendersFor, defendMix, positionsForSize, rfiMix, type Position, type RfiPosition, type TableSize } from './ranges';
import { LEAK_CATEGORY_LABEL, type LeakCategory } from './scenarios';

export type Street = 'flop' | 'turn' | 'river';
export type FacingMode = 'checked' | 'facing-bet';

export interface ScenarioOption {
  id: string;
  label: string;
  ev: number;
}

export interface GeneratedScenario {
  id: string;
  street: Street;
  mode: FacingMode;
  category: LeakCategory;
  tableSize: TableSize;
  heroPosition: Position;
  villainPosition: Position;
  isHeroAggressor: boolean;
  board: Card[];
  heroCards: [Card, Card];
  potBb: number;
  effectiveStackBb: number;
  facingBetBb: number | null;
  facing: string;
  handCategoryLabel: string;
  equityPct: number;
  texture: BoardTexture;
  options: ScenarioOption[];
  bestOptionId: string;
  explanation: string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Weights toward the spots that actually happen most in real poker — BB
 * defends far more often than any single cold-call, blinds cold-calling less
 * than a later non-blind seat with position. */
function pickDefender(defenders: Position[]): Position {
  const weighted = defenders.map((pos) => {
    let weight = 1;
    if (pos === 'BB') weight = 4;
    else if (pos === 'SB') weight = 0.4;
    else if (pos === 'BTN' || pos === 'CO') weight = 1.6;
    else weight = 0.6;
    return { pos, weight };
  });
  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.pos;
  }
  return weighted[weighted.length - 1].pos;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Draws a concrete hero hand from a plausible abstract range, weighted by real
 * combo counts, and returns the matching two cards from an unused deck. */
function dealHandFromRange(rangeLabels: Set<string>, unused: Card[]): [Card, Card] {
  const candidates = ALL_HANDS.filter((h) => rangeLabels.has(h.label));
  const shuffledCandidates = shuffled(candidates);
  for (const hand of shuffledCandidates) {
    const combos = combosForHand(hand, unused);
    if (combos.length > 0) return pick(combos);
  }
  // Degenerate fallback (shouldn't happen with a reasonably sized range).
  const deck = shuffled(unused);
  return [deck[0], deck[1]];
}

function rangeLabelsAbove(positionRaise: (h: (typeof ALL_HANDS)[number]) => number, threshold: number): Set<string> {
  const set = new Set<string>();
  for (const hand of ALL_HANDS) if (positionRaise(hand) >= threshold) set.add(hand.label);
  return set;
}

function handCategoryLabel(score: { category: number; tiebreak: number[] }, heroCards: Card[], board: Card[]): string {
  if (score.category >= 2) return CATEGORY_NAME[score.category];
  if (score.category === 1) {
    const boardRanks = board.map((c) => c.rank).sort((a, b) => b - a);
    const pairRank = score.tiebreak[0];
    if (pairRank > boardRanks[0]) return 'Overpair';
    if (pairRank === boardRanks[0]) return 'Top pair';
    if (pairRank === boardRanks[boardRanks.length - 1]) return 'Bottom pair';
    return 'Middle pair';
  }
  const draws = detectDraws(heroCards, board);
  if (draws.comboDraw) return 'Combo draw (flush + straight)';
  if (draws.flushDraw) return 'Flush draw';
  if (draws.straightDraw) return 'Straight draw';
  return 'No pair, no draw';
}

function categorize(mode: FacingMode, street: Street, hasDraw: boolean, bestOptionId: string, monotone: boolean): LeakCategory {
  if (mode === 'checked') {
    if (street === 'river' && bestOptionId.startsWith('bet')) return 'river-bluff';
    return 'c-bet';
  }
  if (hasDraw && bestOptionId === 'raise') return 'draw-equity';
  if (monotone && bestOptionId !== 'fold') return 'blockers';
  return 'bluff-catch';
}

const TEXTURE_LINES = {
  dryHighAggressor: [
    "This board is high and disconnected — it hits your opening range far more than a caller's range, so you're the one with the advantage here.",
    "Dry, high-card boards like this favor the preflop raiser's range almost across the board — few hands beat you and few draws are live.",
  ],
  wetLowDefender: [
    'Low, connected boards like this actually favor a calling range more than a raiser\'s range — a lot of the hands that flat preflop connect hard with cards like these.',
    'This texture is exactly the kind that hits a wide defending range — straights, two pairs, and sets are all live for the caller.',
  ],
  monotoneSmall: [
    "The board is three-to-a-suit, so a flush is always in the conversation. That usually calls for smaller bets, not bigger ones — you can't extract more from non-flush hands just because one card is possible.",
  ],
  monotoneBig: [
    "The board is three-to-a-suit, but with a hand this strong you're betting big on purpose — you likely hold the best possible hand or close to it, so the flush card isn't a reason to slow down.",
  ],
  paired: [
    'A paired board removes some trip combos from both ranges and plays drier than it looks, even though the danger of trips is still real.',
  ],
};

const CBET_BET_LINES = [
  'With range and nut advantage here, betting applies maximum pressure — a lot of what got to this point simply can\'t continue.',
  'Checking back would give up value against a range that\'s mostly weaker than yours on this texture.',
];

const CBET_CHECK_LINES = [
  "Betting here would mostly be building a pot against a range that hits this board as hard as you do — checking keeps you out of trouble and controls the pot.",
  'There\'s no real range or nut advantage on a texture like this, so firing a bet just bloats the pot against hands that often have you beat.',
];

const CALL_MADE_HAND_LINES = [
  'The price is good enough here — you don\'t need to be ahead often for this call to show a profit over time.',
  'This is a math call: your equity clears what the pot is laying, even without a specific read.',
];

const CALL_DRAW_LINES = [
  "You're not ahead right now, but the price plus what you can win when you hit make this call correct — that's implied odds, not just pot odds.",
  'This is a drawing call: the immediate pot odds plus the extra value on later streets when you connect are enough to continue.',
];

const FOLD_LINES = [
  "The price isn't there, and there's no blocker or specific read to lean on — folding is the disciplined default.",
  'Calling here needs a real reason (a blocker, a busted-draw read, a betting-pattern tell) — absent that, this is a fold.',
];

const RAISE_VALUE_LINES = [
  "This hand is strong enough to raise for value — you want to build the pot now while you're likely ahead, not just call and let a scare card slow you down.",
  "You're raising a genuinely strong hand here, not a bluff — the goal is to get more money in while you have the best of it.",
];

const RAISE_DRAW_LINES = [
  'This hand has real equity and real fold equity at the same time — raising turns "win later" into "win now or win bigger."',
  'A combo draw like this is strong enough to be the aggressor instead of just calling to see the next card.',
];

const RAISE_BLUFF_LINES = [
  "You don't have much of a made hand here, but the fold equity is real — this raise is a pure pressure play, not a value bet.",
  'This is a bluff raise: the hand itself is weak, but the pressure it applies is worth more than checking it down would be.',
];

function pickExplanation(
  mode: FacingMode,
  bestOptionId: string,
  texture: BoardTexture,
  isAggressor: boolean,
  handCategory: number,
  hasDraw: boolean,
): string {
  const parts: string[] = [];
  if (texture.tags.includes('monotone')) {
    const bigBet = bestOptionId === 'bet-75' || bestOptionId === 'raise';
    parts.push(pick(bigBet ? TEXTURE_LINES.monotoneBig : TEXTURE_LINES.monotoneSmall));
  } else if (texture.tags.includes('paired')) parts.push(pick(TEXTURE_LINES.paired));
  else if (texture.tags.includes('high') && texture.tags.includes('disconnected') && isAggressor) {
    parts.push(pick(TEXTURE_LINES.dryHighAggressor));
  } else if (texture.tags.includes('low') && texture.tags.includes('connected')) {
    parts.push(pick(TEXTURE_LINES.wetLowDefender));
  }

  if (mode === 'checked') {
    parts.push(bestOptionId.startsWith('bet') ? pick(CBET_BET_LINES) : pick(CBET_CHECK_LINES));
  } else if (bestOptionId === 'call') {
    parts.push(handCategory === 0 && hasDraw ? pick(CALL_DRAW_LINES) : pick(CALL_MADE_HAND_LINES));
  } else if (bestOptionId === 'fold') {
    parts.push(pick(FOLD_LINES));
  } else {
    if (handCategory >= 2) parts.push(pick(RAISE_VALUE_LINES));
    else if (hasDraw) parts.push(pick(RAISE_DRAW_LINES));
    else parts.push(pick(RAISE_BLUFF_LINES));
  }

  return parts.join(' ');
}

let counter = 0;

export function generateScenario(tableSize: TableSize = 6): GeneratedScenario {
  const rfiPositions = positionsForSize(tableSize).filter((p): p is RfiPosition => p !== 'BB');
  const raiserPos = pick(rfiPositions);
  const defenderPos = pickDefender(defendersFor(raiserPos, tableSize));
  const heroIsRaiser = Math.random() < 0.5;
  const street: Street = pick<Street>(['flop', 'flop', 'flop', 'turn', 'turn', 'river']);
  const mode: FacingMode = heroIsRaiser ? 'checked' : 'facing-bet';

  const deck = freshDeck();

  // Deal hero's hand from a realistic range for their role.
  const raiserRange = rangeLabelsAbove((h) => rfiMix(raiserPos, h).raise, 0.15);
  const defenderCallRange = rangeLabelsAbove((h) => defendMix(h, raiserPos, defenderPos).call, 0.15);
  const heroRangeLabels = heroIsRaiser ? raiserRange : defenderCallRange;
  const heroCards = dealHandFromRange(heroRangeLabels, deck);
  const unusedAfterHero = removeCards(deck, heroCards);

  const boardLength = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
  const board = shuffled(unusedAfterHero).slice(0, boardLength);

  const texture = classifyBoard(board);
  const draws = street !== 'river' ? detectDraws(heroCards, board) : { flushDraw: false, straightDraw: false, comboDraw: false };
  const heroScore = evaluateBest([...heroCards, ...board]);
  const catLabel = handCategoryLabel(heroScore, heroCards, board);

  // Villain's range: whichever side hero *isn't* playing.
  const villainRangeLabels = heroIsRaiser ? defenderCallRange : raiserRange;
  const equityResult = estimateEquity({ heroCards, board, villainRangeLabels, iterations: 320 });
  const equity = equityResult.equity;
  const equityIfContinues = Math.max(0.05, equity - 0.08);

  const potBase = street === 'flop' ? randRange(6, 11) : street === 'turn' ? randRange(14, 24) : randRange(24, 42);
  const potBb = Math.round(potBase);
  const effectiveStackBb = Math.round(randRange(55, 100));

  const feBase = Math.max(0.08, Math.min(0.7, 0.45 - texture.wetness * 0.3 + (heroIsRaiser ? 0.05 : 0)));

  // On flush-possible boards, bigger bets get called relatively more often by
  // exactly the hands that beat you — penalize larger sizings unless the hand
  // is strong enough (two pair+) to not care.
  const monotonePenalty = (betSize: number) =>
    texture.tags.includes('monotone') && heroScore.category < 2 ? (betSize / potBb) * 0.16 : 0;
  const equityForBet = (betSize: number) => Math.max(0.04, equityIfContinues - monotonePenalty(betSize));

  let options: ScenarioOption[];
  let facing: string;
  let facingBetBb: number | null = null;

  if (mode === 'checked') {
    const betSmall = Math.max(1, Math.round(potBb * 0.33));
    const betBig = Math.max(2, Math.round(potBb * 0.75));
    const feSmall = feBase * 0.75;
    const feBig = Math.min(0.75, feBase * 1.2);
    options = [
      { id: 'check', label: 'Check back', ev: equity * potBb },
      { id: 'bet-33', label: `Bet ${betSmall}bb (33% pot)`, ev: evOfBet(equityForBet(betSmall), potBb, betSmall, feSmall) },
      { id: 'bet-75', label: `Bet ${betBig}bb (75% pot)`, ev: evOfBet(equityForBet(betBig), potBb, betBig, feBig) },
    ];
    facing = 'Checked to you';
  } else {
    const villainBet = Math.max(2, Math.round(potBb * randRange(0.5, 0.75)));
    const raiseTo = Math.max(villainBet + 2, Math.round(villainBet * 3));
    const feRaise = Math.min(0.8, feBase * 1.4);
    options = [
      { id: 'fold', label: 'Fold', ev: 0 },
      { id: 'call', label: `Call ${villainBet}bb`, ev: evOfCall(equity, potBb, villainBet) },
      { id: 'raise', label: `Raise to ${raiseTo}bb`, ev: evOfBet(equityForBet(raiseTo), potBb + villainBet, raiseTo, feRaise) },
    ];
    facing = `Villain bets ${villainBet}bb into ${potBb}bb`;
    facingBetBb = villainBet;
  }

  const bestOptionId = options.reduce((best, o) => (o.ev > best.ev ? o : best), options[0]).id;
  const hasDraw = draws.flushDraw || draws.straightDraw;
  const explanation = pickExplanation(mode, bestOptionId, texture, heroIsRaiser, heroScore.category, hasDraw);
  const category = categorize(mode, street, hasDraw, bestOptionId, texture.tags.includes('monotone'));

  counter += 1;

  return {
    id: `gen-${Date.now()}-${counter}`,
    street,
    mode,
    category,
    tableSize,
    heroPosition: heroIsRaiser ? raiserPos : defenderPos,
    villainPosition: heroIsRaiser ? defenderPos : raiserPos,
    isHeroAggressor: heroIsRaiser,
    board,
    heroCards,
    potBb,
    effectiveStackBb,
    facingBetBb,
    facing,
    handCategoryLabel: catLabel,
    equityPct: Math.round(equity * 1000) / 10,
    texture,
    options,
    bestOptionId,
    explanation,
  };
}

export { cardDisplay };
export { LEAK_CATEGORY_LABEL };
export type { LeakCategory };
