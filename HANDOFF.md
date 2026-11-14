# Liquid Light · Nodes Lab — professional handoff

Prepared for Rafa on **14 November 2026**. This is the starting point for a developer, designer, or AI assistant taking over the project.

## What this project is

A working browser-based procedural graphics editor for vector geometry, reusable scalar patterns, colour, optical materials and fluid animation. It is a React/Vite application with a typed node graph, Canvas/WebGL rendering, a CPU fallback, frame/animation export, and optional authenticated cloud persistence. It is separate from the earlier **Liquid Light Studio** application. This repository contains Nodes Lab; the older application's source is not part of this handoff.

The defining requirement is that **a generator describes a reusable value, and each consumer decides where to sample it**. The same Noise can distort a contour, vary glow, and distribute palette colours. The design draws on Cavalry and Houdini concepts; it does not contain their software or reproduce their complete engines.

## First hour

1. Read this file and [the product decisions](docs/handoff/01-product-and-decisions.md).
2. Install a Node version satisfying Vite's requirement: Node 20.19+ or Node 22.12+; this snapshot was verified with Node 24.22.1. Install Git and npm.
3. From the repository root run `npm ci`, then `npm test`, then `npm run build`.
4. Run `npm run dev` and open the exact local address printed by Vite. The editor works locally; hosted cloud sign-in/storage are not configured in this development server.
5. Import `examples/shared-noise.llnodes.json`. Change the Noise seed and confirm geometry, glow and colour respond together.
6. Read [architecture](docs/handoff/02-architecture.md), [graph contracts](docs/handoff/03-graph-and-procedural-engine.md), and [known limits](docs/handoff/08-quality-limitations-and-roadmap.md) before changing the engine.

## Read by responsibility

| Reader/task | Read next |
| --- | --- |
| Product owner, art director | [Intent and decisions](docs/handoff/01-product-and-decisions.md), [quality and roadmap](docs/handoff/08-quality-limitations-and-roadmap.md) |
| Frontend engineer | [UI and editing](docs/handoff/05-ui-and-editing.md), [architecture](docs/handoff/02-architecture.md) |
| Graphics/technical artist | [Procedural engine](docs/handoff/03-graph-and-procedural-engine.md), [rendering and Fluid](docs/handoff/04-rendering-and-fluid.md), [node reference](docs/reference/nodes.md) |
| Backend/hosting engineer | [Storage and API](docs/handoff/06-storage-security-and-api.md), [migration](docs/handoff/07-running-deploying-and-migrating.md) |
| Another AI provider | [Provider-neutral continuation brief](docs/handoff/09-working-with-another-ai.md), then relevant source and tests |
| Backup/restore operator | [Backup and restore](docs/handoff/10-backup-and-restore.md) |

## Snapshot boundaries

- Application source baseline: `6d49470fb85939cffeecbb543a0f6202e15a293d` (the published interaction/material-preview update). The handoff adds documentation, reference examples and packaging utilities. The archive's `manifest.json` records its exact source commit.
- Hosted project: `appgprj_6af79216490c8191a11a3d617342e4c5`; [live application](https://liquid-light-nodes-lab.orafacezar.chatgpt.site/). Existing visitor access is owner-only. Moving source to another repository does not move or change this hosting/access configuration.
- Source has a lockfile and available Git history. A Git bundle in the handoff preserves the history reachable at packaging time without copying repository credentials/configuration.
- Production persistence uses **R2**, binding `BUCKET`. D1 is not used. The hosted identity boundary supplies `oai-authenticated-user-id`; it must be replaced by verified server-side identity when leaving that environment.
- The portable archive separates `source/`, `data/`, `build/` and `history/`. Read `data/INVENTORY.md` for exactly which studies were captured. Personal study backups are not committed into the source repository.
- The open editor and cloud state differed during backup. Both are retained as separate records. Neither is silently declared the winner, and the backup did not replace the editor's graph or cloud revision.
- No hosting tokens, account sessions, API keys, browser profiles or `node_modules` are included. Dependency source is reacquired with `npm ci`; third-party licence texts and the lockfile are included.
- This is a point-in-time handoff, not automatic ongoing backup. Files on another device that were never synced/exported are outside this snapshot.

## GitHub recommendation

Use a **private repository owned by Rafa** as the canonical source, with readable commits, issues and tagged releases. Put the Markdown documents beside the code. Keep personal/cloud data backups in private backup storage or private release attachments, not ordinary source commits. A second AI can clone/read the repository or receive this ZIP; it does not need this conversation to understand the architecture.

The Site's existing Git repository is not evidence of a GitHub repository in Rafa's account. This handoff prepares the material for GitHub; it does not create a new account/repository or change the live deployment. Instructions for importing the bundled history are in [backup and restore](docs/handoff/10-backup-and-restore.md).

## Ownership and verification

No open-source licence for the project's own code has been selected. Handoff does not grant a new public licence. Preserve the third-party notices and confirm rights for any user-imported art before redistribution. See [licensing and assets](docs/handoff/licensing-and-assets.md).

The release checks recorded in `verification/` distinguish tests actually rerun for this archive from earlier browser observations. A successful build/test run does not guarantee identical pixels or real-time performance on every GPU/browser. Cloud migration and GPU/CPU visual parity need explicit acceptance testing.
