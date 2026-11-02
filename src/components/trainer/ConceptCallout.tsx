import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ConceptCalloutProps {
  concept: string;
  title: string;
  children: string;
  tone?: 'success' | 'error';
}

/** A structured "why" panel — a labeled concept tag plus the explanation,
 * instead of a bare paragraph, so the reasoning reads as a lesson rather
 * than a caption. */
export function ConceptCallout({ concept, title, children, tone = 'success' }: ConceptCalloutProps) {
  return (
    <div
      className={cn(
        'rounded-control border p-4',
        tone === 'success' ? 'border-good/30 bg-raised' : 'border-bad/30 bg-raised',
      )}
    >
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-bone" aria-hidden="true" />
        <span className="text-xs font-semibold text-bone">{concept}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}
