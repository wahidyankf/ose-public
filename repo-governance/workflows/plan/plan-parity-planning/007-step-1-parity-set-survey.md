---
description: Empirically surveys every target repo's current state, including source-boundary checks and the survey-freshness re-run rule.
when_to_use: Use when starting a parity run, to build the per-repo state inventory the deviation matrix is built from.
---

# Step 1 — Parity-Set Survey (Per Repo, Parallelizable)

Before any mutation, derive the objective slug and record the common worktree basename and
corresponding short-lived branch mapping under
[Cross-Repository Parity Identity](../../../development/workflow/cross-repository-parity-identity.md).
Probe every intended identity in every target repository. If unavailable, prove the existing
identity belongs to this delivery or choose one common alternative for the full parity set.

Survey each target repo's current state relevant to the objective. Work empirically: read the
configs, grep the files, run the tools — do not trust docs alone.

**Scope of survey** (adapt to the objective's domain):

- Relevant commands (package.json scripts, Nx targets, Makefile rules, shell scripts)
- Configuration files that govern the objective's domain (CI YAML, lint configs, markdownlint,
  prettier, etc.)
- Agent definitions and workflow files that touch the objective's domain
- Plans already in `plans/in-progress/` or `plans/backlog/` addressing the same area
- Governance docs (conventions, development practices) the objective would affect
- Repo-specific constraints: CI runner type (self-hosted vs GitHub-hosted), private vs public
  visibility, language stack, existing toolchain, dual-CLI parity guards
- **Declared shared-source check** (whenever the objective names a local byte-identity boundary):
  run its documented validator in each bound repository. Any failure is drift that MUST become its
  own deviation-matrix row in Step 2 — surface it before grilling, never silently re-sync it.

**Survey freshness**: a clean survey is a point-in-time result, not a standing fact. If execution of a
phase that carries copy-ready artifacts (a file to be propagated verbatim, a cross-repository
assumption baked into a checklist step) begins any meaningful time after that phase's survey ran —
another contributor's concurrent work, a prior phase's own duration, a paused-and-resumed plan — re-run
this step's checks live immediately before executing, rather than trusting the recorded inventory.
A target repo's package baseline, environment scanner, test-target isolation, or even its bare-vs-normal
git topology can all change between survey and execution; a mechanically correct copy step built on a
stale inventory can revert newer work on the target or fail before establishing its own baseline.

**Output**: A per-repo state inventory plus the parity identity record. Every dimension the objective touches is inventoried for
every repo. Document what exists, what is absent, and any repo-specific constraint that will
affect what the plan must contain.

**Success criteria**: Every target repo has a state inventory covering all dimensions the
objective touches.

**On failure**: Surface the dimension or repo where the survey failed. Do not proceed to Step 2
until all inventories are complete.
