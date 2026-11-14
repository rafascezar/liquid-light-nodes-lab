# Persistence, identity and API contract

## Storage inventory

| Location | Key/object | Data |
| --- | --- | --- |
| Browser localStorage | `liquid-light-nodes-workspace-v1` | Current graph |
| Browser localStorage | `liquid-light-nodes-sessions-v1` | Up to 18 local snapshots |
| Browser localStorage | `liquid-light-group-assets` | Reusable group assets |
| Browser localStorage | `liquid-light-panel-workspaces-v1` | Current and named panel layouts |
| Browser localStorage | `liquid-light-last-edit` | Local edit timestamp for initial cloud reconciliation |
| R2 `BUCKET` | `users/<sha256(authenticated-id)>/state.json` | Current graph, layouts, assets, playhead, saved timestamp |
| R2 `BUCKET` | `users/<sha256(authenticated-id)>/sessions/<uuid>.json` | Named graph snapshot, playhead and optional thumbnail |

No SQL database is used by this application. The hosting manifest has `d1: null`, `r2: "BUCKET"`. Artwork assets are embedded in graph/group JSON rather than stored as separate uploaded blobs. Renderer caches and fluid buffers are regenerated, not saved.

## Authentication boundary

All `/api/` requests require a platform-injected `oai-authenticated-user-id`. The Worker hashes it to isolate each owner's prefix; clients do not choose a bucket key or owner ID. Missing identity returns 401 even if the outer dispatch layer allowed access. Hashing an ID is a namespacing strategy, not authentication by itself.

The current gateway makes that header trustworthy. A directly exposed replacement host must verify its own session/JWT and derive identity server-side, or use a trusted gateway that removes any client-supplied identity header and injects only verified identity. Do not expose an endpoint that accepts arbitrary `oai-authenticated-user-id` from the internet. The handoff includes no reusable authenticated sessions or bypass tokens.

Writes additionally require the request Origin to match the request URL origin. This is one layer of same-origin protection; a new cookie/auth architecture must be assessed as a whole. Bucket absence returns 503 with local-work retention. API responses use JSON/no-store/nosniff headers. Static asset responses are cached separately by the Worker.

## HTTP routes

All paths below are relative to the application's origin and require authenticated identity.

| Method/path | Request | Response/behaviour |
| --- | --- | --- |
| GET `/api/account` | No body | `{authenticated:true,sync:true}` when storage/identity available |
| GET `/api/state` | No body | Clean stored state plus `revision`; ETag and X-Workspace-Revision headers; 404 if absent |
| PUT `/api/state` | State JSON plus If-Match previous ETag, or If-None-Match `*` for first creation | Conditional replace/create; returns saved timestamp and new revision |
| GET `/api/sessions` | No body | Up to 100 listed snapshot summaries sorted newest first |
| POST `/api/sessions` | `{name,graph,time,thumbnail?}` | Server generates UUID, validates and writes a create-only snapshot; 201 with stored snapshot/revision |
| GET `/api/sessions/<uuid>` | UUID in the exact accepted format | Full snapshot plus revision; 404 if absent |

State body is `{document,workspace,assets,time,saved}`. `document` passes `cleanGraph`; workspace passes `cleanWorkspaceState`; reusable group assets are independently cleaned and limited to 24. Snapshot body is `{id,name,saved,graph,time,thumbnail}`; server chooses ID/save time. A request body is capped at 12,000,000 bytes. Malformed JSON/graph gives 400; excess size 413; wrong write origin 403; missing state precondition 428; mismatched revision 412. The server does not expose delete/update-session routes.

Session listing currently stops at 100 R2 objects and does not expose a cursor. It should be upgraded for accounts beyond that range; do not call the response an unlimited full-bucket listing.

## Cloud hook state machine

The client probes account/state, loads the cloud revision when its timestamp is not older than the local edit stamp, lists studies, and marks itself ready. Subsequent document/layout/asset changes autosave after roughly 1800ms. State signatures omit playback time so the animation clock does not continuously save. The saved playhead is sampled during an actual state save.

Every state write uses the last known ETag. If another device writes first, 412 retains local edits and enters a conflict state. The user can load the cloud revision or save local work as a separate study. A read on focus can restore a newer cloud state only when local content still matches its synced signature; otherwise it reports a conflict. Network/auth errors retain local work and expose retry.

This is optimistic concurrency for one document, not collaborative editing, an operation log or a CRDT. Wall-clock timestamps guide the initial restore; ETags protect subsequent writes. Do not describe it as a complete merge algorithm.

## Porting data

Keep graph import as the lowest-dependency recovery route. Any exported `*.llnodes.json` can be loaded in a fresh local editor. To restore layouts/assets as well, adapt the wrapper state into the new backend, or use the local restore procedure in the backup guide.

R2 owner prefixes depend on the old identity ID. A new auth provider will produce different IDs. Copy objects into a prefix derived from the verified new user identity, or transform the documents into the new backend's schema after mapping accounts. Do not carry old ETags to the destination: read/create a new destination revision and honour its own conditional writes.

The data export accompanying this archive was read through the existing authenticated application and current-graph download. It captures the accessible cloud state, the three returned session records and the separate open editor graph. It is not a raw R2 administrative dump, and it does not include unsynced browser data on other devices.
