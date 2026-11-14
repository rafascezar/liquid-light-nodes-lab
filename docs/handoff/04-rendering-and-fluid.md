# Rendering, materials, Fluid and export

## Renderer selection

`renderArt` accepts evaluated values and paints a logical 1920×1080 composition into the provided context transform. Basic path appearance uses Canvas 2D. Glass, Fluid, advanced effects, explicit GPU renderer selection and compound even-odd fills route through `RenderSession`. Its preferred backend is WebGL 2; initialization/configuration or runtime graphics failure switches that session entry to the CPU backend.

The SDF bridge rasterizes actual evaluated paths, generates a signed-distance source and supplies material/effect parameters. Drivers are sampled in a bounded CPU-side atlas and uploaded as textures. This keeps scalar generation common to geometry and rendering without embedding the whole JavaScript expression evaluator into GLSL.

The current driver atlas is 32×18 per slot. The bridge searches nearby path samples only if a binding actually needs path/copy context. Spatial/uniform bindings avoid those geometry scans. A maximum of eight layer engines is retained per RenderSession, with pruning/disposal of inactive entries. This is an implementation budget, not a promise of eight simultaneous heavy layers at real-time speed.

## Optical and glass semantics

Optical accepts shape, palette, field, material, effects and image background inputs. Glass Material contains thickness, IOR, roughness, transmission, refraction amount, reflection and dispersion. Each numeric material property can use compatible scalar drivers; a field can limit the material's influence.

This is a stylized 2D material: normals/depth cues come from geometry distance and refraction samples an available background surface. It is not volumetric geometry, multi-bounce ray tracing, measured BRDF glass or a replacement for Redshift. To see recognizable refraction, provide a contrasting Image or rendered image branch to Optical's background. On a nearly flat background the same parameters can look much less dramatic.

Advanced effects are a serializable chain. Tip Emission operates on the start/end of **open** paths; closed circles/polygons do not have those endpoints. Silhouette Spread follows the distance field. Venetian Ribs supports straight/outward directions and time displacement. Contour Colour Pulse and Venetian Ribs accept independent time signals. Because the rendering paths are approximations, compare CPU and GPU before promising exact matching visual output.

## Glass stall fix and budgets

The material-preview update bounds interactive work separately from export:

| Work | Interactive budget |
| --- | --- |
| Material render output | GPU width at most 480px; CPU width at most 320px |
| Material-heavy viewport redraw | Capped at approximately 30 fps; edits remain eligible for immediate redraw |
| GPU optical sweep | 16 samples in preview |
| GPU optical refinement | Three preview iterations |
| Background preview surface | Width at most 480px |
| Disabled Venetian/contour orbit | Expensive work bypassed where disabled |
| Nearest-path context lookup | Only for actual path/copy consumers |

The exported raster dimensions are independent, with material rendering bounded up to 3840px width. A change to preview detail must not silently lower the selected export dimensions. CPU normal computations are restricted to relevant glass surface pixels, and reusable canvas dimensions/effect lookups avoid avoidable per-pixel overhead.

Renderer construction **and initial configuration** are inside recovery handling. Draw/compile/context-loss errors can also fall back. CPU mode is visible in the preview. The fallback prevents repeated GPU failure; it is not proof that every heavy graph will remain smooth. The recorded simple CPU math harness improved from roughly 185–202ms to 41–51ms per frame, but this is historical local evidence, not a general browser/GPU benchmark.

## Fluid lifecycle

The solver advects velocity and dye, adds turbulence/vorticity and emission, applies viscosity/diffusion, computes divergence and pressure projection, handles source collisions and decays dye. GPU buffers use floating-point capabilities where available; CPU has its own bounded solver/material renderer.

Simulation advances at fixed 1/60-second steps. A request for time t advances to floor(t×60) steps. Interactive warm-up has a finite step budget and reports progress; export prepares asynchronously before capture. Going backwards, changing relevant simulation/geometry dependencies or changing simulation resolution resets and replays from zero. The session can evaluate animated upstream geometry at simulation time rather than using only the final visible pose. Source rasterization itself is quantized/bounded for performance.

Display-only material/palette edits can retain simulation/SDF state when the simulation signature is unchanged. Do not indiscriminately include every inspector edit in the replay key. Conversely, a changed physical input that affects the solver must invalidate it. The tests include reproducible replay and separation of display-only edits.

CPU and GPU need not produce identical floating-point results. Deterministic time/seed handling is meaningful within the chosen backend; cross-device byte-identical animation has not been established. Simulation buffers are not included in graph/cloud files and rebuild after load.

## Offline output

`exportEngine` uses a structured clone of the root graph, an independent evaluator/session and a private canvas. It warms Fluid from zero to the selected start, captures fixed sample times and disposes resources on completion/cancel. Live playback must not affect those frames.

| Format | Characteristics and limits |
| --- | --- |
| Editable graph JSON | Native Nodes Lab graph plus playhead time; not a standalone rendered animation |
| PNG | One evaluated frame at selected width; optional alpha |
| PNG sequence ZIP | RGBA when selected, fixed frame sampling, project/settings manifest, FPS instructions |
| Frame-encoded MP4 | WebCodecs H.264 where supported, one submitted frame per timestamp, local MP4 muxer |
| Browser-recorder fallback | Actual MP4 or WebM according to runtime support; wall-clock/browser scheduling can affect duration/timing |

Supported animation rates are 24/30/60 fps, duration 1–30 seconds. Sequence limits are 480 frames through 1920px and 120 frames above that width. PNG sequence accumulated payload and WebCodecs encoded payload have 256MiB guards; the MediaRecorder path does not currently apply the same byte guard. Sequence ZIP uses stored PNG files rather than a general-purpose ZIP compression library. Video includes background and has no alpha/audio track; use PNG sequence for transparency.

The currently exposed resolution choices are implemented in the export UI. Consult those controls before increasing limits. Larger output can multiply CPU memory, texture and encoding work dramatically even when the preview is smooth.

## Verification strategy

Compile/link all 17 GLSL ES3 fragment programs with `node scripts/verify-shaders.mjs` on a system with Python/EGL/GLES. This detects shader compiler failures, not visual correctness. Manually compare Glass with an actual background, open-path Tip Emission, strongly driven fields and Fluid at a forward/backward seek. Test export separately and inspect frame count/FPS/alpha with a media tool. See [quality guide](08-quality-limitations-and-roadmap.md).
