// Solver worker: owns the wasm module and one GameManager. Comlink-exposed; sequential use only.
import * as Comlink from 'comlink';
import { initArgs, type SolverSpot } from '../lib/solver/spots.ts';

type ModST = typeof import('./pkg/solver-st/solver.js');
type ModMT = typeof import('./pkg/solver-mt/solver.js');
type Game = InstanceType<ModST['GameManager']>;

export type SolverMode = 'mt' | 'st' | 'unavailable';
export interface InitInfo {
  mode: SolverMode;
  threads: number;
  /** true in single-thread mode: show "single-thread mode: expect several minutes" */
  banner: boolean;
  error?: string;
}
export interface SolveProgress {
  exploitabilityPct: number; // % of starting pot
  iterations: number;
  threads: number;
  seconds: number;
}
export interface SolveResult extends SolveProgress {
  status: 'done' | 'cancelled' | 'unavailable';
  /** why it stopped: target reached, iteration cap, time cap */
  stop?: 'target' | 'iterations' | 'time';
  memoryMb?: number;
  error?: string;
}

const TARGET_PCT = 1;
const MAX_ITERATIONS = 400;
const MAX_SECONDS = 180;
const MAX_MEMORY = 600e6;
const CHUNK = 10; // iterations between exploitability checks and yields

let mod: ModST | ModMT | null = null;
let info: InitInfo = { mode: 'unavailable', threads: 0, banner: false, error: 'not initialised' };
let game: Game | null = null;
let token = 0; // bumping it stops a running solve loop at its next yield

async function init(force?: 'st' | 'unavailable'): Promise<InitInfo> {
  if (force === 'unavailable') return (info = { mode: 'unavailable', threads: 0, banner: false, error: 'forced' });
  const cores = navigator.hardwareConcurrency || 2;
  const threads = Math.min(8, Math.max(1, cores - 1));
  let mtError: string | undefined;
  const isolated = self.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined';
  if (force !== 'st' && isolated) {
    try {
      const m = await import('./pkg/solver-mt/solver.js');
      await m.default();
      await m.initThreadPool(threads);
      mod = m;
      return (info = { mode: 'mt', threads, banner: false });
    } catch (e) {
      mtError = String(e); // fall through to single-thread, keeping the reason
    }
  }
  try {
    const m = await import('./pkg/solver-st/solver.js');
    await m.default();
    mod = m;
    return (info = { mode: 'st', threads: 1, banner: true, error: mtError });
  } catch (e) {
    return (info = { mode: 'unavailable', threads: 0, banner: false, error: String(e) });
  }
}

const yieldToLoop = () => new Promise<void>((r) => setTimeout(r));

async function solve(spot: SolverSpot, onProgress?: (p: SolveProgress) => void): Promise<SolveResult> {
  const mine = ++token;
  const threads = info.threads;
  const fail = (error: string): SolveResult => ({ status: 'unavailable', exploitabilityPct: 100, iterations: 0, threads, seconds: 0, error });
  if (!mod || info.mode === 'unavailable') return fail(info.error ?? 'solver not initialised');
  game?.free();
  const g = (game = mod.GameManager.new());
  const err = g.init(...initArgs(spot));
  if (err) return fail(err);
  const bytes = Number(g.memory_usage(true));
  if (bytes > MAX_MEMORY) return fail(`memory ${Math.round(bytes / 1e6)} MB over the 600 MB limit`);
  try {
    g.allocate_memory(true);
  } catch (e) {
    return fail(String(e));
  }
  onProgress?.({ exploitabilityPct: 100, iterations: 0, threads, seconds: 0 }); // lets the hand be dealt before the first chunk
  await yieldToLoop();
  const t0 = Date.now();
  let it = 0;
  let pct = 100;
  let stop: SolveResult['stop'];
  while (!stop) {
    if (mine !== token) return { status: 'cancelled', exploitabilityPct: pct, iterations: it, threads, seconds: (Date.now() - t0) / 1000 };
    const c0 = Date.now();
    do g.solve_step(it++); while (Date.now() - c0 < 5000 && it % CHUNK); // one check per 5 s or 10 iterations
    pct = (g.exploitability() / spot.startingPot) * 100;
    const seconds = (Date.now() - t0) / 1000;
    onProgress?.({ exploitabilityPct: pct, iterations: it, threads, seconds });
    stop = pct <= TARGET_PCT ? 'target' : it >= MAX_ITERATIONS ? 'iterations' : seconds >= MAX_SECONDS ? 'time' : undefined;
    await yieldToLoop();
  }
  if (mine !== token) return { status: 'cancelled', exploitabilityPct: pct, iterations: it, threads, seconds: (Date.now() - t0) / 1000 };
  g.finalize();
  return { status: 'done', stop, exploitabilityPct: pct, iterations: it, threads, seconds: (Date.now() - t0) / 1000, memoryMb: bytes / 1e6 };
}

const g = () => {
  if (!game) throw new Error('no solved game');
  return game;
};

// Node-level pass-through for decode/grade/walk (leaf 3). Valid after solve() returned 'done'.
const api = {
  init,
  solve,
  cancel() {
    token++;
  },
  privateCards: (player: number) => g().private_cards(player),
  currentPlayer: () => g().current_player() as 'oop' | 'ip' | 'chance' | 'terminal',
  numActions: () => g().num_actions(),
  actionsAfter: (append: Uint32Array) => g().actions_after(append),
  applyHistory: (history: Uint32Array) => g().apply_history(history),
  totalBetAmount: (append: Uint32Array) => g().total_bet_amount(append),
  possibleCards: () => g().possible_cards(),
  getResults: () => g().get_results(),
  getChanceReports: (append: Uint32Array, numActions: number) => g().get_chance_reports(append, numActions),
};

export type SolverApi = typeof api;
Comlink.expose(api);
