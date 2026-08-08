import { PageShell } from '@/components/layout/PageShell';
import { HandSimulator } from '@/components/trainer/HandSimulator';

export function PlayHandPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Play a Hand</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            A full hand, start to finish. Every seat plays a realistic strategy — you make your
            decisions at each street, and get graded the moment you act. Preflop through showdown,
            just like a real table.
          </p>
        </div>
        <HandSimulator />
      </div>
    </PageShell>
  );
}
