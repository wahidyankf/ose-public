---
description: The the retired spec validation surface validation commands and their default app selection
when_to_use: Read this when running or configuring the retired spec validation surface validate-* commands.
---

# Deterministic Validation (Rhino)

The following `the retired spec validation surface` commands validate the directory structure mechanically:

| Command                             | What it checks                                                             |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `the declared spec-tree check`      | Top-level folders match the canonical five — no flat-root artifacts remain |
| `the declared spec-count check`     | README count claims match actual `.feature` file counts                    |
| `./rhino md internal-link validate` | Markdown link integrity within the spec tree                               |
| `the declared adoption check`       | BDD/Contracts adoption gaps per surface profile                            |

These commands run as part of the `specs-quality-gate` workflow deterministic-offload pass. See [Deterministic Offload](./pre-push-ci-llm-validation-deterministic-offload-and-related-documentation.md#deterministic-offload) in the next section.

## Allowlist-driven default app selection

`validate-adoption`, `validate-tree`, `validate-counts`, and `validate-links` all accept the same three calling shapes:

- Positional `<folder>` or `<app>` — single-target legacy behaviour preserved.
- `--apps <csv>` — multi-app validation across an explicit list.
- No positional, no flag — validates nothing; `specs structure validate` is the wired entry point and discovers every directory under `specs/apps/`.

Pre-push and CI surfaces invoke `specs structure validate` without arguments, so a new app is picked up by folder discovery alone.
