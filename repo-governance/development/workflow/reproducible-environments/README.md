---
description: "Practices for creating consistent, reproducible development and build environments"
when_to_use: "Read this index to find the right Reproducible Environments child document."
---

# Reproducible Environments

- [Principles, Conventions, and Overview](./principles-conventions-and-overview.md) — The principles and conventions reproducible environments respect, and the five-part overview of what reproducibility requires. Use when tracing why reproducible-environment practices exist, or when orienting to the five areas this document covers.
- [Runtime Version Management with Volta](./runtime-version-management-with-volta.md) — How Volta pins and auto-switches Node.js/npm versions per project, plus installation and CI/CD integration. Use when pinning, installing, updating, or wiring Volta-managed Node.js/npm versions into CI.
- [Dependency Locking](./dependency-locking.md) — Lockfile discipline — npm ci over npm install, CI lockfile-freshness checks, and lockfile PR review practices. Use when installing dependencies, wiring CI lockfile checks, or reviewing a PR that changes package-lock.json.
- [Shared Cargo Target Directories](./shared-cargo-target-directories.md) — Records that the shared cargo target-directory symlink cache retired with the in-tree Doctor, and how to reclaim a leftover cache safely. Use when a crate's target/ is still a symlink into a shared cache, or when deciding whether worktrees share cargo build artifacts.
- [Containerization for Complex Environments](./containerization-for-complex-environments.md) — docker-compose.yml and a development Dockerfile pattern for local services and consistent build environments. Use when standing up local Postgres/Redis services via Docker Compose, or writing a development Dockerfile.
- [Documentation](./documentation.md) — README setup-instruction template, troubleshooting entries, and common development-task documentation examples. Use when writing or reviewing a README's setup/troubleshooting sections, or a project's common-tasks documentation.
- [Testing Reproducibility](./testing-reproducibility.md) — A verification script that checks Node.js/npm versions and lockfile presence match expectations, runnable in CI. Use when writing or wiring an environment-verification script into local dev or CI.
- [Troubleshooting](./troubleshooting.md) — Common reproducibility failure modes — CI/local drift, cross-machine install differences, and a workspace-hoisting gotcha. Use when diagnosing a "works on my machine but not CI/others" reproducibility failure.
- [Migration Guide](./migration-guide.md) — Step-by-step migration paths for adding Volta pinning or Docker Compose to an existing project. Use when retrofitting Volta version pinning or Docker Compose into a project that does not yet have them.
- [Git Identity Guardrail](./git-identity-guardrail.md) — No AI agent sets or modifies git identity at any scope; the human per-repository includeIf pattern and the CI service-account exemption. Use when an agent is about to run any git config user.\* command, or when setting up per-repository git identity as a human.
