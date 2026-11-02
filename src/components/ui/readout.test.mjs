// Self-check for the grade cues and the Readout layout.
// Run: node --experimental-strip-types src/components/ui/readout.test.mjs   (from the runout folder)
import assert from 'node:assert/strict';
import { GRADE_CUE, readoutLayout, actionKind, signedBb } from './readoutMath.ts';
import hero from '../../data/heroHand.json' with { type: 'json' };

// 1. four grades: distinct words, distinct shape+fill, good/bad carried by shape (circle vs triangle), not colour alone
const cues = Object.entries(GRADE_CUE);
assert.equal(cues.length, 4);
assert.equal(new Set(cues.map(([, c]) => c.word)).size, 4, 'words must differ');
assert.equal(new Set(cues.map(([, c]) => `${c.shape}/${c.fill}`)).size, 4, 'shape+fill must differ');
for (const [g, c] of cues) assert.equal(c.shape === 'circle', c.tone === 'good', `${g}: shape and tone disagree`);
assert.deepEqual(['best', 'fine'].map((g) => GRADE_CUE[g].tone), ['good', 'good']);
assert.deepEqual(['mistake', 'blunder'].map((g) => GRADE_CUE[g].tone), ['bad', 'bad']);

// 2. layout: best sits at the right end, gap = best EV - chosen EV, segments follow frequency
const rows = [{ label: 'Check', freq: 0.12, evBb: 1.7 }, { label: 'Bet 50% pot', freq: 0.88, evBb: 2.1 }];
const l = readoutLayout(rows, 0, 5.5);
assert.equal(l.best, 1);
assert.equal(l.x[1], 94);
assert.ok(Math.abs(l.gapBb - 0.4) < 1e-9);
assert.ok(l.x[0] > 6 && l.x[0] < 94, 'a gap under 15% of the pot stays inside the ruler');
assert.deepEqual(l.segments.map((s) => s.i), [0, 1]);
assert.equal(readoutLayout(rows, 1, 5.5).gapBb, 0, 'best pick: no gap');
assert.equal(readoutLayout(rows, null, 5.5).gapBb, null);
// a gap wider than 15% of the pot spans the whole ruler
const wide = readoutLayout([{ label: 'Check', freq: 0, evBb: 15 }, { label: 'Bet 75% pot', freq: 1, evBb: 18.2 }], 0, 11.1);
assert.equal(wide.x[0], 6);
assert.deepEqual(wide.segments.map((s) => s.i), [1], 'a 0% action gets no segment');
// equal EVs do not divide by zero
assert.ok(readoutLayout([{ label: 'Check', freq: 0.5, evBb: 1 }, { label: 'Bet 75% pot', freq: 0.5, evBb: 1 }], 0, 0).x.every(Number.isFinite));

// 3. action colour families and number format
assert.deepEqual(['Bet 75% pot', 'Raise 3x (to 8.3bb)', 'All-in 97.5bb', 'Check', 'Call 2.8bb', 'Fold'].map(actionKind),
  ['aggressive', 'aggressive', 'aggressive', 'passive', 'passive', 'fold']);
assert.equal(signedBb(2.1), '+2.10 bb');
assert.equal(signedBb(-0.5), '−0.50 bb');

// 4. the landing hand is a real solve with explain.ts text: shape and consistency of the saved data
for (const d of [hero.flop, hero.turn]) {
  assert.equal(d.actions.length, d.table.length);
  assert.equal(d.choices.length, d.actions.length);
  assert.ok(Math.abs(d.table.reduce((s, r) => s + r.freq, 0) - 1) < 0.01, 'frequencies sum to 1');
  assert.ok(d.potBb > 0);
  for (const c of d.choices) assert.match(c.headline, /^(Best|Fine|Mistake|Blunder) - solver: /);
}
assert.ok(hero.solve.exploitabilityPct <= 1);
console.log('readout.test: all checks passed');
