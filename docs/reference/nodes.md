# Generated node and parameter reference

Regenerate with `node scripts/export-reference.mjs` from the repository root. Source: REGISTRY plus nodeDefinition, including generic whole-output transforms. Group interfaces are dynamic; the built-in empty group shown here is only a default. Hidden legacy primitive kinds migrate on construction/import and are retained here for format archaeology. See [graph semantics](../handoff/03-graph-and-procedural-engine.md).

| Kind | Label | Category | Output | Visibility |
| --- | --- | --- | --- | --- |
| bitmap | Image | Sources | image | Library |
| circle | Circle | Sources | shape | Internal/legacy |
| path | Editable Path | Sources | shape | Library |
| rectangle | Rectangle | Sources | shape | Internal/legacy |
| shapes | Shapes | Sources | shape | Library |
| svg | SVG Graphic | Sources | shape | Library |
| triangle | Triangle | Sources | shape | Internal/legacy |
| copy | Copy | Shape | shape | Library |
| deform | Deform | Shape | shape | Library |
| displace | Displace | Shape | shape | Library |
| outline | Outline | Shape | shape | Library |
| resample | Resample | Shape | shape | Library |
| transform | Transform | Shape | shape | Library |
| trim | Trim Path | Shape | shape | Library |
| box | Box Field | Fields | field | Library |
| linear | Linear Field | Fields | field | Library |
| radial | Radial Field | Fields | field | Library |
| shapeField | Shape Field | Fields | field | Library |
| math | Math | Values | signal | Library |
| noise | Noise | Values | signal | Library |
| random | Random | Values | signal | Library |
| remap | Remap | Values | signal | Library |
| time | Time | Values | signal | Library |
| palette | Gradient | Colour | palette | Library |
| lfo | LFO | Motion | signal | Library |
| glass | Glass Material | Materials | material | Library |
| contourPulse | Contour Colour Pulse | Effects | effects | Library |
| spread | Silhouette Spread | Effects | effects | Library |
| tips | Tip Emission | Effects | effects | Library |
| venetian | Venetian Ribs | Effects | effects | Library |
| fluid | Fluid | Light | image | Library |
| optical | Optical | Light | image | Library |
| group | Node Group | Assets | shape | Library |
| inlet | Group Input | Assets | shape | Internal/legacy |
| mix | Mix | Output | image | Library |
| output | Output | Output | image | Library |

## Image (bitmap)

An imported PNG, JPEG or WebP image. Connect it to a renderer’s Background to see actual glass refraction.

Output: **image**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x | Position X | number | 960 | -1920…3840; step 1 | px | uniform | Always |
| y | Position Y | number | 540 | -1080…2160; step 1 | px | uniform | Always |
| width | Width | number | 1920 | 10…3840; step 1 | px | uniform | Always |
| opacity | Opacity | number | 1 | 0…1; step 0.01 | — | uniform | Always |

## Circle (circle)

A resolution-independent circular path.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| radius | Radius | number | 340 | 10…1000; step 1 | px | copy | Always |
| x | Centre X | number | 760 | -960…2880; step 1 | px | copy | Always |
| y | Centre Y | number | 540 | -540…1620; step 1 | px | copy | Always |

## Editable Path (path)

Editable vector anchors and Bézier handles. All downstream modifiers stay procedural.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x | Position X | number | 0 | -1920…1920; step 1 | px | uniform | Section: transform |
| y | Position Y | number | 0 | -1080…1080; step 1 | px | uniform | Section: transform |
| scale | Scale | number | 1 | 0.05…5; step 0.01 | — | uniform | Section: transform |
| rotation | Rotation | number | 0 | -360…360; step 1 | ° | uniform | Section: transform |

## Rectangle (rectangle)

A rounded rectangle, kept as an editable path.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| width | Width | number | 640 | 20…1800; step 1 | px | copy | Always |
| height | Height | number | 640 | 20…1800; step 1 | px | copy | Always |
| corner | Corner radius | number | 80 | 0…600; step 1 | px | copy | Always |
| x | Centre X | number | 960 | -960…2880; step 1 | px | copy | Always |
| y | Centre Y | number | 540 | -540…1620; step 1 | px | copy | Always |

## Shapes (shapes)

One procedural primitive source. Switch between Circle, Rectangle, Polygon and Star; each mode keeps its settings and uses the same downstream connections.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shape | Shape | select | circle | circle, rectangle, polygon, star | — | — | Always |
| radius | Radius | number | 340 | 1…1500; step 1 | px | copy | Shape: circle, polygon |
| ellipseRatio | Height ratio | number | 1 | 0.05…4; step 0.01 | × | copy | Shape: circle |
| width | Width | number | 640 | 1…3000; step 1 | px | copy | Shape: rectangle |
| height | Height | number | 640 | 1…3000; step 1 | px | copy | Shape: rectangle |
| corner | Corner radius | number | 80 | 0…1500; step 1 | px | copy | Shape: rectangle; Hide if individualCorners |
| individualCorners | Individual corners | boolean | false | — | — | — | Shape: rectangle |
| cornerTL | Top left radius | number | 80 | 0…1500; step 1 | px | copy | Shape: rectangle; Show if individualCorners |
| cornerTR | Top right radius | number | 80 | 0…1500; step 1 | px | copy | Shape: rectangle; Show if individualCorners |
| cornerBR | Bottom right radius | number | 80 | 0…1500; step 1 | px | copy | Shape: rectangle; Show if individualCorners |
| cornerBL | Bottom left radius | number | 80 | 0…1500; step 1 | px | copy | Shape: rectangle; Show if individualCorners |
| sides | Number of points | number | 6 | 3…64; step 1 | — | copy | Shape: polygon |
| roundness | Corner roundness | number | 0 | 0…1; step 0.01 | — | copy | Shape: polygon |
| starPoints | Number of points | number | 5 | 2…64; step 1 | — | copy | Shape: star |
| outerDiameter | Outer diameter | number | 680 | 2…3000; step 1 | px | copy | Shape: star |
| innerDiameter | Inner diameter | number | 320 | 0…3000; step 1 | px | copy | Shape: star |
| outerRoundness | Outer roundness | number | 0 | 0…1; step 0.01 | — | copy | Shape: star |
| innerRoundness | Inner roundness | number | 0 | 0…1; step 0.01 | — | copy | Shape: star |
| x | Position X | number | 960 | -1920…3840; step 1 | px | copy | Section: transform |
| y | Position Y | number | 540 | -1080…2160; step 1 | px | copy | Section: transform |
| rotation | Rotation | number | 0 | -720…720; step 1 | ° | copy | Section: transform |
| fillMode | Geometry | select | filled | filled, outline | — | — | Always |
| strokeWidth | Stroke width | number | 36 | 1…300; step 1 | px | copy | Show if outline |
| startAngle | Arc start | number | 0 | -720…720; step 1 | ° | copy | Shape: circle; Advanced |
| endAngle | Arc end | number | 360 | -720…720; step 1 | ° | copy | Shape: circle; Advanced |
| closure | Arc closure | select | open | open, chord, pie | — | — | Shape: circle; Advanced |
| divisions | Edge divisions | number | 8 | 1…32; step 1 | — | copy | Shape: rectangle, polygon, star; Advanced |
| detail | Curve detail | number | 256 | 16…1024; step 1 | — | copy | Shape: circle, rectangle; Advanced |
| individualRadii | Sample radius per point | boolean | false | — | — | — | Shape: circle, polygon, star; Advanced |
| reverse | Reverse path direction | boolean | false | — | — | — | Advanced |
| scale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |

## SVG Graphic (svg)

Imported, sanitised vector paths. Scale, transform, duplicate and modify them without rasterising the graph.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x | Position X | number | 0 | -1920…1920; step 1 | px | uniform | Section: transform |
| y | Position Y | number | 0 | -1080…1080; step 1 | px | uniform | Section: transform |
| scale | Scale | number | 1 | 0.05…5; step 0.01 | — | uniform | Section: transform |
| rotation | Rotation | number | 0 | -360…360; step 1 | ° | uniform | Section: transform |

## Triangle (triangle)

A parametric three-sided path.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| radius | Radius | number | 370 | 10…1000; step 1 | px | copy | Always |
| x | Centre X | number | 960 | -960…2880; step 1 | px | copy | Always |
| y | Centre Y | number | 540 | -540…1620; step 1 | px | copy | Always |

## Copy (copy)

Create actual path instances with independent spacing and scale.

Output: **shape**. Bypass passes through `shape`.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| count | Count | number | 6 | 1…12; step 1 | — | uniform | Always |
| scale | Scale step | number | 0.87 | 0.4…1.4; step 0.01 | × | copy | Always |
| x | Step X | number | 75 | -300…300; step 1 | px | copy | Always |
| y | Step Y | number | 12 | -300…300; step 1 | px | copy | Always |
| rotation | Rotation step | number | 0 | -90…90; step 1 | ° | copy | Always |
| fade | Opacity step | number | 0.91 | 0.2…1; step 0.01 | — | copy | Always |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Deform (deform)

Move path points along their normals. Connect a Field to limit the effect.

Output: **shape**. Bypass passes through `shape`.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |
| mask | field | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| amount | Amount | number | 27 | 0…160; step 1 | px | point | Always |
| frequency | Frequency | number | 2.2 | 0.1…10; step 0.1 | — | point | Always |
| speed | Speed | number | 0.12 | -1…1; step 0.01 | Hz | point | Always |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Displace (displace)

Sample any connected value at each path point and displace it. Neutral value keeps the original contour; the optional field limits the effect.

Output: **shape**. Bypass passes through `shape`.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |
| value | signal | No |
| mask | field | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| amount | Amount | number | 90 | -300…300; step 1 | px | point | Always |
| midpoint | Neutral value | number | 0.5 | -2…2; step 0.01 | — | point | Always |
| direction | Direction | select | normal | normal, x, y | — | — | Always |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Outline (outline)

Turn a filled path into an outline. Geometry stays editable.

Output: **shape**. Bypass passes through `shape`.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| width | Stroke width | number | 48 | 1…240; step 1 | px | point | Always |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Resample (resample)

Add evenly spaced points before deformation, including along straight edges. Lower spacing gives finer detail at a higher evaluation cost.

Output: **shape**. Bypass passes through `shape`.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| spacing | Point spacing | number | 10 | 1…100; step 1 | px | copy | Always |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Transform (transform)

Translate, rotate and scale incoming paths.

Output: **shape**. Bypass passes through `shape`.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x | Position X | number | 0 | -1920…1920; step 1 | px | copy | Always |
| y | Position Y | number | 0 | -1080…1080; step 1 | px | copy | Always |
| scale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Always |
| rotation | Rotation | number | 0 | -360…360; step 1 | ° | copy | Always |

## Trim Path (trim)

Reveal a percentage of the path, with a movable starting point.

Output: **shape**. Bypass passes through `shape`.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| start | Start | number | 0 | 0…100; step 1 | % | copy | Always |
| end | End | number | 88 | 0…100; step 1 | % | copy | Always |
| offset | Offset | number | -20 | -720…720; step 1 | ° | copy | Always |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Box Field (box)

A rotated rectangular mask and outward normals. Its weight can drive any numeric attribute.

Output: **field**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x | Position X | number | 50 | -50…150; step 1 | % | uniform | Always |
| y | Position Y | number | 50 | -50…150; step 1 | % | uniform | Always |
| width | Width | number | 65 | 3…180; step 1 | % | uniform | Always |
| height | Height | number | 55 | 3…180; step 1 | % | uniform | Always |
| angle | Rotation | number | 0 | -180…180; step 1 | ° | uniform | Always |
| falloff | Falloff | number | 0.4 | 0…1; step 0.01 | — | uniform | Always |
| strength | Strength | number | 1 | 0…1; step 0.01 | — | uniform | Always |
| invert | Invert | boolean | false | — | — | — | Always |

## Linear Field (linear)

A directional gradient mask in canvas space.

Output: **field**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x | Position X | number | 50 | -50…150; step 1 | % | uniform | Always |
| y | Position Y | number | 50 | -50…150; step 1 | % | uniform | Always |
| radius | Ramp width | number | 65 | 3…150; step 1 | % | uniform | Always |
| angle | Direction | number | -25 | -180…180; step 1 | ° | uniform | Always |
| falloff | Softness | number | 0.7 | 0…1; step 0.01 | — | uniform | Always |
| strength | Strength | number | 1 | 0…1; step 0.01 | — | uniform | Always |
| invert | Invert | boolean | false | — | — | — | Always |

## Radial Field (radial)

A spatial mask and direction. Only connected nodes use this field.

Output: **field**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x | Position X | number | 57 | -50…150; step 1 | % | uniform | Always |
| y | Position Y | number | 48 | -50…150; step 1 | % | uniform | Always |
| radius | Radius | number | 52 | 3…140; step 1 | % | uniform | Always |
| squash | Height ratio | number | 0.82 | 0.2…2; step 0.01 | × | uniform | Always |
| falloff | Falloff | number | 0.65 | 0…1; step 0.01 | — | uniform | Always |
| core | Centre softness | number | 0.25 | 0…1; step 0.01 | — | uniform | Always |
| strength | Strength | number | 1 | 0…1; step 0.01 | — | uniform | Always |
| invert | Invert | boolean | false | — | — | — | Always |

## Shape Field (shapeField)

Use any incoming path as a custom field. Filled area or distance from its contour supplies the mask.

Output: **field**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mode | Distance from | select | fill | fill, edge | — | — | Always |
| reach | Falloff distance | number | 160 | 1…1000; step 1 | px | uniform | Always |
| strength | Strength | number | 1 | 0…1; step 0.01 | — | uniform | Always |
| invert | Invert | boolean | false | — | — | — | Always |

## Math (math)

Combine reusable values or field weights. Multiply Noise by a field to localise its influence.

Output: **signal**. Bypass passes through `a`.

| Input ID | Type | Required |
| --- | --- | --- |
| a | signal | No |
| b | signal | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| operation | Operation | select | multiply | multiply, add, subtract, divide, min, max, power | — | — | Always |
| a | A fallback | number | 1 | -2000…2000; step 0.01 | — | context | Always |
| b | B fallback | number | 1 | -2000…2000; step 0.01 | — | context | Always |

## Noise (noise)

One reusable, seeded smooth pattern. Sample it in space, along a path, per copy or uniformly. Connect Time to retime it independently.

Output: **signal**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| time | signal | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| domain | Sample by | select | spatial | spatial, path, copy, uniform | — | — | Always |
| frequency | Frequency | number | 1.8 | 0.05…24; step 0.05 | — | context | Always |
| speed | Evolution speed | number | 0.15 | 0…2; step 0.01 | — | context | Always |
| seed | Seed | number | 17 | 0…9999; step 1 | — | context | Always |
| octaves | Detail octaves | number | 2 | 1…4; step 1 | — | context | Always |
| min | Minimum | number | 0 | -2000…2000; step 0.01 | — | context | Always |
| max | Maximum | number | 1 | -2000…2000; step 0.01 | — | context | Always |
| x | Pattern X | number | 0 | -1920…1920; step 1 | px | context | Always |
| y | Pattern Y | number | 0 | -1080…1080; step 1 | px | context | Always |

## Random (random)

Stable seeded values for each copy, path sample or spatial cell. Scrubbing and export do not reshuffle the result.

Output: **signal**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| domain | Sample by | select | copy | copy, path, spatial, uniform | — | — | Always |
| seed | Seed | number | 31 | 0…9999; step 1 | — | context | Always |
| min | Minimum | number | 0 | -2000…2000; step 0.01 | — | context | Always |
| max | Maximum | number | 1 | -2000…2000; step 0.01 | — | context | Always |

## Remap (remap)

Give a shared pattern a destination-specific range. The upstream Noise and every other connection stay independent.

Output: **signal**. Bypass passes through `value`.

| Input ID | Type | Required |
| --- | --- | --- |
| value | signal | Yes |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| inMin | Input minimum | number | 0 | -2000…2000; step 0.01 | — | context | Always |
| inMax | Input maximum | number | 1 | -2000…2000; step 0.01 | — | context | Always |
| outMin | Output minimum | number | 0 | -2000…2000; step 0.01 | — | context | Always |
| outMax | Output maximum | number | 1 | -2000…2000; step 0.01 | — | context | Always |
| clamp | Clamp input | boolean | true | — | — | — | Always |
| smooth | Smooth transition | boolean | false | — | — | — | Always |

## Time (time)

The same deterministic time used by playback, scrubbing and export. Drive evolution or a numeric parameter through Math and Remap.

Output: **signal**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| speed | Rate | number | 1 | -10…10; step 0.01 | — | context | Always |
| offset | Offset | number | 0 | -100…100; step 0.01 | s | context | Always |

## Gradient (palette)

Map a shared value into colours. With no Value connected, use the regular image gradient.

Output: **palette**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| value | signal | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a | Shadow | color | #071678 | — | — | — | Always |
| b | Midtone | color | #147aff | — | — | — | Always |
| c | Highlight | color | #cbf8ff | — | — | — | Always |
| offset | Offset | number | 0 | -1…1; step 0.01 | — | point | Always |

## LFO (lfo)

Drive numeric attributes with a repeating value. An optional Time input retimes this signal independently.

Output: **signal**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| time | signal | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| wave | Waveform | select | sine | sine, triangle, pulse | — | — | Always |
| frequency | Frequency | number | 0.2 | 0…3; step 0.01 | Hz | context | Always |
| amplitude | Amplitude | number | 35 | 0…10000; step 1 | — | context | Always |
| offset | Centre value | number | 0 | -10000…10000; step 1 | — | context | Always |
| phase | Phase | number | 0 | 0…360; step 1 | ° | context | Always |

## Glass Material (glass)

A refractive screen-space material. Thickness, IOR, roughness, transmission and reflection accept shared procedural values.

Output: **material**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| mask | field | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| thickness | Thickness | number | 54 | 1…300; step 1 | px | point | Always |
| ior | IOR | number | 1.5 | 1…2.5; step 0.01 | — | point | Always |
| roughness | Roughness | number | 0.08 | 0…1; step 0.01 | — | point | Always |
| transmission | Transparency | number | 0.88 | 0…1; step 0.01 | — | point | Always |
| refraction | Refraction | number | 0.8 | 0…2; step 0.01 | — | point | Always |
| reflection | Reflections | number | 0.25 | 0…1; step 0.01 | — | point | Always |
| dispersion | Dispersion | number | 0.08 | 0…1; step 0.01 | — | point | Always |

## Contour Colour Pulse (contourPulse)

A colour and opacity wave travels outward from the contour, with a smooth attack and release.

Output: **effects**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| effects | effects | No |
| mask | field | No |
| time | signal | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| frequency | Frequency | number | 0.2 | -3…3; step 0.01 | Hz | point | Always |
| amount | Colour amount | number | 0.35 | -1…1; step 0.01 | — | point | Always |
| reach | Outward reach | number | 0.55 | 0.01…2; step 0.01 | — | point | Always |
| width | Pulse width | number | 0.35 | 0.02…1; step 0.01 | — | point | Always |
| sharpness | Sharpness | number | 2 | 0.25…8; step 0.05 | — | point | Always |
| phase | Phase | number | 0 | 0…360; step 1 | ° | point | Always |

## Silhouette Spread (spread)

Light travels from the silhouette along its normals. Plug this reusable effect stack into Optical or Fluid.

Output: **effects**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| effects | effects | No |
| mask | field | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| reach | Outward reach | number | 0.45 | 0.005…2; step 0.005 | — | point | Always |
| inside | Inside light | number | 0.2 | 0…1; step 0.01 | — | point | Always |
| outside | Outside light | number | 0.7 | 0…2; step 0.01 | — | point | Always |
| falloff | Falloff | number | 1.8 | 0.2…6; step 0.05 | — | point | Always |
| stretch | Contour stretch | number | 0.2 | 0…2; step 0.01 | — | point | Always |
| softness | Softness | number | 0.55 | 0…1; step 0.01 | — | point | Always |

## Tip Emission (tips)

Emit directional light from actual open-path endpoints and tangents. Trim Path preserves the endpoints used here.

Output: **effects**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| effects | effects | No |
| mask | field | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mode | Emit from | select | both | start, end, both | — | — | Always |
| length | Beam length | number | 300 | 10…1200; step 1 | px | point | Always |
| width | Beam width | number | 45 | 2…300; step 1 | px | point | Always |
| strength | Intensity | number | 1.6 | 0…5; step 0.05 | — | point | Always |
| softness | Softness | number | 0.5 | 0.05…1; step 0.01 | — | point | Always |

## Venetian Ribs (venetian)

Refractive ribs warp the silhouette and light. Neighbouring ribs can sample different times, in straight or outward-normal directions.

Output: **effects**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| effects | effects | No |
| mask | field | No |
| time | signal | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| direction | Rib direction | select | straight | straight, outward | — | — | Always |
| amount | Amount | number | 0.45 | 0…1; step 0.01 | — | point | Always |
| slats | Ribs | number | 36 | 2…180; step 1 | — | point | Always |
| angle | Angle | number | 0 | -180…180; step 1 | ° | point | Always |
| depth | Depth | number | 0.45 | 0…1; step 0.01 | — | point | Always |
| softness | Softness | number | 0.55 | 0…1; step 0.01 | — | point | Always |
| speed | Motion speed | number | 0.08 | -2…2; step 0.01 | — | point | Always |
| offset | Offset | number | 0 | -3…3; step 0.01 | — | point | Always |
| timeDisplacement | Time displacement | number | 0.08 | -2…2; step 0.01 | s | point | Always |

## Fluid (fluid)

An advected 2D fluid with pressure projection, viscosity, vorticity and dye transport. Seeking rebuilds a deterministic cache from time zero.

Output: **image**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |
| palette | palette | No |
| field | field | No |
| effects | effects | No |
| background | image | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| flowSpeed | Flow speed | number | 0.13 | 0…1; step 0.01 | — | uniform | Always |
| turbulence | Turbulence | number | 0.24 | 0…2; step 0.01 | — | uniform | Always |
| eddySize | Eddy size | number | 0.54 | 0.05…2; step 0.01 | — | uniform | Always |
| evolution | Evolution | number | 0.48 | 0…2; step 0.01 | — | uniform | Always |
| swirl | Vorticity | number | 0.55 | 0…2; step 0.01 | — | uniform | Always |
| viscosity | Viscosity | number | 0.32 | 0…1; step 0.01 | — | uniform | Always |
| momentum | Momentum | number | 0.78 | 0…1; step 0.01 | — | uniform | Always |
| diffusion | Colour diffusion | number | 0.12 | 0…1; step 0.01 | — | uniform | Always |
| lifetime | Trail lifetime | number | 5.5 | 0.2…20; step 0.1 | s | uniform | Always |
| emission | Emission | number | 2.1 | 0…8; step 0.05 | — | uniform | Always |
| emissionWidth | Emission width | number | 0.009 | 0.002…0.1; step 0.001 | — | uniform | Always |
| glow | Glow | number | 1.25 | 0…3; step 0.01 | — | uniform | Always |
| glowRadius | Glow softness | number | 0.35 | 0…1; step 0.01 | — | uniform | Always |
| exposure | Exposure | number | 1.05 | 0.1…3; step 0.01 | — | uniform | Always |
| resolution | Simulation detail | select | 256 | 128, 192, 256, 384, 512 | — | — | Always |
| direction | Direction | select | outward | outward, upward, orbit, drift | — | — | Always |
| collision | Source collision | boolean | true | — | — | — | Always |
| seed | Seed | number | 17 | 0…9999; step 1 | — | uniform | Always |
| background | Background | color | #070b22 | — | — | — | Always |

## Optical (optical)

Render editable paths as light, with optional material, background and procedural effect inputs.

Output: **image**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| shape | shape | Yes |
| palette | palette | No |
| field | field | No |
| material | material | No |
| effects | effects | No |
| background | image | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| glow | Light spread | number | 38 | 0…120; step 1 | px | point | Always |
| strength | Glow intensity | number | 0.6 | 0…1; step 0.01 | — | point | Always |
| body | Body opacity | number | 0.8 | 0.05…1; step 0.01 | — | point | Always |
| rim | Edge light | number | 0.85 | 0…1; step 0.01 | — | point | Always |
| stretch | Field stretch | number | 30 | 0…160; step 1 | px | point | Always |
| speed | Colour speed | number | 0.035 | -0.3…0.3; step 0.005 | Hz | uniform | Always |
| background | Background | color | #070b22 | — | — | — | Always |
| renderer | Renderer | select | canvas | canvas, gpu | — | — | Always |

## Node Group (group)

A reusable subgraph with typed external connections and exposed parameters. Open the group to edit its complete internal graph.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Group Input (inlet)

Receives a typed connection or exposed parameter from the containing group.

Output: **shape**. No passthrough bypass.

No fixed inputs.

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| canvasX | Translate X | number | 0 | -1920…1920; step 1 | px | copy | Section: transform |
| canvasY | Translate Y | number | 0 | -1080…1080; step 1 | px | copy | Section: transform |
| canvasScale | Scale | number | 1 | 0.1…4; step 0.01 | × | copy | Section: transform |
| canvasRotation | Rotate | number | 0 | -360…360; step 1 | ° | copy | Section: transform |

## Mix (mix)

Combine two rendered image branches. Shape data cannot connect here.

Output: **image**. Bypass passes through `a`.

| Input ID | Type | Required |
| --- | --- | --- |
| a | image | Yes |
| b | image | No |

| Key | Label | Type | Default | Range/options | Unit | Sample | Visibility/section |
| --- | --- | --- | --- | --- | --- | --- | --- |
| amount | Mix amount | number | 0.5 | 0…1; step 0.01 | — | uniform | Always |

## Output (output)

The final image. Pin it to keep seeing the result while editing upstream nodes.

Output: **image**. No passthrough bypass.

| Input ID | Type | Required |
| --- | --- | --- |
| image | image | Yes |

No fixed parameters.
