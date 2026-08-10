import { PageShell } from '@/components/layout/PageShell';
import { PloHandSimulator } from '@/components/trainer/PloHandSimulator';

export function PlayPloPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Play a PLO Hand</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Pot-Limit Omaha, dealt out for real: four hole cards, exactly two of which make your
            final hand, and bet sizing capped by the pot instead of your whole stack. Every seat
            plays a realistic PLO strategy — you make the calls and get graded street by street.
          </p>
        </div>
        <PloHandSimulator />
      </div>
    </PageShell>
  );
}
