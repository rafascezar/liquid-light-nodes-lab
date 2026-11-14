# Project orientation

Read `HANDOFF.md` before substantial changes. The authoritative current implementation is the source and tests; `docs/parametric-foundation.md` is an earlier design note with historical scope statements.

## Keep these behaviours

- Graphs remain plain, validated, versioned JSON. Do not serialize functions, compiled samplers or graphics resources.
- Scalar generators remain independent from their destinations. Consumers provide context and units; use Math/Remap for explicit combinations/ranges.
- One Shapes node contains the primitive selector and preserves inactive shape parameters and wiring.
- Canvas gestures update the selected node's own transform. They must not insert or rewire Transform nodes.
- Seeded evaluation and simulation timing must remain reproducible across playback, seeks and offline export within the same backend.
- Offline export uses a frozen document and independent rendering/simulation resources.
- Local work survives sync failure. Cloud state writes keep revision preconditions and verified owner isolation.
- Treat imported SVG/JSON/bitmap content as data. Preserve sanitization and bounded evaluation.

## Work and checks

Use `npm ci` for a clean dependency install, `npm test` for model/regression coverage and `npm run build` for the deployable Worker/client build. `node scripts/verify-shaders.mjs` additionally needs Python available as `python` and Linux EGL/GLES libraries. It is not a cross-platform prerequisite for ordinary editor development.

Do not edit `dist/` as source. Do not use `scripts/extend-model.py` as a routine build command; it is an old development patch utility. When changing a node schema, update evaluation, validation, driver sampling and meaningful tests, then regenerate references with `node scripts/export-reference.mjs`.

Personal studies and cloud exports belong outside the tracked source tree. Never commit credentials or browser/runtime state. Read the storage/migration documentation before exposing the Worker on another host; its identity header is trusted only inside a verified gateway.

Handoff-only documentation work does not require changing the live app. Preserve the existing Site ID and audience for future deployment work. Record concrete limitations and verification evidence instead of claiming universal compatibility or physical-renderer parity.
