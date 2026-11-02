import { useState } from 'react';
import hand from '@/data/heroHand.json';
import type { Grade } from '@/lib/solver/grade';
import { buttonClass } from '@/components/ui/Button';
import { actionKind } from '@/components/ui/readoutMath';
import { GradePanel } from '@/components/trainer/GradePanel';
import { SeatRows } from '@/components/trainer/SeatRows';
import { actionLabel } from '@/components/trainer/solverFormat';

const { turn, spot } = hand;

const STEPS = [
  'You act, the way you would at the table.',
  'Runout shows how often the solver makes each play and what each one wins on average (EV, in big blinds).',
  'You get the reason in two to four sentences, then the opponent replies and the hand goes on.',
];

export function HowItWorks() {
  const [picked, setPicked] = useState<number | null>(null);
  const pick = picked === null ? null : turn.choices[picked];
  const label = (i: number) => actionLabel(turn.actions[i], turn.board.length);

  return (
    <section id="how" aria-labelledby="how-title" className="mt-24 grid gap-10 sm:mt-32 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <h2 id="how-title" className="text-h2 font-semibold text-bone">
          Pick a play. The solver answers.
        </h2>
        <p className="mt-4 max-w-[65ch] text-graphite">Here is a turn spot from the trainer. Choose what you would do.</p>
        <ol className="mt-8 space-y-5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-4">
              <span className="font-display text-h3 font-semibold tabular-nums text-faint">{i + 1}</span>
              <span className="max-w-[60ch] pt-1 text-bone">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-panel border border-rule bg-panel p-4 sm:p-6 lg:col-span-7">
        <SeatRows
          villain={{ name: 'BB' }}
          hero={{ name: `You (${spot.ipPos})`, cards: hand.hero }}
          board={turn.board}
          pot={`${turn.potBb.toFixed(1)} bb`}
          line={turn.line}
        />
        <div role="group" aria-label="Your play" className="mt-6 flex flex-wrap gap-3">
          {turn.actions.map((raw, i) => (
            <button
              key={raw}
              type="button"
              aria-pressed={picked === i}
              onClick={() => setPicked(i)}
              className={buttonClass(picked === i ? 'picked' : actionKind(label(i)) === 'aggressive' ? 'aggressive' : 'secondary')}
            >
              {label(i)}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="mt-6 border-t border-rule pt-6">
          {pick && picked !== null ? (
            <>
              <GradePanel
                key={picked}
                grade={pick.grade as Grade}
                headline={pick.headline}
                rows={turn.table}
                chosen={picked}
                potBb={turn.potBb}
                sentences={turn.sentences}
                context={`You played ${label(picked)}`}
              />
              <button
                type="button"
                onClick={() => setPicked(1 - picked)}
                className="mt-5 inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-bone underline decoration-rule-strong underline-offset-4 hover:decoration-bone"
              >
                Try the other play
              </button>
            </>
          ) : (
            <p className="text-graphite">Choose a play to see the solver's answer.</p>
          )}
        </div>
      </div>
    </section>
  );
}
