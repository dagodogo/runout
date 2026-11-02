import { useCallback, useMemo, useState } from 'react';
import { generateScenario, type GeneratedScenario } from '@/lib/poker/scenarioGenerator';
import { cardDisplay } from '@/lib/poker/cards';
import { LEAK_CATEGORY_LABEL } from '@/lib/poker/scenarios';
import type { Position, TableSize } from '@/lib/poker/ranges';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PokerTable } from './PokerTable';
import { TableSizeSelector } from './TableSizeSelector';
import { ConceptCallout } from './ConceptCallout';
import { useProfileStore } from '@/lib/store/profile';
import { cn } from '@/lib/cn';

export function PostflopScenarioTrainer() {
  const [tableSize, setTableSize] = useState<TableSize>(6);
  const [scenario, setScenario] = useState<GeneratedScenario>(() => generateScenario(6));
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [session, setSession] = useState({ correct: 0, total: 0 });
  const recordDecision = useProfileStore((s) => s.recordDecision);

  const handleChoose = useCallback(
    (optionId: string) => {
      if (chosenId) return;
      const correct = optionId === scenario.bestOptionId;
      setChosenId(optionId);
      setSession((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
      recordDecision({
        source: 'heuristic',
        game: 'nlhe',
        street: scenario.street,
        category: scenario.category,
        grade: correct ? 'best' : 'mistake',
        evLossBb: null,
        correct,
      });
    },
    [chosenId, scenario, recordDecision],
  );

  const nextScenario = useCallback(() => {
    setScenario(generateScenario(tableSize));
    setChosenId(null);
  }, [tableSize]);

  const changeTableSize = useCallback((size: TableSize) => {
    setTableSize(size);
    setScenario(generateScenario(size));
    setChosenId(null);
  }, []);

  const bestOption = scenario.options.find((o) => o.id === scenario.bestOptionId)!;
  const sortedOptions = [...scenario.options].sort((a, b) => b.ev - a.ev);
  const heroCardStrings = scenario.heroCards.map(cardDisplay);
  const boardStrings = scenario.board.map(cardDisplay);

  const betBySeat = useMemo(() => {
    if (scenario.mode !== 'facing-bet' || !scenario.facingBetBb) return undefined;
    return { [scenario.villainPosition]: scenario.facingBetBb } as Partial<Record<Position, number>>;
  }, [scenario]);

  return (
    <Card className="mx-auto w-full max-w-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TableSizeSelector value={tableSize} onChange={changeTableSize} />
        <span className="tabular-nums text-xs text-ink-muted">
          {session.correct}/{session.total} correct
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <Badge tone="violet">{scenario.street[0].toUpperCase() + scenario.street.slice(1)}</Badge>
        <Badge tone="neutral">{LEAK_CATEGORY_LABEL[scenario.category]}</Badge>
        {scenario.isHeroAggressor && <Badge>You raised preflop</Badge>}
        <Badge>Heuristic approximation, not solver output</Badge>
      </div>

      <div className="mt-5">
        <PokerTable
          heroPosition={scenario.heroPosition}
          heroCards={heroCardStrings}
          tableSize={scenario.tableSize}
          villainPosition={scenario.villainPosition}
          board={boardStrings}
          potBb={scenario.potBb}
          betBySeat={betBySeat}
        />
      </div>

      <div className="mt-4 text-center text-sm text-ink-muted">{scenario.facing}</div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <div className="rounded-control border border-border bg-surface-2 px-3 py-1.5 text-center">
          <div className="text-xs text-ink-faint">Hand</div>
          <div className="text-xs font-semibold text-ink">{scenario.handCategoryLabel}</div>
        </div>
        <div className="rounded-control border border-border bg-surface-2 px-3 py-1.5 text-center">
          <div className="text-xs text-ink-faint">Equity</div>
          <div className="tabular-nums text-xs font-semibold text-bone">{scenario.equityPct}%</div>
        </div>
        <div className="rounded-control border border-border bg-surface-2 px-3 py-1.5 text-center">
          <div className="text-xs text-ink-faint">Board</div>
          <div className="text-xs font-semibold text-ink">{scenario.texture.summary}</div>
        </div>
        <div className="rounded-control border border-border bg-surface-2 px-3 py-1.5 text-center">
          <div className="text-xs text-ink-faint">Eff. stack</div>
          <div className="tabular-nums text-xs font-semibold text-ink">{scenario.effectiveStackBb}bb</div>
        </div>
      </div>

      <div
        className="mt-6 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${scenario.options.length}, minmax(0, 1fr))` }}
      >
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
                'cursor-pointer rounded-control border py-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-default',
                chosenId
                  ? isBest
                    ? 'border-success bg-success/15 text-success'
                    : isChosen
                      ? 'border-error bg-error/15 text-error'
                      : 'border-border text-ink-faint opacity-50'
                  : 'border-border-strong text-ink hover:border-bone hover:text-bone',
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
              <Badge tone="success">Correct: {bestOption.label}</Badge>
            ) : (
              <Badge tone="error">Best line was {bestOption.label}</Badge>
            )}
          </div>
          <div className="space-y-2">
            {sortedOptions.map((opt) => {
              const width = Math.max(4, Math.min(100, (opt.ev / (Math.abs(bestOption.ev) || 1)) * 100));
              return (
                <div key={opt.id} className="flex items-center gap-3 text-xs">
                  <span className="w-32 shrink-0 text-ink-muted">{opt.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right tabular-nums text-ink-muted">{opt.ev.toFixed(1)}bb</span>
                </div>
              );
            })}
          </div>
          <ConceptCallout
            concept={LEAK_CATEGORY_LABEL[scenario.category]}
            title={`Best play: ${bestOption.label}`}
            tone={chosenId === scenario.bestOptionId ? 'success' : 'error'}
          >
            {scenario.explanation}
          </ConceptCallout>
          <button
            type="button"
            onClick={nextScenario}
            className="w-full cursor-pointer rounded-control bg-accent py-3 text-sm font-semibold text-on-accent transition-colors duration-150 hover:bg-accent-hover"
          >
            Next hand
          </button>
        </div>
      )}
    </Card>
  );
}
