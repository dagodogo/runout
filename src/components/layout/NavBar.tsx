import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { buttonClass } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const LINKS = [
  { to: '/train/solver', label: 'Solver' },
  { to: '/play', label: 'Play' },
  { to: '/play-plo', label: 'PLO' },
  { to: '/train/preflop', label: 'Preflop' },
  { to: '/train/postflop', label: 'Postflop drill' },
  { to: '/train/gto', label: 'Frequency drill' },
  { to: '/dashboard', label: 'Progress' },
  { to: '/learn', label: 'Learn' },
];

// active = bone text plus a 2 px accent underline (a shape cue, not colour alone); NavLink sets aria-current
const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex min-h-11 shrink-0 items-center whitespace-nowrap px-3 text-sm font-medium transition-[color,box-shadow] duration-[120ms]',
    isActive ? 'text-bone shadow-[inset_0_-2px_0_var(--color-accent)]' : 'text-graphite hover:text-bone',
  );

export function NavBar() {
  return (
    <header className="z-50 border-b border-rule bg-black lg:sticky lg:top-0">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 sm:px-6">
        <NavLink to="/" className="flex min-h-14 shrink-0 items-center gap-2 font-display text-lg font-semibold text-bone">
          <Logo />
          <span translate="no">Runout</span>
        </NavLink>
        <div className="hidden flex-1 items-center lg:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <NavLink to="/train/solver" className={buttonClass('primary', 'ml-auto shrink-0 lg:ml-0')}>
          Train a hand
        </NavLink>
      </nav>
      <div className="scroll-row mx-auto flex max-w-[1200px] border-t border-rule px-1 sm:px-3 lg:hidden">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}>
            {link.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
