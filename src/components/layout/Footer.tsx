import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

const LINKS = [
  { to: '/train/solver', label: 'Solver trainer' },
  { to: '/play', label: 'Play' },
  { to: '/train/preflop', label: 'Preflop' },
  { to: '/dashboard', label: 'Progress' },
  { to: '/learn', label: 'Learn' },
];

export function Footer() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 text-sm sm:px-6 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 font-display text-base font-semibold text-bone">
            <Logo />
            <span translate="no">Runout</span>
          </div>
          <p className="text-faint">Educational training software. No real-money play. 18+.</p>
          <p className="text-faint">
            Postflop solver:{' '}
            <a
              href="https://github.com/b-inary/wasm-postflop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-graphite underline hover:text-bone"
            >
              wasm-postflop by b-inary, AGPL-3.0
            </a>
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap content-start gap-x-6 gap-y-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="inline-flex min-h-11 items-center text-graphite hover:text-bone">
              {l.label}
            </NavLink>
          ))}
          <a
            href="https://github.com/dagodogo/runout"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-graphite hover:text-bone"
          >
            Source code (AGPL-3.0)
          </a>
        </nav>
      </div>
    </footer>
  );
}
