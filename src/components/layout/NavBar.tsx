import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { Badge } from '@/components/ui/Badge';
import { useProfileStore } from '@/lib/store/profile';
import { tierForXp } from '@/lib/poker/tiers';
import { cn } from '@/lib/cn';

const LINKS = [
  { to: '/play', label: 'Play' },
  { to: '/play-plo', label: 'PLO' },
  { to: '/train/preflop', label: 'Preflop' },
  { to: '/train/postflop', label: 'Postflop' },
  { to: '/train/gto', label: 'GTO' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/learn', label: 'Learn' },
];

export function NavBar() {
  const xp = useProfileStore((s) => s.xp);
  const tier = tierForXp(xp);

  return (
    <div className="sticky top-4 z-50 mx-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-border bg-surface/90 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-md">
        <NavLink to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <Logo />
          Runout
        </NavLink>

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive ? 'bg-surface-2 text-gold' : 'text-ink-muted hover:text-ink hover:bg-surface-2',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Badge tone="gold" className="hidden sm:inline-flex">
            Lv.{tier.level} {tier.name}
          </Badge>
          <NavLink
            to="/play"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-gold px-3.5 text-sm font-semibold text-base transition-colors duration-200 hover:bg-gold-soft"
          >
            Launch App
          </NavLink>
        </div>
      </nav>
      <div className="mx-auto mt-2 flex max-w-7xl flex-wrap gap-1 rounded-xl border border-border bg-surface/90 p-1 backdrop-blur-md md:hidden">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium',
                isActive ? 'bg-surface-2 text-gold' : 'text-ink-muted',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
