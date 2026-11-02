# Runout

Solver trainer: each hand is solved live in the browser by wasm-postflop (AGPL-3.0); grades are against that solve.

Licence: AGPL-3.0-only (see `LICENSE`). Source code: public repository URL still to come; the footer link waits for it, and it must be added before any deploy.

An AI-flavored poker training app — preflop range trainer, postflop scenario trainer, a GTO frequency drill, an analytics dashboard with an auto-detected Leak Finder, and a free Learn Hub (odds calculator, glossary, printable range chart).

Local-first: no account, no backend. Progress (XP, tier, session history) is stored in the browser via `localStorage`.

## Stack

React 19 + TypeScript + Vite + Tailwind v4 + Zustand + React Router + Recharts.

## Development

```bash
npm install
npm run dev
```

Open the printed `localhost` URL.

## Build

```bash
npm run build   # type-checks then builds to dist/
npm run lint    # oxlint
```

## Notes

- Preflop ranges are generated from the Chen Formula (a well-known hand-strength heuristic), calibrated to approximate realistic 6-max opening frequencies — not real solver output.
- No real-money play. Educational software, 18+.
- Licensing: the postflop solver is wasm-postflop by b-inary, AGPL-3.0 (source: https://github.com/b-inary/wasm-postflop; bundled in `src/solver/pkg`). Third-party notices are in `THIRD_PARTY_LICENSES.md`.
- The solver's preflop ranges are a hand-authored approximation, slightly narrow: BTN opens 41% of combos, CO 23%, BB defends vs BTN 50%, BB defends vs CO 43%.
- The solver tree is lean: one bet size per street, flop check-raise only, no re-raises. Results are an approximation of a solution, not a full solve.
