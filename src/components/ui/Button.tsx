import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'aggressive' | 'picked' | 'ghost';

const VARIANT: Record<ButtonVariant, string> = {
  // white on accent 4.8:1, on the darker hover 6.1:1 (qa.md)
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-rule-strong text-bone hover:bg-raised',
  // a bet, raise or all-in option: red outline, like its segment in the Readout (border 4.1:1, text 6.5:1)
  aggressive: 'border border-accent text-accent-text hover:bg-accent/10',
  // the option the user chose (with aria-pressed): bone border, raised fill
  picked: 'border border-bone bg-raised text-bone',
  ghost: 'text-graphite underline-offset-4 hover:text-bone hover:underline',
};

/** Classes for a <button> or a link styled as one: 44 px tall, press scale 0.98 (skipped under reduced motion). */
export function buttonClass(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex min-h-11 cursor-pointer select-none items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold',
    'transition-[background-color,border-color,color,transform] duration-[120ms] active:scale-[0.98] motion-reduce:active:scale-100',
    'disabled:cursor-default disabled:opacity-50 disabled:active:scale-100',
    VARIANT[variant],
    className,
  );
}
