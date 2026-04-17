# Agent and Workflow Naming Consistency

Audit of agent definitions in `.claude/agents/` (mirrored in `.opencode/agent/`) and workflow definitions in `governance/workflows/` surfaced naming inconsistencies that break the established structural patterns. This plan unifies both naming schemes under single documented rules with zero exceptions, renames outliers, updates all references, and codifies both rules as enforceable governance conventions.

## Scope

- Monorepo: `ose-public` only. No parent or `ose-infra` changes.
- Files touched:
  - Agents: `.claude/agents/*.md`, `.opencode/agent/*.md`, `.claude/agents/README.md`, `.opencode/agent/README.md`.
  - Workflows: `governance/workflows/**/*.md`, `governance/workflows/README.md`.
  - Governance: two new convention files + index updates.
  - Catalog: `CLAUDE.md`, `AGENTS.md`, active `docs/**`, active `governance/**`, active skills, in-progress plans.
- Frozen paths (no edits): `plans/done/**`, `generated-reports/**`.

## Goals

1. Rename six agents to restore agent pattern consistency (three correctness renames plus three `repo-governance-*` → `repo-rules-*` alignments with the workflow scope qualifier).
2. Rename three workflows (plus one directory `workflows/repository/` → `workflows/repo/`) to restore workflow pattern consistency.
3. Update every live reference across both scopes.
4. Publish an **Agent Naming Rule + Role Vocabulary** in `.claude/agents/README.md`.
5. Publish a **Workflow Naming Rule + Type Vocabulary** in `governance/workflows/README.md`.
6. Codify both rules as governance conventions (via the renamed `repo-rules-maker`):
   - `governance/conventions/structure/agent-naming.md`
   - `governance/conventions/structure/workflow-naming.md`
     Both enforceable by the renamed `repo-rules-checker`.
7. Implement mechanical enforcement in `apps/rhino-cli`:
   - `rhino-cli agents validate-naming` — parses every `.claude/agents/*.md` and `.opencode/agent/*.md` filename against the agent rule, checks frontmatter `name:` matches filename, exits non-zero on any violation.
   - `rhino-cli workflows validate-naming` — parses every `governance/workflows/**/*.md` filename (excluding `README.md` and `meta/`) against the workflow rule, checks frontmatter `name:` matches filename, exits non-zero on any violation.
8. Wire the new validators into the existing quality infrastructure:
   - **Husky pre-push hook** — runs both validators when staged changes touch `.claude/agents/**`, `.opencode/agent/**`, or `governance/workflows/**`.
   - **CI (PR quality gate)** — runs both validators unconditionally on every pull request against `main`.

## Non-Goals

- No new agents or workflows. No role/type additions beyond documented vocabulary. No behavior changes.
- No retroactive edits to `plans/done/` or `generated-reports/` — historical record.
- No scope-widening renames (e.g., `docs-link-*` → `repo-link-*`) even if scope technically broader; separate plan if warranted.
- Meta workflow reference docs (`governance/workflows/meta/execution-modes.md`, `workflow-identifier.md`) are NOT renamed — they are reference material about workflows, not workflows themselves. Documented as such in the workflow-naming convention.
- The rhino-cli validators check **structure** (filename pattern, vocabulary, frontmatter-filename match), not **semantics** (whether the role actually matches what the agent does). Semantic review stays with `repo-rules-checker`.

## Decisions (baked)

### Agent rule

`<scope>(-<qualifier>)*-<role>` where role ∈ {`maker`, `checker`, `fixer`, `dev`, `deployer`, `executor`, `manager`}.

Agent renames:

- `docs-link-general-checker` → `docs-link-checker` (drops misplaced "general" modifier).
- `swe-e2e-test-dev` → `swe-e2e-dev` (drops redundant "test" token).
- `web-researcher` → `web-research-maker` (eliminates unique `-researcher` suffix; `maker` produces research output).
- `repo-governance-maker` → `repo-rules-maker` (aligns qualifier with new workflow `repo-rules-quality-gate`; "rules" is the artifact the maker/checker/fixer triad operates on).
- `repo-governance-checker` → `repo-rules-checker` (same rationale).
- `repo-governance-fixer` → `repo-rules-fixer` (same rationale).

Under the unified agent rule, these are **consistent, not exceptions**: `plan-execution-checker`, `swe-code-checker`, `swe-ui-*`, `docs-file-manager`, `social-linkedin-post-maker`.

### Workflow rule

`<scope>(-<qualifier>)*-<type>` where type ∈ {`quality-gate`, `execution`, `setup`}.

Workflow type semantics:

- `quality-gate` — iterative maker → checker → fixer validation loop; terminates on zero-finding condition.
- `execution` — executes a defined procedure or plan against inputs; no iterative fix loop.
- `setup` — one-time environment, tooling, or resource provisioning.

Workflow renames (and one directory rename):

- **Directory**: `governance/workflows/repository/` → `governance/workflows/repo/` (align workflow scope vocabulary with agent scope vocabulary, which already uses `repo-*` — e.g., `repo-governance-checker`, `repo-workflow-checker`).
- `governance/workflows/docs/quality-gate.md` → `governance/workflows/docs/docs-quality-gate.md` (filename already diverges from `name:` frontmatter field which says `docs-quality-gate`; align filename with name).
- `governance/workflows/repository/repository-rules-validation.md` → `governance/workflows/repo/repo-rules-quality-gate.md` (combined directory rename, `repository` prefix → `repo`, and `-validation` → `-quality-gate` since iterative check-fix-verify loop; also update frontmatter `name:` to `repo-rules-quality-gate`).
- `governance/workflows/specs/specs-validation.md` → `governance/workflows/specs/specs-quality-gate.md` (iterative check-fix-verify loop = quality-gate; also update frontmatter `name:`).

Under the unified workflow rule, these are **consistent, not exceptions**: `plan-execution`, `development-environment-setup`, all `*-quality-gate` workflows.

The two files under `governance/workflows/meta/` (`execution-modes.md`, `workflow-identifier.md`) are reference documentation about the workflow system, not workflows. The convention explicitly documents this distinction.

## Companion docs

- [requirements.md](./requirements.md) — acceptance criteria in Gherkin.
- [tech-docs.md](./tech-docs.md) — rename mechanics, reference-update strategy, governance artifact specs.
- [delivery.md](./delivery.md) — step-by-step checklist.
