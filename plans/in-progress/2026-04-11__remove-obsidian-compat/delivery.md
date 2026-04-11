# Delivery Checklist — Remove Obsidian Compatibility from Docs

This document is the phase-by-phase execution plan. Each checkbox represents one concrete, independently verifiable action. Phases execute sequentially; validation gates between phases must pass before proceeding.

## Commit Guidelines

- [ ] Commit each phase separately using the message specified at the end of that phase
- [ ] Follow Conventional Commits: `<type>(<scope>): <description>`
- [ ] If a single phase's work touches multiple unrelated domains (e.g., rhino-cli + `.claude/` + `governance/`), split into separate commits within that phase rather than producing one multi-domain commit
- [ ] Review `git log --oneline` before Phase 8 to confirm clean segmentation

## Environment Setup (Before Phase 1)

- [x] Run `npm install` to ensure all dependencies are current
- [x] Run `npm run doctor` to verify required tool versions (Node.js, Volta, Go, etc.)
- [x] Run `nx run rhino-cli:test:quick` to confirm rhino-cli tests pass before any changes
- [x] Run `npm run lint:md` to confirm zero markdown lint errors before any changes
- [x] Run `npx nx affected -t typecheck lint test:quick spec-coverage` to confirm all affected targets pass before changes; fix ALL failures before proceeding

**Baseline 2026-04-11**: rhino-cli coverage 90.64%. Doctor 19/19 OK. Lint 0 errors (3224 files). Affected: no tasks (main ahead of origin).

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes. This follows the root cause orientation principle — proactively fix preexisting errors encountered during work.

## Phase 1 — Inventory and Baseline

**Goal**: Capture the current state and catch collisions before any destructive action.

- [x] Create `local-temp/` if missing for scratch files
- [x] Enumerate all files under `docs/.obsidian/` and save to `local-temp/obsidian-vault-files.txt`
- [x] Enumerate all `docs/**/*__*.md` files and save to `local-temp/obsidian-prefixed-files.txt`
- [x] Count total docs markdown files and prefixed files; record baseline in the plan's execution notes
- [x] Run `ripgrep -il obsidian` across the repo and save the filtered list (excluding `plans/done/`, `.opencode/`, `apps/oseplatform-web/content/updates/`, `docs/metadata/external-links-status.yaml`, `.gitignore`) to `local-temp/obsidian-references.txt` (`.gitignore` excluded here because Phase 2 handles it explicitly)
- [x] Generate the rename mapping TSV at `local-temp/obsidian-rename-mapping.tsv` using the command in `tech-docs.md` §2.1
- [x] Run the collision check (`awk -F'\t' '{print $2}' ... | sort | uniq -d`); record output to `local-temp/obsidian-rename-collisions.txt`
- [x] If collisions exist, edit the mapping file to resolve each with a descriptive suffix (no prefix reintroduction)
- [x] Re-run the collision check after edits; confirm zero duplicates
- [x] Grep `nx.json`, root `package.json`, `.github/workflows/`, and deploy scripts for any reference to a prefixed `docs/*__*.md` filename; document findings
- [x] Verify `ayokoding-cli links check` scope (read its README) and note whether it covers `docs/`
- [x] Commit the mapping file contents via a short summary in execution notes (do **not** commit `local-temp/` itself — it is scratch space)

### Phase 1 gate

- [x] Baseline counts recorded
- [x] Zero collisions remain in the mapping
- [x] Open Questions in `tech-docs.md` §10 are resolved or deferred explicitly

**Phase 1 summary**:

- Vault files: 9 under `docs/.obsidian/`
- Prefixed files: 304 under `docs/**/*__*.md`
- Total docs markdown files: 352 (so 48 non-prefixed, matching expectation)
- Obsidian references (active): 24 files (after filtering historical)
- Rename mapping: 304 entries
- Collisions: 0
- nx.json / package.json / .github/workflows/: zero prefixed references
- ayokoding-cli: does NOT cover `docs/` (scoped to ayokoding content)

## Phase 2 — Delete Obsidian Vault Config

**Goal**: Remove `docs/.obsidian/` and its `.gitignore` entries.

- [x] Run `git rm -r docs/.obsidian/`
- [x] Edit `.gitignore` to remove the Obsidian block (the 3-line comment plus all 7 Obsidian-related ignore lines)
- [x] Verify `find docs -name .obsidian` returns zero results
- [x] Verify `ripgrep -i 'obsidian|smart-connections|\.trash' .gitignore` returns zero matches
- [x] Commit: `chore(docs): delete Obsidian vault config and ignore entries`

### Phase 2 gate

- [x] `git status` clean
- [x] `npm run lint:md` passes

## Phase 3 — Rewrite the File Naming Convention

**Goal**: Replace `governance/conventions/structure/file-naming.md` with a concise version anchored on **standard markdown + GitHub compatibility**.

- [x] Read the current `governance/conventions/structure/file-naming.md` to capture any non-Obsidian content worth preserving (e.g., ISO 8601 date rule, extension list)
- [x] Write the new `governance/conventions/structure/file-naming.md` following the outline in `tech-docs.md` §4
- [x] Confirm `wc -l` of the new file is ≤120
- [x] Run `ripgrep -i 'obsidian|vault|hierarchical-prefix|ex-go-|hoto__|subdirectory code'` against the new file; expect zero hits
- [x] Run `ripgrep -n 'standard markdown' governance/conventions/structure/file-naming.md`; expect at least one hit
- [x] Run `ripgrep -n 'GitHub' governance/conventions/structure/file-naming.md`; expect multiple hits
- [x] Confirm the new convention explicitly forbids GitHub-unsafe characters (`:`, `?`, `*`, `<`, `>`, `|`, `"`, backslash, spaces, uppercase) and requires case-insensitive-unique filenames per directory
- [x] Update `governance/conventions/README.md` entry for file-naming to reflect the new scope (no prefix framing; cite markdown + GitHub rationale)
- [x] Update `CLAUDE.md` (project root and any subproject) references to the file-naming convention if any cite the prefix scheme
- [x] Grep for other files that cite the prefix scheme (e.g., `governance/conventions/structure/plans.md` mentions "not applicable to plans/"); leave that mention intact but confirm it still renders correctly
- [x] Run `npm run lint:md`
- [x] Commit: `docs(conventions): rewrite file-naming convention on standard-markdown and GitHub basis`

**Phase 3 summary**: new file is 85 lines, 2 "standard markdown" hits, 6 "GitHub" hits, zero Obsidian/prefix refs. Updated CLAUDE.md narrative at lines 316 and 349 (now 351), updated conventions/README.md file-naming entry and example.

### Phase 3 gate

- [x] Rewritten file passes all ripgrep checks (zero Obsidian, positive GitHub + standard markdown)
- [x] `npm run lint:md` passes
- [x] Cross-references to file-naming.md still resolve

## Phase 3b — Remove rhino-cli docs naming validator

**Goal**: Delete the rhino-cli Go command and supporting files that enforce the prefix scheme, so that Phase 4's rename does not break the pre-push hook.

**Critical sequencing**: This phase MUST land before Phase 4. See `tech-docs.md` §6.

- [x] Before deleting anything, run `nx run rhino-cli:build` and `nx run rhino-cli:test:quick` as a baseline; record coverage percentage
- [x] Grep `apps/rhino-cli/internal/docs/links_*.go` for imports of types defined in `types.go`, `validator.go`, `fixer.go`, `scanner.go`, `reporter.go`, `link_updater.go`, or `prefix_rules.go`; record which types (if any) must be preserved or relocated
- [x] Grep the rest of the monorepo for Go imports of `"apps/rhino-cli/internal/docs"` to identify any external consumers; resolve before deletion
- [x] `git rm apps/rhino-cli/cmd/docs_validate_naming.go apps/rhino-cli/cmd/docs_validate_naming_test.go apps/rhino-cli/cmd/docs_validate_naming.integration_test.go`
- [x] `git rm apps/rhino-cli/internal/docs/prefix_rules.go apps/rhino-cli/internal/docs/prefix_rules_test.go`
- [x] `git rm apps/rhino-cli/internal/docs/validator.go apps/rhino-cli/internal/docs/validator_test.go`
- [x] `git rm apps/rhino-cli/internal/docs/fixer.go apps/rhino-cli/internal/docs/fixer_test.go`
- [x] `git rm apps/rhino-cli/internal/docs/scanner.go apps/rhino-cli/internal/docs/scanner_test.go`
- [x] `git rm apps/rhino-cli/internal/docs/reporter.go apps/rhino-cli/internal/docs/reporter_test.go`
- [x] `git rm apps/rhino-cli/internal/docs/link_updater.go apps/rhino-cli/internal/docs/link_updater_test.go`
- [x] If `types.go` is now orphaned (no `links_*.go` imports remain), `git rm apps/rhino-cli/internal/docs/types.go`; otherwise keep it
- [x] Audit `apps/rhino-cli/internal/docs/testdata/` — delete fixtures only referenced by removed tests, keep fixtures referenced by `links_*_test.go`
- [x] `git rm specs/apps/rhino/cli/gherkin/docs-validate-naming.feature` (Gherkin feature consumed only by the removed integration test)
- [x] Edit `apps/rhino-cli/cmd/steps_common_test.go` — remove the entire `// Docs validate-naming step patterns.` const block (the block starting at line ~126 containing `stepDeveloperRunsValidateDocsNaming`, `stepDeveloperRunsValidateDocsNamingWithFix`, `stepDeveloperRunsValidateDocsNamingWithFixAndApply`, and all related step-pattern constants through `stepFilesRenamedToFollowNamingConvention`)
- [x] Edit `apps/rhino-cli/cmd/testable.go` — remove the `// docs validate-naming command delegation.` comment and its two variable declarations (`docsValidateAllFn = docs.ValidateAll` and `docsFixFn = docs.Fix`)
- [x] Verify `apps/rhino-cli/cmd/docs.go` contains no `validate-naming` references — registration was in `docs_validate_naming.go`'s `init()` and is removed automatically by its deletion above (no edit needed)
- [x] Edit `apps/rhino-cli/README.md` to remove the `validate-naming` section and any mention of `--staged-only`, `--fix`, `--apply`, `--no-update-links`, `-o json`, `-o markdown` flags that were specific to that command
- [x] Grep `.claude/agents/` and `.claude/skills/` for `validate-naming`; remove any instructions that tell an agent to invoke the removed command
- [x] Grep `governance/` for `validate-naming`; remove any references to the removed command
- [x] Grep `nx.json`, root `package.json`, `.github/workflows/`, and `apps/rhino-cli/project.json` for `validate-naming`; remove any task that invokes it
- [x] Run `go build ./apps/rhino-cli/...` — must succeed
- [x] Run `nx run rhino-cli:build` — must succeed
- [x] Run `nx run rhino-cli:test:quick` — must pass
- [x] Confirm coverage is still ≥90%; if not, add targeted tests to `links_*` code
- [x] Run `nx affected -t test:quick` to confirm no other project depended on the removed code
- [x] Run `nx affected -t spec-coverage` to verify spec coverage is still met for rhino-cli and any other affected project
- [x] Commit 1 (Go file deletions): `refactor(rhino-cli): remove docs validate-naming command and prefix enforcement`
- [x] Commit 2 (agent/governance cleanup): `refactor(repo): remove validate-naming references from agents, skills, and governance`

**Phase 3b summary**: rhino-cli coverage 90.24% (baseline 90.64%; 0.4pp drop from removing well-tested naming code). Also removed `step6DocsNaming` function and `ValidateNaming`/`FixNaming` Deps fields from `internal/git/runner.go` and `runner_test.go` (undocumented but required — the pre-commit hook called these). Fixed preexisting Python venv with stale shebang via `uv sync`. Spec-coverage 15 feature files / 96 scenarios after deletion.

### Phase 3b gate

- [x] rhino-cli builds and tests pass with coverage ≥90%
- [x] `apps/rhino-cli/internal/docs/links_*` files are intact
- [x] `apps/rhino-cli/cmd/docs_validate_naming.go` does not exist (its deletion removes the `validate-naming` registration, which was in that file's `init()`)
- [x] Zero references to `validate-naming` remain outside `plans/done/` and this plan folder
- [x] `git status` clean

## Phase 4 — Rename Prefixed Files in `docs/`

**Goal**: Execute the `git mv` loop against the mapping file.

- [x] Confirm `local-temp/obsidian-rename-mapping.tsv` is up to date (regenerate if the working tree changed since Phase 1)
- [x] Re-run the collision check; confirm zero duplicates
- [x] Execute the `git mv` loop from `tech-docs.md` §2.3
- [x] Verify `find docs -type f -name '*__*.md'` returns zero results
- [x] Verify `find docs/metadata -type f | sort` is unchanged from baseline (metadata exemption honored)
- [x] Verify `find docs -type f -name 'README.md' | wc -l` is unchanged from baseline (README exemption honored)
- [x] Sample 5 renamed files and run `git log --follow` on each; confirm history is preserved
- [x] Commit: `refactor(docs): rename prefixed files to kebab-case (300+ files)`

### Phase 4 gate

- [x] Zero `*__*.md` files under `docs/`
- [x] `README.md` and `docs/metadata/` counts match baseline
- [x] Git history continuous on sampled files
- [x] Every new filename matches the GitHub-safe regex `^[a-z0-9-]+\.[a-z]+$` (verified via `find docs -type f | awk -F/ '{print $NF}' | grep -vE '^[a-z0-9][a-z0-9-]*\.[a-z]+$|^README\.md$'` returning no results outside `docs/metadata/`)
- [x] No two files in the same directory collide after lowercasing (case-insensitive clone safety)
- [x] `git status` clean

## Phase 5 — Update All Internal Links

**Goal**: Rewrite every reference to the old prefixed filenames.

- [x] Execute the basename-rewriting sed loop from `tech-docs.md` §3.2 (with all exclusion globs)
- [x] Run the leftover-reference scan: `ripgrep --glob '!plans/done/**' --glob '!plans/in-progress/2026-04-11__remove-obsidian-compat/**' --glob '!local-temp/**' --glob '!.opencode/**' --glob '!apps/oseplatform-web/content/updates/**' --glob '!docs/metadata/external-links-status.yaml' '__[a-z0-9-]+\.md'`
- [x] Resolve any remaining matches by manual edit (e.g., inline code spans that the basename scan missed)
- [x] Spot-check `CLAUDE.md`, root `README.md`, `AGENTS.md`, `ROADMAP.md`, and `governance/README.md` — follow 5 arbitrary links in each; confirm each target exists
- [x] Spot-check the governance subsection indices (`governance/conventions/README.md`, `governance/development/README.md`, `governance/workflows/README.md`, `governance/principles/README.md`)
- [x] Run `npm run lint:md`
- [x] If `ayokoding-cli links check` covers `docs/`, run it and confirm zero broken internal links
- [x] Run `npm run format:md` to normalize whitespace after bulk edits
- [x] Commit: `refactor(docs): update internal links for renamed files`

**Phase 5 summary**: Basename sed loop processed 304 mappings and edited 1533 files. Also removed obsolete `ex-ru-` / `ex__ru__` and `tu__` / `hoto__` pattern-matching heuristics from `apps/rhino-cli/internal/docs/links_scanner.go` and `links_categorizer.go` along with their tests, since those patterns no longer exist in the repo. Remaining prefix-scheme matches are narrative examples (placeholder URLs, wiki-link anti-pattern examples) — those are handled in Phase 6.

### Phase 5 gate

- [x] Zero leftover prefixed references outside allowed historical paths (remaining matches are narrative examples for Phase 6)
- [x] Every rewritten link uses the GitHub-compatible form `[Text](./relative/path.md)` with the `.md` extension (spot-checked with `ripgrep '\]\([^)]*\.md\)' docs/` and manual review)
- [x] Zero wiki-link-shaped references introduced (`ripgrep '\[\[' docs/ governance/ .claude/` returns zero hits outside Phase 6 narrative targets)
- [x] `npm run lint:md` passes
- [x] Manual spot-checks confirm cross-links resolve
- [x] `git status` clean

## Phase 6 — Scrub Obsidian References from Governance, Agents, and Skills

**Goal**: Remove the remaining Obsidian-specific rules and anti-patterns.

### Governance edits (use Edit tool)

- [x] `docs/README.md` — remove "optimized for Obsidian" tip block; confirm the rest of the file still reads cleanly
- [x] `docs/how-to/organize-work.md` (renamed from `hoto__organize-work.md` in Phase 4) — remove Obsidian references
- [x] `docs/explanation/software-engineering/architecture/c4-architecture-model/tooling-standards.md` (renamed) — remove Obsidian references
- [x] `README.md` (repo root) — confirm/remove any Obsidian references (TBD from Phase 1 inventory)
- [x] `ROADMAP.md` — remove Obsidian references
- [x] `governance/conventions/README.md` — remove Obsidian mention in the formatting subsection description
- [x] `governance/conventions/formatting/linking.md` — rewrite opening paragraph and the "Why GitHub-Compatible Links?" section per `tech-docs.md` §4b, anchoring rationale on "standard markdown + GitHub compatibility"; reframe the wiki-link rejection ("GitHub does not render `[[...]]`") without mentioning Obsidian; keep all existing link-syntax rules intact
- [x] `governance/conventions/formatting/linking.md` — verify with `ripgrep -i obsidian` (zero hits), `ripgrep -n 'standard markdown'` (at least one hit), `ripgrep -n 'GitHub'` (multiple hits)
- [x] `governance/conventions/formatting/diagrams.md` — remove Obsidian platform mention
- [x] `governance/conventions/formatting/emoji.md` — remove "Obsidian" from the render-consistency list
- [x] `governance/conventions/formatting/indentation.md` — remove Obsidian references
- [x] `governance/conventions/formatting/nested-code-fences.md` — remove Obsidian preview recommendation
- [x] `governance/conventions/formatting/mathematical-notation.md` — remove "Obsidian/GitHub dual compatibility" framing
- [x] `governance/conventions/formatting/color-accessibility.md` — remove Obsidian mention from cross-platform consistency notes
- [x] `governance/conventions/writing/conventions.md` — delete the "TAB indentation for bullet items (Obsidian compatibility)" checklist item
- [x] `governance/conventions/writing/quality.md` — remove Obsidian references (if any after re-grep)
- [x] `governance/conventions/tutorials/general.md` — remove Obsidian references
- [x] `governance/conventions/hugo/shared.md` — remove the docs/-vs-Obsidian contrast language; keep the Hugo-specific rules
- [x] `governance/development/agents/ai-agents.md` — delete the `[[ex-de__ai-agents]]` Obsidian wiki-link anti-pattern example and remove Obsidian from the cross-platform-consistency sentence
- [x] `governance/workflows/meta/workflow-identifier.md` — replace "especially Obsidian" and the Obsidian YAML-parser sentences with generic "some YAML parsers" language; keep the quoting rule
- [x] Run `npm run lint:md`

### Extended governance scrub — prefix-scheme narrative removal

Files from `tech-docs.md` §1.3.b that explain the prefix encoding in narrative prose. The basename sed loop (Phase 5) handled any filename references; this step cleans up the explanations that surrounded them.

- [x] `governance/conventions/structure/README.md` — rewrite any description of the prefix scheme to describe the new kebab-case rule
- [x] `governance/conventions/structure/diataxis-framework.md` — remove prefix examples; keep Diátaxis structure
- [x] `governance/conventions/structure/programming-language-docs-separation.md` — update examples to use unprefixed filenames
- [x] `governance/conventions/structure/plans.md` — confirm the "not applicable to plans/" note still makes sense after the rewrite; update wording if needed. Also update the table row at ~line 270 (`| **File Naming** | No prefixes inside folders | Prefixes encode directory path |`) which will be stale after the convention rewrite, and verify the Phase 5 sed loop correctly rewrites the inline-code reference to `docs/how-to/hoto__organize-work.md` in the table cell at ~line 340
- [x] `governance/conventions/writing/readme-quality.md` — remove prefix-scheme examples
- [x] `governance/conventions/tutorials/README.md`, `programming-language-content.md` — remove prefix examples
- [x] `governance/conventions/hugo/ayokoding.md` — remove any contrast against the docs/ prefix scheme
- [x] `governance/principles/general/simplicity-over-complexity.md` — update any example that cited the prefix scheme as an "explicit over implicit" win
- [x] `governance/principles/software-engineering/README.md` — update any linked example
- [x] `governance/principles/content/documentation-first.md`, `progressive-disclosure.md` — update examples
- [x] `governance/development/agents/skill-context-architecture.md` — update examples
- [x] `governance/development/pattern/database-audit-trail.md` — update any linked example
- [x] `governance/development/quality/criticality-levels.md`, `three-level-testing-standard.md` — update any linked example
- [x] `governance/workflows/infra/development-environment-setup.md` — update any linked example
- [x] Run `ripgrep '(hierarchical-prefix|subdirectory code|prefix encoding|\[prefix\])' governance/` — expect zero matches (or matches only in plan archival documentation)

### Root navigation and subproject docs

- [x] `CLAUDE.md` (repo root) — update any narrative that describes the prefix scheme; confirm all docs/ links resolve
- [x] `AGENTS.md` (repo root) — same treatment as CLAUDE.md
- [x] `README.md` (repo root) — update any docs/ references
- [x] `ROADMAP.md` — update any docs/ references
- [x] `apps/README.md` — update any docs/ references
- [x] `specs/README.md` — update any docs/ references
- [x] All `apps/*/README.md` files containing docs/ references — confirm links resolve (the basename sed loop handled the filename part; narrative text may still need touch-up). Specifically check: `apps/rhino-cli/README.md`, `apps/a-demo-be-*/README.md`, `apps/a-demo-fe-*/README.md`, `apps/organiclever-*/README.md`
- [x] All `apps/*/playwright.config.ts` files with docs/ references — confirm paths resolve
- [x] `docs/tutorials/README.md`, `docs/how-to/README.md`, `docs/reference/README.md`, `docs/explanation/README.md` — regenerate the children-file lists with new names
- [x] Every other `docs/**/README.md` subdirectory index — regenerate children-file lists with new names

### Agent edits (Edit tool for targeted edits, Bash sed for bulk substitutions)

The following `.claude/agents/*` files need both (a) Obsidian word scrub and (b) narrative cleanup. The basename sed loop in Phase 5 already fixed their filename references; this step handles anything that survived:

- [x] `.claude/agents/docs-maker.md` — remove Obsidian wiki-link warning; confirm prefix-scheme descriptions are removed
- [x] `.claude/agents/docs-file-manager.md` — remove Obsidian wiki-link rule; confirm prefix-scheme descriptions are removed
- [x] `.claude/agents/repo-governance-checker.md` — remove any instructions tied to prefix-validation (no longer a thing)
- [x] `.claude/agents/repo-governance-fixer.md` — same treatment as checker
- [x] `.claude/agents/swe-typescript-developer.md` — verify all programming-language doc links resolve
- [x] `.claude/agents/swe-rust-developer.md` — verify links
- [x] `.claude/agents/swe-python-developer.md` — verify links
- [x] `.claude/agents/swe-kotlin-developer.md` — verify links
- [x] `.claude/agents/swe-java-developer.md` — verify links
- [x] `.claude/agents/swe-golang-developer.md` — verify links
- [x] `.claude/agents/swe-fsharp-developer.md` — verify links
- [x] `.claude/agents/swe-elixir-developer.md` — verify links
- [x] `.claude/agents/swe-dart-developer.md` — verify links
- [x] `.claude/agents/swe-csharp-developer.md` — verify links
- [x] `.claude/agents/swe-clojure-developer.md` — verify links
- [x] `.claude/agents/swe-e2e-test-developer.md` — verify links
- [x] Run `ripgrep -i obsidian .claude/agents/` — expect zero matches
- [x] Run `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-)' .claude/agents/` — expect zero matches

### Skill edits (Edit tool for targeted edits, Bash sed for bulk substitutions)

- [x] `.claude/skills/docs-validating-links/SKILL.md` — remove "Error 3: Obsidian wiki links" block; update error numbering; remove any reference to the rhino-cli `validate-naming` command
- [x] `.claude/skills/docs-validating-factual-accuracy/SKILL.md` — remove prefix-scheme references
- [x] `.claude/skills/swe-developing-applications-common/SKILL.md` — verify all docs links resolve
- [x] `.claude/skills/swe-developing-e2e-test-with-playwright/SKILL.md` — verify all docs links resolve
- [x] `.claude/skills/swe-programming-typescript/SKILL.md` — verify all docs links resolve
- [x] `.claude/skills/swe-programming-rust/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-python/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-kotlin/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-java/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-golang/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-fsharp/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-elixir/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-dart/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-csharp/SKILL.md` — verify links
- [x] `.claude/skills/swe-programming-clojure/SKILL.md` — verify links
- [x] `.claude/skills/repo-assessing-criticality-confidence/SKILL.md` — remove any prefix-scheme examples
- [x] Run `ripgrep -i obsidian .claude/skills/` — expect zero matches
- [x] Run `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-)' .claude/skills/` — expect zero matches

### Final scrub verification

- [x] Run the Obsidian-word check: `ripgrep -i obsidian --glob '!plans/done/**' --glob '!local-temp/**' --glob '!.opencode/**' --glob '!apps/oseplatform-web/content/updates/**' --glob '!docs/metadata/external-links-status.yaml' --glob '!plans/in-progress/2026-04-11__remove-obsidian-compat/**'` — expect zero matches
- [x] Run the prefix-pattern check (inline all false-positive globs — see `tech-docs.md §1.3.c` for rationale):

  ```bash
  ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-|ex-ru-|ex-wf-|ex-de-|ex-co-)' \
    --glob '!plans/done/**' \
    --glob '!local-temp/**' \
    --glob '!.opencode/**' \
    --glob '!apps/oseplatform-web/content/updates/**' \
    --glob '!docs/metadata/external-links-status.yaml' \
    --glob '!plans/in-progress/2026-04-11__remove-obsidian-compat/**' \
    --glob '!apps/ayokoding-web/content/en/learn/software-engineering/automation-tools/**' \
    --glob '!apps/ayokoding-web/content/en/learn/software-engineering/data/databases/datomic/by-example/**' \
    --glob '!apps/ayokoding-web/content/en/learn/software-engineering/data/tools/clojure-migratus/by-example/advanced.md' \
    --glob '!apps/ayokoding-web/content/en/learn/software-engineering/data/tools/spring-data-jpa/by-example/**' \
    --glob '!apps/ayokoding-web/content/en/learn/software-engineering/automation-testing/tools/playwright/by-example/advanced.md' \
    --glob '!apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/fe-nextjs/by-example/overview.md' \
    --glob '!apps/a-demo-be-python-fastapi/tests/**' \
    --glob '!apps/a-demo-be-rust-axum/Cargo.toml' \
    --glob '!apps/a-demo-be-clojure-pedestal/test/step_definitions/steps.clj'
  ```

  Expect zero matches

- [x] Run `npm run lint:md`
- [x] Commit: `docs(repo): scrub Obsidian references and prefix-scheme narrative from governance, agents, skills, and navigation`

### Phase 6 gate

- [x] Zero active Obsidian references remain outside allowed historical paths
- [x] Zero prefix-scheme narrative remains outside the false-positive allowlist
- [x] All 12 `.claude/agents/swe-*-developer.md` agents have resolving docs links
- [x] All 11 `.claude/skills/swe-programming-*/SKILL.md` skills have resolving docs links
- [x] All `docs/**/README.md` index files list children by new filenames
- [x] `governance/conventions/formatting/linking.md` cites "standard markdown" and "GitHub" as the sole rationale (verified by ripgrep)
- [x] `governance/conventions/structure/file-naming.md` and `governance/conventions/formatting/linking.md` are both internally consistent (the file-naming rules produce filenames that the linking rules can reference)
- [x] `npm run lint:md` passes

## Phase 7 — Sync .claude/ → .opencode/

**Goal**: Regenerate OpenCode mirrors so both stacks see the same agent and skill definitions.

- [x] Run `npm run sync:claude-to-opencode`
- [x] Run `git diff --stat .opencode/` and confirm every agent and skill that was edited in Phase 6 has a corresponding mirror change (should see ~30 mirrored files)
- [x] Spot-check 3 mirrors: `git diff .opencode/agent/docs-maker.md`, `git diff .opencode/skill/swe-programming-typescript/SKILL.md`, `git diff .opencode/skill/docs-validating-links/SKILL.md`
- [x] Verify `ripgrep -i obsidian .opencode/` returns zero matches
- [x] Verify `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-)' .opencode/` returns zero matches
- [x] Commit: `chore(opencode): sync agent and skill mirrors after Obsidian and prefix scrub`

### Phase 7 gate

- [x] Sync script exits clean
- [x] Mirror diffs match expected edits across all updated agents and skills
- [x] `git status` clean

## Phase 8 — Final Validation and Pre-Push

**Goal**: Make sure everything still works together before pushing.

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes. This follows the root cause orientation principle — proactively fix preexisting errors encountered during work.

- [ ] Run `npm run lint:md`
- [ ] Run `npm run format:md:check`
- [ ] Run `npx nx affected -t typecheck lint test:quick spec-coverage` to warm cache (per CLAUDE.md pre-push guidance)
- [ ] Run `git log --oneline` since plan start; confirm commits are split by domain and follow Conventional Commits
- [ ] Run the pre-commit hook manually (`.husky/pre-commit`) on a trivial edit to confirm `.claude/` validator passes
- [ ] Review `git diff origin/main` and sanity-check that no unintended file changes slipped in
- [ ] Re-run the final Obsidian scrub check from Phase 6
- [ ] Re-run `find docs -type f -name '*__*.md'` — zero results
- [ ] Re-run `find docs -name .obsidian` — zero results

### Post-Push Verification

- [ ] Push commits to `main`: `git push origin main`
- [ ] Navigate to the repository's GitHub Actions page
- [ ] Monitor the triggered workflows for the push (markdown lint, pre-commit validation, and any project-level CI workflows)
- [ ] Wait for all checks to complete; if any check fails, fix it immediately and push a follow-up commit before proceeding to Phase 9
- [ ] Do NOT proceed to Phase 9 until all CI checks are green

### Phase 8 gate

- [ ] All lint checks pass
- [ ] Affected Nx targets pass
- [ ] Commit history is clean and well-segmented
- [ ] All validation checks from `tech-docs.md` §8 pass

## Phase 9 — Archive the Plan

**Goal**: Move the completed plan to `done/` and update indices.

- [ ] Verify ALL delivery checklist items in Phases 1–8 are ticked before proceeding with archival
- [ ] Move `plans/in-progress/2026-04-11__remove-obsidian-compat/` to `plans/done/2026-04-11__remove-obsidian-compat/` using `git mv`
- [ ] Update `plans/in-progress/README.md` — remove this plan from the active list
- [ ] Update `plans/done/README.md` — add this plan to the completed list with a one-line summary
- [ ] Update the plan's `README.md` status line to `Done` and add a `Completed: YYYY-MM-DD` line
- [ ] Clean up `local-temp/obsidian-*` scratch files (they are gitignored; just rm)
- [ ] Commit: `docs(plans): archive remove-obsidian-compat plan`

### Phase 9 gate

- [ ] Plan folder exists at `plans/done/2026-04-11__remove-obsidian-compat/`
- [ ] `plans/in-progress/README.md` no longer lists this plan
- [ ] `plans/done/README.md` lists this plan
- [ ] `git status` clean

## Commit Sequence Summary

The delivery produces (approximately) this commit history on `main`:

1. `chore(docs): delete Obsidian vault config and ignore entries` — Phase 2
2. `docs(conventions): rewrite file-naming convention on standard-markdown and GitHub basis` — Phase 3
3. `refactor(rhino-cli): remove docs validate-naming command and prefix enforcement` — Phase 3b (Go file deletions)
4. `refactor(repo): remove validate-naming references from agents, skills, and governance` — Phase 3b (agent/governance cleanup)
5. `refactor(docs): rename prefixed files to kebab-case (300+ files)` — Phase 4 (pure rename)
6. `refactor(docs): update internal links for renamed files` — Phase 5
7. `docs(repo): scrub Obsidian references and prefix-scheme narrative from governance, agents, skills, and navigation` — Phase 6
8. `chore(opencode): sync agent and skill mirrors after Obsidian and prefix scrub` — Phase 7
9. `docs(plans): archive remove-obsidian-compat plan` — Phase 9

Each commit is independently revertible (see `tech-docs.md` §9). Phases 3b and 4 are coupled: reverting Phase 4 requires reverting Phase 3b (both commits) simultaneously to restore consistent state.

## Execution Notes

Reserved for recording baseline counts, collision resolutions, surprise findings, and any deviation from the plan as it is executed. Append entries under dated subheadings:

### 2026-04-11 — Plan created

- Baseline counts (to be filled during Phase 1): total docs md files: `<TBD>`, prefixed files: `<TBD>`, Obsidian reference files: `<TBD>`
