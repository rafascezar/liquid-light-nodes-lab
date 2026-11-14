# UI, canvas and assets

## Main workspace

The four panel identities are `library`, `canvas`, `graph`, `inspector`. Layout state describes dock/float placement, visibility, active dock tabs, z-order, sizes and floating rectangles. `cleanWorkspace` clamps geometry and rejects invalid values. `cleanWorkspaceState` owns the current layout and up to 24 named layouts. Default is reserved and cannot be overwritten. The layout does not contain the graph itself.

Graph panning/zoom and node diagram positions should remain separate from logical canvas geometry. Selection affects the inspector; pinning preview keeps a chosen output visible while upstream nodes are edited. Export operates on the root document even while a group graph is open.

## Direct editing

Press A to show shape bounding boxes/handles and field guides. Drag the centre to move, the corner handle to scale uniformly, and rotation control to rotate. Gestures update parameters on the selected node, record one undo step and do not add Transform nodes. Shape/source origins are used for native transforms; modifier output transforms remain distinct from controls like Copy step offsets. Driven transform values cannot be overwritten by manual gestures.

Editable paths support anchors and Bézier in/out handles, add/delete points, smooth/corner conversion and open/close changes. `editablePaths` simplifies sampled geometry into a bounded editable representation. Converting a procedural source/modifier to a path bakes the currently evaluated output. It is explicit and undoable; later source-parameter edits no longer drive that converted result.

Keep field units explicit: some field inspector positions/radii are percentages converted to canvas coordinates, while source geometry is in logical pixels. Overlay changes should use schema ranges and shared update helpers instead of assuming all x/y parameters mean the same thing.

## Keyboard commands

| Shortcut | Action |
| --- | --- |
| A | Toggle canvas selection/handles |
| Space | Play/pause |
| B | Bypass the selected supported node |
| Tab with graph last active | Open Add Node |
| Delete/Backspace | Delete selected connection or node |
| Escape | Exit canvas select/pan mode or close active menu/dialog as appropriate |
| Ctrl/Cmd Z | Undo |
| Ctrl/Cmd Shift Z or Ctrl/Cmd Y | Redo |
| Ctrl/Cmd S | Open studies/save-snapshot dialog |
| Alt drag or middle drag | Pan canvas through the canvas controls |

Global handlers skip editable fields, dialogs, menus, comboboxes and listboxes. Do not let Space/letters used inside a dropdown start playback or issue graph commands.

## Dropdown component

`Dropdown.jsx` adapts existing option children into a dark trigger/listbox. Its portal avoids clipping in inspector scroll containers and modals; its placement clamps to viewport space, can open above/below, and constrains scrolling height. Selection has a checkmark and hover/focus states. Arrow keys, Home/End, Enter/Space, Escape, Tab and typeahead are supported. Disabled options stay unavailable.

`ShapeSelector.jsx` supplies Circle, Square, Hexagon and Star icons to the same component for current selection and menu items. The label remains visible; the icon supplements it. Escape should close the menu before its parent export/group dialog. Portal behaviour needs keyboard/focus testing whenever dialogs or scroll containment change.

## Import pipeline

`Import SVG or image` accepts SVG, PNG, JPEG and WebP files up to 5,000,000 bytes. Raster decoding uses a canvas to re-encode bounded embedded WebP at at most 2048px on its longest side. The embedded result travels with the graph; there is no external asset URL dependency.

SVG goes through DOM parsing/sanitization and conversion/sampling to paths. It does not execute scripts, external resources, event handlers or live SVG animation. Supported shapes/transforms/fill rules become internal geometry. Outline text before importing. Gradients, filters, masks, CSS behaviours and other advanced SVG features should not be assumed fully faithful. The precise supported feature set is `svgPaths` in `graphics.js`; test representative real graphics when expanding it.

Embedded vector data is cleaned for finite bounded points, permitted fill rule, opacity/stroke and handle shape. Groups package these assets by value. `cleanGraph` rejects invalid data on both import and cloud write.

## UI change checklist

Verify the canvas at a narrow width, the inspector at its min/max width, a floating panel and a scrolling modal. Exercise mouse and keyboard menu selection, a driven numeric field, undo/redo for one canvas gesture, group entry/exit, and import/export from the root. The current handoff adds documentation and backup tools; it does not introduce a UI redesign.
