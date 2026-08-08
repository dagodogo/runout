import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Card } from '@/components/ui/Card';
import { positionLabel, type Position } from '@/lib/poker/ranges';

interface Datum {
  position: string;
  accuracy: number;
  reps: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Datum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-strong bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <div className="text-ink-muted">{positionLabel(d.position as Position)}</div>
      <div className="font-mono font-semibold text-ink">
        {d.accuracy}% &middot; {d.reps} reps
      </div>
    </div>
  );
}

export function PositionAccuracyChart({ data }: { data: Datum[] }) {
  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Accuracy by position</h3>
      <p className="mt-1 text-xs text-ink-muted">Where your preflop decisions hold up — and where they don't</p>
      {data.length === 0 ? (
        <div className="mt-8 flex h-48 items-center justify-center text-sm text-ink-faint">
          No preflop reps yet.
        </div>
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="position"
                tickFormatter={(v: string) => positionLabel(v as Position).split(' ')[0]}
                tick={{ fill: 'var(--color-ink-muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-surface-2)' }} />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {data.map((d) => (
                  <Cell key={d.position} fill={d.accuracy < 50 ? 'var(--color-error)' : 'var(--color-gold)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
