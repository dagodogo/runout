import { useCallback, useMemo, useState } from 'react';
import { weightedRandomHand, type HandCell } from '@/lib/poker/hands';
import { getMix, positionDescription, type Action, type Position, type RfiPosition, type TableSize } from '@/lib/poker/ranges';
import { explainPreflopDecision } from '@/lib/poker/preflopExplain';
import { freshDeck, cardDisplay } from '@/lib/poker/cards';
import { combosForHand } from '@/lib/poker/equity';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PokerTable } from './PokerTable';
import { ConceptCallout } from './ConceptCallout';
import { useProfileStore } from '@/lib/store/profile';
import { cn } from '@/lib/cn';

interface Round {
  hand: HandCell;
  cards: [string, string];
  answered: Action | null;
}

const ACTION_LABEL: Record<Action, string> = { raise: 'Raise', call: 'Call', fold: 'Fold' };
const OPEN_SIZE_BB = 2.5;

function pctText(v: number) {
  return `${Math.round(v * 100)}%`;
}

function dealRound(excludeLabel?: string): Round {
  const hand = weightedRandomHand(excludeLabel);
  const combos = combosForHand(hand, freshDeck());
  const [c1, c2] = combos[Math.floor(Math.random() * combos.length)];
  return { hand, cards: [cardDisplay(c1), cardDisplay(c2)], answered: null };
}

interface PreflopQuizProps {
  position: Position;
  tableSize?: TableSize;
  openerPosition?: RfiPosition;
}

export function PreflopQuiz({ position, tableSize = 6, openerPosition = 'BTN' }: PreflopQuizProps) {
  const [round, setRound] = useState<Round>(() => dealRound());
  const [session, setSession] = useState({ correct: 0, total: 0, streak: 0 });
  const recordPreflop = useProfileStore((s) => s.recordPreflop);

  const mix = getMix(position, round.hand, openerPosition);
  const dominant: Action = mix.raise >= mix.call && mix.raise >= mix.fold ? 'raise' : mix.call >= mix.fold ? 'call' : 'fold';

  const actions: Action[] = position === 'BB' ? ['raise', 'call', 'fold'] : ['raise', 'fold'];

  const explanation = useMemo(
    () => explainPreflopDecision(position, round.hand, dominant, mix),
    [position, round.hand, dominant, mix],
  );

  const betBySeat = useMemo(
    () => (position === 'BB' ? { [openerPosition]: OPEN_SIZE_BB } : undefined),
    [position, openerPosition],
  );

  const handleAnswer = useCallback(
    (action: Action) => {
      if (round.answered) return;
      const correct = action === dominant;
      setRound((r) => ({ ...r, answered: action }));
      setSession((s) => ({
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
        streak: correct ? s.streak + 1 : 0,
      }));
      recordPreflop({ position, hand: round.hand.label, correct });
    },
    [round, dominant, position, recordPreflop],
  );

  const nextHand = useCallback(() => {
    setRound(dealRound(round.hand.label));
  }, [round.hand.label]);

  return (
    <Card className="mx-auto w-full max-w-xl p-6 sm:p-8">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{positionDescription(position, openerPosition)}</span>
        <span className="font-mono">
          {session.correct}/{session.total} &middot; streak {session.streak}
        </span>
      </div>

      <div className="mt-5">
        <PokerTable
          heroPosition={position}
          heroCards={round.cards}
          tableSize={tableSize}
          villainPosition={position === 'BB' ? openerPosition : undefined}
          potBb={position === 'BB' ? OPEN_SIZE_BB + 1.5 : undefined}
          betBySeat={betBySeat}
        />
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-ink-muted">
          What's the play with <span className="font-mono font-semibold text-ink">{round.hand.label}</span>?
        </p>
      </div>

      <div className={cn('mt-6 grid gap-3', actions.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {actions.map((action) => (
          <button
            key={action}
            type="button"
            disabled={!!round.answered}
            onClick={() => handleAnswer(action)}
            className={cn(
              'cursor-pointer rounded-xl border py-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-default',
              round.answered
                ? action === dominant
                  ? 'border-success bg-success/15 text-success'
                  : action === round.answered
                    ? 'border-error bg-error/15 text-error'
                    : 'border-border text-ink-faint opacity-50'
                : 'border-border-strong text-ink hover:border-gold hover:text-gold',
            )}
          >
            {ACTION_LABEL[action]}
          </button>
        ))}
      </div>

      {round.answered && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            {round.answered === dominant ? (
              <Badge tone="success">Correct</Badge>
            ) : (
              <Badge tone="error">Leans {ACTION_LABEL[dominant]}</Badge>
            )}
            <span className="text-xs text-ink-muted">Solver-flavored mix for this spot:</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full border border-border">
            <div style={{ width: pctText(mix.raise), background: 'var(--color-raise)' }} />
            {mix.call > 0.005 && <div style={{ width: pctText(mix.call), background: 'var(--color-call)' }} />}
            <div style={{ width: pctText(mix.fold), background: 'var(--color-fold)' }} />
          </div>
          <div className="flex justify-between text-xs text-ink-muted">
            <span>Raise {pctText(mix.raise)}</span>
            {mix.call > 0.005 && <span>Call {pctText(mix.call)}</span>}
            <span>Fold {pctText(mix.fold)}</span>
          </div>
          <ConceptCallout
            concept={position === 'BB' ? 'Big blind defense' : 'Opening range'}
            title={`${ACTION_LABEL[dominant]} is the solver-flavored play`}
            tone={round.answered === dominant ? 'success' : 'error'}
          >
            {explanation}
          </ConceptCallout>
          <button
            type="button"
            onClick={nextHand}
            className="w-full cursor-pointer rounded-xl bg-gold py-3 text-sm font-semibold text-base transition-colors duration-150 hover:bg-gold-soft"
          >
            Next hand
          </button>
        </div>
      )}
    </Card>
  );
}
