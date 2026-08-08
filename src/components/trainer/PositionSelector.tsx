import { positionLabel, type Position } from '@/lib/poker/ranges';
import { Tabs } from '@/components/ui/Tabs';

export function PositionSelector({
  value,
  onChange,
  positions,
}: {
  value: Position;
  onChange: (p: Position) => void;
  positions: Position[];
}) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      options={positions.map((p) => ({ value: p, label: positionLabel(p) }))}
    />
  );
}
