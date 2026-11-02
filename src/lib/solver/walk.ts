// Plays a hand through a solved tree: deal, hero action, villain/chance steps until hero acts or the hand ends.
// No browser APIs; the RNG is injected so tests are repeatable.
import { evaluateBest, compareHandScore } from '../poker/evaluator.ts';
import { idToCard, pairIndex } from '../../solver/cards.ts';
import { readResults, type SolverNodes } from './decode.ts';
import type { SolverSpot } from './spots.ts';

export type Rng = () => number;
const SEAT = { oop: 0, ip: 1 } as const;

export interface Hand {
  heroSeat: 'oop' | 'ip';
  /** index of each hand in privateCards(seat) */
  heroIdx: number;
  villainIdx: number;
  hero: [number, number];
  villain: [number, number];
  board: number[];
  /** action indices and dealt card ids, as apply_history wants them */
  history: number[];
  /** private combo counts [oop, ip] */
  length: [number, number];
  log: { who: 'hero' | 'villain' | 'chance'; label: string }[];
  last?: { who: 'hero' | 'villain'; label: string };
}

export interface Outcome {
  kind: 'fold' | 'showdown';
  winner: 'hero' | 'villain' | 'split';
  /** chips in the pot at the end: starting pot + both total bets */
  pot: number;
}

export type Step = { status: 'hero'; actions: string[] } | { status: 'end'; outcome: Outcome };

const lo = (v: number) => v & 255;
const hi = (v: number) => v >> 8;

/** Index drawn with probability proportional to w; uniform if all weights are 0. */
export function sampleIndex(w: ArrayLike<number>, rng: Rng): number {
  let sum = 0;
  for (let i = 0; i < w.length; i++) sum += w[i];
  if (!(sum > 0)) return Math.min(w.length - 1, Math.floor(rng() * w.length));
  let r = rng() * sum;
  for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0 && w[i] > 0) return i;
  for (let i = w.length - 1; i >= 0; i--) if (w[i] > 0) return i; // rounding: last live entry
  return 0;
}

/** Deals hero from the hero range and villain from the villain range, no shared cards. Call with the tree at its root. */
export async function deal(nodes: SolverNodes, spot: SolverSpot, heroSeat: 'oop' | 'ip', rng: Rng): Promise<Hand> {
  const cards = await Promise.all([nodes.privateCards(0), nodes.privateCards(1)]);
  const range = (seat: 'oop' | 'ip') => (seat === 'oop' ? spot.oopRange : spot.ipRange);
  const weights = (seat: 'oop' | 'ip') => Array.from(cards[SEAT[seat]], (v) => range(seat)[pairIndex(lo(v), hi(v))]);
  const villainSeat = heroSeat === 'oop' ? 'ip' : 'oop';
  const heroIdx = sampleIndex(weights(heroSeat), rng);
  const h = cards[SEAT[heroSeat]][heroIdx];
  const vw = weights(villainSeat).map((w, i) => {
    const v = cards[SEAT[villainSeat]][i];
    return lo(v) === lo(h) || lo(v) === hi(h) || hi(v) === lo(h) || hi(v) === hi(h) ? 0 : w;
  });
  const villainIdx = sampleIndex(vw, rng);
  const v = cards[SEAT[villainSeat]][villainIdx];
  return {
    heroSeat,
    heroIdx,
    villainIdx,
    hero: [lo(h), hi(h)],
    villain: [lo(v), hi(v)],
    board: [...spot.board],
    history: [],
    length: [cards[0].length, cards[1].length],
    log: [],
  };
}

/** Action labels at the current node. The solver prints "Call:0"/"Fold:0"; Call gets the chips actually called, Fold and Check lose the zero. */
const labels = async (nodes: SolverNodes) => {
  const raw = (await nodes.actionsAfter(new Uint32Array(0))).split('/');
  if (!raw.some((l) => l.startsWith('Call'))) return raw.map((l) => (/^(Fold|Check):0$/.test(l) ? l.split(':')[0] : l));
  const b = await nodes.totalBetAmount(new Uint32Array(0));
  return raw.map((l) => (l.startsWith('Call') ? `Call:${Math.abs(b[0] - b[1])}` : /^(Fold|Check):0$/.test(l) ? l.split(':')[0] : l));
};

/** Moves the tree to the hand's history, then lets villain and chance act until hero must act or the hand ends. */
export async function advance(nodes: SolverNodes, hand: Hand, rng: Rng, startingPot: number): Promise<Step> {
  const villainSeat = hand.heroSeat === 'oop' ? 'ip' : 'oop';
  for (;;) {
    await nodes.applyHistory(Uint32Array.from(hand.history));
    const player = await nodes.currentPlayer();
    if (player === 'terminal') return { status: 'end', outcome: await finish(nodes, hand, startingPot) };
    if (player === hand.heroSeat) return { status: 'hero', actions: await labels(nodes) };
    if (player === 'chance') {
      const mask = await nodes.possibleCards();
      const dead = new Set([...hand.hero, ...hand.villain, ...hand.board]);
      const live: number[] = [];
      for (let c = 0; c < 52; c++) if ((mask >> BigInt(c)) & 1n && !dead.has(c)) live.push(c);
      if (!live.length) throw new Error('no card can be dealt');
      const c = live[Math.floor(rng() * live.length)];
      hand.history.push(c);
      hand.board.push(c);
      hand.log.push({ who: 'chance', label: String(c) });
      continue;
    }
    // villain: sample from the strategy of its own hand
    const [r, names] = await Promise.all([readResults(nodes, hand.length), labels(nodes)]);
    const n = hand.length[SEAT[villainSeat]];
    const probs = Array.from({ length: r.numActions }, (_, a) => r.strategy[a * n + hand.villainIdx]);
    const a = sampleIndex(probs, rng);
    hand.history.push(a);
    hand.last = { who: 'villain', label: names[a] };
    hand.log.push({ who: 'villain', label: names[a] });
  }
}

/** Applies hero's chosen action (index into the buttons from advance) and continues. */
export async function heroAct(nodes: SolverNodes, hand: Hand, action: number, rng: Rng, startingPot: number): Promise<Step> {
  await nodes.applyHistory(Uint32Array.from(hand.history));
  const label = (await labels(nodes))[action];
  if (label === undefined) throw new Error('no such action ' + action);
  hand.history.push(action);
  hand.last = { who: 'hero', label };
  hand.log.push({ who: 'hero', label });
  return advance(nodes, hand, rng, startingPot);
}

async function finish(nodes: SolverNodes, hand: Hand, startingPot: number): Promise<Outcome> {
  const bets = await nodes.totalBetAmount(new Uint32Array(0));
  const pot = startingPot + bets[0] + bets[1];
  // a fold returns the uncalled part of the bet to the bettor
  if (hand.last?.label.startsWith('Fold')) return { kind: 'fold', winner: hand.last.who === 'hero' ? 'villain' : 'hero', pot: startingPot + 2 * Math.min(bets[0], bets[1]) };
  if (hand.board.length !== 5) throw new Error('showdown before the river');
  const score = (h: number[]) => evaluateBest([...h, ...hand.board].map(idToCard));
  const c = compareHandScore(score(hand.hero), score(hand.villain));
  return { kind: 'showdown', winner: c > 0 ? 'hero' : c < 0 ? 'villain' : 'split', pot };
}

/** The hero's decision at the current node: strategy and action EVs of the hero's own hand. Call after advance said 'hero'. */
export async function heroDecision(nodes: SolverNodes, hand: Hand) {
  const r = await readResults(nodes, hand.length);
  const n = hand.length[SEAT[hand.heroSeat]];
  const col = (arr: ArrayLike<number>) => Array.from({ length: r.numActions }, (_, a) => arr[a * n + hand.heroIdx]);
  return { freq: col(r.strategy), ev: col(r.actionEv), pot: r.eqrBase[SEAT[hand.heroSeat]], results: r };
}
