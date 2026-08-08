/** Equity approximation from outs using the "Rule of 4 and 2", plus the exact
 * (combinatorial) probability for reference. Standard, well-documented poker math —
 * no solver required. */
export function ruleOfFourAndTwo(outs: number, streetsToCome: 1 | 2): number {
  const multiplier = streetsToCome === 2 ? 4 : 2;
  return Math.min(100, outs * multiplier);
}

/** Exact probability of hitting at least one out by the river, given cards left unseen. */
export function exactOutsEquity(outs: number, unseenCards: number, streetsToCome: 1 | 2): number {
  if (streetsToCome === 1) {
    return (outs / unseenCards) * 100;
  }
  const missTurn = (unseenCards - outs) / unseenCards;
  const missRiver = (unseenCards - outs - 1) / (unseenCards - 1);
  return (1 - missTurn * missRiver) * 100;
}

export interface PotOddsResult {
  potOddsPercent: number;
  breakEvenEquity: number;
  ratio: string;
}

export function potOdds(potSize: number, callAmount: number): PotOddsResult {
  const totalPot = potSize + callAmount;
  const breakEvenEquity = totalPot > 0 ? (callAmount / totalPot) * 100 : 0;
  const gcdVal = gcd(Math.round(potSize), Math.round(callAmount) || 1);
  const p = Math.round(potSize / gcdVal);
  const c = Math.round((Math.round(callAmount) || 1) / gcdVal);
  return { potOddsPercent: breakEvenEquity, breakEvenEquity, ratio: `${p}:${c}` };
}

function gcd(a: number, b: number): number {
  a = Math.max(1, Math.abs(a));
  b = Math.max(1, Math.abs(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** EV of calling a bet: equity * (pot after call) - (1-equity) * call cost. */
export function evOfCall(equity: number, potBeforeCall: number, callAmount: number): number {
  const winAmount = potBeforeCall + callAmount;
  return equity * winAmount - (1 - equity) * callAmount;
}

/** EV of betting/raising, combining fold equity with showdown equity when called:
 * EV = P(fold)*potBeforeBet + P(called)*(equity*potIfCalled - (1-equity)*betSize).
 * `equity` should reflect equity against villain's continuing (non-folded) range. */
export function evOfBet(
  equity: number,
  potBeforeBet: number,
  betSize: number,
  foldEquity: number,
): number {
  const potIfCalled = potBeforeBet + betSize * 2;
  const calledEv = equity * potIfCalled - (1 - equity) * betSize;
  return foldEquity * potBeforeBet + (1 - foldEquity) * calledEv;
}

export const COMMON_OUTS = [
  { name: 'Gutshot straight draw', outs: 4 },
  { name: 'Open-ended straight draw', outs: 8 },
  { name: 'Flush draw', outs: 9 },
  { name: 'Flush draw + gutshot', outs: 12 },
  { name: 'Flush draw + open-ended', outs: 15 },
  { name: 'Two overcards', outs: 6 },
  { name: 'Set to full house / quads', outs: 10 },
  { name: 'Pair to two pair / trips', outs: 5 },
];
