import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Position } from '@/lib/poker/ranges';
import type { LeakCategory } from '@/lib/poker/scenarios';

export interface PreflopAttempt {
  id: string;
  timestamp: number;
  position: Position;
  hand: string;
  correct: boolean;
}

export interface PostflopAttempt {
  id: string;
  timestamp: number;
  scenarioId: string;
  category: LeakCategory;
  correct: boolean;
}

interface ProfileState {
  xp: number;
  preflopAttempts: PreflopAttempt[];
  postflopAttempts: PostflopAttempt[];
  recordPreflop: (attempt: Omit<PreflopAttempt, 'id' | 'timestamp'>) => void;
  recordPostflop: (attempt: Omit<PostflopAttempt, 'id' | 'timestamp'>) => void;
  resetProgress: () => void;
}

const XP_CORRECT = 12;
const XP_INCORRECT = 3;
const MAX_HISTORY = 500;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      xp: 0,
      preflopAttempts: [],
      postflopAttempts: [],
      recordPreflop: (attempt) =>
        set((state) => ({
          xp: state.xp + (attempt.correct ? XP_CORRECT : XP_INCORRECT),
          preflopAttempts: [
            { ...attempt, id: makeId(), timestamp: Date.now() },
            ...state.preflopAttempts,
          ].slice(0, MAX_HISTORY),
        })),
      recordPostflop: (attempt) =>
        set((state) => ({
          xp: state.xp + (attempt.correct ? XP_CORRECT : XP_INCORRECT),
          postflopAttempts: [
            { ...attempt, id: makeId(), timestamp: Date.now() },
            ...state.postflopAttempts,
          ].slice(0, MAX_HISTORY),
        })),
      resetProgress: () => set({ xp: 0, preflopAttempts: [], postflopAttempts: [] }),
    }),
    { name: 'runout-profile' },
  ),
);
