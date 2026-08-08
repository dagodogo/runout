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
  { term: 'Range advantage', definition: "Having more strong hands in your overall range than your opponent does on a given board — the main driver of how often you should bet." },
  { term: 'Nut advantage', definition: 'Holding a disproportionate share of the very best possible hands on a board — the main driver of how big you should bet, separate from how often.' },
  { term: 'SPR (stack-to-pot ratio)', definition: "The effective stack divided by the pot size. A low SPR means a hand is close to being committed; a high SPR rewards more cautious, multi-street play." },
  { term: 'Combo draw', definition: 'A hand with two live draws at once (e.g. a flush draw plus a straight draw) — usually strong enough to raise for value and fold equity, not just call.' },
  { term: 'Implied odds', definition: "The extra money you expect to win on later streets if you hit your draw, on top of what's already in the pot — the reason speculative hands like suited connectors are playable." },
  { term: 'Semi-bluff', definition: "A bet or raise with a hand that isn't the best right now but has real equity to improve — it can win immediately if villain folds, or win later if called and it hits." },
  { term: 'Bluff-catcher', definition: 'A medium-strength hand whose only realistic job is to beat a bluff — it loses to value bets and only wins when villain is betting with a worse hand.' },
  { term: 'Continuation (betting a range)', definition: 'Betting the same frequency and sizing with your whole range in a spot — including bluffs — rather than only when you personally have a strong hand, so opponents can\'t read your bet as automatic strength.' },
  { term: 'Donk bet', definition: 'A bet made by a player who was NOT the aggressor on the previous street, leading out before the previous raiser has acted.' },
  { term: 'Tell', definition: "A behavioral or physical cue — timing, bet sizing, posture, chip handling — that gives away information about hand strength. Reliable mainly in live poker, and always secondary to the math." },
];
