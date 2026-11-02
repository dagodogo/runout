import { PageShell, PageHeader } from '@/components/layout/PageShell';
import { PloHandSimulator } from '@/components/trainer/PloHandSimulator';
import { Badge } from '@/components/ui/Badge';

export function PlayPloPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <PageHeader title="Play a PLO hand" aside={<Badge className="self-start">Heuristic approximation, not solver output</Badge>}>
          Pot-Limit Omaha: four hole cards, exactly two of which make your final hand, and bets capped by the pot. The
          other seats follow common PLO strategies; you decide and get a grade street by street.
        </PageHeader>
        <PloHandSimulator />
      </div>
    </PageShell>
  );
}
