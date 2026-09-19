---
description: Three anti-patterns that break commit hygiene - vague-prose ledgers, orphan sync commits, and hand-editing a generated mirror
when_to_use: Use when writing ledger entries or deciding how to commit a primary binding directory edit and its generated mirrors.
---

# Anti-Patterns: Commit Hygiene

## The Ledger as Vague Prose

**Problem**: The record reads "updated the governance docs and synced the bindings."

**Why it fails**: It cannot answer the one question the ledger exists to answer — _is this specific
path mine?_ A ledger that does not resolve to paths is decoration.

**Fix**: Standard 2 — one entry per path, with the operation and the reason.

---

## The Orphan Sync Commit

**Problem**: The agent commits its `.claude/` edit, notices the regenerated mirrors afterwards, and
commits them separately as "chore: sync bindings".

**Why it fails**: The intermediate commit is a tree where a source and its generated mirror disagree.
Anyone who checks out that SHA — a bisect, a CI job, a colleague — gets an inconsistent harness
configuration, and the byte-parity guard fails there for reasons unrelated to their own work.

**Fix**: Standard 9 — source and mirror in one commit. The pre-commit hook already stages them
together; do not defeat it by committing narrowly and reconciling later.

---

## Hand-Editing a Generated Mirror

**Problem**: The agent needs a change in `.opencode/agents/foo.md` and edits that file directly.

**Why it fails**: The next `harness adapters generate` — which pre-commit runs automatically —
overwrites it silently. The change disappears with no error, and the time is spent twice.

**Fix**: Standard 9 — `.claude/` is the only hand-authored _canonical source_ surface for generated
mirrors. Edit the source, regenerate, and let `class: generated` mirrors follow. A `class: vendored`
path (declared in the `harness:` registry's `ownership:` list) is the one exception, and it covers
two structurally different subclasses — see [the two vendored
subclasses](../../../glossary/vendored-exception-subclasses.md)
for which one applies before hand-editing.
