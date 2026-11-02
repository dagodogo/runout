// Node test for decode / grade / walk on a fixed river spot (As Kd 7c 2h 9s, full symmetric ranges, pot 100).
// Run: node --experimental-strip-types src/lib/solver/walk.test.mjs   (from the runout folder)
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import init, { GameManager } from '../../solver/pkg/solver-st/solver.js';
import { initArgs, EFFECTIVE_STACK } from './spots.ts';
import { strToId } from '../../solver/cards.ts';
import { decodeResults, readResults } from './decode.ts';
import { gradeAction } from './grade.ts';
import { deal, advance, heroAct, heroDecision } from './walk.ts';

await init(readFileSync(new URL('../../solver/pkg/solver-st/solver_bg.wasm', import.meta.url)));

function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const full = new Float32Array(1326).fill(1);
const spot = {
  tree: 'lean-xr', ipPos: 'BTN', heroSeat: 'oop',
  board: ['As', 'Kd', '7c', '2h', '9s'].map(strToId),
  oopRange: full, ipRange: full, startingPot: 100, effectiveStack: EFFECTIVE_STACK,
};
const g = GameManager.new();
assert.equal(g.init(...initArgs(spot)), undefined);
g.allocate_memory(true);
let it = 0, pct = 100;
while (it < 400 && pct > 1) {
  for (let k = 0; k < 10; k++) g.solve_step(it++);
  pct = (g.exploitability() / spot.startingPot) * 100;
}
g.finalize();
console.log(`solved: exploitability ${pct.toFixed(2)}% of pot, ${it} iterations`);
assert.ok(pct <= 1, 'target not reached');

// sync GameManager as SolverNodes
const nodes = {
  privateCards: (p) => g.private_cards(p),
  currentPlayer: () => g.current_player(),
  numActions: () => g.num_actions(),
  actionsAfter: (a) => g.actions_after(a),
  applyHistory: (h) => g.apply_history(h),
  totalBetAmount: (a) => g.total_bet_amount(a),
  possibleCards: () => g.possible_cards(),
  getResults: () => g.get_results(),
};
g.apply_history(new Uint32Array(0));
const length = [g.private_cards(0).length, g.private_cards(1).length];
const r = await readResults(nodes, length);
const nAct = r.numActions, n = length[0];
console.log('root:', r.currentPlayer, nAct, 'actions', g.actions_after(new Uint32Array(0)), '| combos', length.join('/'), '| eqrBase', r.eqrBase.join('/'));

// 1. decode offsets agree with the tail rule from smoke.mjs; strategies sum to 1
const raw = g.get_results();
assert.equal(r.strategy.byteOffset, (raw.length - 2 * nAct * n) * 8);
assert.equal(r.actionEv.byteOffset, (raw.length - nAct * n) * 8);
assert.equal(r.strategy.length, nAct * n);
let worst = 0;
for (let i = 0; i < n; i++) {
  let s = 0;
  for (let a = 0; a < nAct; a++) s += r.strategy[a * n + i];
  worst = Math.max(worst, Math.abs(s - 1));
}
assert.ok(worst < 0.01, 'strategy sum off by ' + worst);
const avgEq = [0, 1].map((p) => r.equity[p].reduce((s, e, i) => s + e * r.normalizer[p][i], 0) / r.normalizer[p].reduce((s, w) => s + w, 0));
console.log(`strategies sum to 1 (max error ${worst.toExponential(1)}); range equity oop ${avgEq[0].toFixed(3)} ip ${avgEq[1].toFixed(3)}`);
assert.ok(Math.abs(avgEq[0] - 0.5) < 0.1, 'equity not near 50%');

// 2. grading: synthetic thresholds (design.md), then the real strategy
const gr = (f, ev, c) => gradeAction(f, ev, c, 100).grade;
assert.equal(gr([0.5, 0.5], [10, 9], 1), 'best'); // freq >= 0.20
assert.equal(gr([0.9, 0.1], [10, 7], 1), 'fine'); // freq >= 0.05, loss 3% of pot
assert.equal(gr([0.99, 0.01], [10, 4], 1), 'mistake'); // loss 6%
assert.equal(gr([1, 0], [10, 0], 1), 'mistake'); // loss 10%
assert.equal(gr([1, 0], [20, 0], 1), 'blunder'); // loss 20%
assert.equal(gradeAction([1, 0], [20, 0], 1, 100).evLossBb, 2);
let proved = { best: 0, blunder: 0 };
// root (oop acts) and the node after oop bets (ip: fold / call): folding a strong hand must be a blunder
for (const history of [[], [1]]) {
  g.apply_history(Uint32Array.from(history));
  const rr = await readResults(nodes, length);
  const na = rr.numActions, m = length[rr.currentPlayer === 'oop' ? 0 : 1];
  const seat = rr.currentPlayer === 'oop' ? 0 : 1;
  for (let i = 0; i < m; i++) {
    const f = Array.from({ length: na }, (_, a) => rr.strategy[a * m + i]);
    const ev = Array.from({ length: na }, (_, a) => rr.actionEv[a * m + i]);
    const top = ev.indexOf(Math.max(...ev));
    const gTop = gradeAction(f, ev, top, rr.eqrBase[seat]);
    assert.equal(gTop.grade, 'best'); assert.equal(gTop.lossChips, 0);
    proved.best++;
    for (let a = 0; a < na; a++) {
      const x = gradeAction(f, ev, a, rr.eqrBase[seat]);
      assert.ok(x.lossChips >= 0);
      if (f[a] < 0.005 && x.lossPot > 0.15) { assert.equal(x.grade, 'blunder'); proved.blunder++; }
    }
  }
}
g.apply_history(new Uint32Array(0));
console.log(`best-EV action graded best for ${proved.best} hands; zero-frequency big-loss actions graded blunder: ${proved.blunder} cases`);
assert.ok(proved.blunder > 0, 'no zero-frequency big-loss case in this spot');

// 3. walks: both seats, hands in range, reach a terminal
const rng = mulberry32(12345);
const seen = { fold: 0, showdown: 0 };
for (let k = 0; k < 300; k++) {
  const seat = k % 2 ? 'ip' : 'oop';
  const hand = await deal(nodes, spot, seat, rng);
  const cards = [g.private_cards(0), g.private_cards(1)];
  const inRange = (seatName, c) => {
    const list = cards[seatName === 'oop' ? 0 : 1];
    return list.some((v) => (v & 255) === c[0] && v >> 8 === c[1]) && c[0] !== c[1];
  };
  assert.ok(inRange(seat, hand.hero), 'hero hand not in range');
  assert.ok(inRange(seat === 'oop' ? 'ip' : 'oop', hand.villain), 'villain hand not in range');
  const all = [...hand.hero, ...hand.villain, ...spot.board];
  assert.equal(new Set(all).size, all.length, 'card collision');
  let step = await advance(nodes, hand, rng, spot.startingPot);
  let guard = 0;
  while (step.status === 'hero') {
    assert.ok(guard++ < 10, 'hand does not end');
    const d = await heroDecision(nodes, hand);
    assert.equal(d.freq.length, step.actions.length);
    assert.ok(Math.abs(d.freq.reduce((s, x) => s + x, 0) - 1) < 0.01);
    step = await heroAct(nodes, hand, Math.floor(rng() * step.actions.length), rng, spot.startingPot);
  }
  assert.ok(step.outcome.pot >= spot.startingPot);
  seen[step.outcome.kind]++;
}
console.log('300 hands reached a terminal:', JSON.stringify(seen));
assert.ok(seen.fold > 0 && seen.showdown > 0);

// 4. 50 sampled villain actions at the root (hero ip, villain oop) match the strategy
const samples = 50;
const pick = [];
for (let i = 0; i < n; i++) {
  const p = Array.from({ length: nAct }, (_, a) => r.strategy[a * n + i]);
  if (r.normalizer[0][i] > 0 && Math.max(...p) < 0.75 && Math.min(...p) > 0.2) pick.push(i);
}
assert.ok(pick.length, 'no mixed hand at the root');
const vi = pick[0];
const base = await deal(nodes, spot, 'ip', mulberry32(1));
const count = new Array(nAct).fill(0);
const vcards = g.private_cards(0)[vi];
for (let k = 0; k < samples; k++) {
  const v = [vcards & 255, vcards >> 8];
  const hero = [strToId('Qc'), strToId('Qd')].every((c) => !v.includes(c)) ? [strToId('Qc'), strToId('Qd')] : [strToId('Jc'), strToId('Jd')];
  const hand = { ...base, hero, villainIdx: vi, villain: v, history: [], log: [], last: undefined, board: [...spot.board] };
  await advance(nodes, hand, mulberry32(1000 + k), spot.startingPot);
  count[hand.history[0]]++;
}
const p = Array.from({ length: nAct }, (_, a) => r.strategy[a * n + vi]);
console.log('villain hand', vi, 'strategy', p.map((x) => x.toFixed(2)).join(' '), '| 50 samples', count.map((c) => (c / samples).toFixed(2)).join(' '));
for (let a = 0; a < nAct; a++) assert.ok(Math.abs(count[a] / samples - p[a]) <= 3 * Math.sqrt((p[a] * (1 - p[a])) / samples) + 0.01, 'sampling off for action ' + a);

// 5. decodeResults on a node with no actor (terminal) does not read past the buffer
const t = decodeResults(raw, length, 'chance', 0);
assert.equal(t.strategy.length, 0);
console.log('ALL PASS');

// 6. chance path: turn spot (4-card board) walks through a dealt river card to a showdown
const tspot = { ...spot, board: ['As', 'Kd', '7c', '2h'].map(strToId) };
const tg = GameManager.new();
assert.equal(tg.init(...initArgs(tspot)), undefined);
tg.allocate_memory(true);
for (let k = 0; k < 20; k++) tg.solve_step(k);
tg.finalize();
const tn = {
  privateCards: (q) => tg.private_cards(q), currentPlayer: () => tg.current_player(), numActions: () => tg.num_actions(),
  actionsAfter: (a) => tg.actions_after(a), applyHistory: (h) => tg.apply_history(h), totalBetAmount: (a) => tg.total_bet_amount(a),
  possibleCards: () => tg.possible_cards(), getResults: () => tg.get_results(),
};
let rivers = 0;
for (let k = 0; k < 40; k++) {
  const hand = await deal(tn, tspot, k % 2 ? 'ip' : 'oop', rng);
  let step = await advance(tn, hand, rng, tspot.startingPot);
  while (step.status === 'hero') step = await heroAct(tn, hand, step.actions.findIndex((x) => x.startsWith('Call') || x.startsWith('Check')), rng, tspot.startingPot);
  if (step.outcome.kind === 'showdown') {
    rivers++;
    assert.equal(hand.board.length, 5);
    assert.ok(![...hand.hero, ...hand.villain].some((c) => hand.board.slice(0, 4).includes(c) || hand.board[4] === c), 'dealt card collides');
  }
}
console.log(`turn spot: ${rivers} of 40 hands dealt a river and reached showdown`);
assert.ok(rivers > 0);
console.log('CHANCE PASS');
