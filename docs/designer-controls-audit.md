# Ring designer control audit — 2026-10-02

Scope: all 44 starting presets, every exposed discrete choice, every available slider tick, and dependent stone/setting/accent combinations. This is exhaustive per-control coverage with targeted interaction matrices, not the Cartesian product of every possible configuration.

## Fixed failures

- Bezel and Suspended Bridge no longer overwrite an explicitly selected claw/double-claw setting or head alloy.
- Boolean-unioned detailed models preserve the separate head alloy with face-derived vertex colours. Catalogue thumbnails use those colours too.
- Secret Halo can be switched off. The hidden halo option now applies to both mountings in Dialogue.
- Twin Light applies all nine existing stone cuts; its spacing changes the actual stone positions instead of being swallowed by a fixed angular minimum.
- Signet face size affects the upper silhouette independently of the band width; its width summary includes the larger face.
- Stone width can increase beyond the previously selected length; canonical dimensions and slider bounds stay consistent. Depth limits use the same downward rounding in UI and normalization.
- Modern band width and thickness expose the actual minimum needed for the selected stones/stack, including sufficient thickness for the deepest supported stones. State, controls and model agree.
- Split/tension accent sizes account for the narrower individual tracks. Tension permits two accent rows only when they fit, and its channel rails follow both tracks.
- Pavé, channel rails and vintage edge decoration follow the selected band thickness. Engraving follows the actual nominal inner radius instead of a fixed radial offset.
- Instant previews distinguish satin from brushed finish.
- Controls without applicable geometry are hidden: single-stone count/spacing, full-circle auto-spacing, alternation on a single stone, unused accent dimensions, symmetric-cut orientation, engraving font before any text, and relief-only rhythm when its relief is zero. Modern eternity summaries no longer claim an unrendered pavé layer.
- Expensive obsolete geometry jobs are cancelled. Rapid edits coalesce before Boolean work; stale replies cannot replace the current ring. A poisoned worker gets one fresh-runtime retry; persistent errors remain visible and unmount cancels all work.
- Download anchors are attached to the document for the click and removed afterwards.

## Automated evidence

`node --test tests/*.test.cjs`: **44 passed, 0 failed**.

| Matrix | Cases |
| --- | ---: |
| Individual slider ticks across 44 presets | 8,838 |
| Actual finite stone-cut/orientation models | 783 |
| Legacy setting/prong/side-layout/cut/accent combinations | 623 |
| Materials, requested specifications and finished head alloys | 1,760 |

The slider regression compares adjacent steps; periodic pattern endpoints may describe equivalent phases. Modern slider checks inspect the shared geometric layout, collar dimensions and groove inputs; actual detailed model builds are additionally exercised by the cut, finish, head-alloy and pre-existing geometry tests.

Other tests cover both duet halos, alternate stone shapes/colours, poisoned-worker recovery, stale replies, cancellation, normalization/import/share round trips, workshop snapshots, permissions and order/payment regressions. Clarity, certificate and origin are retained requested specifications; the preview does not invent inclusions or certificates.

Build, source syntax, ESLint, TypeScript pricing checks and `git diff --check` pass.

## Browser evidence

All 44 presets were traversed through all six steps in the Codex in-app browser. The initial complete pass performed 2,638 control operations without selection-retention failures; the changed Bezel/Tension controls were then rechecked. Dynamic controls were discovered after enabling their parent option; choice selection and range endpoints were checked against the resulting DOM.

Additional checks passed: colour/clarity/origin/certificate selectors, Unicode engraving and three fonts, undo/redo (EU 55 → 54 → 55), saving/loading a named design, exact configuration equality after JSON import, exact shared-link restoration, focus mode, all four camera views, zoom, auto rotation and quote handoff with its generated PNG. Desktop 1440px and mobile 390px views had no horizontal overflow and reached detailed quality. The normal browser viewport was restored.

The in-app browser did not report a download event for the JSON export, before or after the anchor change. Native JSON/PNG file delivery is therefore **not browser-verified** in this environment. JSON serialization/round-trip and import are verified, and a matching JSON artifact was saved locally. No live payment or real customer submission was performed.

Reproduce the regression matrices with `npm test`; build the UI with `npm run build` or start it with `LOCAL_PORT=8000 npm run local`.
