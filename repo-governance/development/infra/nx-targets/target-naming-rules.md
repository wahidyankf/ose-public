---
description: "Canonical lifecycle and testing target vocabulary"
when_to_use: "Use when naming or reviewing an Nx target."
---

# Nx Target Naming Rules

- Use `dev` for development and `start` for production serving; never use `serve` aliases.
- Use `test:unit`, `test:integration`, and `test:e2e` only for runtime execution at the named
  boundary.
- Use `test:behaviour:coverage` only for RHINO's shared static behaviour check, which runs no test.
  Per-layer `test:coverage:<layer>` and aggregate `test:coverage` targets are retired.
- Use `test:quick` for the closed fast composition; never include Integration/E2E runtime.
- Separate variants with a colon and use lowercase kebab-case within each segment.
- Omit an inapplicable target; never provide an echo, no-op, sentinel, duplicate, or alias.
- Exception: an E2E project with no app of its own may use `serve` for a target that orchestrates
  multiple owned processes (for example a multi-process local stack with selectable fixture
  profiles) for manual verification. This is not a `dev`/`start` alias — the project has neither —
  and the E2E project explicitly needs a name distinct from `test:e2e`'s automated Gherkin run.
