import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Dot } from 'recharts';
import { Card } from '@/components/ui/Card';
import type { TrendPoint } from '@/lib/poker/stats';

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: TrendPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-control border border-border-strong bg-raised px-3 py-2 text-sm">
      <div className="text-ink-muted">Hands {point.label}</div>
      <div className="tabular-nums font-semibold text-ink">{point.accuracy}% accuracy</div>
    </div>
  );
}

export function AccuracyTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Accuracy trend</h3>
      <p className="mt-1 text-xs text-ink-muted">Rolling accuracy across every 10 practice reps</p>
      {data.length < 2 ? (
        <div className="mt-8 flex h-48 items-center justify-center text-sm text-ink-faint">
          Play at least 20 hands to see your trend.
        </div>
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-border-strong)' }} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="var(--color-bone)"
                strokeWidth={2}
                dot={<Dot r={3} fill="var(--color-bone)" stroke="none" />}
                activeDot={{ r: 5, fill: 'var(--color-bone)', stroke: 'var(--color-black)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
