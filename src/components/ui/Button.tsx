import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gold text-base font-semibold hover:bg-gold-soft shadow-[0_0_24px_rgba(240,180,41,0.25)]',
  secondary:
    'bg-violet text-ink font-semibold hover:bg-violet-soft shadow-[0_0_24px_rgba(124,92,252,0.25)]',
  outline:
    'bg-transparent text-ink border border-border-strong hover:border-gold hover:text-gold',
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-surface-2',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-7 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
