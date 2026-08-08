import { useCallback, useState } from 'react';
import { randomScenario, LEAK_CATEGORY_LABEL, type PostflopScenario } from '@/lib/poker/scenarios';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MiniCard } from './MiniCard';
import { useProfileStore } from '@/lib/store/profile';
import { cn } from '@/lib/cn';

export function PostflopScenarioTrainer() {
  const [scenario, setScenario] = useState<PostflopScenario>(() => randomScenario());
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [session, setSession] = useState({ correct: 0, total: 0 });
  const recordPostflop = useProfileStore((s) => s.recordPostflop);

  const handleChoose = useCallback(
    (optionId: string) => {
      if (chosenId) return;
      const correct = optionId === scenario.bestOptionId;
      setChosenId(optionId);
      setSession((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
      recordPostflop({ scenarioId: scenario.id, category: scenario.category, correct });
    },
    [chosenId, scenario, recordPostflop],
  );

  const nextScenario = useCallback(() => {
    setScenario(randomScenario(scenario.id));
    setChosenId(null);
  }, [scenario.id]);

  const bestOption = scenario.options.find((o) => o.id === scenario.bestOptionId)!;
  const sortedOptions = [...scenario.options].sort((a, b) => b.ev - a.ev);

  return (
    <Card className="mx-auto w-full max-w-2xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <Badge tone="violet">{scenario.street.toUpperCase()}</Badge>
          <Badge tone="neutral">{LEAK_CATEGORY_LABEL[scenario.category]}</Badge>
        </div>
        <span className="font-mono">
          {session.correct}/{session.total} correct
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
        <span>
          You: <span className="text-ink">{scenario.heroPosition}</span> vs{' '}
          <span className="text-ink">{scenario.villainPosition}</span>
        </span>
        <span>
          Pot <span className="font-mono text-ink">{scenario.potBb}bb</span> &middot; Eff. stack{' '}
          <span className="font-mono text-ink">{scenario.effectiveStackBb}bb</span>
        </span>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {scenario.board.map((c) => (
          <MiniCard key={c} card={c} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-ink-faint">Your hand</span>
        {scenario.heroCards.map((c) => (
          <MiniCard key={c} card={c} size="sm" />
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        <span className="text-ink">{scenario.facing}.</span> {scenario.texture}.
      </p>

      <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: `repeat(${scenario.options.length}, minmax(0, 1fr))` }}>
        {scenario.options.map((opt) => {
          const isBest = opt.id === scenario.bestOptionId;
          const isChosen = opt.id === chosenId;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={!!chosenId}
              onClick={() => handleChoose(opt.id)}
              className={cn(
                'cursor-pointer rounded-xl border py-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-default',
                chosenId
                  ? isBest
                    ? 'border-success bg-success/15 text-success'
                    : isChosen
                      ? 'border-error bg-error/15 text-error'
                      : 'border-border text-ink-faint opacity-50'
                  : 'border-border-strong text-ink hover:border-gold hover:text-gold',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {chosenId && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            {chosenId === scenario.bestOptionId ? (
              <Badge tone="success">Correct — {bestOption.label}</Badge>
            ) : (
              <Badge tone="error">Best line was {bestOption.label}</Badge>
            )}
          </div>
          <div className="space-y-2">
            {sortedOptions.map((opt) => (
              <div key={opt.id} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 text-ink-muted">{opt.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.max(4, (opt.ev / bestOption.ev) * 100)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-ink-muted">{opt.ev.toFixed(1)}bb</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-ink-muted">{scenario.explanation}</p>
          <button
            type="button"
            onClick={nextScenario}
            className="w-full cursor-pointer rounded-xl bg-gold py-3 text-sm font-semibold text-base transition-colors duration-150 hover:bg-gold-soft"
          >
            Next scenario
          </button>
        </div>
      )}
    </Card>
  );
}
