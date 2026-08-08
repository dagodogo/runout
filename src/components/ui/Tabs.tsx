import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ options, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150',
              active ? 'bg-gold text-base' : 'text-ink-muted hover:text-ink hover:bg-surface-2',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
