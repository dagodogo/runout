// Node test: build a spot through spots.ts and solve the lean tree single-thread to the target.
// Run: node --experimental-strip-types src/solver/spots.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import init, { GameManager } from './pkg/solver-st/solver.js';
import { buildSpot, initArgs, STARTING_POT } from '../lib/solver/spots.ts';
import { idToStr } from './cards.ts';

await init(readFileSync(new URL('./pkg/solver-st/solver_bg.wasm', import.meta.url)));
// fixed flop and seats so the run is repeatable
const spot = buildSpot(() => 0.5, { ipPos: 'BTN', heroSeat: 'ip', board: [30, 18, 5] });console.log('spot', spot.ipPos, 'hero', spot.heroSeat, spot.board.map(idToStr).join(' '));

const g = GameManager.new();
const err = g.init(...initArgs(spot));
assert.equal(err, undefined, 'init error: ' + err);
const mb = Number(g.memory_usage(true)) / 1e6;
assert.ok(mb < 600, 'memory over limit');
g.allocate_memory(true);
const t0 = Date.now();
let it = 0, pct = 100;
while (it < 400 && pct > 1 && Date.now() - t0 < 180000) {
  for (let k = 0; k < 10; k++) g.solve_step(it++);
  pct = (g.exploitability() / STARTING_POT) * 100;
}
const s = (Date.now() - t0) / 1000;
g.finalize();
assert.equal(g.current_player(), 'oop');
console.log(`exploitability ${pct.toFixed(2)}% of pot | iterations ${it} | memory ${mb.toFixed(0)} MB | ${s.toFixed(1)} s single-thread`);
assert.ok(pct <= 1, 'target not reached');
