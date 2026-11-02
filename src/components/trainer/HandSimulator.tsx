import { useCallback, useMemo, useState } from 'react';
import { startHand, applyHeroAction, advance, type HandSim, type SimAction } from '@/lib/poker/handSimulator';
import { cardDisplay } from '@/lib/poker/cards';
import { type Position, type TableSize } from '@/lib/poker/ranges';
import { Card } from '@/components/ui/Card';
import { PokerTable } from './PokerTable';
import { TableSizeSelector } from './TableSizeSelector';
import { ConceptCallout } from './ConceptCallout';
import { ACTION_TONE, STREET_LABEL, formatLog } from './simDisplay';
import { useProfileStore } from '@/lib/store/profile';
import { spotCategory } from '@/lib/poker/leaks';
import { cn } from '@/lib/cn';

export function HandSimulator() {
  const [tableSize, setTableSize] = useState<TableSize>(6);
  const [sim, setSim] = useState<HandSim>(() => startHand(6));
  const [showFeedback, setShowFeedback] = useState(false);
  const [session, setSession] = useState({ hands: 0, correct: 0, decisions: 0, netBb: 0 });
  const recordDecision = useProfileStore((s) => s.recordDecision);

  const heroPlayer = sim.players.find((p) => p.isHero)!;

  const changeTableSize = useCallback((size: TableSize) => {
    setTableSize(size);
    setSim(startHand(size));
    setShowFeedback(false);
    setSession({ hands: 0, correct: 0, decisions: 0, netBb: 0 });
  }, []);

  const handleAction = useCallback(
    (opt: { id: SimAction; amount?: number }) => {
      // Apply only hero's own action first — the board/pot won't jump ahead
      // to reflect bots that haven't "acted" yet from the viewer's perspective.
      const applied = applyHeroAction(sim, { action: opt.id, amount: opt.amount });
      setSim(applied);
      setShowFeedback(true);
      if (applied.lastFeedback) {
        const correct = applied.lastFeedback.chosenId === applied.lastFeedback.bestId;
        setSession((s) => ({ ...s, decisions: s.decisions + 1, correct: s.correct + (correct ? 1 : 0) }));
        // Preflop has no leak category, so only postflop decisions are recorded.
        if (sim.street === 'flop' || sim.street === 'turn' || sim.street === 'river') {
          const hero = sim.players.find((p) => p.isHero)!;
          recordDecision({
            source: 'heuristic',
            game: 'nlhe',
            street: sim.street,
            category: spotCategory(sim.street, sim.currentBet > hero.committedStreet),
            grade: correct ? 'best' : 'mistake',
            evLossBb: null,
            correct,
          });
        }
      }
    },
    [sim, recordDecision],
  );

  const dismissFeedback = useCallback(() => {
    setSim((current) => advance(current));
    setShowFeedback(false);
  }, []);

  const nextHand = useCallback(() => {
    setSession((s) => ({ ...s, hands: s.hands + 1, netBb: Math.round((s.netBb + (sim.result?.heroNet ?? 0)) * 10) / 10 }));
    setSim(startHand(tableSize));
    setShowFeedback(false);
  }, [tableSize, sim.result]);

  const foldedPositions = useMemo(() => sim.players.filter((p) => p.folded).map((p) => p.position), [sim.players]);

  const betBySeat = useMemo(() => {
    const m: Partial<Record<Position, number>> = {};
    for (const p of sim.players) if (!p.folded && p.committedStreet > 0) m[p.position] = Math.round(p.committedStreet * 10) / 10;
    return m;
  }, [sim.players]);

  const revealCards = useMemo(() => {
    if (sim.street !== 'showdown') return undefined;
    const m: Partial<Record<Position, string[]>> = {};
    for (const p of sim.players) if (!p.folded && !p.isHero) m[p.position] = p.cards.map(cardDisplay);
    return m;
  }, [sim.players, sim.street]);

  const toCall = Math.round((sim.currentBet - heroPlayer.committedStreet) * 10) / 10;
  const potOddsPct = toCall > 0 ? Math.round((toCall / (sim.pot + toCall)) * 100) : null;

  return (
    <Card className="mx-auto w-full max-w-4xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TableSizeSelector value={tableSize} onChange={changeTableSize} />
        <span className="tabular-nums text-xs text-ink-muted">
          {session.correct}/{session.decisions} decisions &middot; {session.hands} hands &middot;{' '}
          <span className={session.netBb >= 0 ? 'text-ink' : 'text-error'}>
            {session.netBb >= 0 ? '+' : ''}
            {session.netBb.toFixed(1)}bb
          </span>
        </span>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_240px]">
        <div>
          <PokerTable
            heroPosition={heroPlayer.position}
            heroCards={heroPlayer.cards.map(cardDisplay)}
            tableSize={tableSize}
            board={sim.board.map(cardDisplay)}
            potBb={Math.round(sim.pot * 10) / 10}
            betBySeat={betBySeat}
            foldedPositions={foldedPositions}
            revealCards={revealCards}
          />

          {sim.heroTurn && !showFeedback && (
            <div className="mt-2">
              <div className="flex items-center justify-center gap-2 text-center">
                <p className="text-sm text-ink-muted">Your turn. What's the play?</p>
                {potOddsPct !== null && (
                  <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 tabular-nums text-xs text-ink-muted">
                    To call {toCall}bb &middot; pot odds {potOddsPct}%
                  </span>
                )}
              </div>
              <div
                className="mt-4 grid gap-3"
                style={{ gridTemplateColumns: `repeat(${sim.heroOptions.length}, minmax(0, 1fr))` }}
              >
                {sim.heroOptions.map((opt, i) => (
                  <button
                    key={`${opt.id}-${i}`}
                    type="button"
                    onClick={() => handleAction(opt)}
                    className={cn(
                      'cursor-pointer rounded-control border py-4 text-sm font-semibold transition-colors duration-150',
                      ACTION_TONE[opt.id],
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showFeedback && sim.lastFeedback && (
            <div className="mt-4 space-y-4">
              <ConceptCallout
                concept={sim.lastFeedback.concept}
                title={
                  sim.lastFeedback.chosenId === sim.lastFeedback.bestId
                    ? `Correct: ${sim.lastFeedback.handLabel}`
                    : `Better play was ${sim.lastFeedback.bestId}: ${sim.lastFeedback.handLabel}`
                }
                tone={sim.lastFeedback.chosenId === sim.lastFeedback.bestId ? 'success' : 'error'}
              >
                {sim.lastFeedback.explanation}
              </ConceptCallout>
              {!sim.handOver && (
                <button
                  type="button"
                  onClick={dismissFeedback}
                  className="w-full cursor-pointer rounded-control bg-accent py-3 text-sm font-semibold text-on-accent transition-colors duration-150 hover:bg-accent-hover"
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {sim.handOver && (
            <div className="mt-4 space-y-3">
              <div
                className={cn(
                  'rounded-control border p-4 text-center',
                  sim.result!.heroNet >= 0 ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5',
                )}
              >
                <p className="text-sm text-ink">{sim.result!.summary}</p>
                <p className={cn('mt-1 tabular-nums text-lg font-bold', sim.result!.heroNet >= 0 ? 'text-ink' : 'text-error')}>
                  {sim.result!.heroNet >= 0 ? '+' : ''}
                  {sim.result!.heroNet.toFixed(1)}bb
                </p>
              </div>
              <button
                type="button"
                onClick={nextHand}
                className="w-full cursor-pointer rounded-control bg-accent py-3 text-sm font-semibold text-on-accent transition-colors duration-150 hover:bg-accent-hover"
              >
                Deal next hand
              </button>
            </div>
          )}
        </div>

        <div className="rounded-control border border-border bg-surface-2 p-3">
          <div className="text-xs font-semibold text-ink-faint">Hand log</div>
          <div className="mt-2 max-h-[520px] space-y-1 overflow-y-auto text-xs">
            {sim.log.map((entry, i) => {
              const streetChanged = i === 0 || sim.log[i - 1].street !== entry.street;
              return (
                <div key={i}>
                  {streetChanged && entry.street !== 'preflop' && (
                    <div className="mb-1 mt-2 text-xs font-bold text-bone">{STREET_LABEL[entry.street]}</div>
                  )}
                  <div className={cn('text-ink-muted', entry.isHero && 'font-semibold text-ink')}>{formatLog(entry)}</div>
                </div>
              );
            })}
            {sim.log.length === 0 && <p className="text-ink-faint">Action will appear here as the hand plays out.</p>}
          </div>
        </div>
      </div>
    </Card>
  );
}
