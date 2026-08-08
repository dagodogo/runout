import { Link } from 'react-router-dom';
import { Lock, Zap, WifiOff } from 'lucide-react';

const POINTS = [
  { icon: Zap, text: 'No signup, no paywall — every trainer is unlocked from the start.' },
  { icon: WifiOff, text: 'Runs client-side, so once it\'s loaded it works without a connection.' },
  { icon: Lock, text: 'Your session history is stored only in this browser — nothing is uploaded.' },
];

export function FreeCallout() {
  return (
    <section className="mt-28 rounded-3xl border border-border bg-surface p-10 text-center sm:p-14">
      <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Free. Local. Yours.</h2>
      <p className="mx-auto mt-3 max-w-xl text-ink-muted">
        Runout is a personal training tool, not a product with a funnel. There's no pricing page
        because there's nothing to buy.
      </p>
      <div className="mx-auto mt-8 grid max-w-3xl gap-6 text-left sm:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.text} className="flex items-start gap-3">
            <p.icon size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            <p className="text-sm text-ink-muted">{p.text}</p>
          </div>
        ))}
      </div>
      <Link
        to="/train/preflop"
        className="mt-9 inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-gold px-7 text-base font-semibold text-base transition-colors duration-200 hover:bg-gold-soft"
      >
        Start training
      </Link>
    </section>
  );
}
