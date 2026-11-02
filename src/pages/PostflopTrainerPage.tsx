import { PageShell, PageHeader } from '@/components/layout/PageShell';
import { PostflopScenarioTrainer } from '@/components/trainer/PostflopScenarioTrainer';

export function PostflopTrainerPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <PageHeader title="Postflop drill">
          Flop, turn and river spots. Pick the line you think earns the most, then see how every option compares and
          why.
        </PageHeader>
        <PostflopScenarioTrainer />
      </div>
    </PageShell>
  );
}
