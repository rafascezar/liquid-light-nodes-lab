# Product intent and recorded decisions

## Creative purpose

Nodes Lab is a procedural motion-design instrument. The immediate visual language is luminous contours, blue glass, colour fields, refracted backgrounds, ribs and flowing dye. The user should be able to construct and understand the behaviour of a visual, reuse the same underlying pattern, and export editable structure as well as rendered animation. Presets demonstrate the system; they should not replace real geometry or hide independent controls.

The priority is **parametric foundations**. Adding a new effect should usually mean adding a consumer of geometry/values, rather than inventing a separate Noise implementation for that effect. Geometry, fields, materials and images still have different contracts. The goal is broad, predictable composition, not arbitrary wires that happen to produce output.

## Decisions from the working project

| Decision | Reason | Consequence for future work |
| --- | --- | --- |
| Shared scalar expressions | One Noise must influence deformation, glow and colour | Preserve consumer context, seeded values, clamping and explicit Remap ranges |
| Typed graph | A palette/image/material is not a list of points | Validate ports and cycles; expose intentional conversions such as field weight to scalar |
| One Shapes source | Circle/rectangle/polygon/star are modes of one reusable primitive | Preserve node ID, edges and inactive controls when switching modes |
| Polygon rather than a separate Triangle source | Three and six points are configurations of the same primitive | Legacy Triangle documents migrate to Shapes with three points |
| Shape-specific controls | Circle radius and star inner/outer diameter describe different constructions | Conditional inspector controls do not delete hidden values or connected ports |
| All canvas transforms on the selected node | Repeated manipulation should not clutter the graph | Native transforms for sources, separate whole-output transform parameters for modifiers |
| Explicit Transform remains available | Procedural graph order can intentionally require a transform between modifiers | Do not automatically merge old Transform nodes or change operation order |
| Geometry remains editable until explicit conversion | Users should tune the source and modifiers after building a look | Convert to Editable Path only through an explicit, undoable action; conversion bakes that output |
| Shared dark dropdowns and shape icons | Controls should feel consistent with the editor | Use Dropdown/ShapeSelector instead of platform-native option popups |
| GPU plus CPU fallback | WebGL support and drivers vary | Recover gracefully, show fallback state and keep preview work bounded |
| Fixed simulation steps and isolated export | Export/scrubbing must not depend on playback timing | Keep private export sessions and deterministic source sampling |
| Browser-local copy plus cloud | Local work must survive network failure; users need cross-device sessions | Never discard unsynced edits; require revision conditions for cloud state writes |
| Separate Nodes Lab application | Experiment without silently replacing the earlier Studio | Do not assume data formats or codebases are interchangeable |

## Present feature coverage

| Area requested | Current implementation | Important boundary |
| --- | --- | --- |
| Glass | Thickness, IOR, roughness, transmission, refraction, reflection, dispersion, optional mask and numeric drivers | Stylized 2D SDF/background refraction, not a 3D physically based path tracer |
| Fluid | Velocity/dye advection, vorticity, viscosity, pressure projection, diffusion, collisions, emission and decay | Bounded resolution; changes may require replay from zero |
| Advanced optics | Silhouette spread, open-path tip beams, contour colour pulses, Venetian ribs and per-rib time displacement | Approximation/driver support differs between CPU and GPU; inspect both |
| Canvas | Bounding boxes, move/rotate/uniform-scale handles; field guides; path anchor/handle edits | No general skew, arbitrary pivot tool or independent X/Y scale gizmo |
| Fields | Radial, linear, rotated Box and geometry-backed Shape Field; weight as numeric source | Scalar targeting is broad, but every property/type is not universally connectable |
| Assets | Sanitized SVG paths, embedded bitmaps, editable paths, nested groups and reusable group assets | Imported SVG text must be outlined; advanced SVG features are not a full SVG renderer |
| Export | PNG, PNG sequence ZIP with alpha, WebCodecs H.264 MP4 and browser-recorder fallback | Browser codec support varies; video includes background; no audio track |
| Cloud | Current document, layouts, reusable groups and saved-study snapshots | Auth/storage tied to current host; no collaborative CRDT editing or transactional account-wide export |

## Design and interaction direction

The app uses a restrained dark work surface, subdued borders, small line icons, typed port colours, compact inspector controls and a prominent canvas. The visual should carry the colour; the editor chrome should support it. Controls must remain understandable through labels, sampling hints and parameter units. Port colour alone is insufficient to communicate compatibility.

The desktop is a dockable workspace with Node Library, Canvas, Node Graph and Inspector. Panels may float or dock; named layouts preserve their state. Mobile has dedicated panel navigation and constrained layouts rather than shrinking the complete desktop into a tiny screen. Avoid exposing internal hosting implementation in ordinary creative flows.

## Open product choices

The project has not committed to a complete keyframe system, a Houdini-style attribute spreadsheet, a plugin marketplace, persistent object IDs or a 3D scene renderer. These are future product decisions. The current graph is scalar-first and a fixed 1920×1080 logical composition. Make changes incrementally with migration plans instead of presenting the prototype as a completed general-purpose DCC.

The user's request for portability is a new priority: keep code, decisions, schemas and sample graphs in standard files; use a private user-owned repository; make hosting-specific services replaceable and backups independently restorable.
