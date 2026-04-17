# Technical Documentation

## Rename mechanics

Three renames. Each rename = five mechanical steps:

1. `git mv .claude/agents/<old>.md .claude/agents/<new>.md`
2. `git mv .opencode/agent/<old>.md .opencode/agent/<new>.md`
3. Edit frontmatter `name:` field in both files.
4. Search-replace `<old>` → `<new>` across live markdown (see exclusions below).
5. Run `npm run sync:claude-to-opencode` to confirm no drift (should be no-op if step 2 was correct).

## Reference search strategy

Use `Grep` with pattern `<old-agent-name>` across repo. Exclude paths:

- `plans/done/**` — historical, frozen.
- `generated-reports/**` — historical, frozen.
- `.git/**`, `node_modules/**`, `dist/**`, `coverage/**`, `generated-contracts/**` — build artifacts.

Live reference categories to update (exhaustive list — each must be swept per rename):

- **Agent catalogs**: `.claude/agents/README.md`, `.opencode/agent/README.md`.
- **Agent bodies**: every file under `.claude/agents/*.md` and `.opencode/agent/*.md` (agents often name sibling agents in their own bodies).
- **Skills**: `.claude/skills/**/SKILL.md`, `.claude/skills/**/reference/**/*.md`, and `.opencode/skill/**/SKILL.md`.
- **Root catalogs**: `CLAUDE.md`, `AGENTS.md`.
- **Governance tree**: `governance/conventions/**`, `governance/development/**`, `governance/principles/**`, `governance/workflows/**`, `governance/vision/**`, `governance/README.md`, `governance/repository-governance-architecture.md`.
- **Docs tree**: `docs/tutorials/**`, `docs/how-to/**`, `docs/reference/**`, `docs/explanation/**`, `docs/README.md`.
- **Plans**: `plans/in-progress/**`, `plans/backlog/**`, `plans/ideas.md`, `plans/README.md` (if present).
- **App READMEs**: `apps/**/README.md` (content agents are often referenced in content-site docs).

After each rename, the success condition is: `Grep "<old-name>"` with the exclusion set above returns **zero** hits across all categories.

## Old → new mapping

### Agents

| Old                         | New                  | Rationale                                                                                               |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| `docs-link-general-checker` | `docs-link-checker`  | Drop misplaced "general" modifier; parallel to other `*-link-checker`.                                  |
| `swe-e2e-test-dev`          | `swe-e2e-dev`        | Drop redundant "test" token; parallel to other `swe-<qualifier>-dev`.                                   |
| `web-researcher`            | `web-research-maker` | Eliminate unique `-researcher` suffix; `maker` produces research output.                                |
| `repo-governance-maker`     | `repo-rules-maker`   | Align qualifier with workflow `repo-rules-quality-gate`; "rules" is the artifact the triad operates on. |
| `repo-governance-checker`   | `repo-rules-checker` | Same rationale; triad stays internally consistent.                                                      |
| `repo-governance-fixer`     | `repo-rules-fixer`   | Same rationale.                                                                                         |

### Workflows

| Old path / name                                                  | New path / name                                        | Rationale                                                                                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `governance/workflows/docs/quality-gate.md`                      | `governance/workflows/docs/docs-quality-gate.md`       | Align filename with existing `name: docs-quality-gate` frontmatter field.                                                                                                                        |
| `governance/workflows/repository/repository-rules-validation.md` | `governance/workflows/repo/repo-rules-quality-gate.md` | Directory rename `repository/` → `repo/` aligns workflow scope vocabulary with agent scope (agents already use `repo-*`). Filename drops `-validation`, adopts `-quality-gate` (iterative loop). |
| `governance/workflows/specs/specs-validation.md`                 | `governance/workflows/specs/specs-quality-gate.md`     | Iterative check-fix-verify loop = `quality-gate` type; drop ad-hoc `-validation`.                                                                                                                |

## Role Vocabulary documentation (AC4)

Replace (or add) the Naming Rule + Role Vocabulary sections in `.claude/agents/README.md`:

```markdown
## Naming Rule

Every agent filename follows: `<scope>(-<qualifier>)*-<role>`

- `scope` — top-level domain (`apps`, `docs`, `plan`, `repo`, `swe`, `ci`, `readme`, `specs`, `social`, `web`, `agent`).
- `qualifier` — zero or more refinement tokens (e.g., `ayokoding-web`, `link`, `ui`, `execution`).
- `role` — exactly one trailing token from the Role Vocabulary below.

No other structure is permitted. No exceptions.

## Role Vocabulary

| Role       | Semantics                                                 | Example agents                                               |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `maker`    | Produces a content/research artifact                      | `docs-maker`, `web-research-maker`                           |
| `checker`  | Validates an artifact against standards                   | `plan-checker`, `plan-execution-checker`, `swe-code-checker` |
| `fixer`    | Applies validated checker findings                        | `plan-fixer`, `swe-ui-fixer`                                 |
| `dev`      | Writes code in a language or test framework               | `swe-rust-dev`, `swe-e2e-dev`                                |
| `deployer` | Deploys an application to an environment                  | `apps-ayokoding-web-deployer`                                |
| `executor` | Executes a defined procedure or checklist                 | `plan-executor`                                              |
| `manager`  | Performs file or resource operations (rename/move/delete) | `docs-file-manager`                                          |
```

Then regenerate `.opencode/agent/README.md` via `npm run sync:claude-to-opencode`.

## Rule compliance audit (AC4 scenario 3)

After renames + README update, every `.claude/agents/*.md` filename must end in one of the seven role suffixes. Quick check:

```bash
ls .claude/agents/*.md \
  | sed 's|.*/||; s|\.md$||' \
  | grep -vE -- '-(maker|checker|fixer|dev|deployer|executor|manager)$' \
  | grep -v '^README$'
```

Expected output: empty. Any line printed is a rule violation.

## Workflow Type Vocabulary documentation (AC10)

Add Naming Rule + Type Vocabulary sections to `governance/workflows/README.md`:

```markdown
## Naming Rule

Every workflow filename follows: `<scope>(-<qualifier>)*-<type>`

- `scope` — top-level domain matching the parent directory (`ci`, `docs`, `plan`, `repo`, `specs`, `ui`, `infra`, `ayokoding-web`, etc.).
- `qualifier` — zero or more refinement tokens (e.g., `rules`, `by-example`, `software-engineering-separation`).
- `type` — exactly one trailing token from the Type Vocabulary below.

No other structure is permitted. No exceptions, except for reference material under `governance/workflows/meta/` (documented below).

## Type Vocabulary

| Type           | Semantics                                                  | Example workflows                                            |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `quality-gate` | Iterative maker → checker → fixer loop until zero findings | `ci-quality-gate`, `plan-quality-gate`, `specs-quality-gate` |
| `execution`    | Executes a defined procedure or plan against inputs        | `plan-execution`                                             |
| `setup`        | One-time environment or resource provisioning              | `development-environment-setup`                              |

## Meta reference exception

Files under `governance/workflows/meta/` are **reference documentation about the workflow system** (e.g., `execution-modes.md`, `workflow-identifier.md`). They describe how workflows work, not workflows themselves. They are exempt from the type-suffix rule.
```

## Workflow rule compliance audit (AC10 scenario 4)

After renames + README update, every workflow file outside `meta/` must end in one of the three type suffixes:

```bash
find governance/workflows -name '*.md' -not -name 'README.md' -not -path '*/meta/*' \
  | sed 's|.*/||; s|\.md$||' \
  | grep -vE -- '-(quality-gate|execution|setup)$'
```

Expected output: empty. Any line printed is a rule violation.

## Governance propagation (AC6)

The `.claude/agents/README.md` Naming Rule is a harness-local summary; the normative source must live under `governance/`. Use `repo-rules-maker` to create:

**File**: `governance/conventions/structure/agent-naming.md`

**Required content**:

- Standard YAML frontmatter (title, description, category: `explanation`, subcategory: `conventions`, tags: `[agents, naming, conventions]`, created: `2026-04-17`, updated: `2026-04-17`).
- "Why this rule exists" section — single rule, zero exceptions, enforceable by `repo-rules-checker`.
- "The Rule" section — `<scope>(-<qualifier>)*-<role>` with scope and qualifier definitions.
- "Scope Vocabulary" section — enumerated scopes: `agent`, `apps`, `ci`, `docs`, `plan`, `readme`, `repo`, `social`, `specs`, `swe`, `web`.
- "Role Vocabulary" section — the seven roles table (identical to README).
- "Applies To" section — both `.claude/agents/*.md` and `.opencode/agent/*.md`, must remain filename-identical.
- "Enforcement" section — compliance audit command, `repo-rules-checker` integration.
- "Examples" section — at least one example per role using current agents.
- Links to `.claude/agents/README.md` and `.opencode/agent/README.md` as operational catalogs.

**Cross-reference updates required by repo-rules-maker**:

- Add entry to `governance/conventions/structure/README.md` index.
- Add entry to `governance/conventions/README.md` master index.
- Add "See: agent-naming.md" link in `CLAUDE.md` under the AI Agents section.
- Add link from `.claude/agents/README.md` and `.opencode/agent/README.md` Naming Rule sections pointing to the convention as normative source.

## Governance propagation — workflow-naming (AC11)

Use `repo-rules-maker` to create a parallel convention for workflows:

**File**: `governance/conventions/structure/workflow-naming.md`

**Required content**:

- Standard YAML frontmatter (title: "Workflow Naming Convention", description, category: `explanation`, subcategory: `conventions`, tags: `[workflows, naming, conventions]`, created: `2026-04-17`, updated: `2026-04-17`).
- "Why this rule exists" section — single rule, zero exceptions (non-meta), enforceable by `repo-rules-checker`.
- "The Rule" section — `<scope>(-<qualifier>)*-<type>` with scope and qualifier definitions. Scope matches parent directory name.
- "Scope Vocabulary" section — enumerated scopes matching current directory structure (`ayokoding-web`, `ci`, `docs`, `infra`, `plan`, `repo`, `specs`, `ui`). Scope vocabulary aligned with agent-naming convention — both use `repo` (not `repository`).
- "Type Vocabulary" section — the three types table (identical to workflows README).
- "Meta reference exception" section — `governance/workflows/meta/` files exempt.
- "Applies To" section — all `governance/workflows/**/*.md` except `README.md` and `meta/**`.
- "Enforcement" section — compliance audit command, `repo-rules-checker` integration.
- "Examples" section — at least one example per type using current workflows.
- Links to `governance/workflows/README.md` as operational catalog; link to `governance/conventions/structure/agent-naming.md` as sibling rule.

**Cross-reference updates required by repo-rules-maker**:

- Add entry to `governance/conventions/structure/README.md` index.
- Add entry to `governance/conventions/README.md` master index (under Structure section).
- Add link to the convention in `governance/workflows/README.md` Naming Rule section as normative source.
- Add "See: workflow-naming.md" reference in `CLAUDE.md` (root).

## rhino-cli validator implementation (AC13)

Two new subcommands under the existing `<scope> validate-<facet>` pattern already used by `agents validate-claude`, `agents validate-sync`:

- `rhino-cli agents validate-naming`
- `rhino-cli workflows validate-naming` (requires a new `workflows.go` Cobra parent command)

### Shared validator core

Implement in `apps/rhino-cli/internal/naming/` a pure-function package:

```go
type Rule struct {
    Roles []string // agent role suffixes OR workflow type suffixes
    Exempt func(path string) bool
}

type Violation struct {
    Path     string
    Kind     string // "role-suffix" | "frontmatter-mismatch" | "mirror-drift" | "meta-in-wrong-dir"
    Message  string
}

func Validate(filenames []string, rule Rule) []Violation
func ValidateFrontmatter(path string, expected string) *Violation  // compares YAML `name:` against filename
```

Unit test this package directly with ≥90% coverage (pure functions, easy). The Cobra commands are thin wrappers that load the file list, call `Validate`, format violations, exit with the right code.

### Agent validator specifics

- Role vocabulary: `{maker, checker, fixer, dev, deployer, executor, manager}`.
- Sources: both `.claude/agents/*.md` and `.opencode/agent/*.md`, each file validated independently.
- Mirror-drift check: symmetric-difference of the two sets must be empty (every `.claude/agents/X.md` has `.opencode/agent/X.md` and vice versa).
- Frontmatter check: parse YAML front-matter, assert `name:` field equals filename (without `.md`).

### Workflow validator specifics

- Type vocabulary: `{quality-gate, execution, setup}`.
- Sources: `governance/workflows/**/*.md`, recursive.
- Exemptions: `governance/workflows/README.md` (index) and everything under `governance/workflows/meta/` (reference docs about the workflow system, per convention).
- Frontmatter check: same `name:` vs filename rule.

### Nx integration

Add Nx targets on the rhino-cli project:

- `nx run rhino-cli:validate:naming:agents` — runs `agents validate-naming`.
- `nx run rhino-cli:validate:naming:workflows` — runs `workflows validate-naming`.
- Both declared with `inputs` including the relevant source globs so Nx cache keys off only those files. `outputs: []` (pure validation, no artifacts).

### Gherkin + godog tests

Specs live under the existing `specs/apps/rhino/cli/gherkin/` layout — one `.feature` file per command, matching sibling commands (`agents-sync.feature`, `agents-validate-claude.feature`, etc.):

- `specs/apps/rhino/cli/gherkin/agents-validate-naming.feature` — scenarios mirror AC13 (role-suffix violation, frontmatter mismatch, mirror drift, happy path).
- `specs/apps/rhino/cli/gherkin/workflows-validate-naming.feature` — same (type-suffix violation, frontmatter mismatch, meta exemption, happy path).
- Update `specs/apps/rhino/cli/gherkin/README.md` index to enumerate both new features.
- If `specs/apps/rhino/README.md` lists available commands, append the two new ones.
- Step implementations live alongside existing godog suites in `apps/rhino-cli/cmd/` (follow the `agents_validate_claude_test.go` / `agents_validate_claude.integration_test.go` pair pattern). Use tmpdir fixtures with synthetic agent/workflow files for violation scenarios; `test:integration` exercises the real repo tree.

### Pre-push and CI integration (AC14)

- **Husky pre-push** (`.husky/pre-push`): add a gated block that runs `nx run rhino-cli:validate:naming:agents` only if `git diff --cached --name-only @{push}..HEAD` matches `.claude/agents/`, `.opencode/agent/`; same for workflows against `governance/workflows/`. Uses the same affected-based cache warmth strategy as existing pre-push targets.
- **CI** (`.github/workflows/` in ose-public): extend the existing quality-gate workflow with two unconditional steps running the two Nx targets. Cache hits make them nearly free on no-op PRs; forced runs catch drift from hand-edited files that bypassed the local hook.

## Risks & mitigations

- **Risk**: Broken internal links after rename. **Mitigation**: `Grep` sweep for old name returns zero matches outside frozen paths before commit; pre-commit link validation catches residuals.
- **Risk**: `.opencode/` drift if rename done manually in only one harness. **Mitigation**: `git mv` in both harnesses, run sync script, verify `git status`.
- **Risk**: External consumers (if any) referring to old agent names break. **Mitigation**: Repo is self-contained; agents invoked by name within repo only. No external API surface.

## Commit strategy

Thirteen commits total, split for bisect-clean history. Ordering matters:

- The `repo-governance-*` → `repo-rules-*` triad rename happens BEFORE the governance-propagation phases so those phases invoke the agent under its final name.
- The rhino-cli validators land AFTER all renames have settled, so the validators' first run finds zero violations and can be safely wired into pre-push/CI.

1. `refactor(agents): rename docs-link-general-checker to docs-link-checker` — Phase 1.
2. `refactor(agents): rename swe-e2e-test-dev to swe-e2e-dev` — Phase 2.
3. `refactor(agents): rename web-researcher to web-research-maker` — Phase 3.
4. `refactor(agents): rename repo-governance triad to repo-rules` — Phase 4 (atomic; triad co-references).
5. `docs(agents): publish naming rule and role vocabulary` — Phase 5.
6. `docs(governance): add agent-naming convention` — Phase 6 (via repo-rules-maker).
7. `refactor(workflows): rename docs/quality-gate to docs/docs-quality-gate` — Phase 7.
8. `refactor(workflows): move repository/ to repo/ and rename to repo-rules-quality-gate` — Phase 8.
9. `refactor(workflows): rename specs-validation to specs-quality-gate` — Phase 9.
10. `docs(workflows): publish naming rule and type vocabulary` — Phase 10.
11. `docs(governance): add workflow-naming convention` — Phase 11 (via repo-rules-maker).
12. `feat(rhino-cli): add agents validate-naming and workflows validate-naming` — Phase 12 (validators + Gherkin specs under `specs/apps/rhino/cli/gherkin/` + godog tests + Nx targets).
13. `feat(ci): enforce naming validators in pre-push and PR quality gate` — Phase 13 (Husky hook + CI workflow).
