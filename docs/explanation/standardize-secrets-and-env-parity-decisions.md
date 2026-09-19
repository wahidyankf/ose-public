---
title: Standardize Secrets and Env — Parity Decisions (2026-06-10)
description: >-
  Explanation of every cross-repo parity decision in the 2026-06-10
  standardize-secrets-and-env plan: what was decided about naming convention,
  hub doc canonical identifiers, env-contract format, and doc canonicalization,
  and why each decision was made.
category: explanation
tags:
  - standardize-secrets-and-env
  - multi-repo
  - governance
  - decision-log
created: 2026-06-10
---

# Standardize Secrets and Env — Parity Decisions (2026-06-10)

This document records every cross-repo parity decision from the `standardize-secrets-and-env` plan
(2026-06-10). The plan ships naming convention, `.env.example` layout, startup validation, the
retired in-tree Rhino env toolchain, and the drift guard (`env-contract:` section in `repo-config.yml`) to ose-public. The full
technical design lives in
[`plans/done/2026-06-10__standardize-secrets-and-env/tech-docs.md`](../../plans/done/2026-06-10__standardize-secrets-and-env/tech-docs.md).

Sibling repo plans: the private sibling carries an equivalent plan; this document
records only the ose-public decisions and deviations.

## Background

The sibling repositories (`ose-public`, the private sibling) each had independently
evolving secrets and env practices — different file naming, no canonical hub doc, and no automated
drift guard. The `standardize-secrets-and-env` plan establishes a single cross-repo canonical
baseline. The four parity-sensitive decisions below required explicit deliberation.

## Decision Matrix

| #   | Dimension                          | ose-public decision                      | The private sibling | Deviation?                                        |
| --- | ---------------------------------- | ---------------------------------------- | ------------------- | ------------------------------------------------- |
| 1   | Canonical rule doc filename        | `no-secrets-in-committed-files.md`       | same (source)       | None — aligned to the private sibling's canonical |
| 2   | `guard-env-file-access` identifier | unchanged                                | unchanged           | None — shared across both                         |
| 3   | Hub doc filename                   | `secrets-and-env-standards.md`           | same                | None                                              |
| 4   | `env-contract:` section format     | `serde_norway` YAML in `repo-config.yml` | same                | None                                              |
| 5   | `DATABASE_URL` exemption           | unprefixed, exempt                       | exempt              | None                                              |
| 6   | Next.js `PORT` vs backend `PORT`   | webs exempt, backends prefixed           | n/a (no Next.js)    | Structural delta (no deviation in principle)      |

## Decision Details

### 1. Canonical rule doc filename: `no-secrets-in-committed-files.md`

**Decision**: Rename `no-secrets-in-git.md` → `no-secrets-in-committed-files.md` in ose-public.

**Why**: the private sibling was already using `no-secrets-in-committed-files.md` as the canonical
identifier. The old ose-public name (`no-secrets-in-git.md`) was a local divergence. Aligning to
`no-secrets-in-committed-files.md` makes the cross-repo canonical name unambiguous and reduces
confusion when scanning across repos.

**Deviation**: None. After this rename, all three repos use the same canonical filename.

**Stub pattern**: The renamed file is a short redirect stub to
`secrets-and-env-standards.md` — the full rule lives in the hub doc.

### 2. `guard-env-file-access` identifier stays unchanged

**Decision**: The canonical identifier `guard-env-file-access` (the machine-readable tag for the
policy that blocks AI agents from touching real `.env*` files) is not renamed.

**Why**: All three repos reference `guard-env-file-access` in hooks, plans, and cross-references.
Renaming it would require a coordinated sweep across all three. The identifier is already aligned and
unambiguous.

**Deviation**: None.

### 3. Hub doc: `secrets-and-env-standards.md`

**Decision**: Create
`repo-governance/conventions/security/secrets-and-env-standards.md` as the authoritative hub for
all secrets and env practices.

**Why**: Prior to this plan, three separate docs covered overlapping ground
(`no-secrets-in-git.md`, `env-file-access.md`, and the `.env` section of
`reproducible-environments.md`). A single hub doc with explicit section anchors makes it possible for
cross-references to point to exact rules rather than whole documents.

**Cross-repo propagation**: the private sibling carries its own equivalent, kept current via the
multi-repo parity planning workflows.

**Deviation**: None in principle. Structural placement in
`repo-governance/conventions/security/` may differ from the private sibling's directory hierarchy.

### 4. `env-contract:` section YAML format

**Decision**: `env-contract:` section in `repo-config.yml` at repo root, parsed with `serde_norway`,
one `surfaces:` array, each entry with `root`, `kind`, `lang`, and `allowlist` fields.

**Why**: A single config file at repo root is the simplest discoverable location for
the then-current retired in-tree Rhino env validator. `serde_norway` (a `serde_yaml` fork maintained by the Rust infra team) is
the canonical YAML parser in this codebase.

**Forward scaffold**: Terraform and Ansible surfaces are present as YAML comments — syntactically
present, not parsed. Uncomment and fill when IaC is added to the repository.

**Cross-repo propagation**: the private sibling adopts the same format.

**Deviation**: None.

### 5. `DATABASE_URL` exemption from per-app prefix rule

**Decision**: `DATABASE_URL` is explicitly exempt from the per-app prefix rule and stays unprefixed
across all three repos.

**Why**: `DATABASE_URL` is the de-facto conventional name understood by `sqlx`, Postgres tooling,
`psql`, migration runners, and most platform operators. The cost of renaming it (breaking every tool
that reads it by convention) exceeds the marginal collision-safety benefit of adding a prefix. It is
an explicitly-blessed unprefixed shared name, not an oversight.

**Deviation**: None.

### 6. Next.js `PORT` exempt vs backend `PORT` prefixed — SUPERSEDED

> **Superseded.** The asymmetry recorded below no longer holds. Every port-binding app, web tier
> included, now takes the app prefix and resolves its port through one shared contract — `--port`
> flag, then the prefixed variable, then the compiled-in default. The premise that renaming `PORT`
> "would break `nx dev ose-www`" was retired by `scripts/next-with-port.mjs`, which resolves the port
> before Next.js starts and assigns `process.env.PORT` itself. See the
> [Environment Variable Naming Standard](../../repo-governance/conventions/security/secrets-and-env-standards/environment-variable-naming-standard.md)
> for the rule now in force. The text below is kept as the historical record of what was decided.

**Decision (historical)**: In Next.js webs (`ose-www`, `ayokoding-www`, etc.), `PORT` stays
unprefixed — it is a framework-reserved name the Next.js dev server reads natively. In F# backends
(`organiclever-be`, `ose-be`), the port var takes the full prefix (`ORGANICLEVER_BE_PORT`,
`OSE_BE_PORT`).

**Why (historical)**: This asymmetry follows from who owns the binding. The Next.js dev server reads
`PORT` from the platform (PaaS or OS) with no indirection through app code. ASP.NET/Giraffe backends
bind whatever value _our own code_ reads from the environment, so the backend port is app-defined and
takes the prefix.

**Deviation from the private sibling**: the private sibling has no Next.js applications, so the web exemption is
structural rather than a policy divergence — the underlying rule (framework-reserved names stay
framework-named) is shared.

## Summary

All four policy decisions are aligned across both sibling repos after this plan. The only
structural delta is Decision 6 (Next.js `PORT` vs backend `PORT`) — a necessary consequence of the
mixed web/backend topology in ose-public that does not exist in the private sibling.

See: [`secrets-and-env-standards.md`](../../repo-governance/conventions/security/secrets-and-env-standards.md)
