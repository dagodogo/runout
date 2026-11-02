import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { COMMON_OUTS, exactOutsEquity, potOdds, ruleOfFourAndTwo } from '@/lib/poker/odds';
import { cn } from '@/lib/cn';

export function OddsCalculator() {
  const [outs, setOuts] = useState(9);
  const [streets, setStreets] = useState<1 | 2>(2);
  const [potSize, setPotSize] = useState(10);
  const [callAmount, setCallAmount] = useState(5);

  const unseen = streets === 2 ? 47 : 46;
  const quickEquity = ruleOfFourAndTwo(outs, streets);
  const exactEquity = exactOutsEquity(outs, unseen, streets);
  const odds = useMemo(() => potOdds(potSize, callAmount), [potSize, callAmount]);
  const isProfitable = exactEquity > odds.breakEvenEquity;

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-semibold text-ink">Outs & pot odds calculator</h3>
      <p className="mt-1 text-xs text-ink-muted">Estimate your equity, then check it against the price you're getting.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {COMMON_OUTS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => setOuts(preset.outs)}
            className={cn(
              'cursor-pointer rounded-control border px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              outs === preset.outs
                ? 'border-bone bg-raised text-bone'
                : 'border-border-strong text-ink-muted hover:text-ink',
            )}
          >
            {preset.name} ({preset.outs})
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-ink-muted">Outs</span>
          <input
            type="number"
            min={0}
            max={20}
            value={outs}
            onChange={(e) => setOuts(Math.max(0, Math.min(20, Number(e.target.value))))}
            className="mt-1 w-full rounded-control border border-border-strong bg-surface-2 px-3 py-2 tabular-nums text-ink focus:border-bone"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-muted">Cards to come</span>
          <select
            value={streets}
            onChange={(e) => setStreets(Number(e.target.value) as 1 | 2)}
            className="mt-1 w-full rounded-control border border-border-strong bg-surface-2 px-3 py-2 text-ink focus:border-bone"
          >
            <option value={2}>Turn + river</option>
            <option value={1}>One card only</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-muted">Pot size (bb)</span>
          <input
            type="number"
            min={0}
            value={potSize}
            onChange={(e) => setPotSize(Math.max(0, Number(e.target.value)))}
            className="mt-1 w-full rounded-control border border-border-strong bg-surface-2 px-3 py-2 tabular-nums text-ink focus:border-bone"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink-muted">Amount to call (bb)</span>
          <input
            type="number"
            min={0}
            value={callAmount}
            onChange={(e) => setCallAmount(Math.max(0, Number(e.target.value)))}
            className="mt-1 w-full rounded-control border border-border-strong bg-surface-2 px-3 py-2 tabular-nums text-ink focus:border-bone"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Quick rule (4-2)" value={`${quickEquity.toFixed(0)}%`} />
        <Stat label="Exact equity" value={`${exactEquity.toFixed(1)}%`} />
        <Stat label="Pot odds needed" value={`${odds.breakEvenEquity.toFixed(1)}% (${odds.ratio})`} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        {isProfitable ? <Badge tone="success">+EV call</Badge> : <Badge tone="error">-EV call</Badge>}
        <span className="text-xs text-ink-muted">
          Your equity is {isProfitable ? 'higher' : 'lower'} than the {odds.breakEvenEquity.toFixed(1)}% you need to break even.
        </span>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-border bg-surface-2 p-3">
      <div className="text-xs font-medium text-ink-faint">{label}</div>
      <div className="mt-1 tabular-nums text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}
