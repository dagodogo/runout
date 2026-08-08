import { Tabs } from '@/components/ui/Tabs';
import type { TableSize } from '@/lib/poker/ranges';

const OPTIONS = [
  { value: '6' as const, label: '6-max' },
  { value: '9' as const, label: '9-max' },
];

export function TableSizeSelector({ value, onChange }: { value: TableSize; onChange: (size: TableSize) => void }) {
  return (
    <Tabs
      value={String(value) as '6' | '9'}
      onChange={(v) => onChange(Number(v) as TableSize)}
      options={OPTIONS}
    />
  );
}
