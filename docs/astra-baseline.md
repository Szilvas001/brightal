# astra-baseline

Snapshot of all current project source changes before the next development phase.

Validation on 2026-09-21:
- `npm run build`: passed. Existing esbuild warning: `import.meta` is unavailable in the IIFE bundle (`public/builder/kernel.mjs`).
- `node --test tests/*.test.cjs`: 16 tests, 15 passed, 1 failed (63.3 seconds).
- Existing failure: `tests/designs.test.cjs:48` expects 24 collection entries; actual collection contains 31.
- `git diff --cached --check`: passed.
- No lint or typecheck script is configured.

Reproducible generated bundles, Brotli files, thumbnails, dependencies, local scratch files and secrets are excluded from version control. Previously tracked generated JS bundles are removed from the index only; local files remain available.

After installing dependencies, run `npm run build` and `node scripts/thumbnails.mjs` before starting the server. The thumbnail generation script is included in this snapshot.

The diamond catalogue currently contains explicitly marked development samples, not verified supplier inventory. This baseline preserves the existing implementation and known limitations; it does not certify manufacturing readiness or live reference pricing.
