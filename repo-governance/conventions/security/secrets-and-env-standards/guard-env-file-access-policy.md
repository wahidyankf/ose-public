---
description: The agent-access policy denying direct Read/Write/Edit of .env.prod and .env.stag, its decoupling from commit policy, its exceptions, and its enforcement mechanism plus residual gap.
when_to_use: Use when an AI agent needs to know which .env* files it may open directly and which are hard-denied.
---

# `guard-env-file-access` Policy

AI agents must not directly read, write, or edit **`.env.prod`** or **`.env.stag`** — the two
restricted-secrets tiers that hold real production and staging credentials. The canonical identifier
for this policy is **`guard-env-file-access`**.

This is a **named-file rule**, not a blanket `.env*` deny: only `.env.prod` and `.env.stag` are
denied. Every other real `.env*` file — `.env`, `.env.local`, `.env.test`, `.env.development`,
`.env.staging`, `.env.preview`, and so on — is agent-readable and agent-editable, alongside the
always-allowed committed template `.env.example`.

**Agent-access policy and commit policy are deliberately decoupled.** Loosening agent read/write
access to `.env.local`, `.env.test`, and the other permitted names is a deliberate trade for task
throughput; it does **not** loosen what may be committed. **Commit policy is unchanged and stays
deny-all for every real `.env*` file** (everything except `.env.example`), enforced independently by
`the public-safety tree check` in the pre-commit path (`env_staged_guard.rs`'s
`is_offending` predicate). An agent may open `.env.local`; it may never commit it.

Exceptions: project scripts under `apps/`, `libs/`, and `scripts/` are exempt (they are part of the
app's own startup/setup logic, not AI-agent operations).

**Enforcement mechanism and its residual gap.** The policy is enforced by
`.claude/hooks/block-env-file-access.sh`, a `PreToolUse` hook. This is a **best-effort guard, not a
hard technical guarantee**: the file-tool branch (Read/Write/Edit/MultiEdit/Grep/Glob) matches on a
symlink-resolved basename, and the Bash branch default-denies any command whose raw text references
`.env.prod`/`.env.stag` anywhere — both case-insensitively, closing the enumerated-verb and
filename-case bypasses. What it **cannot** close, because it is inherent to text-based matching: a
Bash command that never spells the restricted tier name out literally, constructing it instead from
separately-innocuous pieces (e.g. `t=prod; cat ".env.$t"`, or reading the tier name from another
file). No text regex can distinguish that from an unrelated string concatenation. This residual gap
is accepted deliberately; it is why the operator-facing documentation
([configure-app-environments.md](../../../../docs/how-to/configure-app-environments.md)) describes the
guard as best-effort rather than promising agents cannot touch these files.

**Other harness layers.** The secondary binding's permission layer in `.opencode/opencode.json` also denies
`.env.prod` and `.env.stag`. Codex has no enforcement inside this repository: its deny rules live
only in untracked per-user configuration, so for Codex this policy is recorded here but not enforced
by any tracked file.
