import { type HandCell, scoreOf } from './hands';

export const TABLE_SIZES = [6, 9] as const;
export type TableSize = (typeof TABLE_SIZES)[number];

/** All positions that can open (raise-first-in) across both table sizes. */
export const RFI_POSITIONS = ['UTG', 'UTG1', 'UTG2', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB'] as const;
export type RfiPosition = (typeof RFI_POSITIONS)[number];
export type Position = RfiPosition | 'BB';

/** Full seat order for each table size, tightest-to-widest, blinds last. */
export const POSITIONS_BY_SIZE: Record<TableSize, Position[]> = {
  6: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
  9: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
};

export function positionsForSize(size: TableSize): Position[] {
  return POSITIONS_BY_SIZE[size];
}

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
 * position's opening range lands near realistic full-ring / 6-max RFI
 * frequencies. CO/BTN/SB are shared across table sizes — what mainly matters
 * for those seats is who's left to act behind you, which is similar either way. */
export const RFI_CONFIG: Record<RfiPosition, RfiConfig> = {
  UTG: { label: 'UTG', description: 'Under the Gun — first to act, tightest range', full: 7.5, mixStart: 6.5 },
  UTG1: { label: 'UTG+1', description: 'One seat after UTG, still deep in the field', full: 7.5, mixStart: 6.5 },
  UTG2: { label: 'UTG+2', description: 'Early-middle position at a full table', full: 7, mixStart: 6 },
  MP: { label: 'MP', description: 'Middle Position', full: 6.5, mixStart: 5.5 },
  LJ: { label: 'LJ', description: 'Lojack — two off the button', full: 6.5, mixStart: 5.5 },
  HJ: { label: 'HJ', description: 'Hijack — one off the cutoff', full: 6, mixStart: 5 },
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

/** A defender facing an open — could be the big blind (pot odds + closes the
 * action, so the widest defend) or a cold-caller elsewhere (in position if
 * they're a later non-blind seat, out of position with no price discount if
 * they're the small blind). Thresholds shift with both the opener's tightness
 * and the defender's positional value. */
export function defendMix(hand: HandCell, openerPosition: RfiPosition, defenderPosition: Position): ActionMix {
  const score = scoreOf(hand);
  const openerFull = RFI_CONFIG[openerPosition].full;
  const opennessAdj = (openerFull - 4) * 0.55; // tighter opener -> defend tighter

  let positionBonus: number;
  if (defenderPosition === 'BB') positionBonus = 1.4; // pot odds + closes the action
  else if (defenderPosition === 'SB') positionBonus = -1.6; // no price discount, still acts first postflop
  else positionBonus = 0.5; // a later non-blind seat has position postflop

  const threeBetFull = 9 + opennessAdj * 0.5 - positionBonus * 0.3;
  const threeBetMixStart = threeBetFull - 1.5;
  const callFull = 4 + opennessAdj - positionBonus;
  const callMixStart = callFull - 1.5;

  let raise = 0;
  if (score >= threeBetFull) raise = 1;
  else if (score >= threeBetMixStart) {
    raise = lerp(0.1, 0.85, (score - threeBetMixStart) / (threeBetFull - threeBetMixStart));
  }

  let call = 0;
  if (score < threeBetMixStart) {
    if (score >= callFull) call = 1;
    else if (score >= callMixStart) call = lerp(0.15, 0.9, (score - callMixStart) / (callFull - callMixStart));
  }

  const fold = Math.max(0, 1 - raise - call);
  return { raise, call, fold };
}

export function bbDefendMix(hand: HandCell, openerPosition: RfiPosition = 'BTN'): ActionMix {
  return defendMix(hand, openerPosition, 'BB');
}

export function getMix(position: Position, hand: HandCell, openerPosition: RfiPosition = 'BTN'): ActionMix {
  return position === 'BB' ? bbDefendMix(hand, openerPosition) : rfiMix(position, hand);
}

export function positionLabel(position: Position): string {
  return position === 'BB' ? 'BB' : RFI_CONFIG[position].label;
}

export function positionDescription(position: Position, openerPosition?: RfiPosition): string {
  if (position === 'BB') {
    return openerPosition
      ? `Big Blind defending against a ${RFI_CONFIG[openerPosition].label} open — 3-bet, call, or fold`
      : 'Big Blind defending — 3-bet, call, or fold';
  }
  return RFI_CONFIG[position].description;
}

/** Non-blind positions later than `openerPosition` in the given table's seat
 * order — the valid cold-callers, plus the blinds who can always defend. */
export function defendersFor(openerPosition: RfiPosition, size: TableSize): Position[] {
  const order = POSITIONS_BY_SIZE[size];
  const openerIdx = order.indexOf(openerPosition);
  if (openerIdx === -1) return ['BB'];
  return order.slice(openerIdx + 1);
}

export const ALL_POSITIONS: Position[] = POSITIONS_BY_SIZE[6];
