import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <Logo />
          Runout
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <NavLink to="/train/preflop" className="hover:text-ink">Preflop Trainer</NavLink>
          <NavLink to="/train/postflop" className="hover:text-ink">Postflop Trainer</NavLink>
          <NavLink to="/dashboard" className="hover:text-ink">Dashboard</NavLink>
          <NavLink to="/learn" className="hover:text-ink">Learn Hub</NavLink>
        </nav>
        <p className="text-xs text-ink-faint">
          Educational training software. No real-money play. 18+.
        </p>
      </div>
    </footer>
  );
}
