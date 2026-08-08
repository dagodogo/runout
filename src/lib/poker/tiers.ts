export interface Tier {
  level: number;
  name: string;
  minXp: number;
}

export const TIERS: Tier[] = [
  { level: 1, name: 'Limper', minXp: 0 },
  { level: 2, name: 'Calling Station', minXp: 150 },
  { level: 3, name: 'Nit', minXp: 350 },
  { level: 4, name: 'Grinder', minXp: 650 },
  { level: 5, name: 'Regular', minXp: 1050 },
  { level: 6, name: 'Shark', minXp: 1600 },
  { level: 7, name: 'Crusher', minXp: 2300 },
  { level: 8, name: 'Solver Student', minXp: 3200 },
  { level: 9, name: 'Range Reader', minXp: 4300 },
  { level: 10, name: 'GTO Adherent', minXp: 5700 },
  { level: 11, name: 'Table Captain', minXp: 7400 },
  { level: 12, name: 'Runout Elite', minXp: 9500 },
];

export function tierForXp(xp: number): Tier {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (xp >= tier.minXp) current = tier;
  }
  return current;
}

export function nextTier(xp: number): Tier | null {
  const current = tierForXp(xp);
  const idx = TIERS.findIndex((t) => t.level === current.level);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function progressToNextTier(xp: number): number {
  const current = tierForXp(xp);
  const next = nextTier(xp);
  if (!next) return 1;
  const span = next.minXp - current.minXp;
  return span <= 0 ? 1 : Math.min(1, (xp - current.minXp) / span);
}
