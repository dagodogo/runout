import { cn } from '@/lib/cn';
import { actionKind, pctText, readoutLayout, signedBb, type ActionKind, type ReadoutRow } from './readoutMath';

const SEGMENT: Record<ActionKind, string> = {
  aggressive: 'bg-accent text-on-accent',
  passive: 'bg-bone text-black',
  fold: 'bg-fold text-bone',
};

const Dot = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
    <circle cx="4" cy="4" r="4" fill="currentColor" />
  </svg>
);
const Caret = ({ up = false }: { up?: boolean }) => (
  <svg width="10" height="7" viewBox="0 0 10 7" aria-hidden="true" className="shrink-0">
    <path d={up ? 'M5 0 10 7H0Z' : 'M0 0h10L5 7Z'} fill="currentColor" />
  </svg>
);

interface ReadoutProps {
  rows: ReadoutRow[];
  /** the user's pick; null shows the solver's answer alone */
  chosen: number | null;
  /** pot at the node, bb: sets the ruler's smallest span */
  potBb: number;
  className?: string;
}

/**
 * The signature instrument: a mix bar split by solver frequency (your pick marked by a notch) and an EV ruler
 * with a dimension line from your pick to the best EV. Hidden from screen readers: the ActionTable carries the data.
 */
export function Readout({ rows, chosen, potBb, className }: ReadoutProps) {
  const { best, x, segments, gapBb } = readoutLayout(rows, chosen, potBb);
  let before = 0;
  let notch: number | null = null;
  for (const s of segments) {
    if (s.i === chosen) notch = (before + s.share / 2) * 100;
    before += s.share;
  }
  const measured = chosen !== null && chosen !== best && gapBb !== null;
  const [from, to] = measured ? [Math.min(x[chosen], x[best]), Math.max(x[chosen], x[best])] : [0, 0];

  return (
    <div aria-hidden="true" className={cn('select-none', className)}>
      <div className="text-sm text-faint">How often the solver plays each action</div>
      <div className="readout-bar mt-2 flex h-10 gap-0.5">
        {segments.map((s) => {
          const r = rows[s.i];
          return (
            <div
              key={r.label}
              style={{ width: `${s.share * 100}%` }}
              className={cn(
                'flex min-w-0 items-center overflow-hidden whitespace-nowrap rounded-cell px-2 font-display text-sm font-semibold tabular-nums',
                SEGMENT[actionKind(r.label)],
              )}
            >
              {s.share >= 0.3 ? `${r.label} ${pctText(s.share)}` : s.share >= 0.1 ? pctText(s.share) : ''}
            </div>
          );
        })}
      </div>
      <div className="relative h-6 text-sm text-graphite">
        {notch !== null && (
          <span
            className={cn('absolute top-1 inline-flex items-center gap-1 whitespace-nowrap text-bone', notch < 15 ? 'left-0' : notch > 85 ? 'right-0' : '-translate-x-1/2')}
            style={notch >= 15 && notch <= 85 ? { left: `${notch}%` } : undefined}
          >
            <Caret up /> your pick
          </span>
        )}
      </div>

      <div className="mt-3 text-sm text-faint">What each action wins on average (EV, in big blinds)</div>
      <div className="relative mt-1 h-14">
        {measured && (
          <>
            <div className="readout-dim absolute top-4 h-2.5 border-x border-bone" style={{ left: `${from}%`, width: `${to - from}%` }}>
              <div className="absolute inset-x-0 top-1/2 h-px bg-bone" />
            </div>
            <div
              className="readout-dim-label absolute top-0 -translate-x-1/2 whitespace-nowrap font-display text-sm font-semibold tabular-nums text-bone"
              style={{ left: `${(from + to) / 2}%` }}
            >
              {gapBb.toFixed(2)}&nbsp;bb
            </div>
          </>
        )}
        <div className="absolute inset-x-0 top-10 h-px bg-rule-strong" />
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={cn('absolute top-8 h-4 w-px', i === best || i === chosen ? 'bg-bone' : 'bg-faint')}
            style={{ left: `${x[i]}%` }}
          />
        ))}
        <span className="absolute top-[36px] -translate-x-1/2 text-bone" style={{ left: `calc(${x[best]}% + 0.5px)` }}>
          <Dot />
        </span>
        {measured && (
          <span className="absolute top-[26px] -translate-x-1/2 text-bone" style={{ left: `calc(${x[chosen]}% + 0.5px)` }}>
            <Caret />
          </span>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm tabular-nums">
        {measured && (
          <span className="inline-flex items-center gap-1.5 text-graphite">
            <span className="text-bone"><Caret /></span>
            Your pick: <span className="text-bone">{rows[chosen].label} {signedBb(rows[chosen].evBb)}</span>
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5 text-graphite">
          <span className="text-bone"><Dot /></span>
          {chosen === best ? 'Best, and your pick:' : 'Best:'} <span className="text-bone">{rows[best].label} {signedBb(rows[best].evBb)}</span>
        </span>
      </div>
    </div>
  );
}
