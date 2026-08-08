import { Link } from 'react-router-dom';
import heroArt from '@/assets/hero-art.webp';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-xs font-medium text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Free &middot; runs entirely in your browser
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
            Train the poker decisions that actually move your win rate.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-muted">
            Runout drills preflop ranges, postflop spots, and mixed GTO strategies until the right
            play is instinct — then tells you exactly where your leaks are.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/train/preflop"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-gold px-7 text-base font-semibold text-base shadow-[0_0_24px_rgba(240,180,41,0.25)] transition-colors duration-200 hover:bg-gold-soft"
            >
              Start training free
            </Link>
            <Link
              to="/learn"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-border-strong px-7 text-base font-semibold text-ink transition-colors duration-200 hover:border-gold hover:text-gold"
            >
              Explore the Learn Hub
            </Link>
          </div>
          <p className="mt-6 text-xs text-ink-faint">
            No account. No real-money play. Your practice history stays on this device.
          </p>
        </div>

        <div className="relative">
          <img
            src={heroArt}
            alt="Abstract illustration of poker chip stacks and a fanned hand of cards over a radial instrument grid"
            className="w-full rounded-3xl border border-border"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
