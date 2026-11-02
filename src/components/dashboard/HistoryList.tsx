import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { HistoryEntry } from '@/lib/poker/stats';

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Recent hands</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Your last practice reps will show up here.</p>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <Badge tone={e.correct ? 'success' : 'error'} className="w-24 justify-center">
                  {e.correct ? 'Correct' : 'Missed'}
                </Badge>
                <div>
                  <span className="tabular-nums font-semibold text-ink">{e.label}</span>
                  <span className="ml-2 text-xs text-ink-faint">{e.detail}</span>
                </div>
              </div>
              <span className="text-xs text-ink-faint">{timeAgo(e.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
