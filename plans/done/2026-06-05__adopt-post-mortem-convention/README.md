# Adopt Post-Mortem Convention

Adopt the blameless incident **post-mortem convention** from the sibling private repo `ose-infra`
into `ose-public`, reframed for this repository's software-platform reality (an Nx monorepo of
Next.js sites on Vercel, Rust/Go/F# CLIs and backends, and CI/CD via GitHub Actions + Nx Cloud).

## Context

`ose-infra` already maintains a mature, well-structured post-mortem convention: an authoritative
governance rule plus a writer-facing template/index, a four-tier severity scale, blameless culture
rules, an owned/prioritized action-item table, and a `doc_status` lifecycle. `ose-public` has no
post-mortem convention yet. When a CI pipeline breaks, a Vercel production site goes down, a
dependency bump regresses, or a generated-artifact guard trips, there is no standard place or shape
for the retrospective.

This plan adopts that convention — keeping its structure, severity scale, blameless rules,
action-item tracking, and `doc_status` lifecycle — and reframes every example from infrastructure
incidents (Proxmox, Tailscale, dual-WAN routers) to **software incidents** that actually occur in
`ose-public`. `ose-public` has no production infrastructure (that is `ose-infra`'s domain), so the
adopted convention must speak in the vocabulary of CI/CD failures, Vercel outages, dependency-bump
regressions, coverage-threshold regressions, and generated-artifact / byte-equality guard breakages.

## Scope

**In scope**:

- New authoritative governance rule: `repo-governance/conventions/structure/post-mortems.md`
  (software-flavored, adapted from the ose-infra original).
- New writer-facing template + index: `docs/explanation/post-mortems/README.md`.
- One fresh, software-flavored worked-example post-mortem grounded in a **real, already-documented**
  `ose-public` issue: Prettier reformatting generated binding artifacts (`.amazonq/`) broke the
  cross-vendor parity byte-equality guard in CI / pre-commit.
- Index updates: `repo-governance/conventions/structure/README.md`,
  `repo-governance/conventions/README.md`, `docs/explanation/README.md`.
- Validation via the `repo-rules-quality-gate` workflow (strict mode, double-zero).

**Out of scope**:

- Incident-response runbooks (live-outage procedures).
- On-call / escalation policy (no on-call rotation exists for a solo-maintainer repo).
- Any production-infrastructure framing (belongs in `ose-infra`).
- Backfilling historical post-mortems beyond the single worked example.

**Affected surfaces**: `repo-governance/conventions/` and `docs/explanation/` only. No application
code (`apps/`, `libs/`) changes. No agent/skill source (`.claude/`) changes are expected.

## Document Map

This plan uses the five-document multi-file layout:

| Document                       | Purpose                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| [README.md](./README.md)       | This file — context, scope, navigation                                 |
| [brd.md](./brd.md)             | Business rationale: why a post-mortem convention, who consumes it      |
| [prd.md](./prd.md)             | Product requirements: user stories + Gherkin acceptance criteria       |
| [tech-docs.md](./tech-docs.md) | Architecture: dual-file design + ose-infra → ose-public adaptation map |
| [delivery.md](./delivery.md)   | Phased, TDD/execution-grade delivery checklist                         |

## Approach Summary

1. **Phase 0** — environment setup and baseline (`repo-setup-manager`).
2. **Phase 1** — author the authoritative convention via `repo-rules-maker`, reframed for software.
3. **Phase 2** — author the writer-facing template/index and the software-flavored worked example
   via `docs-maker`.
4. **Phase 3** — wire the new convention/doc into the three index files.
5. **Phase 4** — run `repo-rules-quality-gate` (strict, double-zero), local quality gates, markdown
   lint, link validation; fix all issues; commit thematically; push to `origin main`; verify CI.
6. **Phase 5** — archive the plan to `plans/done/`.

## Git Workflow

Trunk Based Development — work on `main`, direct push to `origin main`, **no PR** (the user
explicitly requested direct push, trunk-based). See
[Trunk Based Development Convention](../../../repo-governance/development/workflow/trunk-based-development.md).

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
