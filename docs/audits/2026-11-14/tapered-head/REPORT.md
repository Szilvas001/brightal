# Tapered prong head — work in progress, 2026-11-14

Reference: https://www.stonealgo.com/custom/engagement-rings/custom-ring-builder/?design=avLA8vOXfE4625quvgWtFA

## Changes

- `tapered-prong.mjs`: closed variable-radius sweeps with 80 cross sections and 24 sides; integral rounded tips, shared solid root, optional gallery.
- `model.mjs`: common head builder for main and side stones; tapered shoulders; old four support posts removed for claw settings. Bezel construction is retained.
- `finished-model.mjs`: independent raw prong/stone collision check before cavity subtraction; detected intersections block submission.
- `index.jsx`: the existing 0–6 control maps to the selected 55–75% height ratio for claws; bezel lift still uses millimetres.
- `tapered-prong.test.cjs`: reference solitaire regression and rejection of the known halo collision.

## Completed checks

Five of twelve prototype configurations passed the implemented checks. Full measurements are in `prototype-results.json`.

Passing: one-carat round solitaire; default oval solitaire; hidden halo; pave; cathedral.

Both targeted regression tests passed. Build, lint and source syntax checks passed.

## Known blockers — do not merge into main

- Split and suspended bridge: root intrudes into finger opening.
- Trilogy, duet and the emerald bezel-style preset switched to claws: no smooth collision-free prong path found within the current search.
- Halo and vintage: outer halo stones intersect the new prongs; vintage also fails finished metal topology.
- Pear/marquise V-prongs are not implemented yet.
- Root embedding of at least 85%, all symmetry conditions, the full parameter sweep and export round-trip equivalence are not yet established.
- The complete before/after image set is unfinished. The before directory records the original heads in four views.

This branch is a visual and engineering prototype, not an accepted manufacturing release. The main branch remains unchanged. The localhost demonstration uses the verified one-carat round solitaire.
