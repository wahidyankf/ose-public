---
description: The five software-engineering principles the secrets-and-env standard implements — Reproducibility First, Explicit Over Implicit, Automation Over Manual, Root Cause Orientation, Documentation First.
when_to_use: Use when you need to justify a secrets/env-handling rule in terms of the repository's core principles.
---

# Principles Implemented/Respected

- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: Env templates
  (`*.env.example`) are committed; real values stay in gitignored files. A checkout is reproducible
  by design — no credential is bundled.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Every
  env var is declared by name, class, and type in `.env.example`; startup validators fail fast when a
  required var is absent.
- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: The
  `./rhino env` toolchain (backup, restore, init, validate) and the `env-contract:` section in
  `repo-config.yml` eliminate manual cross-checking between templates and code.
- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: The drift guard
  (`env validate`) catches mismatches at the source, not in production. The hard no-secrets rule
  prevents exposure at the origin — not just after-the-fact scrubbing.
- **[Documentation First](../../../principles/content/documentation-first.md)**: Every rule is codified
  here so it is discoverable and binding regardless of which agent platform or human performs the work.
