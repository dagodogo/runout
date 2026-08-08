import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const FAQS = [
  {
    q: 'Is this real solver output?',
    a: 'Not exactly, but it\'s not fake either. Preflop ranges are generated with a well-known hand-strength heuristic (the Chen Formula) tuned to realistic 6-max frequencies. Postflop, every hand runs through a real 7-card hand evaluator and a Monte Carlo equity simulation against a plausible opponent range — genuine computed odds, not scripted answers. It\'s built for learning solid fundamentals, not for reproducing certified solver output down to the decimal.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. Nothing is stored on a server — your XP, tier, and session history live in this browser via localStorage.',
  },
  {
    q: 'Will my progress sync across devices?',
    a: 'Not currently — progress is local to the browser you\'re training in. That\'s a deliberate tradeoff to keep this a simple, private, no-backend tool.',
  },
  {
    q: 'Is this gambling or real-money play?',
    a: 'No. Runout is strictly educational training software. No real or play money is ever wagered, and there\'s no prize element.',
  },
  {
    q: 'What formats does it cover?',
    a: 'The current trainers focus on 6-max No-Limit Hold\'em cash game fundamentals — preflop opens, big blind defense, and common postflop spots.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="mt-28 max-w-3xl">
      <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Frequently asked questions</h2>
      <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-medium text-ink">{item.q}</span>
                <ChevronDown
                  size={18}
                  className={cn('shrink-0 text-ink-faint transition-transform duration-200', isOpen && 'rotate-180 text-gold')}
                  aria-hidden="true"
                />
              </button>
              {isOpen && <p className="px-6 pb-5 text-sm text-ink-muted">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
