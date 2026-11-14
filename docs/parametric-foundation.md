# Parametric values in Nodes Lab

> Historical implementation note. Statements below about features being outside "this change" describe the first parametric foundation, not the current application's complete feature set. Glass, Fluid, imported graphics, direct path editing and reusable groups were added later. For current scope and limits read [the handoff](../HANDOFF.md) and [quality guide](handoff/08-quality-limitations-and-roadmap.md).

This is the first working foundation for reusable procedural values, based on the documented connection and context concepts in Cavalry. It adapts those ideas to this app; it does not reproduce Cavalry's engine or claim universal compatibility between all node types.

## The design rule

A Noise node describes a pattern, rather than a specific visual effect. A consumer decides where and when to sample it and how to apply the resulting number. Geometry, image recipes, palettes and fields remain distinct data types. Fields can also supply their scalar 0–1 weight to value inputs.

The `Shared Noise` example uses one source for three purposes:

| Consumer | Application | Range |
| --- | --- | --- |
| Displace | Sample the contour, subtract Neutral value, multiply by Amount, move along its normals | Signed displacement in pixels |
| Optical | Remap the same pattern to Glow intensity, sampled along each rendered path | 0.05–1 |
| Gradient | Map the pattern through the three palette colours | 0–1 |

Changing the shared Noise seed changes all three. Disconnecting a consumer affects only that connection. Numeric controls retain their manual values and restore them on disconnection. A connected value replaces a number; use Math and Remap when adding to or multiplying a base value is intended.

## Context is part of evaluation

| Sample by | Meaning |
| --- | --- |
| Spatial | Sample the pattern at canvas X/Y; copies crossing the same position share the same spatial field |
| Along each path | Use normalised arc length and copy index; smooth Noise wraps around the path |
| Per copy | Use the instance index; nested copies propagate separate indices |
| Uniform | Give the whole consumer a single value at the current time |

Copy reevaluates context-dependent upstream geometry for each instance. This includes a Random value connected to a primitive's Radius before Copy. Uniform branches continue to reuse their cached geometry. The graph order remains meaningful: displacement before a transform is transformed with the shape; displacement after it samples the transformed points. Render values sample the resulting geometry, so a spatial colour field is anchored to the canvas. An explicit rest-coordinate workflow is not included yet.

The schema describes where each numeric parameter is sampled. Primitive parameters, transforms, trim and resampling can vary per copy. Displacement and outline width can vary along the contour. Optical intensity, glow size, opacity, rim and field stretch are sampled locally. Counts, field transforms and the renderer's colour-speed setting are uniform. Generator parameters inherit their consumer context. These distinctions are shown beneath connected controls.

## Building and editing

- Values contains Noise, Random, Math, Remap and Time. LFO remains under Motion and uses the same scalar system.
- The link beside any numeric control selects an existing compatible source or creates a Noise, Random or LFO with a useful initial range.
- `+ Parameter inputs` on a node exposes its numeric ports for direct wiring. Connected ports remain visible when the others are hidden.
- Noise and LFO have an optional Time input. With it disconnected, they use the composition clock. A Time node with Rate 0 freezes their evaluation. Math can offset or combine time with another value.
- A field plugged into Math supplies its weight. Multiply it with Noise to localise a pattern before sending it to several consumers.
- Use Resample before deformation when straight edges need more points. It interpolates the path; it does not invent curvature.
- Pin a generator to inspect its actual output. Spatial values show a grayscale field. Other domains show their sampled curve. The inspector uses the same sampler as geometry and rendering.

## Implementation and performance

Projects remain JSON definitions. Evaluation builds serializable scalar expressions, then compiles them into cached sampler functions held outside the project. Consumers provide position, arc length, index, instance, count and time. No expression uses `eval`, and Random uses a seed rather than frame-dependent `Math.random` calls.

The evaluator caches values by dependency identity and, where needed, instance context. Diagram position changes do not change geometry data. Animated dependencies invalidate their descendants; frozen procedural branches remain static. The animation clock still does not rerender the document or graph editor. The preview still uses a back buffer and cropped, reduced-resolution glow surfaces.

Local material modulation uses bounded colour/opacity textures applied through continuous vector paths. PNG export uses higher-resolution material textures. Spatial textures are shared across copies when their sampling context permits it. Variable stroke widths use a continuous ribbon rather than capped line segments. These are rendering approximations, not a new physical glass material system. Direct path editing, imported SVGs, vector-valued drivers, keyframes, attribute spreadsheets, reusable groups, Fluid and physical refraction remain outside this change. Existing version-1 graph files and workspaces are retained.

Bounds: 60 nodes, 160 imported connections, 128 copied paths, 4096 resampled points per path and 65536 total resampled points. Copy topology changes can change index-based random assignments. Spatial and index domains should not be mistaken for persistent object IDs.

## Research sources

Official documentation reviewed for this change:

- [Cavalry: Connections](https://cavalry.studio/docs/getting-started/key-concepts/connections/)
- [Cavalry: Context](https://cavalry.studio/docs/getting-started/key-concepts/context/)
- [Cavalry: Noise](https://cavalry.studio/docs/nodes/behaviours/noise/)
- [Cavalry: Random](https://cavalry.studio/docs/nodes/behaviours/random/)
- [Cavalry: Index Context](https://cavalry.studio/docs/nodes/utilities/index-context/)
- [Cavalry: Falloff](https://cavalry.studio/docs/nodes/utilities/falloff/)
- [Cavalry: Common Behaviour Attributes](https://cavalry.studio/docs/nodes/behaviours/common-attributes-behaviours/)
- [Cavalry: Colour Blend](https://cavalry.studio/docs/nodes/behaviours/color-blend/)
- [Cavalry: Behaviour Mixer](https://cavalry.studio/docs/nodes/behaviours/behaviour-mixer/)
- [Cavalry: Add Divisions](https://cavalry.studio/docs/nodes/behaviours/add-divisions/)
- [Cavalry: Deformer Module](https://cavalry.studio/docs/tech-info/scripting/deformer-module/)
- [Houdini: Geometry Attributes](https://www.sidefx.com/docs/houdini/model/attributes.html)
