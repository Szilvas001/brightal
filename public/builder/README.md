# BRIGHTAL Atelier

The designer is available at `/ring-builder`, in both languages and both navigation layouts. Its JS bundle loads only when the route opens. Three.js and the procedural studio environment are bundled locally; the renderer requires no remote textures, models or services.

## Build and test

```sh
npm ci
npm run build
npm run test:builder
npm start
```

`scripts/build.js` builds the existing React app and the new designer. Commit both generated `public/app.js` and `public/builder/bundle.js`, as the existing deployment serves these files directly. `build:watch` watches the original app only; rerun `build` after designer changes.

## Architecture

- `state.js`: allowlisted, bounded version-1 configuration, presets and share-link parsing.
- `index.jsx`: bilingual five-step UI, undo/redo, local save, URL sharing, image/specification export, quote handoff.
- `renderer.js`: procedural comfort-fit band, faceted center stones, prongs, accents, inner engraving and studio rendering. Geometries, materials and textures are disposed on rebuild and unmount.
- `builder.css`: scoped responsive styles; the existing store styles are preserved.

Configurations are independent of the renderer. Certificate, origin and clarity are requested specifications, not fabricated inventory records. Shape, carat, color, metal, finish, width, size, profile, prongs, accents and engraving affect the preview. Clarity is not mapped to arbitrary visible defects; an actual inclusion pattern requires the selected stone's scan.

## Optics and performance

The center-stone shader traces a refracted ray through the convex cut's facet planes, with Snell refraction (IOR 2.417), Fresnel reflection and up to five internal bounces. Spectral exit directions approximate dispersion. Metal uses Three.js physical materials and a PMREM studio environment. Small accent stones use cheaper physical materials. This is a real-time concept renderer, not spectral path tracing, gemological simulation or manufacturing CAD. Cut outlines are stylized, including emerald/radiant; actual cut facet layouts and stone scans would be needed for a production gemstone digital twin.

Idle scenes render on demand. Offscreen/hidden scenes pause rendering, pixel ratio is capped at 1.75, and sustained slow rendering drops it to 1. Auto rotation is opt-in. Keyboard arrows rotate; +/- zoom. WebGL loss displays a recovery UI while design controls and JSON export remain available. Browser/device performance varies; 60 FPS is a target, not a cross-device guarantee.

## Quote handoff

The current PNG and complete specifications populate the existing authenticated upload form. The draft survives reload in session storage where available; memory is the fallback. Submission uses the existing `/api/requests` endpoint and existing consent, authentication and review workflow. The draft is removed after successful submission. Payment is not initiated by the designer, and no invented live price is displayed.

## Validation

Unit tests cover adversarial configuration values, Unicode/share round-trips, wedding-band compatibility, and finite, outward-facing convex geometry for every cut within the shader's plane budget. Manual browser checks cover the eight cuts, alternate settings, Hungarian/English, 1440px desktop and 390px mobile, save/reload, quote handoff and 3D rendering. The tested desktop browser measured 60 FPS during halo auto rotation. Live payments, real certificate inventory and manufacturing validation are outside this local preview.
