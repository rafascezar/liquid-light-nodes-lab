# Quality, limitations and suggested next work

## Verification evidence

The handoff reruns the existing Node regression suite, the client/Worker build and all 17 shader compile/link checks. Raw logs are included under archive `verification/`. Recovery checks verify the Git bundle, unpacked file checksums and graph/example validation. Read the archive's verification summary for the exact results; do not mistake a historical README claim for a new test run.

The preceding interaction/material-preview release had **65 passing automated tests**. Browser observations for that release included changing shape modes/icons by mouse/keyboard, moving and rotating a source without adding nodes, actually wiring Glass to animated Optical, editing IOR/roughness while playback advanced, and closing an export dropdown with Escape while leaving its dialog open. Earlier work also exercised a one-second/24-frame MP4 and PNG sequence. These are documented prior observations, not a fresh cross-browser matrix for this handoff.

## Test map

| File | Focus |
| --- | --- |
| `tests/model.test.mjs` | Typed connections, evaluation, persistence and base graph behaviour |
| `tests/procedural.test.mjs` | Shared scalar expressions, sampling context and dependency behaviour |
| `tests/shapes.test.mjs` | Unified primitives, mode retention, geometry and migration |
| `tests/canvas-transforms.test.mjs` | Native/modifier transform reuse, no node insertion, persistence/history/driver protection |
| `tests/extensions.test.mjs` | Extended sources/materials/effects/groups and output behaviour |
| `tests/fluid.test.mjs` | Fixed-step/replay and simulation boundaries |
| `tests/cloud.test.mjs` | Identity isolation, cleaning, conditional writes and error handling |
| `tests/workspaces.test.mjs` | Layout cleaning, reserved Default and named workspaces |
| `tests/render-budget.test.mjs` | Context lookup selection and preview/export bounds |
| `scripts/verify-shaders.mjs` | Linux EGL compilation/link of all shader programs |

There is no broad automated end-to-end browser test suite, screenshot golden-image suite, cross-device codec suite or comprehensive visual CPU/GPU parity suite. Node tests do not validate the look of a rendered image. Add targeted tests when a new contract/failure justifies them.

## Current bounds

| Resource | Current limit/behaviour |
| --- | --- |
| Graph validation | 60 nodes and 160 edges per graph |
| Nested group validation | Up to six levels |
| Evaluated copied paths | 128 paths |
| Resampling | 4096 segments limit per path; total resampled point budget 65536 |
| Imported vector cleaning | 128 paths, 8192 points/path, 65536 total points |
| Composition | 1920×1080 logical coordinates; duration 1–30s |
| Graphic file input | 5,000,000 bytes; raster longest side at most 2048px after import |
| Embedded image validation | Data URI length at most 5,500,000 characters |
| Cloud body | 12,000,000 bytes |
| Reusable assets/named layouts | 24 each |
| Local snapshots | Most recent 18 |
| Cloud list | First 100 listed objects; pagination not exposed |
| Material preview | GPU 480px / CPU 320px maximum width |
| Tip atlas | Up to 32 endpoint beams |
| RenderSession layer cache | Up to eight retained engines |
| Export sequence | 480 frames at ≤1920px; 120 frames above |
| Payload memory guard | 256MiB for PNG-sequence and frame-encoded MP4 payloads; recorder path differs |

Check the source when changing a limit. Several limits protect different stages and should not be collapsed into one universal number. A valid graph near every maximum can still be expensive.

## Known limitations and risks

- Glass is an artistic 2D approximation. GPU/CPU results and exported versus low-resolution preview detail may differ. Connecting Glass was responsive in the observed release checks; performance on every device is not guaranteed.
- Smooth playback depends on graph complexity, simulation replay, browser load and hardware. Full document edits can invalidate expensive work. The CPU fallback trades detail/speed and needs more visual comparison coverage.
- Only scalar procedural values are first-class. No general vector/colour attribute graph, persistent rest coordinates or attribute spreadsheet exists. Palette hex pickers are not arbitrary animated colour sockets.
- There is no dedicated keyframe editor, curve editor, node plugin SDK, persistent copy identity system, general 3D mesh engine or distributed render service.
- SVG import is sanitized geometry conversion, not full browser SVG fidelity. Path conversion simplifies/bakes data; advanced filters/text/animation do not transfer automatically.
- Groups are copied assets rather than shared linked definitions. Cloud snapshots have no update/delete API. Session listing has no pagination beyond 100 entries.
- Cloud conflicts protect against stale overwrite but do not merge edits. Initial timestamp reconciliation can be sensitive to device clocks. Unsynced browser data is device-specific.
- Recorder fallback can have wall-clock timing differences and lacks the frame-encoder's byte guard. Codec support/colour/alpha must be verified in the user's browser and target editing software.
- This is a working prototype with compact source, a small schema validator and a handcrafted MP4 muxer. It has not received a formal security audit, production load test or accessibility audit.

## Suggested priorities for the next professional

These are engineering recommendations, not promised features or approved new scope.

1. **Reproducible recovery and releases.** Import into a private owner-controlled GitHub repository, run CI for test/build, tag reviewed versions, and keep a separate data backup routine. Restore to a second environment before relying on it.
2. **Rendering confidence.** Establish a small visual test matrix on the user's Intel Mac, a modern GPU, and the CPU fallback. Compare glass/refraction with a contrasting background and save timings for representative graphs. Add meaningful visual baselines before major shader refactoring.
3. **Storage portability.** Add an explicit all-data export/import UI, pagination and deliberate account mapping. Implement an auth/storage adapter boundary if independent hosting becomes the actual target.
4. **Engine maintainability.** Split the large orchestration/evaluator modules into tested boundaries without changing serialized semantics. Define versioned migrations before extending the document schema.
5. **Parametric expansion.** Decide whether vector/colour values, rest coordinates, keyframes or richer attribute inspection best serve the next creative use cases. Avoid adding more isolated one-off Noise controls.

## Fast diagnostic guide

| Symptom | First evidence to gather |
| --- | --- |
| Material appears frozen | Playback time, CPU badge, graph complexity, replay progress, console graphics errors; lower preview workload |
| Tip beams absent | Is the incoming path open? Does Trim produce endpoints? Are effects wired into Optical? |
| Scalar wire seems ineffective | Input/output types, consumer clamp/range, sampling domain, mask, bypass and preview pin |
| Source move creates a new node | Regressed gesture path: inspect App.beginTransform and shared transform helpers |
| Changing colour restarts Fluid | Simulation signature includes display-only changes or dependency invalidation is too broad |
| Cloud unsynced/conflict | Identity, bucket binding, same-origin request, exact last ETag and local unsaved state |
| Video duration/format unexpected | Frame encoder versus recorder fallback; inspect actual extension/container and frame count |
| Imported graph loses fields | Schema/migration cleaning; unknown properties are not preserved automatically |

The `perf` query flag enables local counters/timing. Record the selected backend, viewport/export size, graph, device and browser alongside timings; a single number without those conditions is not a useful performance guarantee.
