import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';

// label sits beside the trainer it qualifies (storyboard principle 4); Play and PLO record source 'heuristic'
const TRAINERS = [
  { to: '/train/solver', name: 'Solver trainer', line: 'Hands from the flop to the river, each solved while you play.', label: 'Solver output' },
  {
    to: '/play',
    name: 'Play a hand',
    line: 'Full 6-max hands from the deal to showdown against seats that follow common strategies.',
    label: 'Heuristic approximation, not solver output',
  },
  { to: '/play-plo', name: 'PLO', line: 'The same full hands with four hole cards.', label: 'Heuristic approximation, not solver output' },
  { to: '/train/preflop', name: 'Preflop', line: 'Learn opening and defending ranges for each seat on a 13 by 13 grid.', label: 'Hand-authored chart' },
  { to: '/learn', name: 'Learn', line: 'Glossary, strategy notes, an odds calculator and common player types.' },
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="trainers-title" className="mt-24 sm:mt-32">
      <h2 id="trainers-title" className="text-h2 font-semibold text-bone">
        Five ways to train
      </h2>
      <ul className="mt-8 divide-y divide-rule border-y border-rule">
        {TRAINERS.map((t) => (
          <li key={t.to} className="grid gap-2 py-5 lg:grid-cols-12 lg:items-center lg:gap-6">
            <Link
              to={t.to}
              className="font-display text-h3 font-semibold text-bone underline decoration-transparent underline-offset-4 hover:decoration-bone lg:col-span-3"
            >
              {t.name}
            </Link>
            <p className="max-w-[65ch] text-graphite lg:col-span-6">{t.line}</p>
            <div className="lg:col-span-3 lg:text-right">{t.label && <Badge>{t.label}</Badge>}</div>
          </li>
        ))}
      </ul>
      <p className="mt-5 max-w-[65ch] text-sm text-graphite">
        Also in the app: a postflop drill and a frequency drill, both heuristic, and a progress page that shows where you
        lose the most.
      </p>
    </section>
  );
}
