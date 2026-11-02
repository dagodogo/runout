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
  // red marks the aggressive actions only (storyboard principle 2); every border is at least 3:1 on black
  fold: 'border-rule-strong text-graphite hover:bg-raised hover:text-bone',
  check: 'border-rule-strong text-bone hover:bg-raised',
  call: 'border-bone/70 text-bone hover:bg-raised',
  bet: 'border-accent text-accent-text hover:bg-accent/10',
  raise: 'border-accent text-accent-text hover:bg-accent/10',
};

export const STREET_LABEL: Record<string, string> = { flop: 'FLOP', turn: 'TURN', river: 'RIVER', showdown: 'SHOWDOWN' };

export function formatLog(entry: DisplayLogEntry): string {
  const who = entry.isHero ? 'You' : positionLabel(entry.position);
  if (entry.amount !== undefined) return `${who} ${ACTION_VERB[entry.action]} ${entry.amount}bb`;
  return `${who} ${ACTION_VERB[entry.action]}`;
}
