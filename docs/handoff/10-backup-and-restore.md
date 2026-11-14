# Backup and restore

## Archive layout

| Path | Contents |
| --- | --- |
| `START_HERE.md` | Archive orientation and recovery commands |
| `manifest.json` | Exact source baseline, branch, history count, collection timestamp and inclusion boundaries |
| `source/` | Every tracked source/document/example file at the packaged commit |
| `history/liquid-light-nodes-lab.bundle` | Reachable Git history, without local .git config or credentials |
| `history/commits.txt` | Readable commit log |
| `build/client/`, `build/server/` | Optional built frontend and Worker output |
| `data/` | Separately captured personal cloud state, snapshot records and open editor graph |
| `verification/` | Check results/logs and data validation reports |
| `SHA256SUMS` | Checksums for each other archive member |

The original open editor graph has 21 nodes. The separately captured cloud workspace has eight nodes. The three listed cloud snapshots contain 4, 4 and 10 nodes. Preserve their names/files rather than automatically choosing one based only on a similar title. `data/INVENTORY.md` describes the collection boundary and restore paths.

## Restore with history

Extract the ZIP. From its root:

```bash
git clone history/liquid-light-nodes-lab.bundle liquid-light-nodes-lab
cd liquid-light-nodes-lab
npm ci
npm test
npm run build
npm run dev
```

The bundle restores the source branch and reachable commits; local repository configuration, credentials, hooks and ignored files are not copied. The initial clone remote points to the bundle. Add a differently named GitHub remote or remove/rename that local-bundle remote before using `origin` for GitHub.

Without Git, use the `source/` directory directly and run npm commands there. It contains the same tracked files; the bundle is only needed to retain history. The archive is not self-contained for dependency installation on an offline machine: dependencies must be installed from the standard registry or an existing package cache.

## Create an owner-controlled GitHub repository

Create an empty **private** repository in Rafa's account. Keep README/licence/gitignore initialization off when pushing the existing complete history. From a clone of the bundle, add the actual repository URL returned by GitHub and push `main`; avoid force-push or overwriting an unrelated repository.

With an authenticated GitHub CLI, the equivalent is:

```bash
gh repo create liquid-light-nodes-lab --private --source=. --remote=github --push
```

That command is documentation for the owner/next professional; it has not been executed by this handoff. The existing Site source repository is not automatically changed to GitHub by this action. Decide deliberately which remote is canonical and how releases reach the existing host. A second source remote is not automatic bidirectional sync.

Keep code/docs/sample graphs in Git. Keep personal study dumps outside normal source commits; use a private backup store or private release attachment if appropriate. Choose a project licence before public redistribution. Add CI/test/build and release tags once the repository is created.

## Restore artwork first

Open the editor, use Import graph JSON, and select `data/open-editor.llnodes.json` for the exact open editor graph. The archive also provides directly importable `*.llnodes.json` copies of the captured cloud workspace and each saved study. Import restores embedded graphics/groups/parameters/wiring; it does not automatically restore cloud revision or all panel layout wrappers.

The graph download includes `frameTime`; the current import path uses it as the playhead. A cloud snapshot's thumbnail and ETag are metadata, not required for graph rendering.

## Restore the captured full local state

Prefer graph import for ordinary creative recovery. A developer may restore a cloud-state wrapper to a **fresh local or staging origin** to recover layouts/assets as well. Close other tabs on that origin and save any existing local content before doing so. Read `data/cloud-state.json` or choose the appropriate wrapper. Its fields map as follows:

| Wrapper field | LocalStorage destination |
| --- | --- |
| `document` | JSON value at `liquid-light-nodes-workspace-v1` |
| `workspace` | JSON value at `liquid-light-panel-workspaces-v1` |
| `assets` | JSON value at `liquid-light-group-assets` |
| `saved` | Decimal timestamp at `liquid-light-last-edit` |
| Snapshot array with `id` and `graph` | JSON array at `liquid-light-nodes-sessions-v1`, subject to normal local retention |

This is a developer recovery mapping, not an existing "import everything" button. Use a fresh origin because localStorage replacement affects that origin's current document. Do not replay an old `revision` into the live site's PUT API. For cloud restoration, authenticate as the intended owner, read the destination's current revision and deliberately migrate through its validated API/storage adapter.

## Produce another handoff

After intentional source changes, regenerate the references if needed and commit all source/docs you want included. Export current personal data separately. Then run:

```bash
python3 scripts/package-handoff.py --output /absolute/path/liquid-light-handoff.zip --with-build --data /absolute/path/exported-data --verification /absolute/path/verification
```

The utility requires a clean Git worktree, checks tracked paths/history for recognizable credential patterns, copies tracked source and optional build/data/check records, creates/verifies a Git bundle, and emits a checksum manifest. It is a bounded secret-pattern check, not a formal audit. Do not deliberately place credentials in the input data directory.

The package command does not read cloud/browsers, create GitHub repositories, contact other services, change hosting, or set up a schedule. It packages what exists at the supplied paths. Run actual tests/build before invoking it; included old logs alone are not evidence of a new successful verification.

## Verification after extraction

Verify ZIP integrity and the SHA256SUMS entries; on Linux `sha256sum -c SHA256SUMS` is available, while macOS can use `shasum -a 256` or Python. Run `git bundle verify` from an existing Git repository or clone the bundle. Confirm the clone's HEAD matches `manifest.json`, then install/test/build. Import the native graphs and inspect their results.

Keep a backup in a second owner-controlled location, periodically test restoration, and record release/source/data timestamps. A Git repository preserves committed code; it does not by itself back up R2 data, local browser state, hosting accounts, secrets or unsaved changes.
