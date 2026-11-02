// Display strings for solver action labels ("Bet:28" from walk.ts) and outcomes. UI only: no solver logic.
import { CHIPS_PER_BB } from '@/lib/solver/spots';
import { cardDisplay } from '@/lib/poker/cards';
import { idToCard } from '@/solver/cards';

/** solver card id -> "K♠" (PlayingCard's input) */
export const cardText = (id: number) => cardDisplay(idToCard(id));

/** chips -> "2.8 bb" (non-breaking space) */
export const bbText = (chips: number) => `${(chips / CHIPS_PER_BB).toFixed(1)} bb`;

// the lean tree's only bet sizes (spots.ts initArgs): flop 50% (in position), turn and river 75%
const betPct = (boardLen: number) => (boardLen === 3 ? 50 : 75);

const parse = (raw: string) => {
  const [kind, amt] = raw.split(':');
  return { kind, chips: amt === undefined ? 0 : +amt };
};

/** Button label: "Bet:28" -> "Bet 2.8 bb (50%)"; Check and Fold carry no amount. */
export function actionLabel(raw: string, boardLen: number): string {
  const { kind, chips } = parse(raw);
  if (!(chips > 0)) return kind;
  if (kind === 'Bet') return `Bet ${bbText(chips)} (${betPct(boardLen)}%)`;
  if (kind === 'Raise') return `Raise to ${bbText(chips)}`;
  if (kind === 'Allin') return `All-in ${bbText(chips)}`;
  return `${kind} ${bbText(chips)}`;
}

/** An action as a sentence: "BB calls 2.8 bb.", "You check." */
export function actionText(raw: string, who: string): string {
  const { kind, chips } = parse(raw);
  const s = who === 'You' ? '' : 's';
  if (kind === 'Check') return `${who} check${s}.`;
  if (kind === 'Fold') return `${who} fold${s}.`;
  if (kind === 'Call') return chips > 0 ? `${who} call${s} ${bbText(chips)}.` : `${who} call${s}.`;
  if (kind === 'Bet') return `${who} bet${s} ${bbText(chips)}.`;
  if (kind === 'Raise') return `${who} raise${s} to ${bbText(chips)}.`;
  if (kind === 'Allin') return `${who} ${s ? 'goes' : 'go'} all-in for ${bbText(chips)}.`;
  return `${who}: ${raw}.`;
}

export const STREET_NAME: Record<number, string> = { 3: 'Flop', 4: 'Turn', 5: 'River' };

/** explain.ts headline without its leading grade word (the badge shows it): "Fine - solver: X" -> "Solver: X." */
export const headlineBody = (h: string) => h.replace(/^(Best|Fine|Mistake|Blunder) - solver: /, 'Solver: ') + '.';
