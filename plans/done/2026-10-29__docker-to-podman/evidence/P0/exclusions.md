# AC-09 exclusion and peer-state comparison base

Captured 2026-10-26 12:20 UTC at execution worktree revision
`71bb3aa5cadc1043e709e6cb13c2e0ffd8f489a7`, equal to `origin/main`. This snapshot precedes all
baseline tests and runtime implementation.

## Learning-content tree

The current source tree identified by the plan is `apps/ayokoding-www/content/`, with the existing
`en` and `id` locales. The Phoenix plan remains paused in Phase 0, says implementation has not
begun, and directs the future app to read this Markdown and its assets in place. Its future app
path `apps/ayokoding-web/` has no tracked files at this source revision, so no new shared
learning-content root has landed. All AyoKoding lesson content, examples, manifests, assets,
`run.yaml`, and expected outputs under the identified source root are excluded from this plan's
edits.

The content hash walks the complete current filesystem tree without following symlinks. It hashes
each relative path, entry type and mode, regular-file bytes, and symlink target using length-framed
SHA-256 fields. It records each entry in an ignored local JSONL manifest so the same algorithm can
recompute the comparison at P3. The aggregate does not include host-absolute paths or timestamps.

| Root                          | Entries | Regular-file bytes | Tree SHA-256                                                       |
| ----------------------------- | ------: | -----------------: | ------------------------------------------------------------------ |
| `apps/ayokoding-www/content/` |  21,659 |         95,271,791 | `ab08b1be7d34f8a670786c15ff622ecd488f28cf410bb0badb8b07e809974a85` |

Command: `PATH="$HOME/.dotnet/tools:$HOME/.local/share/flutter-sdk/3.41.5/flutter/bin:$PATH" rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- python3 local-tmp/plan/docker-to-podman/hash-content-tree.py apps/ayokoding-www/content local-tmp/plan/docker-to-podman/exclusions-ayokoding-www-content.jsonl`.
HIPPO session `95750` exited 0. The script and per-entry manifest are ignored, task-owned local
artifacts; the manifest is retained only to reproduce the P3 comparison.

## Peer-worktree state

The peer metadata was read from the registered worktrees without reading peer file contents or
changing their files, branches, processes, or pause states. Paths and raw status remain in ignored
worktree-local records; this report contains revisions, status counts, and hashes only.

| Peer plan            | HEAD                                       | Tracked status entries | Untracked paths | SHA-256 of full NUL-delimited porcelain-v2 status                  |
| -------------------- | ------------------------------------------ | ---------------------: | --------------: | ------------------------------------------------------------------ |
| Phoenix rewrite      | `09473ab8fcc8fbfc41a24c72fe596e0e46cb7bee` |                      0 |               0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Learn Revamp plan 10 | `234e1133a289904a7cfbb3c758044de1f1854636` |                    472 |             864 | `84dbbace0369266c588e699d570acc76e071fe34979085d4376a34c0cb47c543` |

Both heads match the previously recorded revisions. Plan 10's current counts have one more tracked
status entry than the historical observation (471) and a current untracked-path inventory; the
complete private inventory is retained locally for later comparison. These values describe state
at this snapshot and do not assign ownership of peer changes to this plan.

Command: `PATH="$HOME/.dotnet/tools:$HOME/.local/share/flutter-sdk/3.41.5/flutter/bin:$PATH" rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- python3 local-tmp/plan/docker-to-podman/hash-peer-status.py`.
HIPPO session `14376` exited 0. The helper emits no peer path or file content. Both helpers and the
per-file content manifest are ignored under this worktree's `local-tmp/`.

## Worktree registration

The current registration output agrees with the plan's immutable execution-worktree identity. Two
unrelated registrations remain marked prunable and were not changed. The raw registration output
is preserved in ignored local state; no peer worktree is an owned cleanup target.
