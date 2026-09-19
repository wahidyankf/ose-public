---
description: "The authoritative hub for how this repository handles secrets and environment variables — naming convention, layout, annotation format, startup validation, tooling (./rhino env family), tiered injection standard (env-injection: section in repo-config.yml), storage tiers, and the env-contract drift guard."
when_to_use: Use when you need any rule about handling secrets or environment variables in this repository — naming, storage, injection, or agent access.
---

# Secrets and Environment-Variable Standards

This document is the single authoritative reference for how this repository handles secrets and
environment variables. The three prior docs that covered overlapping ground now redirect here:

- [`no-secrets-in-committed-files.md`](../security/no-secrets-in-committed-files.md) — hard iron rule stub
- [`env-file-access.md`](../security/env-file-access.md) — `guard-env-file-access` policy stub
- [`reproducible-environments.md`](../../development/workflow/reproducible-environments.md) — `.env.example` pattern stub

## In This Standard

- [Principles Implemented/Respected](./secrets-and-env-standards/principles-implemented-respected.md) — Principles this standard implements
- [Hard Iron Rule — No Secrets in Committed Files](./secrets-and-env-standards/hard-iron-rule-no-secrets-in-committed-files.md) — The no-secrets-in-git rule
- [Secret-Exposure History Remediation](./secrets-and-env-standards/secret-exposure-history-remediation.md) — Incident procedure for a leaked secret
- [Environment Variable Naming Standard](./secrets-and-env-standards/environment-variable-naming-standard.md) — Variable classes and prefixing
- [Layout Standard — One Template per App](./secrets-and-env-standards/layout-standard-one-template-per-app.md) — Where env templates live
- [.env.example Annotation Format](./secrets-and-env-standards/env-example-annotation-format.md) — The required comment-block format
- [Startup Validation](./secrets-and-env-standards/startup-validation.md) — Rust and TypeScript startup/build validation
- [`./rhino env` Toolchain](./secrets-and-env-standards/Rhino-env-toolchain.md) — The backup/restore/init/validate commands
- [Tiered Injection Standard](./secrets-and-env-standards/tiered-injection-standard.md) — How a key is injected — source of truth
- [Variable Classes with Injection Homes](./secrets-and-env-standards/variable-classes-with-injection-homes.md) — The four variable classes
- [Injection Matrix](./secrets-and-env-standards/injection-matrix.md) — App-type × stage × platform mapping
- [infra/dev/\<stack\> Compose Env](./secrets-and-env-standards/infra-dev-compose-env-no-duplicate-templates.md) — No duplicate templates rule
- [GitHub Environment Key Registry](./secrets-and-env-standards/github-environment-key-registry.md) — vars./secrets. per environment
- [`env-injection:` Manifest](./secrets-and-env-standards/env-injection-section-value-less-injection-manifest.md) — Per-app, per-stage injection homes
- [Secret-Surface Census](./secrets-and-env-standards/secret-surface-census.md) — Inventory of secret-bearing surfaces
- [`guard-env-file-access` Policy](./secrets-and-env-standards/guard-env-file-access-policy.md) — Which .env\* files agents may open
- [Tiered Env Files — the `APP_ENV` Contract](./secrets-and-env-standards/tiered-env-files-the-app-env-contract.md) — The tier-file loading contract
- [Content-Fixture Exclusion](./secrets-and-env-standards/content-fixture-exclusion.md) — Rule for course env fixtures
- [Content-Fixture Exclusion — Enforcement Surfaces](./secrets-and-env-standards/content-fixture-exclusion-enforcement-surfaces.md) — Which surface carries it, plus the Codex gotcha

## Related Documents

- [`no-secrets-in-committed-files.md`](../security/no-secrets-in-committed-files.md) — hard iron rule (stub)
- [`env-file-access.md`](../security/env-file-access.md) — `guard-env-file-access` agent policy (stub)
- [`reproducible-environments.md`](../../development/workflow/reproducible-environments.md) — environment setup (stub)
- [`docs/explanation/standardize-secrets-and-env-parity-decisions.md`](../../../docs/explanation/standardize-secrets-and-env-parity-decisions.md) — cross-repo parity decisions
- [`repo-config.yml`](../../../repo-config.yml) — unified config hub (`env-contract:` and `env-injection:` sections)

## IaC Forward Scaffold

Terraform and Ansible surfaces are documented in the `env-contract:` section of `repo-config.yml`
as **commented forward-scaffold** entries — syntactically present but inactive. Uncomment and fill
in `root` when IaC surfaces are added
to the repository. This prevents the drift guard from producing false findings before IaC exists while
ensuring the pattern is immediately available when it does.
