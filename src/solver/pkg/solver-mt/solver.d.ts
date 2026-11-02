/* tslint:disable */
/* eslint-disable */
/**
* @param {number} num_threads
* @returns {Promise<any>}
*/
export function initThreadPool(num_threads: number): Promise<any>;
/**
* @returns {Promise<any>}
*/
export function exitThreadPool(): Promise<any>;
/**
* @param {number} receiver
*/
export function wbg_rayon_start_worker(receiver: number): void;
/**
*/
export class GameManager {
  free(): void;
/**
* @returns {GameManager}
*/
  static new(): GameManager;
/**
* @param {Float32Array} oop_range
* @param {Float32Array} ip_range
* @param {Uint8Array} board
* @param {number} starting_pot
* @param {number} effective_stack
* @param {number} rake_rate
* @param {number} rake_cap
* @param {boolean} donk_option
* @param {string} oop_flop_bet
* @param {string} oop_flop_raise
* @param {string} oop_turn_bet
* @param {string} oop_turn_raise
* @param {string} oop_turn_donk
* @param {string} oop_river_bet
* @param {string} oop_river_raise
* @param {string} oop_river_donk
* @param {string} ip_flop_bet
* @param {string} ip_flop_raise
* @param {string} ip_turn_bet
* @param {string} ip_turn_raise
* @param {string} ip_river_bet
* @param {string} ip_river_raise
* @param {number} add_allin_threshold
* @param {number} force_allin_threshold
* @param {number} merging_threshold
* @param {string} added_lines
* @param {string} removed_lines
* @returns {string | undefined}
*/
  init(oop_range: Float32Array, ip_range: Float32Array, board: Uint8Array, starting_pot: number, effective_stack: number, rake_rate: number, rake_cap: number, donk_option: boolean, oop_flop_bet: string, oop_flop_raise: string, oop_turn_bet: string, oop_turn_raise: string, oop_turn_donk: string, oop_river_bet: string, oop_river_raise: string, oop_river_donk: string, ip_flop_bet: string, ip_flop_raise: string, ip_turn_bet: string, ip_turn_raise: string, ip_river_bet: string, ip_river_raise: string, add_allin_threshold: number, force_allin_threshold: number, merging_threshold: number, added_lines: string, removed_lines: string): string | undefined;
/**
* @param {number} player
* @returns {Uint16Array}
*/
  private_cards(player: number): Uint16Array;
/**
* @param {boolean} enable_compression
* @returns {bigint}
*/
  memory_usage(enable_compression: boolean): bigint;
/**
* @param {boolean} enable_compression
*/
  allocate_memory(enable_compression: boolean): void;
/**
* @param {number} current_iteration
*/
  solve_step(current_iteration: number): void;
/**
* @returns {number}
*/
  exploitability(): number;
/**
*/
  finalize(): void;
/**
* @param {Uint32Array} history
*/
  apply_history(history: Uint32Array): void;
/**
* @param {Uint32Array} append
* @returns {Uint32Array}
*/
  total_bet_amount(append: Uint32Array): Uint32Array;
/**
* @returns {string}
*/
  current_player(): string;
/**
* @returns {number}
*/
  num_actions(): number;
/**
* @param {Uint32Array} append
* @returns {string}
*/
  actions_after(append: Uint32Array): string;
/**
* @returns {bigint}
*/
  possible_cards(): bigint;
/**
* @returns {Float64Array}
*/
  get_results(): Float64Array;
/**
* @param {Uint32Array} append
* @param {number} num_actions
* @returns {Float64Array}
*/
  get_chance_reports(append: Uint32Array, num_actions: number): Float64Array;
}
/**
*/
export class wbg_rayon_PoolBuilder {
  free(): void;
/**
* @returns {number}
*/
  numThreads(): number;
/**
* @returns {number}
*/
  receiver(): number;
/**
*/
  build(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly __wbg_wbg_rayon_poolbuilder_free: (a: number) => void;
  readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
  readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
  readonly wbg_rayon_poolbuilder_build: (a: number) => void;
  readonly initThreadPool: (a: number) => number;
  readonly exitThreadPool: () => number;
  readonly wbg_rayon_start_worker: (a: number) => void;
  readonly __wbg_gamemanager_free: (a: number) => void;
  readonly gamemanager_new: () => number;
  readonly gamemanager_init: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number, w: number, x: number, y: number, z: number, a1: number, b1: number, c1: number, d1: number, e1: number, f1: number, g1: number, h1: number, i1: number, j1: number, k1: number, l1: number, m1: number, n1: number, o1: number, p1: number, q1: number, r1: number, s1: number, t1: number, u1: number, v1: number) => void;
  readonly gamemanager_private_cards: (a: number, b: number, c: number) => void;
  readonly gamemanager_memory_usage: (a: number, b: number) => number;
  readonly gamemanager_allocate_memory: (a: number, b: number) => void;
  readonly gamemanager_solve_step: (a: number, b: number) => void;
  readonly gamemanager_exploitability: (a: number) => number;
  readonly gamemanager_finalize: (a: number) => void;
  readonly gamemanager_apply_history: (a: number, b: number, c: number) => void;
  readonly gamemanager_total_bet_amount: (a: number, b: number, c: number, d: number) => void;
  readonly gamemanager_current_player: (a: number, b: number) => void;
  readonly gamemanager_num_actions: (a: number) => number;
  readonly gamemanager_actions_after: (a: number, b: number, c: number, d: number) => void;
  readonly gamemanager_possible_cards: (a: number) => number;
  readonly gamemanager_get_results: (a: number, b: number) => void;
  readonly gamemanager_get_chance_reports: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly memory: WebAssembly.Memory;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_thread_destroy: (a: number, b: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
* @param {WebAssembly.Memory} maybe_memory
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput, maybe_memory?: WebAssembly.Memory): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
* @param {WebAssembly.Memory} maybe_memory
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>, maybe_memory?: WebAssembly.Memory): Promise<InitOutput>;
