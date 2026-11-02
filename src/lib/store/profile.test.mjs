// Checks the decision log: XP by grade, old persisted state still loads, solver-first leaks, solver EV metric.
// Run: node --experimental-strip-types src/lib/store/profile.test.mjs   (from the runout folder)
import { register } from 'node:module';
import assert from 'node:assert/strict';

// The app's TS sources use '@/' and extensionless imports; this hook lets plain node load them.
const root = new URL('../../../', import.meta.url).href;
register(
  `data:text/javascript,${encodeURIComponent(`
const ROOT = ${JSON.stringify(root)};
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) specifier = new URL('src/' + specifier.slice(2), ROOT).href;
  try { return await next(specifier, context); }
  catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; return next(specifier + '.ts', context); }
}`)}`,
);

// zustand persist reads window.localStorage; an in-memory stub is enough.
const disk = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (disk.has(k) ? disk.get(k) : null),
    setItem: (k, v) => disk.set(k, String(v)),
    removeItem: (k) => disk.delete(k),
  },
};

// An old persisted profile (before decisions existed) must still load.
disk.set(
  'runout-profile',
  JSON.stringify({
    state: {
      xp: 30,
      preflopAttempts: [],
      postflopAttempts: [{ id: 'old', timestamp: 1, scenarioId: 'x', category: 'c-bet', correct: true }],
    },
    version: 0,
  }),
);

const { useProfileStore } = await import('./profile.ts');
const { postflopLeaks, solverEvLostPer100, spotCategory } = await import('../poker/leaks.ts');
const s = () => useProfileStore.getState();

assert.equal(s().xp, 30, 'old persisted xp loads');
assert.equal(s().decisions.length, 1, 'old postflop row migrated into decisions');
assert.deepEqual(
  [s().decisions[0].source, s().decisions[0].grade, s().decisions[0].evLossBb, s().decisions[0].street, s().decisions[0].category],
  ['heuristic', 'best', null, 'flop', 'c-bet'],
  'migrated row shape',
);

// XP by grade: best 12, fine 8, mistake 3, blunder 1.
const solverRow = { source: 'solver', game: 'nlhe', street: 'river', category: 'bluff-catch', evLossBb: 0.5 };
for (const [grade, xp, correct] of [['best', 12, true], ['fine', 8, true], ['mistake', 3, false], ['blunder', 1, false]]) {
  const before = s().xp;
  s().recordDecision({ ...solverRow, grade, correct });
  assert.equal(s().xp - before, xp, `${grade} gives ${xp} XP`);
  assert.equal(s().decisions[0].grade, grade);
  assert.equal(s().decisions[0].source, 'solver');
  assert.ok(s().decisions[0].id && s().decisions[0].timestamp > 0, 'id and timestamp set');
}

// Heuristic rows: correct gives 12 and wrong gives 3, the old per-attempt XP.
s().resetProgress();
assert.equal(s().xp, 0);
assert.deepEqual(s().decisions, []);
s().recordDecision({ source: 'heuristic', game: 'nlhe', street: 'flop', category: 'c-bet', grade: 'best', evLossBb: null, correct: true });
s().recordDecision({ source: 'heuristic', game: 'nlhe', street: 'flop', category: 'c-bet', grade: 'mistake', evLossBb: null, correct: false });
assert.equal(s().xp, 15, 'heuristic correct 12 + wrong 3');

// postflopLeaks: solver rows win once a category has 3 of them; otherwise heuristic rows count.
s().resetProgress();
const row = (source, category, grade, correct) =>
  s().recordDecision({ source, game: 'nlhe', street: 'turn', category, grade, evLossBb: source === 'solver' ? 0.2 : null, correct });
// c-bet: 3 solver (2 right) and 3 heuristic (all right): solver wins, 2/3.
row('solver', 'c-bet', 'best', true);
row('solver', 'c-bet', 'best', true);
row('solver', 'c-bet', 'mistake', false);
for (let i = 0; i < 3; i++) row('heuristic', 'c-bet', 'best', true);
// bluff-catch: 2 solver (below 3) and 3 heuristic (all wrong): heuristic wins, 0/3.
row('solver', 'bluff-catch', 'mistake', false);
row('solver', 'bluff-catch', 'best', true);
for (let i = 0; i < 3; i++) row('heuristic', 'bluff-catch', 'mistake', false);
// value-sizing: 2 solver only, below 3 everywhere, so no entry.
row('solver', 'value-sizing', 'best', true);
row('solver', 'value-sizing', 'best', true);

const leaks = postflopLeaks(s().decisions);
const byKey = Object.fromEntries(leaks.map((e) => [e.key, e]));
assert.equal(leaks.length, 2, 'value-sizing has too few rows');
assert.equal(byKey['c-bet'].attempts, 3);
assert.equal(byKey['c-bet'].correct, 2, 'c-bet uses the solver rows (2 of 3 right)');
assert.equal(byKey['bluff-catch'].attempts, 3);
assert.equal(byKey['bluff-catch'].correct, 0, 'bluff-catch uses the heuristic rows (0 of 3 right)');

// Solver EV lost per 100: mean of solver evLossBb x 100; heuristic rows (null EV) are ignored.
s().resetProgress();
row('solver', 'c-bet', 'fine', true); // evLossBb 0.2
row('solver', 'c-bet', 'mistake', false); // evLossBb 0.2
row('heuristic', 'c-bet', 'best', true);
const ev = solverEvLostPer100(s().decisions);
assert.equal(ev.sample, 2);
assert.ok(Math.abs(ev.value - 20) < 1e-9, `mean 0.2bb x 100 = 20, got ${ev.value}`);
s().resetProgress();
row('heuristic', 'c-bet', 'best', true);
assert.equal(solverEvLostPer100(s().decisions), null, 'no solver rows gives null');

// Spot category for the hand simulators and the solver trainer.
assert.equal(spotCategory('flop', true), 'bluff-catch');
assert.equal(spotCategory('flop', false), 'c-bet');
assert.equal(spotCategory('turn', false), 'value-sizing');

console.log('profile.test.mjs: all checks passed');
