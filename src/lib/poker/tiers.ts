export interface Tier {
  level: number;
  name: string;
  minXp: number;
}

const BAND_NAMES = [
  'Limper',
  'Calling Station',
  'Nit',
  'Grinder',
  'Regular',
  'Shark',
  'Crusher',
  'Solver Student',
  'Range Reader',
  'GTO Adherent',
  'Table Captain',
  'Runout Elite',
];

const LEVELS_PER_BAND = 5;
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/** XP required to REACH a given level (level 1 = 0 XP). Formula-based so
 * progression has no hard ceiling — there's always a next level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(60 * Math.pow(level, 1.7));
}

export function tierName(level: number): string {
  const bandIndex = Math.floor((level - 1) / LEVELS_PER_BAND);
  const withinBand = (level - 1) % LEVELS_PER_BAND;
  if (bandIndex < BAND_NAMES.length) {
    return `${BAND_NAMES[bandIndex]} ${ROMAN[withinBand]}`;
  }
  // Beyond the named bands: keep climbing as "Runout Elite" with rising numerals.
  const prestige = bandIndex - BAND_NAMES.length + 2;
  return `Runout Elite ${prestige}.${ROMAN[withinBand]}`;
}

function tierAt(level: number): Tier {
  return { level, name: tierName(level), minXp: xpForLevel(level) };
}

/** Binary search for the highest level whose xpForLevel <= xp. Levels are
 * unbounded, so we widen the search range until it brackets xp. */
export function tierForXp(xp: number): Tier {
  if (xp <= 0) return tierAt(1);
  let hi = 2;
  while (xpForLevel(hi) <= xp) hi *= 2;
  let lo = 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (xpForLevel(mid) <= xp) lo = mid;
    else hi = mid;
  }
  return tierAt(lo);
}

export function nextTier(xp: number): Tier {
  const current = tierForXp(xp);
  return tierAt(current.level + 1);
}

export function progressToNextTier(xp: number): number {
  const current = tierForXp(xp);
  const next = nextTier(xp);
  const span = next.minXp - current.minXp;
  return span <= 0 ? 1 : Math.min(1, (xp - current.minXp) / span);
}
