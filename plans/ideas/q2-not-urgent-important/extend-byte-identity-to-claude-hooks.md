# Extend cross-repo byte-identity checking to `.claude/hooks/`

One-line summary: `apps/rhino-cli` has an enforced byte-identity gate across `ose-public` and
the private sibling; `.claude/hooks/` — including the security-load-bearing `block-env-file-access.sh` —
has no equivalent check, and drifted silently between those repos during
`restrict-env-access-to-prod-and-stag`.

> Idea, added 2026-08-13 — captured from `restrict-env-access-to-prod-and-stag`'s Phase 9/10
> (the private sibling's `plans/done/2026-08-13__restrict-env-access-to-prod-and-stag/learnings.md`, "Two variants of one
> guard script is how drift hides" and "Phase 9 cross-repo verification caught the exact drift class
> predicted at authoring time").
> Relocated from private-sibling/plans/ideas/extend-byte-identity-to-claude-hooks.md on 2026-08-19 by plan-ideas-grooming.

## Problem / context

This plan's Phase 9 hash-compared `.claude/hooks/block-env-file-access.sh` between `ose-public` and
the private sibling and found they had diverged: `ose-public`'s copy had gained three security hardening
fixes (default-deny on any command text referencing a restricted tier, symlink-target resolution,
case-insensitive matching) during this plan's own PR-review cycle in `ose-public`, none of which had
been ported back to the private sibling. The `.claude/settings.json` `permissions.deny` list had drifted
too (the private sibling was missing both `Write(**/.env.prod)` and `Write(**/.env.stag)` entries that
`ose-public` had). Both were fixed as part of this plan's Phase 9, but only because Phase 9 happened
to include an explicit hash-check step for these specific files — nothing would have caught the drift
otherwise, and nothing prevents the same class of drift recurring the next time either file is edited
in only one repo.

## Why now

Not urgent — this specific instance is fixed, and `apps/rhino-cli`'s own byte-identity gate
demonstrates the checking mechanism already exists and works. It carries a real stake because
`block-env-file-access.sh` is a security control (not a convenience script), and the current state
relies on a human or agent remembering to check it manually — exactly the failure mode the
`rhino-cli` byte-identity gate was built to eliminate for that crate.

## Prior art / precedents

- **`apps/rhino-cli` byte-identity gate** — the existing enforced mechanism (zero carve-outs per
  [`AGENTS.md §Related Repositories`](../../../AGENTS.md#related-repositories)) this idea would extend the pattern
  from, not invent fresh.
- **[`parity-manifest.sha256`](../../../apps/rhino-cli/parity-manifest.sha256)** — the manifest format
  `rhino-cli`'s own gate already uses; a similar manifest could cover `.claude/hooks/`.
- **This plan's Phase 9** — proved the check works when run manually; the ask here is to make it run
  automatically instead of depending on a plan remembering to include it.

## Proposed direction (sketch)

- Identify which `.claude/hooks/*.sh` files are security-load-bearing (deny/block hooks) versus
  purely repo-specific (formatting, cache-warming) — only the former need cross-repo identity.
- Extend the `rhino-cli` byte-identity gate (or add a lighter sibling CI job) to hash-compare the
  security-load-bearing hooks across `ose-public` and the private sibling.
- Fail CI on drift, same as the existing `rhino-cli` gate does today.

## Rough scope & non-goals

In scope: `.claude/hooks/block-env-file-access.sh` and its test file, at minimum; any other hook
later identified as security-load-bearing.

Out of scope: hooks that are intentionally repo-specific (e.g. anything referencing a repo's own
build/deploy pipeline); `.opencode/`/`.codex/`/`.agents/` mirror generation (separate, already-
automated concern via `npm run generate:bindings`).

> Narrowed by `update-harness-support`: the `.amazonq/` and `.cursor/` mirrors named here no longer
> exist — support is now exactly Claude Code, OpenCode, and Codex CLI. The hook byte-identity
> question this brief is actually about is untouched by that.

## Risks & open questions

- Should this reuse `rhino-cli`'s existing gate machinery directly, or is a separate, lighter CI job
  simpler given hooks are plain shell scripts with no build step? (open)
- Full byte-identity, or an explicit "may diverge, sync manually" marker for hooks with legitimate
  repo-specific branches? Needs a survey of the current hook set before deciding. (open)

## What success looks like + promotion signal

Success: a CI check fails automatically if `block-env-file-access.sh` (or any other hook classified
security-load-bearing) diverges between repos, rather than depending on a plan's own Phase 9 to catch
it. Promote to a full `backlog/` plan once the hook survey (which hooks are security-load-bearing)
is complete enough to scope the actual check.
