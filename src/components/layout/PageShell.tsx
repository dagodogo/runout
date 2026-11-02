import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Page frame: 1200 px max, 16 px gutter on phones. `id="main"` is the skip link's target. */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main id="main" tabIndex={-1} className={cn('mx-auto w-full max-w-[1200px] px-4 pb-24 pt-8 outline-none sm:px-6 sm:pt-12', className)}>
      {children}
    </main>
  );
}

/** App page title, one lead paragraph, and optional honest labels beside it. */
export function PageHeader({ title, children, aside }: { title: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="font-display text-h1 font-semibold text-bone">{title}</h1>
      {children && <p className="max-w-[65ch] text-graphite">{children}</p>}
      {aside}
    </header>
  );
}
