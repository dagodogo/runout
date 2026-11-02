import { cn } from '@/lib/cn';
import { pctText, signedBb, type ReadoutRow } from './readoutMath';

interface ActionTableProps {
  rows: ReadoutRow[];
  /** null before the user has picked */
  chosen: number | null;
  best: number;
  caption: string;
}

/** The accessible source of the Readout's data: action, solver frequency, EV, text markers. */
export function ActionTable({ rows, chosen, best, caption }: ActionTableProps) {
  return (
    <table className="w-full text-left text-sm leading-[1.35]">
      <caption className="sr-only">{caption}</caption>
      <thead className="text-faint">
        <tr className="border-b border-rule">
          <th scope="col" className="py-2 pr-3 font-medium">Action</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">Solver plays it</th>
          <th scope="col" className="py-2 text-right font-medium">EV</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {rows.map((r, i) => (
          <tr key={r.label} className={cn('border-b border-rule last:border-0', i === chosen && 'bg-raised')}>
            <th scope="row" className="py-2 pl-2 pr-3 font-medium text-bone">
              {r.label}
              {i === best && <span className="ml-2 text-sm font-normal text-graphite">best</span>}
              {i === chosen && <span className="ml-2 text-sm font-normal text-graphite">your pick</span>}
            </th>
            <td className="py-2 pr-3 text-right text-bone">{pctText(r.freq)}</td>
            <td className="py-2 pr-2 text-right text-bone">{signedBb(r.evBb)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
