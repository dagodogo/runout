import { type HandCell, scoreOf } from './hands';

export const RFI_POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB'] as const;
export type RfiPosition = (typeof RFI_POSITIONS)[number];
export type Position = RfiPosition | 'BB';

export type Action = 'raise' | 'call' | 'fold';

export interface ActionMix {
  raise: number;
  call: number;
  fold: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

interface RfiConfig {
  label: string;
  description: string;
  full: number;
  mixStart: number;
}

/** Thresholds calibrated against Chen-score combo-weight distribution so each
 * position's opening range lands near realistic 6-max RFI frequencies. */
export const RFI_CONFIG: Record<RfiPosition, RfiConfig> = {
  UTG: { label: 'UTG', description: 'Under the Gun — first to act, tightest range', full: 7.5, mixStart: 6.5 },
  MP: { label: 'MP', description: 'Middle Position', full: 6.5, mixStart: 5.5 },
  CO: { label: 'CO', description: 'Cutoff', full: 5.5, mixStart: 4.5 },
  BTN: { label: 'BTN', description: 'Button — widest range, best position', full: 4, mixStart: 3.5 },
  SB: { label: 'SB', description: 'Small Blind — opens folded-to pot', full: 4.5, mixStart: 3.5 },
};

export function rfiMix(position: RfiPosition, hand: HandCell): ActionMix {
  const cfg = RFI_CONFIG[position];
  const score = scoreOf(hand);
  let raise: number;
  if (score >= cfg.full) raise = 1;
  else if (score >= cfg.mixStart) raise = lerp(0.15, 0.92, (score - cfg.mixStart) / (cfg.full - cfg.mixStart));
  else raise = 0;
  return { raise, call: 0, fold: 1 - raise };
}

/** BB doesn't open — it defends. Three-way mix vs. a BTN open, the classic
 * raise/call/fold preflop chart. */
const BB_THREEBET_FULL = 9;
const BB_THREEBET_MIX = 7.5;
const BB_CALL_FULL = 4;
const BB_CALL_MIX = 2.5;

export function bbDefendMix(hand: HandCell): ActionMix {
  const score = scoreOf(hand);
  let raise = 0;
  if (score >= BB_THREEBET_FULL) raise = 1;
  else if (score >= BB_THREEBET_MIX) {
    raise = lerp(0.1, 0.85, (score - BB_THREEBET_MIX) / (BB_THREEBET_FULL - BB_THREEBET_MIX));
  }

  let call = 0;
  if (score < BB_THREEBET_MIX) {
    if (score >= BB_CALL_FULL) call = 1;
    else if (score >= BB_CALL_MIX) call = lerp(0.15, 0.9, (score - BB_CALL_MIX) / (BB_CALL_FULL - BB_CALL_MIX));
  }

  const fold = Math.max(0, 1 - raise - call);
  return { raise, call, fold };
}

export function getMix(position: Position, hand: HandCell): ActionMix {
  return position === 'BB' ? bbDefendMix(hand) : rfiMix(position, hand);
}

export function positionLabel(position: Position): string {
  return position === 'BB' ? 'BB (vs BTN open)' : RFI_CONFIG[position].label;
}

export function positionDescription(position: Position): string {
  return position === 'BB'
    ? 'Big Blind defending against a Button open — 3-bet, call, or fold'
    : RFI_CONFIG[position].description;
}

export const ALL_POSITIONS: Position[] = [...RFI_POSITIONS, 'BB'];
