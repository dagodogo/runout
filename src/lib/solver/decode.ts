// Decodes GameManager.get_results(). Layout copied from wasm-postflop ResultNav.vue (getResults).
// No browser APIs: runs in node tests and on the main thread.

type Maybe<T> = T | Promise<T>;
type F64 = Float64Array<ArrayBufferLike>;

/** The node-level calls the walk needs; the Comlink Remote of SolverApi and a sync GameManager adapter both fit. */
export interface SolverNodes {
  privateCards(player: number): Maybe<Uint16Array>;
  currentPlayer(): Maybe<'oop' | 'ip' | 'chance' | 'terminal'>;
  numActions(): Maybe<number>;
  actionsAfter(append: Uint32Array): Maybe<string>;
  applyHistory(history: Uint32Array): Maybe<void>;
  totalBetAmount(append: Uint32Array): Maybe<Uint32Array>;
  possibleCards(): Maybe<bigint>;
  getResults(): Maybe<F64>;
}

export interface Results {
  currentPlayer: 'oop' | 'ip' | 'chance' | 'terminal';
  numActions: number;
  isEmpty: number;
  /** pot each player's equity-realization is measured against: [oop, ip], chips */
  eqrBase: [number, number];
  /** per player (0 oop, 1 ip), one value per private combo */
  weights: F64[];
  normalizer: F64[];
  equity: F64[];
  ev: F64[];
  eqr: F64[];
  /** strategy[a * n + i] of the acting player's combo i; empty when nobody acts */
  strategy: F64;
  /** actionEv[a * n + i], chips */
  actionEv: F64;
}

const empty: F64 = new Float64Array(0);

export function decodeResults(
  buffer: F64,
  length: [number, number],
  currentPlayer: Results['currentPlayer'],
  numActions: number,
): Results {
  let o = 0;
  const take = (n: number) => buffer.subarray(o, (o += n));
  const header = take(3);
  const isEmpty = header[2];
  const pair = (): F64[] => [take(length[0]), take(length[1])];
  const weights = pair();
  const normalizer = pair();
  let equity = [empty, empty];
  let ev = [empty, empty];
  let eqr = [empty, empty];
  if (!isEmpty) {
    equity = pair();
    ev = pair();
    eqr = pair();
  }
  let strategy = empty;
  let actionEv = empty;
  if (currentPlayer === 'oop' || currentPlayer === 'ip') {
    const n = length[currentPlayer === 'oop' ? 0 : 1];
    strategy = take(numActions * n);
    if (!isEmpty) actionEv = take(numActions * n);
  }
  return { currentPlayer, numActions, isEmpty, eqrBase: [header[0], header[1]], weights, normalizer, equity, ev, eqr, strategy, actionEv };
}

/** Reads the current node. `length` = private combo counts, from privateCards(0/1).length. */
export async function readResults(nodes: SolverNodes, length: [number, number]): Promise<Results> {
  const [player, nAct, buffer] = await Promise.all([nodes.currentPlayer(), nodes.numActions(), nodes.getResults()]);
  return decodeResults(buffer, length, player, nAct);
}
