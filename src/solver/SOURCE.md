# Solver source (AGPL-3.0)

The files in `pkg/solver-st` and `pkg/solver-mt` are compiled from wasm-postflop 0.2.7, unmodified:

- Source: https://github.com/b-inary/wasm-postflop, tag `v0.2.7` (commit `97360db`)
- License: AGPL-3.0 (copy in `../../LICENSE`)
- Build, from a clone of that tag, with nightly Rust, `rust-src`, the `wasm32-unknown-unknown` target and `wasm-pack`:

```sh
npm install
npm run wasm:solver-st   # output: pkg/solver-st  -> src/solver/pkg/solver-st
npm run wasm:solver-mt   # output: pkg/solver-mt  -> src/solver/pkg/solver-mt
```

Runout changes nothing in the solver itself. The "lean" game tree (one bet size per street, flop
check-raise only) is set at run time in `src/lib/solver/spots.ts` and `src/solver/worker.ts`.

Known limit: the compiled files embed build paths from the machine that built them (the user name
and folder). A rebuild with `RUSTFLAGS="--remap-path-prefix=<build dir>=/build"` removes them.
