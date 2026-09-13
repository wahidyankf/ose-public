# PRD — Rename `repo-governance/` to `repo-governance/`

## Product Overview

A mechanical rename of one top-level directory and all its path references. No new features, no
behavior changes. The rename is a pure refactor: the directory's purpose, contents, and internal
structure are identical before and after.

## Personas

- **Contributor (new)**: sees `repo-governance/` and immediately understands it is repository-scoped
- **AI agent**: receives unambiguous paths in instruction files and avoids GRC misinterpretation
- **Tooling/CI**: continues to resolve paths without error after reference updates

## User Stories

1. As a new contributor, I want the governance directory name to make its scope obvious so I don't
   confuse it with a GRC program.
2. As an AI agent, I want instruction files to contain the correct path tokens so I navigate the
   repo without broken links.
3. As a CI system, I want all automation (pre-push hook, rhino-cli targets, validate scripts) to
   reference the correct paths so pipelines don't break.

## Acceptance Criteria

```gherkin
Scenario: Directory renamed
  Given the ose-public repo at HEAD
  When the rename is applied
  Then `repo-governance/` exists at repo root
  And `repo-governance/` does not exist at repo root

Scenario: No stray path references remain in functional files
  Given the rename has been applied
  When grep is run for "repo-governance/" in *.go and *.sh files
  Then zero matches are found outside the repo-governance/ directory itself

Scenario: Pre-push hook still functions
  Given the rename has been applied
  When a commit is created and pre-push triggers
  Then the hook runs without path-not-found errors

Scenario: rhino-cli lint target passes
  Given the rename has been applied
  When `npx nx run rhino-cli:lint` is run
  Then it exits 0

Scenario: rhino-cli test:unit passes
  Given the rename has been applied
  When `npx nx run rhino-cli:test:unit` is run
  Then it exits 0

Scenario: Markdown lint passes
  Given the rename has been applied
  When `npm run lint:md` is run
  Then it exits 0 with no link errors for repo-governance/ paths
```

## Product Scope

**In scope:**

- `repo-governance/` directory rename via `git mv`
- All `repo-governance/` path tokens in `.md`, `.sh`, `.go`, `.json`, `.yaml`, `.yml`, `.feature` files
- Parent repo `~/ose-projects/CLAUDE.md`

**Out of scope:**

- Prose occurrences of the word "governance" without a trailing `/` (not a path token)
- Content within governance files
- `ose-infra` or `ose-primer` governance directories

## Product Risks

| Risk                                | Severity | Note                                                                             |
| ----------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Missed reference in generated files | Low      | `.nx/workspace-data/` auto-regenerates; `.out` files regenerate on next test run |
| Broken worktree branch paths        | Low      | `worktrees/` excluded from sed; worktrees recreated fresh                        |
