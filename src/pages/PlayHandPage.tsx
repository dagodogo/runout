import { PageShell, PageHeader } from '@/components/layout/PageShell';
import { HandSimulator } from '@/components/trainer/HandSimulator';
import { Badge } from '@/components/ui/Badge';

export function PlayHandPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <PageHeader title="Play a hand" aside={<Badge className="self-start">Heuristic approximation, not solver output</Badge>}>
          A full 6-max hand from the deal to showdown. The other seats follow common strategies; you decide on every
          street and get a grade the moment you act.
        </PageHeader>
        <HandSimulator />
      </div>
    </PageShell>
  );
}
