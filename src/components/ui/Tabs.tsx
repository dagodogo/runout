import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ options, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('inline-flex flex-wrap gap-1 rounded-control border border-rule bg-panel p-1', className)}>
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
              'min-h-11 cursor-pointer rounded-[6px] px-3.5 text-sm font-medium transition-[background-color,color] duration-[120ms]',
              active ? 'bg-bone text-black' : 'text-graphite hover:bg-raised hover:text-bone',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
