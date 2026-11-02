import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { STRATEGY_NOTES, STRATEGY_EXAMPLES } from '@/data/strategyNotes';
import { cn } from '@/lib/cn';

export function StrategyLibrary() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Strategy library</h3>
      <p className="mt-1 text-xs text-ink-muted">The core ideas behind every recommendation you'll see in the trainers.</p>

      <div className="mt-4 divide-y divide-border rounded-control border border-border">
        {STRATEGY_NOTES.map((note, i) => {
          const isOpen = open === i;
          return (
            <div key={note.title}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-ink">{note.title}</span>
                <ChevronDown
                  size={16}
                  className={cn('shrink-0 text-ink-faint transition-transform duration-200', isOpen && 'rotate-180 text-bone')}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <ul className="space-y-2 px-4 pb-4 text-sm text-ink-muted">
                  {note.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <h4 className="mt-6 text-xs font-semibold text-ink-faint">Illustrative examples</h4>
      <div className="mt-3 space-y-3">
        {STRATEGY_EXAMPLES.map((ex) => (
          <div key={ex.title} className="rounded-control border border-border bg-surface-2 p-4">
            <div className="text-sm font-semibold text-bone">{ex.title}</div>
            <p className="mt-1 text-sm text-ink-muted">{ex.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
