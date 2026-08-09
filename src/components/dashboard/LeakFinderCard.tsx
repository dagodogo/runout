import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { LeakEntry } from '@/lib/poker/leaks';

export function LeakFinderCard({ leaks }: { leaks: LeakEntry[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Leak Finder</h3>
        <Badge tone="violet">Auto-detected</Badge>
      </div>
      {leaks.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">
          Play at least 3 hands in a category to surface your weakest spots here.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {leaks.map((leak) => (
            <div key={leak.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-ink">{leak.label}</span>
                <span className="font-mono text-ink-muted">
                  {Math.round(leak.accuracy * 100)}% ({leak.correct}/{leak.attempts})
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${leak.accuracy * 100}%`,
                    background: leak.accuracy < 0.5 ? 'var(--color-error)' : 'var(--color-gold)',
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">{leak.tip}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
