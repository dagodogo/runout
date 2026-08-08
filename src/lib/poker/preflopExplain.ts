import type { HandCell } from './hands';
import type { Action, ActionMix, Position } from './ranges';

const RANK_VALUE: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, T: 10, 9: 9, 8: 8, 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2 };

function handFeatureLine(hand: HandCell): string {
  const hi = RANK_VALUE[hand.high];
  const lo = RANK_VALUE[hand.low];
  const gap = hi - lo;

  if (hand.kind === 'pair') {
    if (hi >= 10) return `${hand.label} is a big pocket pair — it's ahead of almost everything and rarely needs to improve to stay ahead.`;
    if (hi >= 6) return `${hand.label} is a mid pocket pair — strong preflop, but it'll often need to flop a set to keep playing on a scary board.`;
    return `${hand.label} is a small pocket pair — mostly a set-mining hand, cheap to play but needing to hit to continue.`;
  }
  if (hand.high === 'A' && hand.kind === 'suited') {
    return `${hand.label} carries real hidden value beyond top pair — the nut-flush blocker and backdoor-flush equity make it stronger than it looks.`;
  }
  if (hand.kind === 'suited' && gap <= 2) {
    return `${hand.label} is a suited connector — it rarely makes top pair, but it flops straights, flushes, and combo draws that play great for stacks.`;
  }
  if (hand.kind === 'suited') {
    return `${hand.label} gets a real boost from being suited — the extra ~2-3% flush equity and easier bluffing lines add up over a lot of hands.`;
  }
  if (hand.kind === 'offsuit' && hi >= 11 && lo >= 10) {
    return `${hand.label} is a strong high-card hand, but being offsuit and missing a running-straight backup shaves a bit off its value versus its suited cousin.`;
  }
  if (hand.kind === 'offsuit' && gap >= 6) {
    return `${hand.label} has little connectivity and no suit — it plays a one-dimensional "make top pair or fold" game with almost no backup equity.`;
  }
  return `${hand.label} is a fairly ordinary offsuit hand — playable in the right spot, but with no single standout trait carrying it.`;
}

const POSITION_LINE: Record<Position, string> = {
  UTG: "you're first to act against a full table behind you, so only the hands that play well against everyone's range are profitable opens.",
  UTG1: "you're still deep in the field with most of the table left to act — barely any wider than a straight UTG open.",
  UTG2: "there's still a full table behind you, but the range can start opening up a little as fewer players remain.",
  MP: "there are still several players left to act, so the range opens up a bit from UTG but still needs to respect what's behind you.",
  LJ: "with the button and cutoff still to come, the range widens further, but late-position steals and squeezes are still a real risk.",
  HJ: "one seat before the cutoff, you're close enough to the button that a noticeably wider range starts printing money.",
  CO: "with only the button and blinds left to act, a lot more hands become profitable opens here.",
  BTN: "you'll have position on the whole rest of the hand no matter who calls — that positional edge is why the button opens the widest range at the table.",
  SB: "you only need to get through the big blind, and with position gone postflop, a wide-but-careful range makes sense here.",
  BB: "you're already getting a discount from the blind you posted, and no one can act behind you if you call — that's exactly why the big blind can defend wider than the hand looks in isolation.",
};

export function explainPreflopDecision(
  position: Position,
  hand: HandCell,
  dominant: Action,
  mix: ActionMix,
): string {
  const feature = handFeatureLine(hand);
  const positionLine = POSITION_LINE[position];
  const mixed = mix.raise > 0.03 && mix.raise < 0.97 && dominant !== 'call';

  let actionLine: string;
  if (dominant === 'fold') {
    actionLine = 'That combination of factors leaves it below the bar here, so folding is correct.';
  } else if (dominant === 'call') {
    actionLine = "That's enough to continue, but not enough to drive the betting — a flat call fits better than a 3-bet.";
  } else if (mixed) {
    actionLine = "That puts it right on the edge of the range — solvers mix here instead of playing it 100/0, to stay balanced against a sharp opponent.";
  } else {
    actionLine = position === 'BB' ? 'That combination is strong enough to 3-bet rather than just call.' : "That's comfortably inside the opening range here.";
  }

  return `${feature} From ${position === 'BB' ? 'the big blind' : position}, ${positionLine} ${actionLine}`;
}
