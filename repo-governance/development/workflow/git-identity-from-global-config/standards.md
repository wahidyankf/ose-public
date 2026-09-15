---
description: The three standards governing git identity — no per-repo [user] section, global-config-only resolution, and behavioural guardrail enforcement.
when_to_use: Use when checking whether a `.git/config` state, an `includeIf` setup, or an enforcement mechanism complies with this convention.
---

# Standards

## Standard 1: No `[user]` Section in Any Sibling Repo `.git/config`

The `[user]` section MUST NOT appear in `.git/config` for any repository in the
ecosystem (`ose-public`, the private sibling).

**Violation:**

```ini
# ose-public/.git/config  ← PROHIBITED
[user]
    name  = Some Name
    email = some@email.example
```

**Compliant state:** the `[user]` section is absent from `.git/config` entirely. Git falls
through to the developer's global `~/.gitconfig`.

This rule is **identity-agnostic**: any `[user]` value is a violation, regardless of
whether the identity it encodes happens to match the developer's real identity. The
mechanism itself is disallowed, not just incorrect values.

## Standard 2: Identity Comes From Global Git Config Only

The authoritative source for `user.name` and `user.email` in all subrepos is, in resolution
order:

1. `~/.gitconfig` — the standard per-user global config.
2. `~/.config/git/config` — the XDG-compliant alternative location.
3. System-level `/etc/gitconfig` — for shared CI environments only.

Developers who need a different identity per repository (e.g., work vs. personal projects)
MUST use `includeIf` directives in their global `~/.gitconfig` rather than editing any
subrepo's `.git/config`.

**Per-directory identity via `includeIf` (compliant approach):**

```ini
# ~/.gitconfig

[user]
    name  = Your Name
    email = personal@example.com

[includeIf "gitdir:/path/to/work-projects/"]
    path = ~/.gitconfig-work
```

```ini
# ~/.gitconfig-work

[user]
    name  = Your Name
    email = work@company.example
```

Git applies `~/.gitconfig-work` automatically for any repository whose `.git/` directory
is under `/path/to/work-projects/`. No per-repo `.git/config` edit is required.

**One-off override via environment variables (compliant approach for isolated commits):**

```bash
GIT_AUTHOR_NAME="Your Name" GIT_AUTHOR_EMAIL="other@example.com" \
  GIT_COMMITTER_NAME="Your Name" GIT_COMMITTER_EMAIL="other@example.com" \
  git commit -m "chore: one-off commit under alternate identity"
```

Environment variables override config for a single invocation without touching any
`.git/config` file.

## Standard 3: Enforcement Is a Behavioural Guardrail, Not a Pre-Commit Script

`ose-public` previously enforced Standard 1 with an automated `scripts/git-identity-check.sh`
pre-commit guard. That script has been **removed** — see
[Reproducible Environments Convention §Git Identity Guardrail](../reproducible-environments/git-identity-guardrail.md#git-identity-guardrail)
for the removal rationale: it over-restricted human developers who legitimately maintain
per-repository identities via `includeIf`.

Enforcement today is the **Git Identity Guardrail** documented in
[Reproducible Environments Convention §Git Identity Guardrail](../reproducible-environments/git-identity-guardrail.md#git-identity-guardrail)
and in `AGENTS.md`: no AI agent may set or modify git identity at any scope
(`git config --local/--global/--system user.*`, or a direct `.git/config` `[user]`-block edit).
This is a behavioural rule enforced by agent instruction-following, not a Husky hook — human
developers remain free to use `includeIf` for legitimate multi-identity workflows, which is
exactly what the removed script could not distinguish from a violation.

For the current, registry-backed shape of the three Husky hook shims themselves (which no
longer include an identity-check step), see
[Git Hook Lifecycle](../git-hook-lifecycle.md).
