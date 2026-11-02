import { PlayingCard } from './PlayingCard';
import { cardText, STREET_NAME } from './solverFormat';
import { cn } from '@/lib/cn';

interface Seat {
  name: string;
  /** chips behind, when known */
  stack?: string;
  /** solver card ids; left out = face down */
  cards?: number[];
}

interface SeatRowsProps {
  villain: Seat;
  hero: Seat & { cards: number[] };
  board: number[];
  /** "5.5 bb", when known */
  pot?: string;
  /** what happened on this street, as sentences */
  line?: string[];
  className?: string;
}

const Label = ({ name, sub, strong }: { name: string; sub?: string; strong?: boolean }) => (
  <div className="min-w-0">
    <div className={cn('text-sm', strong ? 'font-semibold text-bone' : 'text-graphite')}>{name}</div>
    {sub && <div className="text-sm tabular-nums text-faint">{sub}</div>}
  </div>
);

/** A heads-up spot as three rows: villain, board, you. Two seats only, no six-seat oval. */
export function SeatRows({ villain, hero, board, pot, line, className }: SeatRowsProps) {
  const cards = (ids: number[]) => ids.map((c) => <PlayingCard key={c} card={cardText(c)} size="row" />);
  return (
    <div className={className}>
      <div className="grid grid-cols-[5.5rem_1fr] items-center gap-x-4 gap-y-4 sm:grid-cols-[7rem_1fr]">
        <Label name={villain.name} sub={villain.stack} />
        <div role="group" aria-label={`${villain.name}'s cards`} className="flex gap-1.5">
          {villain.cards ? cards(villain.cards) : [0, 1].map((i) => <PlayingCard key={i} card="" size="row" faceDown />)}
        </div>

        <Label name={STREET_NAME[board.length] ?? 'Board'} sub={pot && `Pot ${pot}`} />
        <div role="group" aria-label="Board" className="flex gap-1.5">
          {cards(board)}
          {Array.from({ length: Math.max(0, 5 - board.length) }, (_, i) => (
            <PlayingCard key={`slot${i}`} card="" size="row" empty />
          ))}
        </div>

        <Label name={hero.name} sub={hero.stack} strong />
        <div role="group" aria-label="Your cards" className="flex gap-1.5">
          {cards(hero.cards)}
        </div>
      </div>
      {line && line.length > 0 && <p className="mt-4 text-bone">{line.join(' ')}</p>}
    </div>
  );
}
