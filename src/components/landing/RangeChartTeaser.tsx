import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PositionSelector } from '@/components/trainer/PositionSelector';
import { RangeGrid } from '@/components/trainer/RangeGrid';
import type { Position } from '@/lib/poker/ranges';

export function RangeChartTeaser() {
  const [position, setPosition] = useState<Position>('BTN');

  return (
    <section className="mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            A range chart you can actually study
          </h2>
          <p className="mt-3 text-ink-muted">
            Hover any hand to see its exact raise/call/fold mix. Split cells are the solver-flavored
            blend zones — the hands most players get wrong.
          </p>
        </div>
        <PositionSelector value={position} onChange={setPosition} />
      </div>
      <div className="mt-8">
        <RangeGrid position={position} />
      </div>
      <div className="mt-6 text-center">
        <Link to="/train/preflop" className="text-sm font-semibold text-gold hover:text-gold-soft">
          Open the full Preflop Trainer &rarr;
        </Link>
      </div>
    </section>
  );
}
