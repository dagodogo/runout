import { PageShell, PageHeader } from '@/components/layout/PageShell';
import { GtoFrequencyTrainer } from '@/components/trainer/GtoFrequencyTrainer';

export function GtoTrainerPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <PageHeader title="Frequency drill">
          Many hands are not played one way every time. Train your feel for mixed strategies: the hands where a range
          splits between raising and folding.
        </PageHeader>
        <GtoFrequencyTrainer />
      </div>
    </PageShell>
  );
}
