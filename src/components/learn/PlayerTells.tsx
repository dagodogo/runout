import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TELLS, type Tell } from '@/data/tells';

// the word carries it; success/error are reserved for grades
const RELIABILITY_TONE: Record<Tell['reliability'], 'call' | 'neutral'> = {
  strong: 'call',
  moderate: 'neutral',
  weak: 'neutral',
};

export function PlayerTells() {
  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Player reads reference</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Live-poker tells only: timing and sizing patterns still beat physical reads, and any single tell is weaker
        than a pattern repeated across many hands.
      </p>
      <div className="mt-4 space-y-4">
        {TELLS.map((tell) => (
          <div key={tell.cue} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-ink">{tell.cue}</span>
              <Badge tone={RELIABILITY_TONE[tell.reliability]} className="shrink-0 capitalize">
                {tell.reliability}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{tell.meaning}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
