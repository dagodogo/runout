export interface StrategyNote {
  title: string;
  points: string[];
}

export const STRATEGY_NOTES: StrategyNote[] = [
  {
    title: 'Preflop fundamentals',
    points: [
      "Position is worth more than any two cards. Acting last means more information before you commit chips, which is why opening ranges expand from roughly 15% of hands in early position to 40%+ on the button.",
      "A good opening hand plays well even when it doesn't hit the flop — suitedness adds backdoor-flush equity, connectivity adds straight potential, and both keep a hand live after a miss.",
      "High cards carry hidden value through blockers: an ace in your hand also removes a combo of AA/KK/AK from your opponent's possible holdings.",
      "3-bets come in two flavors — value (QQ+, AK, wanting money in ahead) and bluff (suited aces and connectors with good blockers and playability).",
      "Big blind defense is about pot odds plus closing the action: you're getting a discount, and nobody can act behind you if you call, which justifies a wider range than the hand looks in isolation.",
    ],
  },
  {
    title: 'Reading a board\'s texture',
    points: [
      "Start with two questions: how connected is it, and how coordinated by suit? K-7-2 rainbow is dry; J-T-9 two-tone is wet.",
      "Paired boards remove some trip combos from both ranges and usually play drier than they look.",
      "Monotone boards call for smaller bets, not bigger ones — you can't extract more from non-flush hands just because a flush is possible.",
      "High-card-heavy boards favor whoever raised preflop, since their range is loaded with big cards.",
      "Low, connected boards tend to favor the caller's (often the big blind's) range — exactly when the preflop raiser should slow down.",
    ],
  },
  {
    title: 'Continuation betting',
    points: [
      "Two separate questions drive c-bet strategy: how often to bet (range advantage) and how big (nut advantage).",
      "Range advantage without a big nut edge → bet small, often. Dry, high-card boards reward cheap, frequent pressure.",
      "Range advantage plus nut advantage → bet big, extracting more from the hands that do continue.",
      "No range or nut advantage → check back more. Betting into a range that hits the board as hard as yours just bloats the pot.",
      "Texture should decide your plan, not habit — a static bet size regardless of the flop ignores half the information available.",
    ],
  },
  {
    title: 'Bluff-catching and river decisions',
    points: [
      "Work out whether a bet looks polarized (nuts or air) or merged (a consistent medium-strength range) based on how the hand was played.",
      "Blockers change the math both ways: holding a card that blocks villain's value combos makes calling more attractive; holding a card their bluffs would need makes folding more attractive.",
      "Pot odds set the floor for a profitable call — a pot-sized bet needs you to be good about 33% of the time; a half-pot bet only needs about 25%.",
      "Compare the math to a believable story: does villain's range realistically contain enough missed draws and bluffs given how the hand played out?",
      "\"I don't know\" isn't a reason to call a big river bet — back every call with a read, a blocker, or a favorable price.",
    ],
  },
  {
    title: 'Draws and equity realization',
    points: [
      "Combo draws (flush draw + straight draw, or draw + overcards) run 45%+ equity — strong enough to raise for value and protection, not just call.",
      "Single draws are usually better played as calls, taking a cheaper look at more cards.",
      "Raise a draw when you have real fold equity — the raise stacks 'win now' on top of 'win later if called.'",
      "Call with a draw when implied odds are strong: deep stacks, an opponent likely to pay you off, limited incentive to raise.",
      "Implied odds are why speculative hands like suited connectors are playable at all — not the pot in front of you now, but the extra money after you hit.",
    ],
  },
  {
    title: 'Common leaks by skill level',
    points: [
      "Overvaluing top pair with a weak kicker — calling down multiple streets because folding 'feels bad.'",
      "Under-bluffing the river — bluffing reasonably on the flop, then going passive by the river and becoming easy to read.",
      "Under-defending the big blind, folding hands that had the right price and playability to continue.",
      "Folding too often to 3-bets, giving up equity in hands that were profitable to continue given pot odds and postflop playability.",
      "Using one bet size for every board texture, ignoring that dry and wet flops call for very different frequencies and sizing.",
      "Ignoring stack-to-pot ratio, committing full stacks with merely-good hands when the SPR should dictate a more cautious plan.",
    ],
  },
];

export interface StrategyExample {
  title: string;
  body: string;
}

export const STRATEGY_EXAMPLES: StrategyExample[] = [
  {
    title: 'The Moneymaker bluff (2003 WSOP Main Event)',
    body: "Heads-up, Chris Moneymaker fired a massive river bluff holding king-high, and Sammy Farha folded top pair. The textbook case for polarized river betting: a bet size and story so strong that even a made hand can't continue.",
  },
  {
    title: 'The "ABC TAG" top-pair trap',
    body: 'A common archetype: a tight-aggressive player raises preflop, c-bets the flop, then calls down three streets with top pair/weak kicker purely because "I have to see it." A vivid illustration of the overvaluing-top-pair leak.',
  },
  {
    title: 'The combo-draw semi-bluff',
    body: "Flopping a flush draw plus an open-ended straight draw and raising instead of calling — the poster-child example of a hand with enough combined equity and fold equity to become the aggressor rather than just a caller.",
  },
];
