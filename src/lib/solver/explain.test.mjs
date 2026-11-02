// Guard tests for the explanation engine: crafted nodes, then every hand of the solved river spot As Kd 7c 2h 9s.
// Run: node --experimental-strip-types src/lib/solver/explain.test.mjs   (from the runout folder)
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import init, { GameManager } from '../../solver/pkg/solver-st/solver.js';
import { initArgs, EFFECTIVE_STACK } from './spots.ts';
import { strToId } from '../../solver/cards.ts';
import { readResults } from './decode.ts';
import { explain, handCategory, roleWord, RULES } from './explain.ts';

const id = strToId;
const pack = (a, b) => (a < b ? a | (b << 8) : b | (a << 8));
const F = (xs) => Float64Array.from(xs);
const RIVER = ['As', 'Kd', '7c', '2h', '9s'].map(id);

/**
 * Crafted node, hero oop at index 0. heroEq/villEq: equity per combo (normalizer 1 each unless given).
 * freq/ev: hero hand's strategy and action EVs (chips).
 */
function mk({ heroEq = [0.5, 0.5], villEq = [0.5, 0.5], heroNorm, villNorm, eqr = 1, actions = ['Check:0', 'Bet:75'], freq = [0.5, 0.5], ev = [50, 50],
  eqrBase = [100, 100], board = RIVER, heroCards = [pack(id('Qh'), id('Jh')), pack(id('3c'), id('4d'))], villCards = [pack(id('Ah'), id('Ad')), pack(id('5c'), id('6d'))], isEmpty = 0 } = {}) {
  const nh = heroEq.length, na = actions.length;
  const strategy = new Float64Array(na * nh), actionEv = new Float64Array(na * nh);
  for (let a = 0; a < na; a++) { strategy[a * nh] = freq[a]; actionEv[a * nh] = ev[a]; }
  const results = {
    currentPlayer: 'oop', numActions: na, isEmpty, eqrBase,
    weights: [F(heroEq.map(() => 1)), F(villEq.map(() => 1))],
    normalizer: [F(heroNorm ?? heroEq.map(() => 1)), F(villNorm ?? villEq.map(() => 1))],
    equity: isEmpty ? [F([]), F([])] : [F(heroEq), F(villEq)],
    ev: [F(heroEq.map(() => 0)), F(villEq.map(() => 0))],
    eqr: isEmpty ? [F([]), F([])] : [F(heroEq.map(() => eqr)), F(villEq.map(() => 1))],
    strategy, actionEv,
  };
  return { results, heroSeat: 'oop', heroIdx: 0, cards: [heroCards, villCards], board, actions, chosen: 0 };
}
const fires = (inp, rule) => explain(inp).fired.includes(rule);
const text = (inp, rule) => { const e = explain(inp); return e.sentences[e.fired.indexOf(rule)]; };
let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };

// ---------- hand category from cards ----------
const hc = (h, b) => handCategory(h.map(id), b.map(id));
assert.deepEqual(hc(['Ah', '5h'], ['Kh', '9h', '2c']), { made: null, draws: ['flush draw'] });
assert.deepEqual(hc(['9c', '8d'], ['Th', '7s', '2c']), { made: null, draws: ['OESD'] });
assert.deepEqual(hc(['9c', '6d'], ['Th', '7s', '2c']), { made: null, draws: ['gutshot'] });
assert.deepEqual(hc(['Ac', 'Kd'], ['Ah', '7s', '2c']), { made: 'pair', draws: [] });
assert.deepEqual(hc(['3c', '4d'], ['7h', '7s', '2c', 'Kd', '9s']), { made: null, draws: [] }); // board pair only
assert.deepEqual(hc(['Ac', '2d'], ['3h', '4s', '9c']), { made: null, draws: ['gutshot'] }); // wheel gutshot
checks += 6;

// ---------- each guard fires on a crafted case, and its failure omits the sentence ----------
// hand
ok(fires(mk(), 'hand'), 'hand fires');
ok(!fires(mk({ isEmpty: 1 }), 'hand') && explain(mk({ isEmpty: 1 })).sentences.length === 0, 'empty node: no sentences');
// potOdds: villain bet 50 into 100 -> eqrBase hero 100, villain 150; call 50, final pot 200, needs 25%
const facing = mk({ actions: ['Fold:0', 'Call:0'], freq: [0.2, 0.8], ev: [0, 30], eqrBase: [100, 150], heroEq: [0.4, 0.5], eqr: 0.7 });
ok(fires(facing, 'potOdds'), 'potOdds fires');
const po = text(facing, 'potOdds');
ok(po.includes('5.0bb') && po.includes('20.0bb') && po.includes('25%') && po.includes('40%') && po.includes('realize only 70%'), 'potOdds numbers: ' + po);
ok(!text(mk({ actions: ['Fold:0', 'Call:0'], freq: [0.2, 0.8], ev: [0, 30], eqrBase: [100, 150], eqr: 0.9 }), 'potOdds').includes('realize'), 'eqr clause omitted at 0.9');
ok(!fires(mk(), 'potOdds'), 'potOdds omitted when not facing');
// mix: 0.5/0.5, EVs 50 and 51 (1% of pot)
ok(fires(mk({ ev: [49.5, 50.5] }), 'mix') && text(mk({ ev: [49.5, 50.5] }), 'mix').includes('5.0bb'), 'mix fires');
ok(!fires(mk({ freq: [0.9, 0.1] }), 'mix'), 'mix omitted: second freq < 0.25');
ok(!fires(mk({ ev: [50, 55] }), 'mix'), 'mix omitted: EV gap 5% of pot');
// size: two bet sizes, big beats small by 5% of pot; polarized range (2 of 3 combos >= 0.8 or <= 0.3)
const sized = mk({ actions: ['Check:0', 'Bet:50', 'Bet:75'], freq: [0.2, 0.2, 0.6], ev: [40, 45, 50], heroEq: [0.5, 0.9, 0.5] });
ok(fires(sized, 'size'), 'size fires');
const st = text(sized, 'size');
ok(st.includes('Bet 75% pot') && st.includes('0.5bb more than Bet 50% pot') && !st.includes('polarized'), 'size text: ' + st);
const polar = mk({ actions: ['Check:0', 'Bet:50', 'Bet:75'], freq: [0.2, 0.2, 0.6], ev: [40, 45, 50], heroEq: [0.5, 0.9, 0.1, 0.95, 0.05] });
ok(text(polar, 'size').includes('polarized here (40% very strong, 40% weak)'), 'polarized clause: ' + text(polar, 'size'));
ok(!fires(mk({ actions: ['Check:0', 'Bet:75'] }), 'size'), 'size omitted: one bet size (lean tree)');
ok(!fires(mk({ actions: ['Check:0', 'Bet:50', 'Bet:75'], freq: [0.2, 0.2, 0.6], ev: [40, 50, 51] }), 'size'), 'size omitted: gap 1% of pot');
// blockers: river, hero air with Ah Qd; villain strong = AhAd (blocked by the Ah) and KcKh (not) -> 50%
const bl = mk({ heroEq: [0.1, 0.5], heroCards: [pack(id('Ah'), id('Qd')), pack(id('3c'), id('4d'))],
  villEq: [0.95, 0.9, 0.2], villCards: [pack(id('Ah'), id('Ad')), pack(id('Kc'), id('Kh')), pack(id('5c'), id('6d'))], freq: [0.3, 0.7], ev: [0, 5] });
ok(fires(bl, 'blockers') && text(bl, 'blockers').includes('50%'), 'blockers fires: ' + text(bl, 'blockers'));
ok(!fires({ ...bl, board: RIVER.slice(0, 4) }, 'blockers'), 'blockers omitted on the turn');
ok(!fires(mk({ heroEq: [0.1, 0.5], villEq: [0.95, 0.9, 0.2], villCards: [pack(id('Kh'), id('Kc')), pack(id('Qc'), id('Qs')), pack(id('5c'), id('6d'))] }), 'blockers'), 'blockers omitted: nothing blocked');
// nuts: hero 2 of 4 combos >= 0.85, villain 1 of 4 -> 50% vs 25%
const nuts = mk({ heroEq: [0.5, 0.9, 0.9, 0.2], villEq: [0.9, 0.5, 0.5, 0.5] });
ok(fires(nuts, 'nuts') && text(nuts, 'nuts').includes('50%') && text(nuts, 'nuts').includes('25%'), 'nuts fires: ' + text(nuts, 'nuts'));
ok(!fires(mk({ heroEq: [0.5, 0.9, 0.9, 0.2], villEq: [0.9, 0.9, 0.5, 0.5] }), 'nuts'), 'nuts omitted: equal share');
// range / rangeClose: exactly one of the two
ok(fires(mk({ heroEq: [0.7, 0.7], villEq: [0.3, 0.3] }), 'range') && !fires(mk({ heroEq: [0.7, 0.7], villEq: [0.3, 0.3] }), 'rangeClose'), 'range fires');
ok(fires(mk(), 'rangeClose') && !fires(mk(), 'range'), 'rangeClose fires');
// cap: never more than 4 sentences
ok(explain(polar).sentences.length <= 4, 'cap 4');

// ---------- vocabulary predicates ----------
ok(roleWord(0.6, false, true) === 'value' && roleWord(0.59, false, true) === null && roleWord(0.9, false, false) === null, 'value predicate');
ok(roleWord(0.44, true, true) === 'semi-bluff' && roleWord(0.44, false, true) === null, 'semi-bluff predicate');
ok(roleWord(0.29, false, true) === 'bluff' && roleWord(0.3, false, true) === null, 'bluff predicate');
const vt = text(mk({ heroEq: [0.7, 0.5], freq: [0.2, 0.8], ev: [40, 60] }), 'hand');
ok(vt.includes('for value'), 'value sentence: ' + vt);
ok(!text(mk({ heroEq: [0.7, 0.5], freq: [0.8, 0.2], ev: [60, 40] }), 'hand').includes('value'), 'no value when check is top');

// ---------- headline ----------
const h = explain({ ...mk({ freq: [0.38, 0.62], ev: [47, 50] }), chosen: 0 });
console.log('headline example:', h.headline);
ok(h.headline === 'Best - solver: Bet 75% pot 62% of the time, Check 38%; your hand loses 0.30bb by checking', 'headline format');
// bug 1/2: Call shows its amount, Check and Fold none; bet sizes snap to the tree's 50%/75%
ok(explain(mk({ actions: ['Fold', 'Call:41'], freq: [0.2, 0.8], ev: [0, 30], eqrBase: [100, 150] })).table.map((t) => t.label).join() === 'Fold,Call 4.1bb', 'call label');
ok(explain(mk({ actions: ['Check', 'Bet:51'], eqrBase: [100, 100] })).table[1].label === 'Bet 50% pot', 'bet size snaps to 50%');
// bug 3: a weak made hand never reads "made hand ... air"
const weakPair = mk({ heroEq: [0.12, 0.5], heroCards: [pack(id('Ah'), id('3d')), pack(id('3c'), id('4d'))], freq: [0.5, 0.5] });
ok(text(weakPair, 'hand').startsWith('You hold a weak pair with only 12% equity against his range.') && !text(weakPair, 'hand').includes(': air'), 'weak pair text: ' + text(weakPair, 'hand'));
// bug 4: headline names the real top-EV action, or "about equal" when the mix guard holds
ok(explain(mk({ freq: [0.6, 0.4], ev: [50.4, 50.5], actions: ['Check', 'Bet:75'] })).headline.includes('checking and betting are about equal here'), 'equal headline');
const topEv = explain({ ...mk({ freq: [0.9, 0.1], ev: [50, 50.2], actions: ['Check', 'Bet:75'] }), chosen: 1 }).headline;
ok(topEv.endsWith('betting is the top-EV play for your hand') && !topEv.includes('about equal'), 'top-EV headline: ' + topEv);
console.log(`crafted: ${checks} checks pass`);

// ---------- real solved river spot: every hand, root and facing a bet ----------
await init(readFileSync(new URL('../../solver/pkg/solver-st/solver_bg.wasm', import.meta.url)));
const full = new Float32Array(1326).fill(1);
const spot = { tree: 'lean-xr', ipPos: 'BTN', heroSeat: 'oop', board: RIVER, oopRange: full, ipRange: full, startingPot: 100, effectiveStack: EFFECTIVE_STACK };
const g = GameManager.new();
g.init(...initArgs(spot));
g.allocate_memory(true);
for (let it = 0; it < 400; it += 10) {
  for (let k = 0; k < 10; k++) g.solve_step(it + k);
  if (g.exploitability() <= 1) break;
}
g.finalize();
const nodes = { currentPlayer: () => g.current_player(), numActions: () => g.num_actions(), getResults: () => g.get_results() };
const cards = [g.private_cards(0), g.private_cards(1)];
const length = [cards[0].length, cards[1].length];
const firedCount = {}, words = { value: 0, 'semi-bluff': 0, bluff: 0 };
const samples = [];
let total = 0;
for (const history of [[], [1], [0], [0, 1]]) {
  g.apply_history(Uint32Array.from(history));
  const results = await readResults(nodes, length);
  const seat = results.currentPlayer;
  const actions = g.actions_after(new Uint32Array(0)).split('/');
  const hero = seat === 'oop' ? 0 : 1;
  for (let i = 0; i < length[hero]; i++) {
    if (results.normalizer[hero][i] === 0) continue;
    const e = explain({ results, heroSeat: seat, heroIdx: i, cards, board: RIVER, actions, chosen: i % actions.length });
    total++;
    const all = [e.headline, ...e.sentences, ...e.table.map((t) => t.label)].join(' ').toLowerCase();
    assert.ok(!all.includes('protection'), 'banned word');
    assert.ok(e.sentences.length >= 2 && e.sentences.length <= 4, 'sentence count ' + e.sentences.length);
    const eq = results.equity[hero][i];
    const draw = e.category.draws.length > 0;
    const topBet = /^(Bet|Raise|All-in)/.test([...e.table].sort((a, b) => b.freq - a.freq)[0].label);
    const rest = all.replaceAll('semi-bluff', '');
    if (all.includes('value')) { words.value++; assert.ok(eq >= 0.6 && topBet, 'value misuse'); }
    if (all.includes('semi-bluff')) { words['semi-bluff']++; assert.ok(draw && eq < 0.45, 'semi-bluff misuse'); }
    if (rest.includes('bluff')) { words.bluff++; assert.ok(eq < 0.3, 'bluff misuse: ' + all); }
    for (const f of e.fired) firedCount[f] = (firedCount[f] ?? 0) + 1;
    for (const want of ['hand', 'potOdds', 'mix', 'nuts', 'range']) {
      if (!e.fired.includes(want) || samples.some((s) => s.rule === want)) continue;
      samples.push({ history, i, rule: want, sentence: e.sentences[e.fired.indexOf(want)], eq, eqr: results.eqr[hero][i], eqrBase: [...results.eqrBase], e,
        rangeEq: [0, 1].map((p) => results.equity[p].reduce((s, x, k) => s + x * results.normalizer[p][k], 0) / results.normalizer[p].reduce((s, w) => s + w, 0)),
        nut: [0, 1].map((p) => results.equity[p].reduce((s, x, k) => s + (x >= 0.85 ? results.normalizer[p][k] : 0), 0) / results.normalizer[p].reduce((s, w) => s + w, 0)) });
    }
  }
}
console.log(`real spot: ${total} hand-node explanations, no "protection", vocabulary within predicates; word uses ${JSON.stringify(words)}`);
console.log('rules fired:', JSON.stringify(firedCount));
assert.ok(firedCount.hand && firedCount.potOdds && (firedCount.range || firedCount.rangeClose), 'real spot fires the core rules');
for (const s of samples) {
  console.log(`\n[${s.rule}] history ${JSON.stringify(s.history)} hand ${s.i}: ${s.sentence}`);
  console.log(`  fields: equity ${s.eq.toFixed(4)}, eqr ${s.eqr.toFixed(4)}, eqrBase ${s.eqrBase.join('/')}, rangeEq oop/ip ${s.rangeEq.map((x) => x.toFixed(4)).join('/')}, nutShare oop/ip ${s.nut.map((x) => x.toFixed(4)).join('/')}, table ${s.e.table.map((t) => `${t.label} f=${t.freq.toFixed(3)} ev=${t.evBb.toFixed(2)}bb`).join('; ')}`);
}
assert.ok(RULES.length === 8);
console.log('\nEXPLAIN PASS');
