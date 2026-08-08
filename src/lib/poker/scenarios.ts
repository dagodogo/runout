export type Street = 'flop' | 'turn' | 'river';

export type LeakCategory =
  | 'c-bet'
  | 'bluff-catch'
  | 'draw-equity'
  | 'value-sizing'
  | 'check-raise'
  | 'blockers'
  | 'river-bluff';

export interface ScenarioOption {
  id: string;
  label: string;
  ev: number; // in big blinds, illustrative not solver-exact
}

export interface PostflopScenario {
  id: string;
  street: Street;
  category: LeakCategory;
  heroPosition: string;
  villainPosition: string;
  board: string[];
  heroCards: [string, string];
  potBb: number;
  effectiveStackBb: number;
  facing: string;
  texture: string;
  options: ScenarioOption[];
  bestOptionId: string;
  explanation: string;
}

export const POSTFLOP_SCENARIOS: PostflopScenario[] = [
  {
    id: 'pf-1',
    street: 'flop',
    category: 'c-bet',
    heroPosition: 'BTN',
    villainPosition: 'BB',
    board: ['A♠', '7♦', '2♣'],
    heroCards: ['K♠', 'K♥'],
    potBb: 6,
    effectiveStackBb: 100,
    facing: 'Checked to you',
    texture: 'Dry ace-high board, no flush draw',
    options: [
      { id: 'check', label: 'Check back', ev: 1.4 },
      { id: 'bet-33', label: 'Bet 33% pot', ev: 2.6 },
      { id: 'bet-75', label: 'Bet 75% pot', ev: 1.9 },
    ],
    bestOptionId: 'bet-33',
    explanation:
      'KK is an overpair that mostly wants to deny equity and get thin value from worse pairs — a small c-bet does that cheaply on a dry, ace-high board where villain\'s checking range is capped.',
  },
  {
    id: 'pf-2',
    street: 'flop',
    category: 'draw-equity',
    heroPosition: 'CO',
    villainPosition: 'BTN',
    board: ['J♠', '9♠', '4♦'],
    heroCards: ['Q♠', 'T♠'],
    potBb: 8,
    effectiveStackBb: 95,
    facing: 'Villain bets 5bb into 8bb',
    texture: 'Two-tone board, straight + flush draws live',
    options: [
      { id: 'fold', label: 'Fold', ev: 0 },
      { id: 'call', label: 'Call', ev: 2.1 },
      { id: 'raise', label: 'Raise to 16bb', ev: 2.8 },
    ],
    bestOptionId: 'raise',
    explanation:
      'A combo straight-flush draw with two overcards has huge equity and fold equity here — raising realizes that equity and can win the pot outright when villain folds.',
  },
  {
    id: 'pf-3',
    street: 'river',
    category: 'bluff-catch',
    heroPosition: 'BB',
    villainPosition: 'CO',
    board: ['K♦', '8♣', '3♠', '3♥', '2♦'],
    heroCards: ['K♣', 'J♦'],
    potBb: 22,
    effectiveStackBb: 70,
    facing: 'Villain overbets 30bb into 22bb',
    texture: 'Static board, river blank',
    options: [
      { id: 'fold', label: 'Fold', ev: 0 },
      { id: 'call', label: 'Call', ev: 3.2 },
    ],
    bestOptionId: 'call',
    explanation:
      'Top pair good kicker is a strong bluff-catcher on a board with few scare cards. Overbets are polarized — villain needs to be bluffing often enough that calling shows a profit even against a tight value range.',
  },
  {
    id: 'pf-4',
    street: 'flop',
    category: 'check-raise',
    heroPosition: 'BB',
    villainPosition: 'BTN',
    board: ['7♥', '6♥', '2♠'],
    heroCards: ['7♠', '6♠'],
    potBb: 6,
    effectiveStackBb: 100,
    facing: 'You are first to act',
    texture: 'Low, connected board that favors the big blind range',
    options: [
      { id: 'check-call', label: 'Check, plan to call', ev: 3.0 },
      { id: 'check-raise', label: 'Check, then raise a bet', ev: 4.4 },
      { id: 'lead', label: 'Lead out betting', ev: 2.2 },
    ],
    bestOptionId: 'check-raise',
    explanation:
      'Two pair is way ahead of BTN\'s c-betting range on a board that hits BB more often. Checking induces a bet from air and one-pair hands, then raising builds the pot with a hand that\'s rarely behind.',
  },
  {
    id: 'pf-5',
    street: 'turn',
    category: 'blockers',
    heroPosition: 'BTN',
    villainPosition: 'BB',
    board: ['A♣', 'K♦', '9♣', '9♠'],
    heroCards: ['A♥', 'Q♣'],
    potBb: 14,
    effectiveStackBb: 88,
    facing: 'Checked to you',
    texture: 'Paired board, hero holds the nut-flush blocker',
    options: [
      { id: 'check', label: 'Check back', ev: 3.4 },
      { id: 'bet-50', label: 'Bet 50% pot', ev: 4.6 },
    ],
    bestOptionId: 'bet-50',
    explanation:
      'Top pair top kicker with the club blocker can bet for value against worse aces and kings, and the blocker reduces the chance villain check-raises a flopped club combo.',
  },
  {
    id: 'pf-6',
    street: 'flop',
    category: 'c-bet',
    heroPosition: 'UTG',
    villainPosition: 'BB',
    board: ['9♠', '8♠', '7♠'],
    heroCards: ['Q♦', 'Q♥'],
    potBb: 6,
    effectiveStackBb: 100,
    facing: 'Checked to you',
    texture: 'Monotone, straight-heavy board — terrible for a tight UTG range',
    options: [
      { id: 'check', label: 'Check back', ev: 1.8 },
      { id: 'bet-33', label: 'Bet 33% pot', ev: 0.9 },
      { id: 'bet-75', label: 'Bet 75% pot', ev: 0.4 },
    ],
    bestOptionId: 'check',
    explanation:
      'This board smashes the big blind\'s wide flatting range far more than an UTG open-raiser\'s range. Overpairs like QQ should check back to control the pot and avoid getting raised off the best hand.',
  },
  {
    id: 'pf-7',
    street: 'river',
    category: 'river-bluff',
    heroPosition: 'CO',
    villainPosition: 'BTN',
    board: ['K♠', 'T♦', '6♣', '4♦', '3♦'],
    heroCards: ['A♠', 'A♦'],
    potBb: 18,
    effectiveStackBb: 60,
    facing: 'You are first to act, no pair',
    texture: 'Missed diamond draw, hero has the nut-diamond blocker',
    options: [
      { id: 'check', label: 'Check', ev: 2.0 },
      { id: 'bet-70', label: 'Bet 70% pot as a bluff', ev: 3.1 },
    ],
    bestOptionId: 'bet-70',
    explanation:
      'Overpair that missed still blocks the nut flush and unblocks folding hands. Betting turns AA into a credible bluff here, representing exactly the diamond villain is scared of.',
  },
  {
    id: 'pf-8',
    street: 'flop',
    category: 'value-sizing',
    heroPosition: 'BTN',
    villainPosition: 'CO',
    board: ['2♠', '2♥', '9♦'],
    heroCards: ['9♠', '9♥'],
    potBb: 10,
    effectiveStackBb: 100,
    facing: 'Villain checks',
    texture: 'Set on a dry paired board, opponent range capped',
    options: [
      { id: 'check', label: 'Check back', ev: 4.0 },
      { id: 'bet-33', label: 'Bet 33% pot', ev: 5.5 },
      { id: 'bet-125', label: 'Overbet 125% pot', ev: 4.2 },
    ],
    bestOptionId: 'bet-33',
    explanation:
      'A concealed set on a paired, disconnected board rarely faces a raise, so a smaller bet gets called by more of villain\'s weaker holdings than an overbet would.',
  },
];

export interface LeakStat {
  category: LeakCategory;
  attempts: number;
  correct: number;
}

export const LEAK_CATEGORY_LABEL: Record<LeakCategory, string> = {
  'c-bet': 'Continuation betting',
  'bluff-catch': 'Bluff-catching',
  'draw-equity': 'Playing draws',
  'value-sizing': 'Value bet sizing',
  'check-raise': 'Check-raising',
  blockers: 'Blocker-based bluffs',
  'river-bluff': 'River bluffing',
};

export function randomScenario(excludeId?: string): PostflopScenario {
  const pool = excludeId ? POSTFLOP_SCENARIOS.filter((s) => s.id !== excludeId) : POSTFLOP_SCENARIOS;
  return pool[Math.floor(Math.random() * pool.length)];
}
