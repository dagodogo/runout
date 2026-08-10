import { positionLabel, type Position } from '@/lib/poker/ranges';

export type DisplaySimAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface DisplayLogEntry {
  street: string;
  position: Position;
  action: DisplaySimAction;
  amount?: number;
  isHero: boolean;
}

export const ACTION_VERB: Record<DisplaySimAction, string> = {
  fold: 'folds',
  check: 'checks',
  call: 'calls',
  bet: 'bets',
  raise: 'raises to',
};

export const ACTION_TONE: Record<DisplaySimAction, string> = {
  fold: 'border-fold/50 text-fold-soft hover:border-fold hover:bg-fold/10',
  check: 'border-border-strong text-ink-muted hover:border-ink-muted hover:text-ink',
  call: 'border-call/50 text-call-soft hover:border-call hover:bg-call/10',
  bet: 'border-raise/50 text-raise-soft hover:border-raise hover:bg-raise/10',
  raise: 'border-raise/50 text-raise-soft hover:border-raise hover:bg-raise/10',
};

export const STREET_LABEL: Record<string, string> = { flop: 'FLOP', turn: 'TURN', river: 'RIVER', showdown: 'SHOWDOWN' };

export function formatLog(entry: DisplayLogEntry): string {
  const who = entry.isHero ? 'You' : positionLabel(entry.position);
  if (entry.amount !== undefined) return `${who} ${ACTION_VERB[entry.action]} ${entry.amount}bb`;
  return `${who} ${ACTION_VERB[entry.action]}`;
}
