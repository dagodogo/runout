export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'VPIP', definition: 'Voluntarily Put money In Pot — the percentage of hands a player enters pre-flop by calling or raising, excluding forced blinds.' },
  { term: 'PFR', definition: 'Pre-Flop Raise — the percentage of hands a player opens or re-raises before the flop.' },
  { term: '3-bet', definition: 'The second raise in a betting round pre-flop (the first raise is the "1-bet" from the blinds\' perspective, so a re-raise is the "3-bet").' },
  { term: 'GTO', definition: 'Game Theory Optimal — a strategy that cannot be exploited regardless of how an opponent plays, derived from solving the game as a mathematical equilibrium.' },
  { term: 'EV', definition: 'Expected Value — the average amount a decision wins or loses over the long run, weighted by the probability of each outcome.' },
  { term: 'Equity', definition: "A hand's share of the pot based on its probability of winning if all remaining cards were dealt out right now." },
  { term: 'Pot odds', definition: 'The ratio between the current size of the pot and the cost of a contemplated call, used to judge whether a call is profitable.' },
  { term: 'Blockers', definition: "Cards in your hand that reduce the number of combinations an opponent can hold of a specific hand — e.g. holding the A♦ blocks the nut flush on a diamond board." },
  { term: 'C-bet', definition: 'Continuation bet — a bet made by the pre-flop raiser on the flop, continuing the aggression from the previous street.' },
  { term: 'Range', definition: 'The full set of hand combinations a player could hold in a given spot, given their actions so far.' },
  { term: 'Polarized range', definition: 'A range made up of very strong hands and bluffs, with few medium-strength hands — typical of large bets and overbets.' },
  { term: 'Merged range', definition: 'A range made up mostly of medium-strength hands, typical of smaller, more frequent bets.' },
  { term: 'Leak', definition: 'A recurring, identifiable mistake in a player\'s strategy that costs them money over a large sample of hands.' },
  { term: 'ICM', definition: 'Independent Chip Model — a model used in tournament poker to convert chip stacks into real-money equity, since chips don\'t have a linear cash value near the bubble or final table.' },
  { term: 'Combo', definition: 'A specific combination of two cards, e.g. "A♠K♥" is one of 16 AK combos (4 suited, 12 offsuit).' },
  { term: 'Effective stack', definition: 'The smaller of two players\' stacks in a hand — the maximum amount that can actually be won or lost between them.' },
];
