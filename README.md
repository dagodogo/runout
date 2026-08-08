# Runout

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
