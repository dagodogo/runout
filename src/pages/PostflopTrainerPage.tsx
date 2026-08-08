import { PageShell } from '@/components/layout/PageShell';
import { PostflopScenarioTrainer } from '@/components/trainer/PostflopScenarioTrainer';

export function PostflopTrainerPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Postflop Scenario Trainer</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Realistic flop, turn, and river spots. Pick the highest-EV line, then see how every option
            compares and why the best play wins.
          </p>
        </div>
        <PostflopScenarioTrainer />
      </div>
    </PageShell>
  );
}
