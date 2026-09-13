# Tech Docs — Rename `repo-governance/` to `repo-governance/`

## Architecture

Six sed passes + three `git mv` operations:

| Pass | Token                                                           | Scope                                      | What it covers                                                |
| ---- | --------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| A    | `governance/` → `repo-governance/`                              | All text files (excl. `.opencode/agents/`) | Path tokens with trailing slash                               |
| B    | `"governance"` → `"repo-governance"`                            | `*.go` only                                | Bare quoted directory-name string literals + test fixtures    |
| C    | `repo-governance vendor-audit` → `repo-governance vendor-audit` | All text files                             | CLI verb (space-separated, no slash)                          |
| D    | `repo-governance-vendor-audit` → `repo-governance-vendor-audit` | All text files                             | Hyphenated form: Nx target, Gherkin tag, spec/convention refs |
| E    | Go package rename (manual + sed)                                | `internal/repo-governance/`                | Package decl + import paths                                   |
| F    | Cobra cmd rename (manual)                                       | `cmd/governance.go` + callers              | `Use:`, variable name, registration                           |

Plus one sync command after agents update: `npm run sync:claude-to-opencode`.

No logic changes. No schema changes. No API changes.

---

## Pass A — Path Tokens (`repo-governance/`)

Catches all string literals with a trailing slash across `.md`, `.sh`, `.go`, `.json`, `.yaml`,
`.yml`, `.feature` files.

**Important exclusion**: `.opencode/agents/` is EXCLUDED. Those files are auto-generated from
`.claude/agents/`. Applying Pass A there and then running the sync would produce a double-update.
Instead: update `.claude/agents/` via Pass A, then regenerate `.opencode/agents/` via
`npm run sync:claude-to-opencode`.

Agent/skill files caught by Pass A [Repo-grounded, 73 agent + 37 skill files]:

- All `repo-governance/` path links in `.claude/agents/*.md` (relative links pointing into `repo-governance/conventions/`, `repo-governance/development/`, etc.)
- Functional glob patterns in `repo-rules-checker.md` lines 648–656
- Directory checks in `repo-rules-fixer.md` line 267
- Layer-to-path mapping in `repo-understanding-repository-architecture/SKILL.md` lines 44–49

Workflow files caught by Pass A [Repo-grounded]:

- `repo-governance/workflows/meta/workflow-identifier.md` (7 refs)
- `repo-governance/workflows/README.md` (6 refs)
- `repo-governance/workflows/repo/repo-rules-quality-gate.md` (2 refs)
- `repo-governance/workflows/repo/repo-cross-vendor-parity-quality-gate.md` (2 refs)
- `repo-governance/workflows/plan/plan-execution.md` (2 refs)

Spec files caught by Pass A:

- `specs/apps/rhino/behavior/cli/gherkin/workflows-validate-naming.feature` —
  `repo-governance/workflows/meta/` in scenario steps

---

## Pass B — Bare Go String Literals (`"governance"`)

Scoped to `*.go` only. Catches `filepath.Join` segments, default-value assignments, test fixtures.

| File                                              | Line    | Pattern                                              |
| ------------------------------------------------- | ------- | ---------------------------------------------------- |
| `apps/rhino-cli/cmd/governance_vendor_audit.go`   | 52      | `scanPath := "governance"`                           |
| `apps/rhino-cli/cmd/workflows_validate_naming.go` | 81      | `filepath.Join(repoRoot, "governance", "workflows")` |
| `apps/rhino-cli/cmd/docs_validate_mermaid.go`     | 209     | `filepath.Join(repoRoot, "governance")`              |
| `apps/rhino-cli/internal/docs/links_scanner.go`   | 78      | `[]string{"governance", "docs", ".claude"}`          |
| 13 test occurrences (`*_test.go`)                 | various | Mock paths + default-path assertions                 |

**Safety**: import paths like `"github.com/.../internal/governance"` do NOT match bare `"governance"`.

---

## Pass C — CLI Verb (`repo-governance vendor-audit` with space)

NOT caught by Pass A (no slash). Applies to all text file types.

Confirmed locations [Repo-grounded]:

| File                                                                         | Lines                      | Content                                         |
| ---------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| `apps/rhino-cli/project.json`                                                | 98                         | `repo-governance vendor-audit repo-governance/` |
| `apps/rhino-cli/scripts/validate-cross-vendor-parity.sh`                     | 40, 41, 50, 51             | `repo-governance vendor-audit ...`              |
| `repo-governance/conventions/structure/governance-vendor-independence.md`    | 110, 200, 212, 218, 232    | CLI usage examples                              |
| `specs/apps/rhino/behavior/cli/gherkin/repo-governance-vendor-audit.feature` | 10, 16, 22, 28, 34, 40, 46 | Gherkin step text                               |
| Any agent/skill help text mentioning the CLI verb                            | various                    | Documentation                                   |

---

## Pass D — Hyphenated Form (`repo-governance-vendor-audit`)

NOT caught by Pass A (no slash). Applies to all text file types.

Confirmed locations [Repo-grounded]:

| File                                                                         | Lines      | Content                                                      |
| ---------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `apps/rhino-cli/project.json`                                                | target key | `validate:repo-governance-vendor-audit`                      |
| `.husky/pre-push`                                                            | —          | `npx nx run rhino-cli:validate:repo-governance-vendor-audit` |
| `repo-governance/conventions/structure/governance-vendor-independence.md`    | 221, 232   | Nx target reference                                          |
| `specs/apps/rhino/behavior/cli/gherkin/README.md`                            | 22         | Feature file entry                                           |
| `specs/apps/rhino/behavior/cli/gherkin/repo-governance-vendor-audit.feature` | 1          | `@repo-governance-vendor-audit` tag                          |

**Note**: The `.feature` file itself is named `repo-governance-vendor-audit.feature` — it also needs a
`git mv` (see §File Renames below).

---

## Pass E — Go Package Rename (`internal/governance` → `internal/repo-governance`)

Module: `github.com/wahidyankf/ose-public/apps/rhino-cli` [Repo-grounded]

### Files in `internal/repo-governance/` [Repo-grounded]

| File                                                       | Package declaration  |
| ---------------------------------------------------------- | -------------------- |
| `internal/repo-governance/governance_vendor_audit.go`      | `package governance` |
| `internal/repo-governance/governance_vendor_audit_test.go` | `package governance` |

### E1 — `git mv`

```bash
git mv apps/rhino-cli/internal/governance apps/rhino-cli/internal/repo-governance
```

### E2 — Package declarations

Go disallows hyphens in package names. New name: **`package repogovernance`**

Update both files in `internal/repo-governance/`.

### E3 — Import paths (3 files) [Repo-grounded]

Files: `cmd/governance_vendor_audit.go`, `cmd/governance_vendor_audit_test.go`, `cmd/golden_test.go`

Use import alias `governance` to preserve all call sites (`governance.Walk(...)` unchanged):

```go
// before
"github.com/wahidyankf/ose-public/apps/rhino-cli/internal/governance"

// after
governance "github.com/wahidyankf/ose-public/apps/rhino-cli/internal/repo-governance"
```

---

## Pass F — Cobra Command Rename (manual)

| File                                                    | Change                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/rhino-cli/cmd/governance.go` line 6               | `Use: "governance"` → `Use: "repo-governance"`                        |
| `apps/rhino-cli/cmd/governance.go` line 7               | `Short:` update prose                                                 |
| `apps/rhino-cli/cmd/governance.go` line 8               | `Long:` update prose                                                  |
| `apps/rhino-cli/cmd/governance.go` var                  | `governanceCmd` → `repoGovernanceCmd`                                 |
| `apps/rhino-cli/cmd/governance_vendor_audit.go` line 43 | `governanceCmd.AddCommand(...)` → `repoGovernanceCmd.AddCommand(...)` |

---

## File Renames (git mv)

Three directories/files renamed via `git mv`:

| Old path                                                                     | New path                                                                     |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `repo-governance/`                                                           | `repo-governance/`                                                           |
| `apps/rhino-cli/internal/repo-governance/`                                   | `apps/rhino-cli/internal/repo-governance/`                                   |
| `specs/apps/rhino/behavior/cli/gherkin/repo-governance-vendor-audit.feature` | `specs/apps/rhino/behavior/cli/gherkin/repo-governance-vendor-audit.feature` |

---

## OpenCode Agent Sync

`.opencode/agents/` (73 files) are auto-generated mirrors of `.claude/agents/`. Do NOT apply Pass A
to `.opencode/agents/` directly. After all `.claude/agents/` updates are complete, regenerate:

```bash
npm run sync:claude-to-opencode
```

---

## Full File Impact Summary

### Critical — functional breakage if missed

| File                                                                 | Pass(es)      | Risk if missed                            |
| -------------------------------------------------------------------- | ------------- | ----------------------------------------- |
| `apps/rhino-cli/cmd/governance_vendor_audit.go`                      | A, B, E       | Scan uses wrong path; broken import       |
| `apps/rhino-cli/cmd/workflows_validate_naming.go`                    | A, B          | Wrong workflow walk root                  |
| `apps/rhino-cli/cmd/docs_validate_mermaid.go`                        | A, B          | Wrong Mermaid default dir                 |
| `apps/rhino-cli/internal/docs/links_scanner.go`                      | B             | Wrong default scan dirs                   |
| `apps/rhino-cli/internal/docs/links_categorizer.go`                  | A             | Wrong exclusion logic                     |
| `apps/rhino-cli/internal/repo-governance/governance_vendor_audit.go` | A, E          | Wrong exemption path; broken pkg          |
| `apps/rhino-cli/cmd/governance.go`                                   | F             | CLI verb unchanged — subcommand not found |
| `apps/rhino-cli/project.json`                                        | A, C, D       | Wrong CLI verb; wrong Nx target key       |
| `.husky/pre-push`                                                    | D             | Hook invokes non-existent Nx target       |
| `apps/rhino-cli/scripts/validate-cross-vendor-parity.sh`             | A, C          | Wrong CLI verb + wrong paths              |
| `specs/.../repo-governance-vendor-audit.feature`                     | C, D + git mv | Wrong CLI verb in step text; tag mismatch |

### High-impact documentation

| Group                                                                     | Pass     | Refs                   |
| ------------------------------------------------------------------------- | -------- | ---------------------- |
| Root docs (`AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`)      | A        | ~56                    |
| `.claude/agents/` (73 files)                                              | A        | ~500                   |
| `.claude/skills/` (37 files)                                              | A        | ~300                   |
| `.opencode/agents/` (73 files)                                            | sync cmd | ~500 (regenerated)     |
| `docs/metadata/external-links-status.yaml`                                | A        | ~50                    |
| `repo-governance/conventions/structure/governance-vendor-independence.md` | A, C, D  | CLI + target refs      |
| `specs/apps/rhino/` (9 files)                                             | A, C, D  | Path + verb + tag refs |

### Cross-repo

| File                                       | Refs                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `~/ose-projects/CLAUDE.md` [Repo-grounded] | 1 (`ose-public/repo-governance/` occurrence; the parent's own `./repo-governance/` refs are unaffected) |

### Excluded

| Path                    | Reason                                            |
| ----------------------- | ------------------------------------------------- |
| `.nx/workspace-data/`   | Auto-regenerated by Nx                            |
| `worktrees/`            | Live branches, recreated fresh                    |
| `*.out` / `cover.out`   | Test coverage output, regenerated                 |
| `archived/` search JSON | Stale Hugo static build artifact                  |
| `.opencode/agents/`     | Regenerated via `npm run sync:claude-to-opencode` |

---

## Design Decisions

**Pass A excludes `.opencode/agents/`**
These files are auto-generated from `.claude/agents/`. Applying Pass A then sync would double-update
or produce inconsistent state. Correct sequence: update source (`.claude/`), then sync.

**Import alias `governance` for the renamed package**
Using `import governance "...internal/repo-governance"` preserves all `governance.Walk(...)` call
sites. Minimises diff noise while making import path accurate.

**`repo-governance-vendor-audit.feature` file rename**
The filename itself is the hyphenated form. Pass D updates text content; a `git mv` renames the
file. Both needed.

**Test fixtures updated**
User decision: maximum consistency. Pass B covers all bare `"governance"` in `*_test.go`.

---

## Rollback

```bash
# 1. Reverse directory + file renames
git mv repo-governance governance
git mv apps/rhino-cli/internal/repo-governance apps/rhino-cli/internal/governance
git mv specs/apps/rhino/behavior/cli/gherkin/repo-governance-vendor-audit.feature \
       specs/apps/rhino/behavior/cli/gherkin/repo-governance-vendor-audit.feature

# 2. Reverse Pass A
find . -not -path './.git/*' -not -path './node_modules/*' \
  -not -path './.nx/*' -not -path './worktrees/*' -not -path './.opencode/agents/*' \
  -not -name '*.out' \
  -type f \( -name '*.md' -o -name '*.sh' -o -name '*.go' -o -name '*.json' \
    -o -name '*.yaml' -o -name '*.yml' -o -name '*.feature' \) \
  | xargs grep -l 'repo-governance/' \
  | xargs sed -i '' 's|repo-governance/|repo-governance/|g'

# 3. Reverse Pass B
find apps/rhino-cli -name '*.go' | xargs grep -l '"repo-governance"' \
  | xargs sed -i '' 's|"repo-governance"|"governance"|g'

# 4. Reverse Pass C
find . ... -type f ... | xargs grep -l 'repo-governance vendor-audit' \
  | xargs sed -i '' 's|repo-governance vendor-audit|repo-governance vendor-audit|g'

# 5. Reverse Pass D
find . ... -type f ... | xargs grep -l 'repo-governance-vendor-audit' \
  | xargs sed -i '' 's|repo-governance-vendor-audit|repo-governance-vendor-audit|g'

# 6. Reverse Pass E — edit package decls and import aliases manually

# 7. Reverse Pass F — edit cmd/governance.go manually

# 8. Re-sync OpenCode agents
npm run sync:claude-to-opencode

# 9. Restore parent CLAUDE.md
sed -i '' 's|ose-public/repo-governance/|ose-public/repo-governance/|g' \
  ~/ose-projects/CLAUDE.md
```

---

## Dependencies

None. Independent of `rhino-cli-dry-and-exhaustive-enums` (touches enum logic, not paths).
