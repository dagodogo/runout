import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * "Solver EV lost per 100 decisions" drawn as the Readout's caliper: your plays on the left, the solver's on the
 * right, the gap between them labelled. The caliper has no scale; the label is the number.
 */
export function EvLostTile({ ev }: { ev: { value: number; sample: number } | null }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm text-faint">Solver EV lost per 100 decisions</div>
        <Badge>{ev ? 'Source: solver' : 'Source: none yet'}</Badge>
      </div>
      {ev ? (
        <>
          <p className="sr-only">
            {ev.value.toFixed(2)} big blinds lost per 100 decisions, over {ev.sample} decisions graded by the solver.
          </p>
          <div aria-hidden="true" className="relative mt-3 h-16 select-none">
            <div className="readout-dim-label absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap font-display text-h3 font-semibold tabular-nums text-bone">
              {ev.value.toFixed(2)}&nbsp;bb
            </div>
            <div className="readout-dim absolute left-[6%] right-[6%] top-9 h-2.5 border-x border-bone">
              <div className="absolute inset-x-0 top-1/2 h-px bg-bone" />
            </div>
            <div className="absolute inset-x-0 top-[3.25rem] h-px bg-rule-strong" />
          </div>
          <div aria-hidden="true" className="flex justify-between text-sm text-graphite">
            <span>Your plays</span>
            <span>The solver's plays</span>
          </div>
          <p className="mt-2 text-sm text-graphite">{ev.sample} decisions graded by the solver</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-graphite">No solver decisions yet. Train a hand to start.</p>
      )}
    </Card>
  );
}
