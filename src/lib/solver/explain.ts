// Explanation engine (design.md, "Explanation engine"). Every sentence has a guard computed from solver
// fields; a failed guard omits the sentence; every number in the text comes from a field.
// No browser APIs. Pure: explain(input) -> { headline, sentences, table }.
import { evaluateBest, CATEGORY_NAME } from '../poker/evaluator.ts';
import { idToCard } from '../../solver/cards.ts';
import { gradeAction, type GradeResult } from './grade.ts';
import { CHIPS_PER_BB, type Seat } from './spots.ts';
import type { Results } from './decode.ts';

// Design thresholds (the only literal numbers allowed in the text logic).
const RANGE_EDGE = 0.05; // range advantage: equity diff >= 5 points
const NUT_EQ = 0.85; // a "nut" combo
const NUT_RATIO = 1.5;
const NUT_DIFF = 0.05;
const MIX_FREQ = 0.25;
const MIX_EV = 0.02; // of pot
const SIZE_EV = 0.02; // of pot
const POLAR_HI = 0.8;
const POLAR_LO = 0.3;
const POLAR_SHARE = 0.6;
const EQR_LOW = 0.8;
const BLOCK_SHARE = 0.15;
const STRONG_EQ = 0.8; // villain "strong" for blockers, = the "very strong" bucket
const VALUE_EQ = 0.6;
const SEMI_EQ = 0.45;
const BLUFF_EQ = 0.3;
const MAX_SENTENCES = 4;

export interface ExplainInput {
  /** decoded node, hero to act */
  results: Results;
  heroSeat: Seat;
  /** index of hero's hand in privateCards(heroSeat) */
  heroIdx: number;
  /** privateCards(0), privateCards(1): packed (lo | hi << 8) card ids */
  cards: [ArrayLike<number>, ArrayLike<number>];
  board: number[];
  /** labels from actions_after([]), e.g. "Bet:41" */
  actions: string[];
  chosen: number;
}

export interface HandCategory {
  /** e.g. "pair", null when hero's cards don't improve the board */
  made: string | null;
  draws: ('flush draw' | 'OESD' | 'gutshot')[];
}

export interface Explanation {
  headline: string;
  sentences: string[];
  /** ids of the rules whose guard fired, in output order */
  fired: string[];
  table: { label: string; freq: number; evBb: number }[];
  category: HandCategory;
  grade: GradeResult;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const bb = (chips: number) => `${(chips / CHIPS_PER_BB).toFixed(1)}bb`;
const lo = (v: number) => v & 255;
const hi = (v: number) => v >> 8;

// ---------- hand category, from cards ----------

function hasStraight(ranks: Set<number>): boolean {
  const s = new Set(ranks);
  if (s.has(14)) s.add(1);
  for (let top = 5; top <= 14; top++) if ([0, 1, 2, 3, 4].every((k) => s.has(top - k))) return true;
  return false;
}

function boardCategory(board: number[]): number {
  if (board.length >= 5) return evaluateBest(board.map(idToCard)).category;
  const counts = new Map<number, number>();
  for (const c of board) counts.set(c >> 2, (counts.get(c >> 2) ?? 0) + 1);
  const v = [...counts.values()].sort((a, b) => b - a);
  return v[0] === 4 ? 7 : v[0] === 3 ? 3 : v[0] === 2 ? (v[1] === 2 ? 2 : 1) : 0;
}

export function handCategory(hero: number[], board: number[]): HandCategory {
  const all = [...hero, ...board];
  const best = evaluateBest(all.map(idToCard)).category;
  const made = best > boardCategory(board) ? CATEGORY_NAME[best].toLowerCase() : null;
  const draws: HandCategory['draws'] = [];
  if (board.length >= 5) return { made, draws };
  if (best < 5) {
    for (let suit = 0; suit < 4; suit++) {
      if (all.filter((c) => (c & 3) === suit).length === 4 && hero.some((c) => (c & 3) === suit)) draws.push('flush draw');
    }
  }
  if (best < 4) {
    const rank = (c: number) => (c >> 2) + 2;
    const mine = new Set(all.map(rank));
    const boardRanks = new Set(board.map(rank));
    let outs = 0;
    for (let r = 2; r <= 14; r++) {
      if (mine.has(r)) continue;
      if (hasStraight(new Set([...mine, r])) && !hasStraight(new Set([...boardRanks, r]))) outs++;
    }
    if (outs >= 2) draws.push('OESD');
    else if (outs === 1) draws.push('gutshot');
  }
  return { made, draws };
}

// ---------- context ----------

type Kind = 'Fold' | 'Check' | 'Call' | 'Bet' | 'Raise' | 'Allin';
interface Act { kind: Kind; amount: number; label: string; freq: number; ev: number }

interface Ctx {
  input: ExplainInput;
  hero: number;
  villain: number;
  i: number;
  /** hero pot (eqrBase[hero]), chips */
  pot: number;
  acts: Act[];
  /** by frequency, descending */
  byFreq: Act[];
  eq: number;
  eqr: number;
  cat: HandCategory;
  rangeEq: [number, number];
  nutShare: [number, number];
}

const aggressive = (a: Act) => a.kind === 'Bet' || a.kind === 'Raise' || a.kind === 'Allin';

// the pot-percentage bet sizes of the lean tree (spots.ts initArgs): flop 50%, turn and river 75%
const TREE_BET_PCTS = [50, 75];
const nearestTreeSize = (x: number) => TREE_BET_PCTS.reduce((a, b) => (Math.abs(b - x * 100) < Math.abs(a - x * 100) ? b : a));

function label(kind: Kind, amount: number, pot: number): string {
  if (kind === 'Bet') return `Bet ${nearestTreeSize(amount / pot)}% pot`;
  if (kind === 'Raise') return `Raise to ${bb(amount)}`; // the tree's only raise is the flop check-raise, 3x
  if (kind === 'Call') return amount > 0 ? `Call ${bb(amount)}` : 'Call';
  if (kind === 'Allin') return `All-in ${bb(amount)}`;
  return kind;
}

const ING: Record<Kind, string> = { Fold: 'folding', Check: 'checking', Call: 'calling', Bet: 'betting', Raise: 'raising', Allin: 'going all-in' };

function rangeStat(r: Results, p: number, f: (e: number) => number): number {
  let s = 0, w = 0;
  for (let k = 0; k < r.normalizer[p].length; k++) {
    s += r.normalizer[p][k] * f(r.equity[p][k]);
    w += r.normalizer[p][k];
  }
  return w > 0 ? s / w : 0;
}

function context(input: ExplainInput): Ctx {
  const r = input.results;
  const hero = input.heroSeat === 'oop' ? 0 : 1;
  const villain = 1 - hero;
  const n = r.normalizer[hero].length;
  const i = input.heroIdx;
  const pot = r.eqrBase[hero];
  const acts: Act[] = input.actions.map((s, a) => {
    const [kind, amt] = s.split(':') as [Kind, string];
    const amount = Number(amt);
    return { kind, amount, label: label(kind, amount, pot), freq: r.strategy[a * n + i], ev: r.actionEv[a * n + i] };
  });
  const v = input.cards[hero][i];
  return {
    input, hero, villain, i, pot, acts,
    byFreq: [...acts].sort((a, b) => b.freq - a.freq),
    eq: r.equity[hero][i],
    eqr: r.eqr[hero][i],
    cat: handCategory([lo(v), hi(v)], input.board),
    rangeEq: [rangeStat(r, 0, (e) => e), rangeStat(r, 1, (e) => e)],
    nutShare: [rangeStat(r, 0, (e) => (e >= NUT_EQ ? 1 : 0)), rangeStat(r, 1, (e) => (e >= NUT_EQ ? 1 : 0))],
  };
}

// ---------- rules: guard + text ----------

const DRAW_TEXT = { 'flush draw': 'a flush draw', OESD: 'an open-ended straight draw', gutshot: 'a gutshot straight draw' } as const;

function describeHand(c: HandCategory, weak = false): string {
  const parts = [c.made ? (weak ? `a weak ${c.made}` : `a made hand (${c.made})`) : '', ...c.draws.map((d) => DRAW_TEXT[d])].filter(Boolean);
  return parts.length ? parts.join(' plus ') : 'no made hand and no draw';
}

function bucket(c: Ctx): string {
  if (c.eq >= 0.8) return 'very strong';
  if (c.eq >= 0.6) return 'strong';
  if (c.eq >= 0.45) return 'medium';
  if (c.eq >= 0.25) return c.cat.draws.length ? 'weak but drawing' : 'weak';
  return 'air';
}

/** The role word for the top action, under the vocabulary rule. Exported for the test. */
export function roleWord(eq: number, hasDraw: boolean, topIsBet: boolean): 'value' | 'semi-bluff' | 'bluff' | null {
  if (!topIsBet) return null;
  if (eq >= VALUE_EQ) return 'value';
  if (hasDraw && eq < SEMI_EQ) return 'semi-bluff';
  if (eq < BLUFF_EQ) return 'bluff';
  return null;
}

const ROLE_VERB: Partial<Record<Kind, string>> = { Bet: 'bets', Raise: 'raises', Allin: 'shoves' };
const roleText = (role: 'value' | 'semi-bluff' | 'bluff', kind: Kind) => {
  const v = `The solver mostly ${ROLE_VERB[kind] ?? 'bets'} it`;
  return role === 'value' ? ` ${v} for value.` : role === 'semi-bluff' ? ` ${v} as a semi-bluff: it can still improve.` : ` ${v} as a bluff.`;
};

/** Two sizes of aggression (lean tree: usually only one, then this rule's guard fails). */
function sizes(c: Ctx): [Act, Act] | null {
  const agg = c.acts.filter(aggressive).sort((a, b) => a.amount - b.amount);
  return agg.length >= 2 && agg[agg.length - 1].amount > agg[0].amount ? [agg[agg.length - 1], agg[0]] : null;
}

function facing(c: Ctx): { call: number; potAfter: number } | null {
  const b = c.input.results.eqrBase;
  const call = b[c.villain] - b[c.hero];
  if (!(call > 0) || !c.acts.some((a) => a.kind === 'Call')) return null;
  return { call, potAfter: b[c.villain] + call };
}

function blocked(c: Ctx): number {
  const r = c.input.results;
  const v = c.input.cards[c.hero][c.i];
  const mine = [lo(v), hi(v)];
  let strong = 0, hit = 0;
  for (let k = 0; k < r.normalizer[c.villain].length; k++) {
    if (r.equity[c.villain][k] < STRONG_EQ) continue;
    const w = r.normalizer[c.villain][k];
    const x = c.input.cards[c.villain][k];
    strong += w;
    if (mine.includes(lo(x)) || mine.includes(hi(x))) hit += w;
  }
  return strong > 0 ? hit / strong : 0;
}

interface Rule { id: string; guard: (c: Ctx) => boolean; text: (c: Ctx) => string }

export const RULES: Rule[] = [
  {
    id: 'hand',
    guard: (c) => Number.isFinite(c.eq),
    text: (c) => {
      const top = c.byFreq[0];
      const role = roleWord(c.eq, c.cat.draws.length > 0, aggressive(top) && top.freq >= 0.5);
      const lead = bucket(c) === 'air'
        ? `You hold ${describeHand(c.cat, true)} with only ${pct(c.eq)} equity against his range.`
        : `You hold ${describeHand(c.cat)} with ${pct(c.eq)} equity against his range: ${bucket(c)}.`;
      return lead + (role ? roleText(role, top.kind) : '');
    },
  },
  {
    id: 'potOdds',
    guard: (c) => facing(c) !== null && Number.isFinite(c.eq),
    text: (c) => {
      const f = facing(c)!;
      const real = c.eqr < EQR_LOW ? `, but you realize only ${pct(c.eqr)} of it` : '';
      return `Calling ${bb(f.call)} for a final pot of ${bb(f.potAfter)} needs ${pct(f.call / f.potAfter)} equity; you have ${pct(c.eq)}${real}.`;
    },
  },
  {
    id: 'mix',
    guard: (c) => c.byFreq.length >= 2 && c.byFreq[1].freq >= MIX_FREQ && Math.abs(c.byFreq[0].ev - c.byFreq[1].ev) < MIX_EV * c.pot,
    text: (c) => {
      const [a, b] = c.byFreq;
      return `${a.label} and ${b.label} both are worth about ${bb((a.ev + b.ev) / 2)}; mixing them keeps you unexploitable.`;
    },
  },
  {
    id: 'size',
    guard: (c) => {
      const s = sizes(c);
      return s !== null && s[0].ev - s[1].ev > SIZE_EV * c.pot;
    },
    text: (c) => {
      const [big, small] = sizes(c)!;
      const r = c.input.results;
      const high = rangeStat(r, c.hero, (e) => (e >= POLAR_HI ? 1 : 0));
      const low = rangeStat(r, c.hero, (e) => (e <= POLAR_LO ? 1 : 0));
      const polar = high + low > POLAR_SHARE ? ` Your range is polarized here (${pct(high)} very strong, ${pct(low)} weak), which suits the big size.` : '';
      return `${big.label} earns ${bb(big.ev - small.ev)} more than ${small.label}.` + polar;
    },
  },
  {
    id: 'blockers',
    guard: (c) => c.input.board.length === 5 && c.eq < BLUFF_EQ && c.acts.some((a) => aggressive(a) && a.freq > 0) && blocked(c) >= BLOCK_SHARE,
    text: (c) => `Your cards block ${pct(blocked(c))} of his strongest hands, which makes this hand a better bluff.`,
  },
  {
    id: 'nuts',
    guard: (c) => {
      const [h, v] = [c.nutShare[c.hero], c.nutShare[c.villain]];
      const [big, small] = h > v ? [h, v] : [v, h];
      return big - small >= NUT_DIFF && (small === 0 || big / small >= NUT_RATIO);
    },
    text: (c) => {
      const [h, v] = [c.nutShare[c.hero], c.nutShare[c.villain]];
      return h > v
        ? `You have the nut edge: ${pct(h)} of your range is near-certain to win, against ${pct(v)} of his.`
        : `He has the nut edge: ${pct(v)} of his range is near-certain to win, against ${pct(h)} of yours.`;
    },
  },
  {
    id: 'range',
    guard: (c) => Math.abs(c.rangeEq[c.hero] - c.rangeEq[c.villain]) >= RANGE_EDGE,
    text: (c) => {
      const [h, v] = [c.rangeEq[c.hero], c.rangeEq[c.villain]];
      return h > v ? `Your range is ahead: ${pct(h)} equity against ${pct(v)}.` : `His range is ahead: ${pct(v)} equity against your ${pct(h)}.`;
    },
  },
  {
    id: 'rangeClose',
    guard: (c) => Math.abs(c.rangeEq[c.hero] - c.rangeEq[c.villain]) < RANGE_EDGE,
    text: (c) => `The ranges are close: ${pct(c.rangeEq[c.hero])} equity for you, ${pct(c.rangeEq[c.villain])} for him.`,
  },
];

const GRADE_NAME = { best: 'Best', fine: 'Fine', mistake: 'Mistake', blunder: 'Blunder' } as const;

export function explain(input: ExplainInput): Explanation {
  const c = context(input);
  const grade = gradeAction(c.acts.map((a) => a.freq), c.acts.map((a) => a.ev), input.chosen, c.pot);
  const chosen = c.acts[input.chosen];
  const mix = c.byFreq.filter((a) => Math.round(a.freq * 100) > 0).map((a, k) => `${a.label} ${pct(a.freq)}${k === 0 ? ' of the time' : ''}`).join(', ');
  const topEv = c.acts.reduce((a, b) => (b.ev > a.ev ? b : a));
  const loss = grade.lossChips / CHIPS_PER_BB >= 0.05
    ? `your hand loses ${(grade.lossChips / CHIPS_PER_BB).toFixed(2)}bb by ${ING[chosen.kind]}`
    : RULES.find((r) => r.id === 'mix')!.guard(c) // top two actions within the "why a mix" thresholds
      ? `${ING[c.byFreq[0].kind]} and ${ING[c.byFreq[1].kind]} are about equal here`
      : `${ING[topEv.kind]} is the top-EV play for your hand`;
  // an empty node (isEmpty) has no equity: nothing can be explained
  const fired = input.results.isEmpty ? [] : RULES.filter((r) => r.guard(c)).slice(0, MAX_SENTENCES);
  return {
    headline: `${GRADE_NAME[grade.grade]} - solver: ${mix}; ${loss}`,
    sentences: fired.map((r) => r.text(c)),
    fired: fired.map((r) => r.id),
    table: c.acts.map((a) => ({ label: a.label, freq: a.freq, evBb: a.ev / CHIPS_PER_BB })),
    category: c.cat,
    grade,
  };
}
