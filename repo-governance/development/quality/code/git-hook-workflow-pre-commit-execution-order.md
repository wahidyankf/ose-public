---
description: "The pre-commit hook's location and gate steps."
when_to_use: "Use to trace what runs on git commit."
---

# Git Hook Workflow: Pre-commit Hook (Execution Order)

## Pre-commit Hook

**Location**: `.husky/pre-commit`

**Execution Order**:

1. You run `git commit`
2. Pre-commit hook triggers (`.husky/pre-commit` — a thin shim that sets
   `RHINO_GATE_SURFACE=pre-commit` and runs `./rhino gate run --surface pre-commit` inside a
   `./hippo run` boundary)
3. `gate run --surface pre-commit` runs every registry-declared `pre-commit` gate in declaration
   order, failing fast. The gate set is registry-driven — discover it rather than trusting a copy:

   ```bash
   ./rhino gate list
   ```

   The declaration order puts the public-safety tree screen first, then the `format-staged`
   formatter mutation, then deterministic checks covering repository configuration, environment
   policy, Markdown lint and validators, the emoji convention, and the shell, Dockerfile, and
   workflow linters.
   Gates with a `files` input receive only the staged paths; the rest check their whole declared
   surface.

4. Commit proceeds if no gate fails

Pre-commit never runs `test:quick`, Unit, Integration, or E2E runtime. See
[Git Hook Lifecycle](../../workflow/git-hook-lifecycle.md) for the shared mechanism and
[Staged Formatting Gate](./staged-formatting-gate.md) for how formatting reaches the index.

**Implementation**: the pinned Rhino executable owns dispatch; each declared gate runs only through
its explicit command vector in `repo-config.yml`.
