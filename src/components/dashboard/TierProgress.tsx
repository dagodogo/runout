import { Card } from '@/components/ui/Card';
import { nextTier, progressToNextTier, tierForXp } from '@/lib/poker/tiers';

export function TierProgress({ xp }: { xp: number }) {
  const tier = tierForXp(xp);
  const next = nextTier(xp);
  const progress = progressToNextTier(xp);

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">Current tier</div>
          <div className="mt-1 font-display text-2xl font-semibold text-gold">
            Lv.{tier.level} {tier.name}
          </div>
        </div>
        <div className="text-right font-mono text-sm text-ink-muted">{xp.toLocaleString()} XP</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mt-2 text-xs text-ink-muted">
        {next ? `${next.minXp - xp} XP to Lv.${next.level} ${next.name}` : 'Max tier reached'}
      </div>
    </Card>
  );
}
