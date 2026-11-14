# Run, deploy and migrate

## Reproduce the source

Use a modern Node version supported by the locked Vite release: `^20.19.0 || >=22.12.0`. The handoff checks use Node 24.22.1. Git is needed for history recovery; Python 3 is needed only for the optional package utility and Linux shader-verification helper.

```bash
npm ci
npm test
npm run build
npm run dev
```

Use the exact development URL printed by Vite. Do not open `index.html` by double-clicking it: development uses ES modules/JSX and build transforms. `npm ci` uses `package-lock.json`; don't replace it with a fresh dependency resolution while diagnosing an unrelated graphics bug.

The local Vite server intentionally does not impersonate the hosted user or provide a production bucket. `/api/` requests fail safely and local saving remains available. To test cloud logic locally, use the storage tests or configure a real local Worker/auth/storage development adapter. Putting a hosted token into client code is not a solution.

## Build output

`npm run build` invokes `scripts/build-worker.mjs`. It first builds the frontend to `dist/client/`, reads those assets into a generated entry, then bundles a standalone Worker ES module to `dist/server/index.js`. The generated `.build/` intermediate directory is removed. `dist/` is an output and remains ignored by Git.

| Output | Suitable use |
| --- | --- |
| `dist/client/` | Static editor hosting with browser-local documents/export |
| `dist/server/index.js` | Worker-compatible hosting with the cloud API and embedded frontend |
| `.openai/hosting.json` | Existing Site identity and R2 binding declaration; not a universal hosting configuration |

The handoff ZIP may include a `build/` copy for immediate inspection. Source plus the lockfile is the maintained product; rebuild rather than editing minified output. Browser codecs, WebGL support and storage limits still apply regardless of host.

## Stay on the current host

Retain the exact project ID and audience from `.openai/hosting.json`. Obtain short-lived repository access through the platform, sync the chosen source, build/package the matching commit, save the source version and deploy that version. Never commit access credentials, copy browser sessions or change visitor sharing just to publish. The platform's authenticated gateway and `BUCKET` binding are necessary for the current cloud API. Documentation-only work can be saved without deploying a new UI.

The source history and release manifest identify the previously published baseline. Keep a record of source commit, version, build checksum and deployment result when publishing a later release.

## Static migration: quickest independent route

1. Recover the source from the Git bundle or `source/` directory.
2. Run the install/check/build commands.
3. Serve `dist/client/` over HTTP(S) using a static host. The current asset paths assume the site is at the origin root; configure Vite `base` deliberately for a subdirectory deployment.
4. Import a supplied native graph and test editing/export. Cloud calls will fail/return unavailable and the editor will keep browser-local data.

This route removes the hosting dependency for editing/rendering but does not recreate cross-device cloud sessions. Modern browser APIs may require a secure origin; `localhost` is appropriate for local development.

## Full cloud migration

There are two separable adapters: authenticated identity and object persistence. Keep the UI graph schema while replacing either backend. Cloudflare Workers plus R2 is the smallest change because `server/documents.js` already uses the R2 binding interface. Other hosts can implement equivalent get/list/conditional-put behaviour or replace these routes with an authenticated service.

For a new Worker account, configure the built module as the main entry and bind an R2 bucket under `BUCKET`. A Wrangler configuration can name `dist/server/index.js` and an `r2_buckets` entry with binding `BUCKET`. Bucket names/account IDs must come from the new owner, not this archive. Local R2 emulation is available through the Cloudflare development tools. See the official links below for the current syntax.

Before exposing that Worker, implement verified session identity. A publicly supplied header is not a substitute for authentication. Map the old user's data into the new identity's namespace and initialize destination revisions from the new store. Keep conditional writes, same-origin protection, graph/asset validation and payload bounds. Set an appropriate CORS/session policy for the chosen architecture rather than opening cross-origin access indiscriminately.

Acceptance on the new host must include: two independently authenticated users cannot read/write each other's state; missing identity fails; stale writes fail without losing local edits; refresh/new device restores the correct graph; three archived snapshots import; images/groups/layouts survive; export works after changing host. Do this against a non-production destination first.

## What moves automatically and what needs work

| Item | Portable in this handoff | Extra work |
| --- | --- | --- |
| Geometry, scalar evaluation, UI | Source and examples | Install/build and normal browser QA |
| Optical/Fluid implementation | JS/GLSL and tests | Validate target device/driver performance and fallback |
| PNG/sequence/video export | Source and muxer | Check browser encoders and output timing |
| Native studies | Plain JSON, embedded graphics/groups | Import individually or adapt state wrapper |
| Panel workspaces | State schema and captured wrapper | Restore using the new backend/local procedure |
| Cloud storage | API source and captured user records | Provision storage and map identity/object paths |
| ChatGPT sign-in/gateway | Documented dependency | Replace with verified auth outside this environment |
| Site URL/access/deployment history | Provenance only | Hosting configuration and account access stay with the current provider |
| Conversation context | Relevant requirements/decisions summarized | No full private chat transcript is required |

## Official operational references

Checked for this handoff on 14 November 2026:

- [GitHub: adding locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub: creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [Git: bundle format and restore](https://git-scm.com/docs/git-bundle)
- [Cloudflare: R2 local development](https://developers.cloudflare.com/r2/local-development/)
- [Cloudflare: Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare: R2 Workers API](https://developers.cloudflare.com/r2/get-started/workers-api/)

These links document external tools; they are not additional proprietary runtime requirements for the local editor.
