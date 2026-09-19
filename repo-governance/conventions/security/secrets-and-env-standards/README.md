---
description: "The authoritative hub for how this repository handles secrets and environment variables — naming convention, layout, annotation format, startup validation, tooling (./rhino env family), tiered injection standard (env-injection: section in repo-config.yml), storage tiers, and the env-contract drift guard."
when_to_use: "Read this index to find the right Secrets and Environment-Variable Standards child document."
---

# Secrets and Environment-Variable Standards

- [Principles Implemented/Respected](./principles-implemented-respected.md) — The five software-engineering principles the secrets-and-env standard implements — Reproducibility First, Explicit Over Implicit, Automation Over Manual, Root Cause Orientation, Documentation First.
- [Hard Iron Rule — No Secrets in Committed Files](./hard-iron-rule-no-secrets-in-committed-files.md) — The absolute rule that no system secret may enter any git-tracked file, why, where real secret values belong instead, and the cross-repo canonical doc name.
- [Secret-Exposure History Remediation](./secret-exposure-history-remediation.md) — The mandatory five-step incident procedure for a secret found in committed Git history — contain and rotate, inventory, rewrite, replace remote state, replace the PR.
- [Environment Variable Naming Standard](./environment-variable-naming-standard.md) — The variable-class naming rules (app-defined, framework-reserved, shared-service, tier-forbidden) and the list of framework-reserved exempt names.
- [Layout Standard — One Template per App](./layout-standard-one-template-per-app.md) — Where each app's env template lives, the no-duplication rule, the HUMAN-only rule for relocating real env files, and the library env-var declaration rule.
- [.env.example Annotation Format](./env-example-annotation-format.md) — The required comment-block format preceding every env var line in a .env.example template — REQUIRED/OPTIONAL, type, description, and placeholder rules.
- [Startup Validation](./startup-validation.md) — How Rust backends (dotenvy + envy) and TypeScript webs (@t3-oss/env-nextjs + zod) validate required env vars at startup or build time.
- [`./rhino env` Toolchain](./Rhino-env-toolchain.md) — The ./rhino env command family (backup, restore, init, validate), the backup-scope registry, and the env-contract section that drives drift validation.
- [Tiered Injection Standard](./tiered-injection-standard.md) — How a declared .env.example key is injected into each running surface across GitHub Actions, Vercel, and the backend container/k3s path — introduction and source-of-truth rule.
- [Variable Classes with Injection Homes](./variable-classes-with-injection-homes.md) — The four variable classes (app-runtime server, app-runtime public build, CI test-harness, platform-injected) and where each is injected, including why VERCEL_AUTOMATION_BYPASS_SECRET is load-bearing.
- [Injection Matrix](./injection-matrix.md) — The full table mapping each app type and deploy stage to its injection platform, injection home, and value owner, plus the two load-bearing boundaries it implies.
- [infra/dev/<stack> Compose Env — No Duplicate Templates](./infra-dev-compose-env-no-duplicate-templates.md) — Why compose stacks must not introduce a second .env.example key list, and how they load a gitignored local .env with CI overrides instead.
- [GitHub Environment Key Registry](./github-environment-key-registry.md) — Which `vars.`/`secrets.` keys each named GitHub environment holds, and when to
  omit an empty environment.
- [`env-injection:` Section — Value-Less Injection Manifest](./env-injection-section-value-less-injection-manifest.md) — The repo-config.yml env-injection section that declares, per app, the injection home for every key at every stage, and how it feeds the validate-env manifest-consistency check.
- [Secret-Surface Census](./secret-surface-census.md) — The full inventory of every secret-bearing surface in the repo — app env files, .secrets/, secrets.json, IaC vars, and each platform's environment — with backing tool, backup, and validation status.
- [`guard-env-file-access` Policy](./guard-env-file-access-policy.md) — The agent-access policy denying direct Read/Write/Edit of .env.prod and .env.stag, its decoupling from commit policy, its exceptions, and its enforcement mechanism plus residual gap.
- [Tiered Env Files — the `APP_ENV` Contract](./tiered-env-files-the-app-env-contract.md) — How an app selects its runtime tier via APP_ENV and loads exactly one .env.<tier> file, the fallback rule for a missing tier file, and the local/test/stag/prod agent-access table.
- [Content-Fixture Exclusion](./content-fixture-exclusion.md) — The dotfile-shaped rule that lets a non-dotfile <word>.env course fixture under apps/<app>/content/\*\* bypass guard-env-file-access.
- [Content-Fixture Exclusion — Enforcement Surfaces](./content-fixture-exclusion-enforcement-surfaces.md) — Which surface (hook, settings.json, opencode.json, Codex config, staged-guard) carries the content-fixture exclusion, the Codex glob gotcha, and the accepted residual gap for non-dotfile real env files.
