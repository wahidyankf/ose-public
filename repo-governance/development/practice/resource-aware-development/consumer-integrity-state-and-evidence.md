---
description: How the pinned release is verified, what the shared root and owner ceiling mean across checkouts, the container reaping-init requirement, and what evidence may contain.
when_to_use: Use when changing the pin, the local policy example, HIPPO_ROOT, or a test that touches HIPPO state.
---

# Consumer Integrity, State, and Evidence

`hippo.lock` pins version, commit, and four archive checksums. The bootstrap validates downloads and
revalidates cached digest plus embedded identity. `hippo.local.json.example` shows schema 3; any
machine-specific `hippo.local.json` stays ignored and cannot weaken floors. The shared machine
policy owns the two-owner base, evidence-gated third owner, resource tiers, and emergency floor.
A contained worktree with no local copy uses the primary checkout's ignored policy; `HIPPO_CONFIG`
and `--config` still take precedence.

Use the per-user root so all checkouts share one ledger. Set `HIPPO_ROOT` only for isolated tests or
a separately administered domain. When HIPPO itself runs inside a container, that container needs
a reaping init: a PID 1 that leaves orphans unreaped makes retirement wait forever on Linux.
Guarding a container from the host is unaffected. Evidence may contain capacity and process health, never arguments,
repository paths/origins, credentials, file contents, or user data. Raw evidence rolls for seven
days; compacted daily summaries roll for 30 days under byte caps.

Tests use synthetic releases, isolated cache/state, and fake pressure—never manufactured host
pressure. Scheduled Linux/macOS smoke verifies identity, schema, mappings, policy, shared-root
behavior, and cleanup. Ordinary hosted PR CI retains runner-native controls.

`hippo.identity.json` supplies this repository's source and default tags. Hippo discovers it upward
from nested paths and contained `worktrees/<task>` checkouts. Add privacy-safe
`--tag checkout=worktree --tag plan=<slug>` values per run; every checkout still uses the shared
default root. Operators run `./hippo status`, `./hippo watch --source ose-public`, and
`./hippo history --since 30d --source ose-public` directly, without admission.

BeaverNest's canonical
[`hippo-bootstrap.feature`](https://github.com/wahidyankf/beaver-nest/blob/main/specs/tools/hippo-consumer/behaviours/hippo-bootstrap.feature)
specifies portable bootstrap behavior; OSE binds those scenarios through its own hermetic adapter
without copying the feature or making BeaverNest a parity sibling.
