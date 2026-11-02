// Pure data for the grade cues and the Readout (no React), so a plain node test can check them.
import type { Grade } from '../../lib/solver/grade.ts';

export interface GradeCue {
  word: string;
  /** circle = good, triangle = bad; fill = strength. Shape and word carry the grade, colour is the third cue. */
  shape: 'circle' | 'triangle';
  fill: 'solid' | 'outline';
  tone: 'good' | 'bad';
}

export const GRADE_CUE: Record<Grade, GradeCue> = {
  best: { word: 'Best', shape: 'circle', fill: 'solid', tone: 'good' },
  fine: { word: 'Fine', shape: 'circle', fill: 'outline', tone: 'good' },
  mistake: { word: 'Mistake', shape: 'triangle', fill: 'outline', tone: 'bad' },
  blunder: { word: 'Blunder', shape: 'triangle', fill: 'solid', tone: 'bad' },
};

export interface ReadoutRow {
  label: string;
  freq: number;
  evBb: number;
}

export type ActionKind = 'aggressive' | 'passive' | 'fold';

/** Action colour family from the label: Bet/Raise/All-in red, Check/Call bone, Fold grey. */
export const actionKind = (label: string): ActionKind =>
  /^(Bet|Raise|All-in)/.test(label) ? 'aggressive' : label.startsWith('Fold') ? 'fold' : 'passive';

/** Smallest ruler span as a share of the pot: the blunder line (grade.ts), so a short line means a cheap mistake. */
const MIN_SPAN_POT = 0.15;
const PAD = 6; // % kept free at each end of the ruler

/**
 * Mix-bar segments (share of the bar) and EV-ruler tick positions (% from the left).
 * The ruler ends at the best EV and spans at least 15% of the pot, so lengths compare across spots.
 */
export function readoutLayout(rows: ReadoutRow[], chosen: number | null, potBb: number) {
  const best = rows.reduce((b, r, i) => (r.evBb > rows[b].evBb ? i : b), 0);
  const max = rows[best].evBb;
  const min = Math.min(...rows.map((r) => r.evBb));
  const span = Math.max(max - min, MIN_SPAN_POT * potBb, 1e-9);
  const x = rows.map((r) => PAD + ((100 - 2 * PAD) * (r.evBb - (max - span))) / span);
  const total = rows.reduce((s, r) => s + r.freq, 0) || 1;
  const segments = rows.map((r, i) => ({ i, share: r.freq / total })).filter((s) => s.share >= 0.005);
  const gapBb = chosen === null ? null : Math.max(0, max - rows[chosen].evBb);
  return { best, x, segments, gapBb };
}

/** "+2.12 bb" with a non-breaking space; minus sign, not hyphen. */
export const signedBb = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(2)} bb`;
export const pctText = (f: number) => `${Math.round(f * 100)}%`;
