import { ALL_POSITIONS, positionLabel, type Position } from '@/lib/poker/ranges';
import { Tabs } from '@/components/ui/Tabs';

export function PositionSelector({
  value,
  onChange,
}: {
  value: Position;
  onChange: (p: Position) => void;
}) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      options={ALL_POSITIONS.map((p) => ({ value: p, label: positionLabel(p) }))}
    />
  );
}
