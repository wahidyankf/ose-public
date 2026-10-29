# P0 disk recovery

Status: both the initial stale generated-output removal and the later approved Go build-cache
recovery passed. The unchanged original build then passed through finalization. This record
does not establish whole-plan or P0 readiness.

## Scope and authority

The maintainer explicitly approved the proposed one-operation cleanup exception on 2026-10-26.
Only this duplicate generated directory was removed from the execution worktree:

`apps/ayokoding-www/.next/standalone/apps/ayokoding-www/.next/server/app`

The P0 builds in frozen rows 14 and 26 produced it. The approved Next.js upgrade requires a new
build; the old standalone bundle is incomplete until that build recreates it. Its original
`apps/ayokoding-www/.next/server/app`, traces, diagnostics, source, learning content, environment
files, native prerequisites, retained installer archive, peer worktrees and other caches remain.

## Verification and outcome

The independently reviewed fixed-path script has SHA-256
`a1f05db32e6c2c304246cccd45ea901ddc67ec0e1bbc9ddf6aec7f27c3bc98b2`.
Review found zero issues. Seven filesystem guard fixtures and the final read-only process/tree
audit passed. The audit found no active consumer or unknown process metadata. The target had
50,208 entries and 9,134,460,928 allocated bytes, without symlinks, hardlinks, environment names,
special files or filesystem crossings. No target file bodies were read or hashed.

The exact approved application, session `49645`, exited 0. Native free-space readings increased
from 18,714,468,352 to 27,848,925,184 bytes: **9,134,456,832 bytes reclaimed**. The target was absent
afterward; the preserved original output, traces and diagnostics retained their observed stat
identities. Raw receipts remain ignored under `local-tmp/swe-debugger/`.

Fresh HIPPO status session `12438` exited 0 at `2026-10-26T22:54:29Z`: requested and resolved
profile matched, pressure was normal, owners and waiters were zero, and filesystem free space was
27,848,605,696 bytes. The existing reserve was 18,955,967,693 bytes, leaving 8,892,638,003 bytes
of headroom. The approved machine configuration hash remained
`c825694bdcc629154a35d895a67cf2e07e689b4bd40c3e39aeb2e4b57e1877ed`.
No resource profile, class, limit, package, or host-security setting was changed by this operation.

## Machine procedure reconciliation

The maintainer directed the coordinator to inspect the central workstation repository. Its
existing machine disk-recovery procedure explicitly exempts the official cleanup tool's scout,
sweep and temporary-directory commands, including their Go compilation, from HIPPO admission.
The cloud-machine entrypoint requires survey, classification, approval of measured rows,
consumer recheck, selective execution and measured savings. A whole-root deletion pass is allowed
only when every candidate in that pass is approved.

The earlier assertion that no machine-specific route existed was incomplete: the initial
investigation covered the application repository rather than that central machine procedure.
The completed custom operation had its own explicit approval. No broad machine sweep was run.
Other installation and verification commands continue through the unchanged HIPPO boundary.

## Later rebuild capacity finding

After the approved dependency upgrades, the original Ayo build completed compilation, TypeScript
and all 3,278 static pages. HIPPO stopped finalization with `hippo.limit.storage-blocked`, exit 124,
at 17,516,130,304 free bytes against the unchanged 18,955,967,693-byte reserve. The child had no
terminal success marker, so this is an interrupted build, not a pass or an assertion failure.
Its generated output, traces and diagnostics remain retained. Repeating deletion of the same
generated duplicate would not correct the rebuild's net space requirement.

A subsequent official machine survey ran three explicit dry sweeps and an isolated scout with
temporary-file opening disabled and an empty local Docker configuration. Separate guarded native
metadata supplied the local engine inventory. That survey performed no cleanup. Most project
candidates were in excluded peer content and were skipped. Docker images and build cache share
layers; their displayed sizes are not additive. All seven existing Docker volumes remain retained.

The bounded recovery candidate was the installed toolchain's 5,658,525,696-byte native Go build
cache. Source and metadata checks establish that `go clean -cache` preserves the SDK, source,
module cache and separately managed fuzz data. The cache is recently used but has no observed
compiler consumer. Its cold-build cost and one-operation admission exception were submitted for
explicit approval.

## Approved cache recovery and build result

The maintainer approved that exact cache row and one native recovery operation on 2026-10-27.
Fresh path, ownership, directory-identity, fuzz-absence and idle-compiler guards passed. Native
`go clean -cache` exited 0 at `00:46:25Z`. Cache allocation fell from 5,658,525,696 to 12,288 bytes.
Filesystem available space rose from 17,516,249,088 to 23,174,737,920 bytes: an observed gain of
**5,658,488,832 bytes**. Concurrent host writes can explain the small difference from the cache
allocation reduction; it is left unattributed. The cache root identity remained unchanged.

HIPPO status session `18778` exited 0 at `00:46:35.650Z`: requested and resolved profiles remained
balanced, pressure was normal, storage was unblocked, and owners and waiters were zero. It observed
23,174,402,048 free bytes against the unchanged 18,955,967,693-byte reserve, with 4,218,434,355 bytes
of headroom. The approved configuration hash remained unchanged. No other caches, Docker resources,
volumes, source, content, SDKs, peer outputs or host policy were changed.

The coordinator then authorized one replay of the original frozen row 14 build, retaining its
earlier interrupted receipt. The replay completed all 3,278 pages and final optimization with
inner and HIPPO exits 0. See [the affected-target results](./pin-upgrade-target-results.md) for
the distinct interrupted and successful receipts. Other compute continues through HIPPO.
