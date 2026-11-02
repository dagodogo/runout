import { Link } from 'react-router-dom';
import { buttonClass } from '@/components/ui/Button';

// the first two lines are verbatim from the brief; keep them as literals
const TRUST = [
  'Preflop ranges are a hand-authored approximation of common 6-max 100bb charts, not solver output. Everything postflop is solved live given those ranges.',
  'Simplified action tree: one bet size per street, flop check-raise only, no re-raises.',
  'So a grade means "best given these ranges and this tree", not "best against every opponent".',
  "Each solve needs about 600 MB of memory and takes 30 to 90 seconds on a recent laptop, or 2 to 4 minutes on browsers that can't run it on several threads.",
  'Runout is free and open source under AGPL-3.0. Your history stays in this browser. No account, no real-money play.',
];

export function FreeCallout() {
  return (
    <>
      <section aria-labelledby="trust-title" className="mt-24 sm:mt-32 lg:grid lg:grid-cols-12 lg:gap-12">
        <h2 id="trust-title" className="text-h2 font-semibold text-bone lg:col-span-5">
          How far to trust the grades
        </h2>
        <ul className="mt-6 space-y-4 lg:col-span-7 lg:mt-0">
          {TRUST.map((t) => (
            <li key={t} className="max-w-[65ch] border-l-2 border-rule-strong pl-4 text-bone">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="last-title" className="mt-24 border-t border-rule pt-16 sm:mt-32">
        <h2 id="last-title" className="text-h2 font-semibold text-bone">
          Deal a hand and see where you stand.
        </h2>
        <Link to="/train/solver" className={buttonClass('primary', 'mt-8')}>
          Train a hand
        </Link>
        <p className="mt-4 text-sm text-faint">Opens the solver trainer. The first hand is ready in about a minute.</p>
      </section>
    </>
  );
}
