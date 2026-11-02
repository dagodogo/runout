// Main-thread client for the solver worker. One worker, one game, sequential.
import * as Comlink from 'comlink';
import type { SolverSpot } from '../lib/solver/spots.ts';
import { readResults, type Results } from '../lib/solver/decode.ts';
import type { InitInfo, SolveProgress, SolveResult, SolverApi } from './worker.ts';

export type { InitInfo, SolveProgress, SolveResult, SolverMode } from './worker.ts';

let worker: Worker | null = null;
let api: Comlink.Remote<SolverApi> | null = null;
let ready: Promise<InitInfo> | null = null;

/** Start the worker once; later calls return the same result. `force` is for tests of the fallback ladder. */
export function init(force?: 'st' | 'unavailable'): Promise<InitInfo> {
  ready ??= (async () => {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onerror = (e) => {
      ready = Promise.resolve({ mode: 'unavailable', threads: 0, banner: false, error: String(e.message ?? e) });
    };
    api = Comlink.wrap<SolverApi>(worker);
    return api.init(force);
  })();
  return ready;
}

/** Cancels any running solve, then solves the spot. Resolves when the solve stops. */
export async function startSolve(spot: SolverSpot, onProgress?: (p: SolveProgress) => void): Promise<SolveResult> {
  const info = await init();
  if (!api || info.mode === 'unavailable') {
    return { status: 'unavailable', exploitabilityPct: 100, iterations: 0, threads: 0, seconds: 0, error: info.error };
  }
  // 240 s = the 180 s cap plus the longest chunk; a dead worker never answers
  const dead = new Promise<SolveResult>((r) =>
    setTimeout(() => r({ status: 'unavailable', exploitabilityPct: 100, iterations: 0, threads: 0, seconds: 0, error: 'solver did not answer' }), 240_000),
  );
  return Promise.race([api.solve(spot, onProgress && Comlink.proxy(onProgress)), dead]);
}

export const cancel = () => api?.cancel();

/** Node-level accessors; leaf 3 builds decode/grade/walk on these. Call only after startSolve resolved 'done'. */
export function nodes(): Comlink.Remote<SolverApi> {
  if (!api) throw new Error('solver not initialised');
  return api;
}

/** Decoded get_results() of the current node (offsets: lib/solver/decode.ts). */
export async function results(): Promise<Results> {
  const n = nodes();
  return readResults(n, [(await n.privateCards(0)).length, (await n.privateCards(1)).length]);
}
