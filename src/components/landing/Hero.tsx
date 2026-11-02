import { Link } from 'react-router-dom';
import hand from '@/data/heroHand.json';
import type { Grade } from '@/lib/solver/grade';
import { buttonClass } from '@/components/ui/Button';
import { GradePanel } from '@/components/trainer/GradePanel';
import { SeatRows } from '@/components/trainer/SeatRows';
import { actionLabel } from '@/components/trainer/solverFormat';

const { flop, spot } = hand;
const pick = flop.choices[flop.chosen];
const bb = (v: number) => `${v.toFixed(1)} bb`;

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5 lg:pt-10">
        <h1 id="hero-title" className="text-display font-semibold text-bone">
          See what the solver would play. Then see why.
        </h1>
        <p className="mt-6 max-w-[65ch] text-lead text-graphite">
          Runout deals you a hand, solves it live in your browser and grades each decision against the solver, the
          software strong players use to study. Then it tells you why, in plain English.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link to="/train/solver" className={buttonClass('primary')}>
            Train a hand
          </Link>
          <a
            href="#how"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-bone underline decoration-rule-strong underline-offset-4 hover:decoration-bone"
          >
            How it teaches you
          </a>
        </div>
        <p className="mt-6 text-sm text-faint">Free. No account. Open source.</p>
      </div>

      <figure className="rounded-panel border border-rule bg-panel p-4 sm:p-6 lg:col-span-7">
        <p className="text-sm text-graphite">
          {spot.ipPos} vs BB, single-raised pot
        </p>
        <SeatRows
          className="mt-4"
          villain={{ name: 'BB', stack: bb(spot.stackBb) }}
          hero={{ name: `You (${spot.ipPos})`, stack: bb(spot.stackBb), cards: hand.hero }}
          board={flop.board}
          pot={bb(flop.potBb)}
          line={flop.line}
        />
        <GradePanel
          className="mt-6 border-t border-rule pt-6"
          grade={pick.grade as Grade}
          headline={pick.headline}
          rows={flop.table}
          chosen={flop.chosen}
          potBb={flop.potBb}
          sentences={flop.sentences}
          context={`You played ${actionLabel(flop.actions[flop.chosen], flop.board.length)}`}
          table={false}
        />
        <figcaption className="mt-6 text-sm text-faint">
          A real hand, solved with the same engine the trainer runs, to {hand.solve.exploitabilityPct}% of the pot from
          perfect.
        </figcaption>
      </figure>
    </section>
  );
}
