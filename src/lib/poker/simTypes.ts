import type { Position } from './ranges';

export type SimStreet = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type SimAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface LogEntry {
  street: SimStreet;
  position: Position;
  action: SimAction;
  amount?: number;
  isHero: boolean;
}

export interface HeroOption {
  id: SimAction;
  label: string;
  amount?: number;
}

export interface HeroFeedback {
  chosenId: SimAction;
  bestId: SimAction;
  equityPct: number;
  handLabel: string;
  concept: string;
  explanation: string;
}
