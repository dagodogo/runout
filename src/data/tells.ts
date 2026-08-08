export interface Tell {
  cue: string;
  meaning: string;
  reliability: 'strong' | 'moderate' | 'weak';
}

/** Well-established, widely-taught live-poker tells. Reliability is a rough
 * guide, not a guarantee — timing and sizing patterns beat physical tells,
 * and any single tell is weaker than a pattern repeated over many hands. */
export const TELLS: Tell[] = [
  {
    cue: 'Sudden, unusual stillness right after betting',
    meaning: 'Players instinctively try to look calm when bluffing. Forced, deliberate stillness is a classic strong-hand-acting-weak (bluff) signal.',
    reliability: 'moderate',
  },
  {
    cue: 'A visible hand tremor when betting',
    meaning: 'Genuine adrenaline from a big hand, not nerves from a bluff — shaking hands after a bet usually means real strength, not weakness.',
    reliability: 'moderate',
  },
  {
    cue: 'A quick, almost careless-looking bet',
    meaning: 'Comfort and confidence often show up as speed. A fast bet into a scary board can mean the player already knows exactly what they have — and it\'s good.',
    reliability: 'weak',
  },
  {
    cue: 'A long tank before a small bet or check',
    meaning: 'Genuine indecision usually means a genuinely close, marginal hand — not the mega-strength a slow "Hollywood" act tries to sell.',
    reliability: 'moderate',
  },
  {
    cue: 'Glancing at their own chips right after seeing the flop',
    meaning: 'An unconscious, forward-looking action — the brain is already preparing to bet, which usually means the flop connected.',
    reliability: 'moderate',
  },
  {
    cue: 'Sighing, complaining, or acting annoyed before betting',
    meaning: 'A classic weak-means-strong act — real disappointment is rarely performed that visibly. Treat exaggerated reluctance as a warning sign.',
    reliability: 'weak',
  },
  {
    cue: 'Staring you down aggressively after betting',
    meaning: "Confident eye contact after a bet is more often a bluff trying to look powerful than a monster hand, which doesn't need to sell anything.",
    reliability: 'weak',
  },
  {
    cue: 'A bet size that\'s slightly different from their usual pattern',
    meaning: "Deviating from an established sizing habit — betting a little bigger or smaller than normal — is one of the most reliable tells there is, because it's unconscious.",
    reliability: 'strong',
  },
  {
    cue: 'Checking a strong hand out of position, then betting big on a later street',
    meaning: 'A classic slow-play pattern to induce action — especially believable when the board didn\'t obviously improve for anyone.',
    reliability: 'moderate',
  },
  {
    cue: 'Consistent, unreadable timing on every single decision',
    meaning: "A player using the same tempo for every action, strong or weak, is deliberately denying you information — often a sign of a more experienced opponent.",
    reliability: 'weak',
  },
];
