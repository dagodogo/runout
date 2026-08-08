import type { Card } from './cards';

export type TextureTag =
  | 'monotone'
  | 'two-tone'
  | 'rainbow'
  | 'paired'
  | 'connected'
  | 'disconnected'
  | 'high'
  | 'middling'
  | 'low';

export interface BoardTexture {
  tags: TextureTag[];
  /** 0 (bone dry) .. 1 (maximally wet/coordinated) */
  wetness: number;
  summary: string;
}

/** Classifies a flop/turn board using the standard wet/dry heuristics: suit
 * coordination, pairing, connectivity, and how high the cards run. */
export function classifyBoard(board: Card[]): BoardTexture {
  const tags: TextureTag[] = [];
  let wetness = 0.25;

  const suitCounts = new Map<string, number>();
  for (const c of board) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const maxSuit = Math.max(...suitCounts.values());
  if (maxSuit >= 3) {
    tags.push('monotone');
    wetness += 0.3;
  } else if (maxSuit === 2) {
    tags.push('two-tone');
    wetness += 0.15;
  } else {
    tags.push('rainbow');
  }

  const rankCounts = new Map<number, number>();
  for (const c of board) rankCounts.set(c.rank, (rankCounts.get(c.rank) ?? 0) + 1);
  const paired = [...rankCounts.values()].some((n) => n >= 2);
  if (paired) {
    tags.push('paired');
    wetness -= 0.1;
  }

  const uniqueRanks = [...new Set(board.map((c) => c.rank))].sort((a, b) => a - b);
  const span = uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0];
  const connected = span <= 4 && uniqueRanks.length >= 3;
  if (connected) {
    tags.push('connected');
    wetness += 0.25;
  } else {
    tags.push('disconnected');
  }

  const highCard = Math.max(...board.map((c) => c.rank));
  const lowCard = Math.min(...board.map((c) => c.rank));
  if (highCard >= 12) {
    tags.push('high');
  } else if (lowCard >= 8) {
    tags.push('middling');
  } else {
    tags.push('low');
    wetness += 0.1;
  }

  wetness = Math.max(0, Math.min(1, wetness));

  const suitPart = tags.includes('monotone') ? 'monotone' : tags.includes('two-tone') ? 'two-tone' : 'rainbow';
  const shapePart = connected ? 'connected' : 'disconnected';
  const heightPart = tags.includes('high') ? 'high-card' : tags.includes('low') ? 'low' : 'middling';
  const pairedPart = paired ? ', paired' : '';
  const summary = `${heightPart}, ${shapePart}, ${suitPart}${pairedPart}`;

  return { tags, wetness, summary };
}

export interface DrawInfo {
  flushDraw: boolean;
  straightDraw: boolean;
  comboDraw: boolean;
}

export function detectDraws(heroCards: Card[], board: Card[]): DrawInfo {
  const all = [...heroCards, ...board];
  const suitCounts = new Map<string, number>();
  for (const c of all) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const flushDraw = [...suitCounts.values()].some((n) => n === 4);

  const ranks = new Set(all.map((c) => c.rank));
  if (ranks.has(14)) ranks.add(1); // wheel-low ace
  let straightDraw = false;
  for (let low = 1; low <= 10; low++) {
    let filled = 0;
    for (let r = low; r < low + 5; r++) if (ranks.has(r)) filled++;
    if (filled === 4) {
      straightDraw = true;
      break;
    }
  }

  return { flushDraw, straightDraw, comboDraw: flushDraw && straightDraw };
}
