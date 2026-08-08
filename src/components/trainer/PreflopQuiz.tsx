import { useCallback, useState } from 'react';
import { weightedRandomHand, type HandCell } from '@/lib/poker/hands';
import { getMix, positionDescription, type Action, type Position } from '@/lib/poker/ranges';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useProfileStore } from '@/lib/store/profile';
import { cn } from '@/lib/cn';

interface Round {
  hand: HandCell;
  answered: Action | null;
}

const ACTION_LABEL: Record<Action, string> = { raise: 'Raise', call: 'Call', fold: 'Fold' };

function pctText(v: number) {
  return `${Math.round(v * 100)}%`;
}

export function PreflopQuiz({ position }: { position: Position }) {
  const [round, setRound] = useState<Round>(() => ({ hand: weightedRandomHand(), answered: null }));
  const [session, setSession] = useState({ correct: 0, total: 0, streak: 0 });
  const recordPreflop = useProfileStore((s) => s.recordPreflop);

  const mix = getMix(position, round.hand);
  const dominant: Action = mix.raise >= mix.call && mix.raise >= mix.fold ? 'raise' : mix.call >= mix.fold ? 'call' : 'fold';

  const actions: Action[] = position === 'BB' ? ['raise', 'call', 'fold'] : ['raise', 'fold'];

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
    setRound({ hand: weightedRandomHand(round.hand.label), answered: null });
  }, [round.hand.label]);

  return (
    <Card className="mx-auto w-full max-w-xl p-8">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{positionDescription(position)}</span>
        <span className="font-mono">
          {session.correct}/{session.total} &middot; streak {session.streak}
        </span>
      </div>

      <div className="mt-8 text-center">
        <div className="font-mono text-6xl font-bold text-ink">{round.hand.label}</div>
        <p className="mt-3 text-sm text-ink-muted">What's the play?</p>
      </div>

      <div className={cn('mt-8 grid gap-3', actions.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
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
