import type { Grade } from '@/lib/solver/grade';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { Readout } from '@/components/ui/Readout';
import { ActionTable } from '@/components/ui/ActionTable';
import { readoutLayout, type ReadoutRow } from '@/components/ui/readoutMath';
import { cn } from '@/lib/cn';
import { headlineBody } from './solverFormat';

interface GradePanelProps {
  grade: Grade;
  /** explain.ts headline */
  headline: string;
  rows: ReadoutRow[];
  chosen: number;
  potBb: number;
  sentences: string[];
  /** e.g. "Flop: you chose Check" */
  context?: string;
  /** the action table; the hero panel leaves it out (headline and sentences carry the numbers) */
  table?: boolean;
  className?: string;
}

/** One graded decision: badge, headline, Readout, the 2-4 sentences, the action table. Same on the landing page and in the trainer. */
export function GradePanel({ grade, headline, rows, chosen, potBb, sentences, context, table = true, className }: GradePanelProps) {
  return (
    <div className={cn('fade-in', className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <GradeBadge grade={grade} className="text-lead" />
        {context && <span className="text-sm text-graphite">{context}</span>}
      </div>
      <p className="mt-2 text-bone">{headlineBody(headline)}</p>
      <Readout className="mt-5" rows={rows} chosen={chosen} potBb={potBb} />
      {sentences.length > 0 && (
        <ul className="mt-5 max-w-[65ch] space-y-2 text-graphite">
          {sentences.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      {table && (
        <div className="mt-5">
          <ActionTable rows={rows} chosen={chosen} best={readoutLayout(rows, chosen, potBb).best} caption="Solver frequency and EV for each action" />
        </div>
      )}
    </div>
  );
}
