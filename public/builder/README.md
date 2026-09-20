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

- `state.js`: allowlisted, bounded version-2 configuration, eight presets and share-link parsing. Existing v1 local saves remain compatible.
- `index.jsx`: bilingual six-step UI, undo/redo, eight-design local library, JSON import/export, URL sharing, image export and quote handoff. Gallery thumbnails come from the real 3D models.
- `model.mjs`: ten procedural ring families, nine center cuts, independently sized/shaped/colored side stones, two-tone settings, double halos, independent hidden halos, split shanks, cathedral bridges and configurable band accents.
- `optics.mjs`: convex facet geometry, gemstone materials and the shared procedural HDR lighting environment.
- `renderer.js`: scene, camera, interactive controls, inner engraving and rendering lifecycle. Geometries, materials and textures are disposed on rebuild and unmount.
- `builder.css` and `atelier.css`: scoped responsive styles and original cream/merlot Atelier identity; existing store styles are preserved. Both the homepage and navigation offer photo upload and the designer.

Configurations are independent of the renderer. Certificate, origin and clarity are requested specifications, not fabricated inventory records. Shape, carat, color, metal, finish, width, size, profile, prongs, accents and engraving affect the preview. Clarity is not mapped to arbitrary visible defects; an actual inclusion pattern requires the selected stone's scan.

## Optics and performance

The hero-stone shader traces a refracted ray through up to 128 convex facet planes, with Snell refraction (diamond IOR 2.417), Fresnel reflection, absorption and up to seven internal bounces. Separate RGB exit directions approximate dispersion. Sapphire, ruby and emerald palettes use different optical properties. Emerald and Asscher use octagonal stepped cuts; other cuts use brilliant-style facets. Metal uses Three.js physical materials and a PMREM of the same HDR environment used by gemstones. Small accent stones use cheaper physical materials. This is a real-time concept renderer, not spectral path tracing, gemological simulation or manufacturing CAD. Actual cut scans would be needed for a production gemstone digital twin.

Idle scenes render on demand. Offscreen/hidden scenes pause rendering, pixel ratio is capped at 1.75, and sustained slow rendering drops it to 1. Auto rotation is opt-in. Keyboard arrows rotate; +/- zoom. WebGL loss displays a recovery UI while design controls and JSON export remain available. Browser/device performance varies; 60 FPS is a target, not a cross-device guarantee.

## Quote handoff

The current PNG and complete specifications populate the existing authenticated upload form. The draft survives reload in session storage where available; memory is the fallback. Submission uses the existing `/api/requests` endpoint and existing consent, authentication and review workflow. The draft is removed after successful submission. Payment is not initiated by the designer, and no invented live price is displayed.

## Validation

Unit tests cover adversarial configuration values, Unicode/share round-trips, compatibility constraints, all 40 style/side-layout combinations, and finite, outward-facing convex geometry for all nine cuts within the shader plane budget. Browser checks cover desktop/mobile layouts, independent side stones, saved-design library, quote handoff and live 3D rendering. Live payments, real certificate inventory and manufacturing validation are outside this local preview.
