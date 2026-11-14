# Liquid Light · Nodes Lab

A procedural vector, field and light editor. This Site is independent of the original Liquid Light Studio.

**Taking over or moving the project? Start with [HANDOFF.md](HANDOFF.md).** It links the architecture, complete generated node/parameter reference, storage/API contracts, deployment/migration guide, known limitations, provider-neutral AI brief and backup/restore instructions. Native sample graphs are in `examples/`. The package utility creates a portable source/history/data handoff without repository credentials.

## Run and verify

- `npm run dev` — Vite editor. Cloud APIs require the published Site’s authenticated identity; preview keeps local copies.
- `npm test` — graph, primitives, groups, fields, fluid determinism, workspace and cloud authorization/revision tests.
- `node scripts/verify-shaders.mjs` — compile/link every GLSL ES 3 shader using a local EGL implementation, when available.
- `npm run build` — build the client and a self-contained Worker at `dist/server/index.js`.

## Shapes

Sources contains one **Shapes** primitive. The Shape selector chooses Circle, Rectangle, Polygon or Star. Every mode emits the same path data type, so changing modes retains connections and downstream modifiers. Inactive parameters and their wires are retained and restored when that mode returns. Older Circle/Rectangle/Triangle documents migrate without changing node IDs or wire targets.

| Mode | Main controls |
| --- | --- |
| Circle | Radius, ellipse height ratio; advanced start/end angle and open/chord/pie closure |
| Rectangle | Width, height, global or individual corner radii |
| Polygon | Radius, number of points (3 = triangle, 6 = hexagon), corner roundness |
| Star | Number of points, inner/outer diameters, independent inner/outer roundness |
| Common | Position, rotation, fill/outline, stroke width, curve detail/edge divisions, reversed path direction |

The advanced **Sample radius per point** option samples connected radius/diameter values at each contour point. Noise can vary the star’s outer vertices or a circle’s radius while the source stays procedural. Values otherwise sample per copy, with an upstream source evaluated in each Copy instance’s context. Use Remap when a 0–1 field or Noise needs a range in pixels.

The architecture follows Cavalry’s Basic Shape pattern: one primitive selector with typed controls, a common shape output, subdivisions for downstream deformation, and an explicit conversion to editable paths. See the official [Basic Shape](https://cavalry.studio/docs/nodes/shapes/basic-shape/), [Polygon](https://cavalry.studio/docs/nodes/shapes/basic-shape/polygon/) and [Star](https://cavalry.studio/docs/nodes/shapes/basic-shape/star/) documentation. The precise parameter names and additional rounding controls here are our implementation choices.

## Procedural values and groups

Noise, Random, Math, Remap, Time and LFO are serializable expressions. Consumers sample them with position, path position, copy identity/index and composition time. Numeric sockets accept compatible values or field weights; the same generator can feed geometry, colour and light/material attributes. Disconnecting restores the manual value. Copy pulls context-dependent upstream nodes separately for each instance.

Box Field and Shape Field add rotated rectangular and arbitrary-geometry masks. Shape Field uses fill or distance from the contour. Gradient accepts a spatial mapping and offset. Material/effect numeric controls use the same scalar bindings.

**Group…** packages a chosen output and selected nodes. Incoming connections become typed group inputs; selected unconnected numeric attributes become exposed controls. Double-click a group or choose **Open group graph** to edit inside it; use the breadcrumb to return. **Save reusable group** adds an independent reusable asset to Add Node. Groups and their exposed controls round-trip in JSON and cloud workspaces. Group nesting is limited to six levels; each graph is limited to 60 nodes/160 edges, and evaluated geometry to 128 paths.

## Canvas and graphics

Press **A** for shape bounding boxes, move/scale/rotation handles and field guides. Canvas moves, rotations and scales update the selected node’s own Transform controls. Gestures never create or rewire nodes, including after reselecting the source. Shapes, SVG and editable paths reuse their native position/rotation/scale; modifiers keep an output transform separately from controls such as Copy spacing. Each gesture is a single undo step. Driven transform values must be disconnected before manually dragging the affected handle.

**Import SVG or image** accepts SVG/PNG/JPEG/WebP up to 5 MB. Raster assets are decoded and re-encoded to bounded embedded WebP. SVGs are sanitized and sampled into paths; external resources, scripts and live SVG animation are not executed. Outline text before import. Compound fill rules are retained. Converting geometry to an editable path simplifies redundant samples, provides anchor/handle editing, add/delete, smooth/corner and open/close operations. Conversion is explicit and undoable.

## Light, glass and fluid

Optical can use the fast Canvas appearance renderer or the SDF renderer. A Glass Material or advanced effect selects the latter automatically. Glass offers thickness, IOR, roughness, transparency, refraction, reflection and dispersion. It refracts the actual Background image input or accumulated image behind it. This is screen-space glass, not a volumetric ray tracer.

Silhouette Spread, Tip Emission, Contour Colour Pulse and Venetian Ribs form a typed, reusable effect stack. Tips use open-path endpoints/tangents. Ribs support straight/outward directions, animation and per-rib time displacement. Contour and rib effects can receive independent Time signals. The atlas renderer samples scalar drivers spatially, with copy/path context from nearby geometry.

Fluid uses velocity/dye advection, vorticity forces, viscosity, divergence, Jacobi pressure projection, dye diffusion, source collision and decay. It advances in fixed 1/60-second steps. Seeking backwards or editing simulation inputs resets and replays from zero; the UI shows cache progress. Display-only palette and material edits do not need a replay. WebGL 2 uses floating-point buffers; when unavailable, a deterministic CPU solver and SDF material renderer remain available. The CPU fallback uses reduced preview/simulation detail and may be slower or look different from GPU rendering.

## Export

Export the pinned root output as PNG, PNG-sequence ZIP (with optional RGBA alpha), MP4 through WebCodecs, or browser-recorded video where frame encoding is unavailable. The video filename identifies the actual format. A frozen document, private evaluator and private simulation session keep export separate from playback. Export warms Fluid from zero asynchronously, supports progress/cancellation, and releases graphics resources. ZIPs contain the graph/settings and frame-rate manifest. Encoded output is bounded to 256 MB.

Verification included an actual 960×540 H.264 MP4 at 24 fps with exactly 24 frames/1 second, and a ZIP with 24 distinct-time PNGs. All 17 shaders were compiled and linked with GLSL ES 3. Browser checks exercised CPU glass, fluid, shape mode changes, group editing, SVG conversion, canvas translation and undo. GPU visuals still depend on the device/driver.

## Saving and sync

Browser copies remain available offline. The published Worker uses the Site’s authenticated ChatGPT visitor ID, hashed into an owner-specific R2 prefix. Missing identity is rejected even if dispatch access was bypassed. Writes require same-origin requests. Session snapshots, current document, reusable groups and named workspaces sync across devices.

A workspace save must provide the previously read ETag (`If-Match`) or create-only (`If-None-Match: *`). A conflict retains local work and offers loading the cloud revision or saving a separate study. No background stale overwrite is allowed. No credentials are bundled in the client. The default workspace cannot be overwritten. Payloads are bounded to 12 MB and graphs/assets are validated server-side.

## Interaction and material preview update

Dropdowns share one dark, portal-based listbox with selected checkmarks, hover/focus states, typeahead and arrow/Home/End/Enter/Escape navigation. Shape choices include small geometry icons. Menus stay inside the viewport and above scrolling inspectors and dialogs.

Glass preview work is bounded independently from export dimensions: interactive GPU output is capped at 480px with 16 sweep samples; CPU output at 320px. Disabled Venetian and contour-orbit calculations are bypassed, local path/copy searches run only when a binding needs that context, and material-only edits retain the geometry SDF. GPU initialization, framebuffer, compile, draw and context-loss failures switch to CPU rather than repeatedly failing every animation frame. The CPU Shared Noise + Glass math harness improved from about 185–202ms to 41–51ms per frame; this is a local benchmark, not a device guarantee.

Regression coverage: 65 tests, including repeated native/modifier transforms without node creation, persistence, undo/redo, driver protection, and preview/export work bounds. Browser checks connected Glass to the animated Shared Noise graph and edited IOR/roughness, and exercised icon menus, keyboard selection and canvas transforms.
