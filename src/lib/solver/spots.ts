// Spot builder for the solver trainer. No browser APIs: runs in the worker and in node tests.
import { BTN_RFI, CO_RFI, BB_CALL_VS_BTN, BB_CALL_VS_CO, expandTo1326 } from '../../data/solverRanges.ts';

export const STARTING_POT = 55; // chips; 0.1 bb per chip (5.5 bb: 2.5 open + call + dead blinds)
export const EFFECTIVE_STACK = 975; // 97.5 bb behind
export const CHIPS_PER_BB = 10;
export const TREE_ID = 'lean-xr';

export type IpPosition = 'BTN' | 'CO';
export type Seat = 'oop' | 'ip';

export interface SolverSpot {
  tree: typeof TREE_ID;
  ipPos: IpPosition;
  heroSeat: Seat;
  board: [number, number, number]; // solver card ids
  oopRange: Float32Array;
  ipRange: Float32Array;
  startingPot: number;
  effectiveStack: number;
}

/** Random flop of three distinct card ids (0..51). */
export function randomFlop(rng: () => number = Math.random): [number, number, number] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (52 - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return [deck[0], deck[1], deck[2]];
}

/** BTN vs BB or CO vs BB, random flop, random hero seat (all overridable). */
export function buildSpot(
  rng: () => number = Math.random,
  override: Partial<Pick<SolverSpot, 'ipPos' | 'heroSeat' | 'board'>> = {},
): SolverSpot {
  const ipPos = override.ipPos ?? (rng() < 0.5 ? 'BTN' : 'CO');
  return {
    tree: TREE_ID,
    ipPos,
    heroSeat: override.heroSeat ?? (rng() < 0.5 ? 'oop' : 'ip'),
    board: override.board ?? randomFlop(rng),
    oopRange: expandTo1326(ipPos === 'BTN' ? BB_CALL_VS_BTN : BB_CALL_VS_CO),
    ipRange: expandTo1326(ipPos === 'BTN' ? BTN_RFI : CO_RFI),
    startingPot: STARTING_POT,
    effectiveStack: EFFECTIVE_STACK,
  };
}

/** Arguments for GameManager.init, in the order of solver.d.ts. Lean tree "lean-xr" (design REVISION 1). */
export type InitArgs = [
  Float32Array, Float32Array, Uint8Array, number, number, number, number, boolean,
  string, string, string, string, string, string, string, string, // oop: flop bet/raise, turn bet/raise/donk, river bet/raise/donk
  string, string, string, string, string, string, // ip: flop, turn, river bet/raise
  number, number, number, string, string,
];

export function initArgs(s: SolverSpot): InitArgs {
  return [
    s.oopRange, s.ipRange, Uint8Array.from(s.board), s.startingPot, s.effectiveStack, 0, 0, false,
    '', '3x', '75%', '', '', '75%', '', '',
    '50%', '', '75%', '', '75%', '',
    0, 0, 0.1, '', '',
  ];
}
