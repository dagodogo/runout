export type Street = 'flop' | 'turn' | 'river';

export type LeakCategory =
  | 'c-bet'
  | 'bluff-catch'
  | 'draw-equity'
  | 'value-sizing'
  | 'check-raise'
  | 'blockers'
  | 'river-bluff';

export const LEAK_CATEGORY_LABEL: Record<LeakCategory, string> = {
  'c-bet': 'Continuation betting',
  'bluff-catch': 'Bluff-catching',
  'draw-equity': 'Playing draws',
  'value-sizing': 'Value bet sizing',
  'check-raise': 'Check-raising',
  blockers: 'Blocker-based bluffs',
  'river-bluff': 'River bluffing',
};
