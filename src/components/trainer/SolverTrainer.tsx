import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { SOLVER_RANGE_DISCLAIMER } from '@/data/solverRanges';
import { buildSpot, CHIPS_PER_BB, type SolverSpot } from '@/lib/solver/spots';
import { deal, advance, heroAct, type Hand, type Outcome, type Step } from '@/lib/solver/walk';
import { readResults } from '@/lib/solver/decode';
import { explain, type Explanation } from '@/lib/solver/explain';
import { idToCard } from '@/solver/cards';
import { init, startSolve, cancel, nodes, type InitInfo, type SolveProgress, type SolveResult } from '@/solver/client';
import { useProfileStore } from '@/lib/store/profile';
import { spotCategory } from '@/lib/poker/leaks';
import { CATEGORY_NAME, evaluateBest } from '@/lib/poker/evaluator';
import { buttonClass } from '@/components/ui/Button';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { actionKind, signedBb } from '@/components/ui/readoutMath';
import { GradePanel } from './GradePanel';
import { SeatRows } from './SeatRows';
import { actionLabel, actionText, bbText, cardText, headlineBody, STREET_NAME } from './solverFormat';

const LEAN_TREE_NOTE = 'Simplified action tree: one bet size per street, flop check-raise only, no re-raises.';
const TARGET_PCT = 1; // worker.ts stops at 1% of the pot

type FeedItem =
  | { kind: 'grade'; street: string; chosen: number; label: string; ex: Explanation; potBb: number; rough?: number }
  | { kind: 'text'; text: string };

/** What the seat rows show. A snapshot, so the decision's street stays on screen until "Next street". */
interface View {
  board: number[];
  bets: [number, number]; // chips put in after the flop, [oop, ip]
  line: string[]; // this street's actions so far
  villainCards?: number[]; // shown after a showdown
}

const seatIdx = (seat: 'oop' | 'ip') => (seat === 'oop' ? 0 : 1);
const villainName = (s: SolverSpot) => (s.heroSeat === 'ip' ? 'BB' : s.ipPos);

function streetLine(h: Hand, villain: string) {
  const from = h.log.map((e) => e.who).lastIndexOf('chance') + 1;
  return h.log.slice(from).map((e) => actionText(e.label, e.who === 'hero' ? 'You' : villain));
}

/** Reads the bets at the node the tree is on: call right after advance or heroAct. */
async function snapshot(h: Hand, villain: string): Promise<View> {
  const b = await nodes().totalBetAmount(new Uint32Array(0));
  return { board: [...h.board], bets: [b[0], b[1]], line: streetLine(h, villain) };
}

function outcomeText(o: Outcome, h: Hand, villain: string) {
  const pot = bbText(o.pot);
  const end = o.winner === 'hero' ? `You win the ${pot} pot.` : o.winner === 'villain' ? `${villain} wins the ${pot} pot.` : `Split pot of ${pot}.`;
  if (o.kind === 'fold') return end;
  const show = (c: number[]) =>
    `${c.map(cardText).join(' ')} (${CATEGORY_NAME[evaluateBest([...c, ...h.board].map(idToCard)).category].toLowerCase()})`;
  const verb = o.winner === 'hero' ? 'beats' : o.winner === 'villain' ? 'loses to' : 'ties with';
  return `Showdown: your ${show(h.hero)} ${verb} ${show(h.villain)}. ${end}`;
}

export function SolverTrainer() {
  const [info, setInfo] = useState<InitInfo | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [spot, setSpot] = useState<SolverSpot | null>(null);
  const [progress, setProgress] = useState<SolveProgress | null>(null);
  const [solved, setSolved] = useState<SolveResult | null>(null);
  const [hero, setHero] = useState<[number, number] | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [pending, setPending] = useState<View | null>(null); // the next street, held until "Next street"
  const [step, setStep] = useState<Step | null>(null);
  const [stepNo, setStepNo] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState({ hands: 0, graded: 0, lossBb: 0 });
  const recordDecision = useProfileStore((s) => s.recordDecision);

  const busyRef = useRef(false); // mirrors `busy` for newHand's closure
  const run = useRef(0); // bumped per hand; stale async work checks it
  const handRef = useRef<Hand | null>(null);
  const cardsRef = useRef<[Uint16Array, Uint16Array] | null>(null);
  const solveRef = useRef<Promise<SolveResult> | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const focusInBar = useRef(false);

  // each decision gets fresh buttons with nothing selected (the last street's pick used to stay highlighted)
  const showStep = useCallback((s: Step | null) => {
    setStep(s);
    setPicked(null);
    setStepNo((n) => n + 1);
  }, []);

  const newHand = useCallback(async () => {
    if (busyRef.current) return; // a decision's node messages are in flight; a new solve would free the game under them
    const id = ++run.current;
    const stale = () => id !== run.current;
    void cancel();
    handRef.current = null;
    cardsRef.current = null;
    setFailed(null);
    setSpot(null);
    setProgress(null);
    setSolved(null);
    setHero(null);
    setView(null);
    setPending(null);
    showStep(null);
    setFeed([]);
    setBusy(false);
    try {
      const i = await init();
      if (stale()) return;
      setInfo(i);
      if (i.mode === 'unavailable') return setFailed(i.error ?? 'init failed');

      const s = buildSpot();
      setSpot(s);
      let dealing: Promise<void> | null = null;
      let previewed = false;
      const dealHand = async () => {
        const n = nodes();
        const h = await deal(n, s, s.heroSeat, Math.random);
        cardsRef.current = [await n.privateCards(0), await n.privateCards(1)];
        if (stale()) return;
        handRef.current = h;
        setHero(h.hero);
        setSession((x) => ({ ...x, hands: x.hands + 1 }));
        setView({ board: [...h.board], bets: [0, 0], line: [] }); // the flop, nothing bet yet
        if (s.heroSeat === 'oop') {
          // buttons before the solve ends: only hero's own labels are needed here
          try {
            const first = await advance(n, h, Math.random, s.startingPot);
            if (!stale()) {
              previewed = true;
              showStep(first);
            }
          } catch {
            // preview not possible mid-solve: buttons appear when the solve is done
          }
        }
      };
      const solving = startSolve(s, (p) => {
        if (stale()) return;
        setProgress(p);
        dealing ??= dealHand();
      });
      solveRef.current = solving;
      const res = await solving;
      if (stale()) return;
      if (res.status === 'unavailable') return setFailed(res.error ?? 'solver failed');
      if (res.status === 'cancelled') return;
      setSolved(res);
      await (dealing ??= dealHand());
      // OOP: the flop buttons are already up (and may be picked); re-showing them would drop the pick
      if (stale() || !handRef.current || previewed) return;
      const first = await advance(nodes(), handRef.current, Math.random, s.startingPot);
      const v = await snapshot(handRef.current, villainName(s));
      if (stale()) return;
      setView(v);
      showStep(first);
    } catch (e) {
      if (!stale()) setFailed(String(e));
    }
  }, [showStep]);

  // unmount: invalidate pending async work and stop the solve
  const stopAll = useCallback(() => {
    run.current++;
    void cancel();
  }, []);

  useEffect(() => {
    void newHand();
    return stopAll;
  }, [newHand, stopAll]);

  // keyboard users keep their place: when the bar's buttons are swapped, focus moves to the new first button
  const barKey = `${stepNo}-${pending ? 1 : 0}`;
  useEffect(() => {
    const bar = barRef.current;
    const active = document.activeElement;
    if (bar && focusInBar.current && (active === document.body || bar.contains(active))) {
      bar.querySelector('button')?.focus({ preventScroll: true });
    }
  }, [barKey]);

  const act = async (choice: number) => {
    const h = handRef.current;
    const s = spot;
    const v = view;
    if (busy || !h || !s || !v || step?.status !== 'hero') return;
    const id = run.current;
    const actions = step.actions;
    setPicked(choice);
    setBusy(true);
    try {
      const res = await solveRef.current;
      if (id !== run.current || res?.status !== 'done') return;
      busyRef.current = true; // node messages start now; waiting for the solve above stays cancellable
      const n = nodes();
      const villain = villainName(s);
      const street = STREET_NAME[h.board.length];
      const label = actionLabel(actions[choice], h.board.length);
      const added: FeedItem[] = [];
      if (actions.length === 1) {
        // nothing to choose, so nothing to grade or record (it used to say "Correct. Best - solver: Check 100%")
        added.push({ kind: 'text', text: `Only one option here: ${label}. Not graded.` });
      } else {
        await n.applyHistory(Uint32Array.from(h.history));
        const results = await readResults(n, h.length);
        const ex = explain({
          results,
          heroSeat: h.heroSeat,
          heroIdx: h.heroIdx,
          cards: cardsRef.current!,
          board: h.board,
          actions,
          chosen: choice,
        });
        const exact = res.stop === 'target';
        const solverStreet =h.board.length === 3 ? 'flop' : h.board.length === 4 ? 'turn' : 'river';
        recordDecision({
          source: 'solver',
          game: 'nlhe',
          street: solverStreet,
          category: spotCategory(solverStreet, actions.some((a) => a.startsWith('Call'))),
          grade: ex.grade.grade,
          evLossBb: exact ? ex.grade.evLossBb : null, // a rough solve's EVs are off by about its exploitability
          correct: ex.grade.correct,
        });
        setSession((x) => ({ ...x, graded: x.graded + 1, lossBb: x.lossBb + ex.grade.evLossBb }));
        const potBb = (s.startingPot + v.bets[0] + v.bets[1]) / CHIPS_PER_BB;
        added.push({ kind: 'grade', street, chosen: choice, label, ex, potBb, rough: exact ? undefined : res.exploitabilityPct });
      }
      const seen = h.log.length;
      const next = await heroAct(n, h, choice, Math.random, s.startingPot);
      if (id !== run.current) return;
      // log[seen] is hero's own action; the rest is villain and dealt cards
      for (const e of h.log.slice(seen + 1)) {
        const c = +e.label;
        added.push({
          kind: 'text',
          text: e.who === 'chance' ? `${STREET_NAME[h.board.indexOf(c) + 1]}: ${cardText(c)}.` : actionText(e.label, villain),
        });
      }
      const nv = await snapshot(h, villain);
      if (id !== run.current) return;
      if (next.status === 'end') {
        added.push({ kind: 'text', text: outcomeText(next.outcome, h, villain) });
        setView(next.outcome.kind === 'showdown' ? { ...nv, villainCards: h.villain } : nv);
      } else if (nv.board.length > v.board.length) {
        setPending(nv);
      } else {
        setView(nv);
      }
      setFeed((f) => [...f, ...added]);
      showStep(next);
    } catch (e) {
      if (id === run.current) setFailed(String(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const villain = spot ? villainName(spot) : 'BB';
  const heroSeatName = spot ? (spot.heroSeat === 'ip' ? spot.ipPos : 'BB') : '';
  const bet = (seat: 'oop' | 'ip') => view?.bets[seatIdx(seat)] ?? 0;
  const lastGrade = feed.map((f) => f.kind).lastIndexOf('grade');
  const solving = !solved && !failed;
  const pickLabel = picked !== null && step?.status === 'hero' && view ? actionLabel(step.actions[picked], view.board.length) : '';

  let status: string;
  if ((!progress || progress.iterations === 0) && !solved && !view) status = 'Dealing a new hand…';
  else if (solving && busy) status = `Your pick is saved: ${pickLabel}. Grading when the solve finishes.`;
  else if (solving && progress)
    status = `Solving this hand: ${progress.exploitabilityPct.toFixed(1)}% of the pot from perfect, target ${TARGET_PCT}%. ${progress.threads} ${progress.threads === 1 ? 'thread' : 'threads'}, ${progress.seconds.toFixed(0)} s.`;
  else if (solved?.stop && solved.stop !== 'target')
    status = `The solve stopped at ${solved.seconds.toFixed(0)} s at ${solved.exploitabilityPct.toFixed(1)}% of the pot from perfect. Grades use this answer.`;
  else status = step?.status === 'hero' && !pending && feed.length === 0 ? 'Solved. Your move.' : '';
  const frac = progress ? Math.min(1, TARGET_PCT / Math.max(progress.exploitabilityPct, TARGET_PCT)) : 0;

  let bar: ReactNode = null;
  if (pending)
    bar = (
      <button type="button" className={buttonClass('primary', 'w-full lg:w-auto')} onClick={() => {
          setView(pending);
          setPending(null);
        }}>
        Next street
      </button>
    );
  else if (step?.status === 'end')
    bar = (
      <button type="button" className={buttonClass('primary', 'w-full lg:w-auto')} onClick={() => void newHand()}>
        Next hand
      </button>
    );
  else if (step?.status === 'hero' && view)
    bar = step.actions.map((raw, i) => {
      const label = actionLabel(raw, view.board.length);
      const variant = picked === i ? 'picked' : actionKind(label) === 'aggressive' ? 'aggressive' : 'secondary';
      return (
        <button
          key={`${stepNo}-${raw}`}
          type="button"
          aria-pressed={picked === i}
          disabled={busy && picked !== i}
          onClick={() => void act(i)}
          className={buttonClass(variant, 'flex-1 lg:flex-none')}
        >
          {label}
        </button>
      );
    });

  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-display text-h1 font-semibold text-bone">Solver trainer</h1>
        {session.hands > 0 && (
          <p className="text-sm tabular-nums text-graphite">
            Hand {session.hands}
            {session.graded > 0 && (
              <>
                {' · This session '}
                <span className="text-bone">{signedBb(-session.lossBb)}</span>
              </>
            )}
          </p>
        )}
      </header>
      <div className="mt-4 flex max-w-[80ch] gap-3 text-sm text-graphite">
        <Info size={16} aria-hidden="true" className="mt-1 shrink-0" />
        <div>
          <p>{SOLVER_RANGE_DISCLAIMER}</p>
          <p className="mt-1">{LEAN_TREE_NOTE}</p>
        </div>
      </div>

      {info?.banner && (
        <p role="status" className="mt-4 max-w-[80ch] rounded-card border border-rule-strong bg-raised px-4 py-3 text-sm text-bone">
          Single-thread mode: this browser can't solve on several threads, so each hand takes 2 to 4 minutes, and the
          answer may be rougher (the solve stops at 3 minutes).
          {info.error && <span className="block break-words text-faint">Details: {info.error}</span>}
        </p>
      )}

      {failed ? (
        <div role="alert" className="mt-8 max-w-[65ch] rounded-panel border border-rule bg-panel p-6">
          <p className="text-bone">
            {failed.startsWith('memory')
              ? "This flop's tree is too big for the 600 MB limit. Deal another hand."
              : "The solver can't run on this device: it needs about 600 MB of free memory and a browser that supports WebAssembly."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/train/postflop" className={buttonClass('primary')}>
              Open the postflop drill
            </Link>
            <button type="button" className={buttonClass('secondary')} onClick={() => void newHand()}>
              Try another hand
            </button>
          </div>
          <p className="mt-3 text-sm text-faint">The drill runs everywhere; its grades are a heuristic approximation, not solver output.</p>
          <p className="mt-4 break-words text-sm text-faint">Details: {failed}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-panel border border-rule bg-panel p-4 sm:p-6">
              {spot && (
                <p className="mb-4 text-sm text-graphite">
                  {spot.ipPos} vs BB, single-raised pot. You are {heroSeatName}.
                </p>
              )}
              {view && hero && spot ? (
                <SeatRows
                  villain={{ name: villain, stack: bbText(spot.effectiveStack - bet(spot.heroSeat === 'ip' ? 'oop' : 'ip')), cards: view.villainCards }}
                  hero={{ name: `You (${heroSeatName})`, stack: bbText(spot.effectiveStack - bet(spot.heroSeat)), cards: hero }}
                  board={view.board}
                  pot={bbText(spot.startingPot + bet('oop') + bet('ip'))}
                  line={view.line}
                />
              ) : (
                <p className="text-graphite">Dealing a new hand…</p>
              )}
            </div>
            {bar && (
              <div
                ref={barRef}
                role="group"
                aria-label={step?.status === 'hero' && !pending ? 'Your action' : 'Continue'}
                onFocus={() => (focusInBar.current = true)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) focusInBar.current = false;
                }}
                className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-rule bg-black px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:static lg:z-auto lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0"
              >
                {bar}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            {status && (
              <div role="status">
                <p className="text-sm tabular-nums text-graphite">{status}</p>
                {solving && progress && !busy && (
                  <p className="mt-1 text-sm text-faint">
                    That is how far the current answer is from an unbeatable strategy, as a share of the pot.
                  </p>
                )}
              </div>
            )}
            {solving && (
              <div
                role="progressbar"
                aria-label="Solve progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(frac * 100)}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised"
              >
                <div className="h-full bg-bone transition-[width] duration-300" style={{ width: `${frac * 100}%` }} />
              </div>
            )}
            {solving && spot?.heroSeat === 'ip' && view && !step && (
              <p className="mt-3 text-sm text-graphite">{villain} acts first. His action appears when the solve finishes.</p>
            )}

            <ul aria-live="polite" className="mt-6 space-y-4">
              {feed.map((f, i) =>
                f.kind === 'text' ? (
                  <li key={i} className="text-bone">
                    {f.text}
                  </li>
                ) : i === lastGrade ? (
                  <li key={i} className="border-t border-rule pt-6">
                    <GradePanel
                      grade={f.ex.grade.grade}
                      headline={f.ex.headline}
                      rows={f.ex.table}
                      chosen={f.chosen}
                      potBb={f.potBb}
                      sentences={f.ex.sentences}
                      context={`${f.street}: you chose ${f.label}${f.rough === undefined ? '' : ` (rough: solve stopped at ${f.rough.toFixed(1)}% from perfect)`}`}
                    />
                  </li>
                ) : (
                  <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule pt-4 text-sm">
                    <GradeBadge grade={f.ex.grade.grade} />
                    <span className="text-graphite">
                      {f.street}: you chose {f.label}. {headlineBody(f.ex.headline)}
                    </span>
                  </li>
                ),
              )}
            </ul>

            {view && (
              <button type="button" className={buttonClass('ghost', 'mt-6')} disabled={busy && !!solved} onClick={() => void newHand()}>
                Deal a new hand
              </button>
            )}
          </div>
        </div>
      )}
      {/* room for the fixed action bar on phones */}
      <div aria-hidden="true" className="h-24 lg:hidden" />
    </div>
  );
}
