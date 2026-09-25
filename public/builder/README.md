# BRIGHTAL Design Lab

The designer is available at `/ring-builder`, in both languages and both navigation layouts. Its JS bundle loads only when the route opens. Three.js and the procedural studio environment are bundled locally; the renderer requires no remote textures, models or services.

## Build and test

```sh
npm ci
npm run build
npm run test:builder
npm run test:designs
npm start
```

`scripts/build.js` builds the app, designer and geometry worker. Generated bundles are ignored by Git; run `npm run build` after pulling or use `npm run local`, which builds before starting. `build:watch` watches the original app only; rerun `build` after designer changes.

## Architecture

- `state.mjs`: allowlisted, bounded configuration, twenty-two presets and share-link parsing. Existing v1 local saves remain compatible.
- `index.jsx`: bilingual six-step UI, undo/redo, eight-design local library, JSON import/export, URL sharing, image export and quote handoff. Gallery thumbnails come from the real 3D models.
- `model.mjs`: ten procedural ring families, nine center cuts, independently sized/shaped/colored side stones, two-tone settings, double halos, independent hidden halos, split shanks, cathedral bridges and configurable band accents.
- `fashion.mjs`: six additional sculptural families: wave, rope, dome, signet, open cuff and stacked bands. Controls change amplitude, rhythm, layers, spacing, signet shape/size/inlay and mixed metals. These intentionally have no center-stone, pavé or engraving controls; incompatible state is normalized away. The stack is a coordinated set of separate bands, not a fused manufacturing solid.
- `optics.mjs`: convex facet geometry, gemstone materials and the shared procedural HDR lighting environment.
- `renderer.js`: scene, camera, interactive controls, inner engraving and rendering lifecycle. Geometries, materials and textures are disposed on rebuild and unmount.
- `builder.css`, `atelier.css` and `lab.css`: scoped responsive styling, expanded 1920px Design Lab workspace, focus canvas and teal/graphite visual identity. Existing store styles are preserved. Both the homepage and navigation offer photo upload and the designer.

The creative toolbar generates an optional randomized fashion variation; it never changes a saved design automatically and is reversible through undo. Style filters, context-sensitive silhouette/contrast steps and fourteen actual 3D preset thumbnails support exploration. Focus mode hides the controls temporarily, with an explicit return button. There are no streaks, countdowns, engagement notifications or auto-running motion.

Configurations are independent of the renderer. Certificate, origin and clarity are requested specifications, not fabricated inventory records. Shape, carat, color, metal, finish, width, size, profile, prongs, accents and engraving affect the preview. Clarity is not mapped to arbitrary visible defects; an actual inclusion pattern requires the selected stone's scan.

## Optics and performance

Every stone, including pavé, halo, cluster and hidden-halo accents, traces a refracted ray through up to 128 convex facet planes, with Snell refraction (diamond IOR 2.417), Fresnel reflection, absorption and up to seven internal bounces. Each stone has independent local-camera uniforms and shares cached cut geometry. Separate RGB exit directions approximate dispersion. Sapphire, ruby and emerald palettes use different optical properties. Emerald and Asscher use octagonal stepped cuts; other cuts use brilliant-style facets. Metal uses uncoated Three.js physical materials and a PMREM of the same HDR environment used by gemstones. Neutral fill cards and differentiated alloy palettes reduce muddy gold reflections. Swept band seams are welded before normal calculation; small cluster stones have scaled baskets, claws and connecting supports. This is a real-time concept renderer, not spectral path tracing, gemological simulation or manufacturing CAD. Actual cut scans would be needed for a production gemstone digital twin.

Idle scenes render on demand. Offscreen/hidden scenes pause rendering, pixel ratio is capped at 1.75, and sustained slow rendering drops it to 1. Auto rotation is opt-in. Keyboard arrows rotate; +/- zoom. WebGL loss displays a recovery UI while design controls and JSON export remain available. Browser/device performance varies; 60 FPS is a target, not a cross-device guarantee.

## Quote handoff

The current PNG and complete specifications populate the existing authenticated upload form. The draft survives reload in session storage where available; memory is the fallback. Submission uses the existing `/api/requests` endpoint and existing consent, authentication and review workflow. The draft is removed after successful submission. Payment is not initiated by the designer, and no invented live price is displayed.

## Validation

Unit tests cover adversarial configuration values, Unicode/share round-trips, compatibility constraints, all 64 style/side-layout inputs (incompatible fashion side layouts normalize to none), geometry changes for each fashion family's primary control, and finite outward-facing convex geometry for all nine cuts within the shader plane budget. Browser checks cover desktop/mobile layouts, signet inlays, two-tone stacks, focus mode, variation/undo, independent side stones, saved-design library, quote handoff and live 3D rendering. Live payments, real certificate inventory and manufacturing validation are outside this local preview.


## Order snapshots and workshop handoff (v3)

There are 24 style families, including eight daily diamond layouts and six sculptural families. Engagement is the default filter; plain and eternity bands are in the daily collection. Five original daily designs add ribbon, graduated, east–west, alternating-cut and crown compositions. The original engagement models and all store destinations remain available.

Submitting a designer quote sends a versioned `ringDesign` field through the existing authenticated request endpoint. The server validates and normalizes it using the same shared state module. The persisted request includes a design UUID, name, model version, canonical configuration and SHA-256 configuration digest. Metal, size and engraving in the order derive from this configuration, preventing contradictory form values. Prices and payment approval still come exclusively from the existing admin workflow.

At submission time the server creates a private, immutable ZIP under `data/designs/<request-id>.zip`. Back up this directory with the existing data directory. The admin's **Rendelés forrása → Gyűrűtervező** filter also applies to CSV/XLS exports. Each designer order has an admin-only **Műhelycsomag letöltése (ZIP)** link, preserved across payment and production states. Existing photo-only orders work unchanged; old free-text designer requests cannot be reconstructed automatically and have no package.

The ZIP contains:
- `design.json`: full importable configuration, requested nominal dimensions, model version, digest and mesh bounds;
- `ring-concept.obj`: one named logical object with separate component groups, with scene scale converted to millimetres;
- reference images and `workshop.html`: a printable brief with all parameters, nominal size and space for workshop sign-off;
- `READ-ME.txt`: exact manufacturing limitations.

**This is workshop review material, not certified manufacturing CAD.** A single OBJ object is not a Boolean-unioned watertight solid. In particular, the legacy preview size follows the shank centreline, so its actual inner diameter differs from the requested nominal size; stones are approximate carat-scaled cuts, not measured stock. STEP/3DM production solids, proper seats and tolerances, engraving subtraction, casting shrinkage and wall/clearance validation require a separate parametric CAD implementation plus actual stones and workshop process specifications. Do not send this OBJ directly to casting/printing as an approved production file. Sculptural stacks remain separate physical bands and mixed materials require separate operations. No UI or package declares these designs 100% manufacturable.

Verification includes malformed design rejection and uploaded-file cleanup, original photo orders, immutable ZIP bytes after payment-status changes, customer/anonymous download denial, admin source filtering and filtered exports, OBJ indices/finite coordinates, HTML escaping and new layout geometry differences. No live payment is executed by these tests.
