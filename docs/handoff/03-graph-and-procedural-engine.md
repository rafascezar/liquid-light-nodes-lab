# Graph format and procedural engine

## Document contract

Documents are ordinary JSON with `version: 1`, `name`, `duration` (seconds), `nodes`, `edges`, and `preview` (the pinned node ID). Export may additionally carry `frameTime`; it is an import/playhead convenience, not the simulation cache. The logical artwork coordinates are 1920×1080 regardless of viewport/export size.

Each node has `id`, React Flow `type: "effect"`, diagram `position: {x,y}`, and `data`. Node data contains `kind`, user `label`, `bypassed`, and `params`. Source/group nodes may also carry embedded paths/images or nested graph/interface data. Each edge stores `id`, `source`, `target`, `sourceHandle: "out"`, and a `targetHandle` that names either a regular port or `param:<key>`.

Prefer `newNode`, `connect` and `cleanGraph` over assembling arbitrary JSON. `cleanGraph` reconstructs trusted nodes from their schema, checks graph/group limits, sanitizes labels, clamps supported numeric values, accepts only listed enum choices, validates embedded assets, migrates legacy primitives and reconnects edges through the actual connection validator. Unknown custom properties are not a stable extension API.

## Types and connections

| Output type | Meaning | Typical consumers |
| --- | --- | --- |
| `shape` | Editable point paths with fill/stroke/instance metadata | Shape modifiers, fields, Optical, Fluid |
| `field` | Spatial weight plus directional information where relevant | Masks, field ports and scalar-compatible parameter inputs |
| `signal` | Serializable scalar expression | Numeric parameter inputs, Math/Remap, palette mapping, time inputs |
| `palette` | Colour stops and optional mapping/offset expressions | Optical or Fluid colour input |
| `material` | Glass parameters, optional bindings/mask | Optical material port |
| `effects` | Chain of optical effect descriptions | More effects, Optical or Fluid |
| `image` | Compositable render recipe/layers | Mix, background input, Output |

Connection rules reject cycles, unknown nodes/ports and incompatible types. There is one incoming value per target handle; connecting a replacement changes that port rather than blending two values automatically. A field may intentionally provide its scalar weight to a value input. A shape does not implicitly become an image, and a palette does not implicitly become a shape.

Numeric controls expose `param:<key>` sockets. Their schema is obtained from `nodeDefinition(node)`, not only raw `REGISTRY`: shape-producing modifiers receive generic canvas transform controls and groups have dynamic interfaces. The manual number stays in `params` while a value is connected. A wire replaces the sampled number; disconnecting restores it. Use Math to add/multiply a base value and Remap to convert a 0–1 pattern into pixel/intensity ranges. Enum, boolean and colour-picker controls are not all arbitrary scalar sockets.

## Sampling model

Generators construct expressions; consumers sample them. A context includes:

| Property | Meaning |
| --- | --- |
| `position` | Canvas position `[x,y]` |
| `u` | Normalized distance along the current path |
| `index`, `count` | Current instance/copy indexing |
| `instance` | Namespaced instance identity used for evaluation/cache separation |
| `time` | Composition time in seconds |

Noise offers spatial, along-path, per-copy and uniform domains. Along-path smooth Noise wraps around a circular domain; Random remains seeded and domain-specific. These indices are not persistent artist-assigned object IDs. Changing copy topology can change index-based assignments.

Schema `sample` describes how a consumer samples a parameter: uniform, per-copy, per-point, or inherited generator context. Counts/modes are intentionally uniform. Primitive dimensions normally sample per-copy. `Sample radius per point` explicitly samples circle/polygon radius or star diameters across the contour. Displace and variable outline width sample locally. Rendered material/light/palette parameters can sample spatially; the SDF bridge uses a bounded driver atlas rather than evaluating arbitrary JavaScript per shader fragment.

Root defaults are centre position `[960,540]`, index 0, count 1, `u: 0`, time 0 and empty instance. Consumers must supply meaningful context rather than relying on defaults for all purposes. Connected values are clamped to the consumer's numeric bounds. The sampler rejects non-finite results and bounds extreme scalar output. Math's zero-division and signed-power handling are defined in `signals.js`.

## Shared Noise recipe

Open `examples/shared-noise.llnodes.json`. Noise feeds Displace's value, a Remap feeding Optical's intensity, and Gradient's mapping input. Gradient feeds Optical's palette. The same seed evolves one pattern; each branch interprets its own range. A Radial Field masks displacement without changing the other uses. This is the key acceptance example for the architecture.

Graph order remains meaningful. Deformation before a transform is transformed with the result; deformation after it samples transformed points. Spatial colour is anchored in canvas space. There is no explicit rest-coordinate attribute workflow yet.

## Shapes and transforms

Shapes emits the same `shape` type in Circle, Rectangle, Polygon and Star modes. Hidden controls retain values and connected parameters. Circle supports ellipses and partial arcs; Rectangle supports global/individual corners; Polygon has 3–64 points and roundness; Star has inner/outer diameter, point count and independent roundness. Divisions/detail prepare geometry for downstream deformation. SVG/path geometry is converted into the same downstream path representation.

Canvas gestures use `canvasTransformState` and `updateCanvasTransform`. Shapes, path, SVG and explicit Transform reuse native x/y/scale/rotation. Other shape outputs add `canvasX`, `canvasY`, `canvasScale`, `canvasRotation`. The latter operate on the output and must not overwrite Copy's spacing/scale-step controls. Gestures never create/rewire nodes. A connected transform component is protected from manual dragging until disconnected. One gesture records one history change. Existing explicit Transform nodes stay in their intended order.

## Groups

`packGroup` turns selected nodes and an explicit output into a nested graph. External connections become typed inlets. Exposed numeric controls retain the referenced inner schema; group output type comes from the chosen inner output. Group evaluation resolves external inputs and namespaces internal instances. The root document, not only the currently opened subgroup view, is exported/saved.

Reusable group assets are independent snapshots, not linked components with automatic global updates. Instantiating one copies its data. Groups may nest to six levels; each graph validates its own bounds. Future linked assets need explicit identity/versioning semantics rather than silently changing this behaviour.

## Extending the engine

1. Define node/parameter schemas in the appropriate registry source and choose output/input types and sampling domains.
2. Implement evaluation to produce the appropriate serializable value; keep compiled closures and GPU objects outside the document.
3. Reuse the shared scalar binding and field sampler. Make units/ranges explicit.
4. If rendering is affected, update both renderer plumbing and supported CPU behaviour; document any deliberate fallback difference.
5. Add meaningful tests for the new contract, persistence, connection validation and context dependency. Avoid tests that merely restate a parameter constant.
6. Update sample graphs and regenerate the reference. For incompatible saved-data changes introduce a deliberate migration/version strategy.

See [node reference](../reference/nodes.md) and [machine-readable registry](../reference/nodes.json) for every current schema. Those files describe current built-in defaults, not every possible dynamically exposed group interface.
