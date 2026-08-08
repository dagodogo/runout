import { PageShell } from '@/components/layout/PageShell';
import { GtoFrequencyTrainer } from '@/components/trainer/GtoFrequencyTrainer';

export function GtoTrainerPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">GTO Frequency Trainer</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Most hands aren't 100% one action. Train your feel for mixed strategies — the blend zones
            where solver-flavored ranges split between raising and folding.
          </p>
        </div>
        <GtoFrequencyTrainer />
      </div>
    </PageShell>
  );
}
