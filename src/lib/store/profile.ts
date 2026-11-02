import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Position } from '@/lib/poker/ranges';
import type { LeakCategory, Street } from '@/lib/poker/scenarios';
import type { Grade } from '@/lib/solver/grade';

export interface PreflopAttempt {
  id: string;
  timestamp: number;
  position: Position;
  hand: string;
  correct: boolean;
}

/** One graded decision from any trainer. Heuristic rows have no EV, so evLossBb is null. */
export interface DecisionAttempt {
  id: string;
  timestamp: number;
  source: 'solver' | 'heuristic';
  game: 'nlhe' | 'plo';
  street: Street;
  category: LeakCategory;
  grade: Grade;
  evLossBb: number | null;
  correct: boolean;
}

/** Postflop rows are decisions now; the old name stays for the stats helpers. */
export type PostflopAttempt = DecisionAttempt;

interface ProfileState {
  xp: number;
  preflopAttempts: PreflopAttempt[];
  decisions: DecisionAttempt[];
  recordPreflop: (attempt: Omit<PreflopAttempt, 'id' | 'timestamp'>) => void;
  recordDecision: (decision: Omit<DecisionAttempt, 'id' | 'timestamp'>) => void;
  resetProgress: () => void;
}

const XP_CORRECT = 12;
const XP_INCORRECT = 3;
const XP_BY_GRADE: Record<Grade, number> = { best: 12, fine: 8, mistake: 3, blunder: 1 };
const MAX_HISTORY = 500;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      xp: 0,
      preflopAttempts: [],
      decisions: [],
      recordPreflop: (attempt) =>
        set((state) => ({
          xp: state.xp + (attempt.correct ? XP_CORRECT : XP_INCORRECT),
          preflopAttempts: [
            { ...attempt, id: makeId(), timestamp: Date.now() },
            ...state.preflopAttempts,
          ].slice(0, MAX_HISTORY),
        })),
      recordDecision: (decision) =>
        set((state) => ({
          xp: state.xp + XP_BY_GRADE[decision.grade],
          decisions: [{ ...decision, id: makeId(), timestamp: Date.now() }, ...state.decisions].slice(0, MAX_HISTORY),
        })),
      resetProgress: () => set({ xp: 0, preflopAttempts: [], decisions: [] }),
    }),
    {
      name: 'runout-profile',
      version: 1,
      // v0 kept heuristic postflop rows in `postflopAttempts`; carry them into `decisions`
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Record<string, unknown> & { decisions?: DecisionAttempt[] };
        if (version < 1) {
          const old = Array.isArray(s.postflopAttempts) ? (s.postflopAttempts as Record<string, unknown>[]) : [];
          s.decisions = [
            ...(s.decisions ?? []),
            ...old
              .filter((a) => typeof a.category === 'string')
              .map((a) => ({
                id: String(a.id ?? makeId()),
                timestamp: Number(a.timestamp ?? Date.now()),
                source: 'heuristic' as const,
                game: 'nlhe' as const,
                street: (a.street ?? 'flop') as Street, // old rows carry no street field
                category: a.category as LeakCategory,
                grade: (a.correct ? 'best' : 'mistake') as Grade,
                evLossBb: null,
                correct: Boolean(a.correct),
              })),
          ];
          delete s.postflopAttempts;
        }
        return s as unknown as ProfileState;
      },
    },
  ),
);
