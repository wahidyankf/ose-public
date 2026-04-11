# Delivery Checklist — Remove Obsidian Compatibility from Docs

This document is the phase-by-phase execution plan. Each checkbox represents one concrete, independently verifiable action. Phases execute sequentially; validation gates between phases must pass before proceeding.

## Phase 1 — Inventory and Baseline

**Goal**: Capture the current state and catch collisions before any destructive action.

- [ ] Create `local-temp/` if missing for scratch files
- [ ] Enumerate all files under `docs/.obsidian/` and save to `local-temp/obsidian-vault-files.txt`
- [ ] Enumerate all `docs/**/*__*.md` files and save to `local-temp/obsidian-prefixed-files.txt`
- [ ] Count total docs markdown files and prefixed files; record baseline in the plan's execution notes
- [ ] Run `ripgrep -il obsidian` across the repo and save the filtered list (excluding `plans/done/`, `.opencode/`, `apps/oseplatform-web/content/updates/`, `docs/metadata/external-links-status.yaml`, `.gitignore`) to `local-temp/obsidian-references.txt`
- [ ] Generate the rename mapping TSV at `local-temp/obsidian-rename-mapping.tsv` using the command in `tech-docs.md` §2.1
- [ ] Run the collision check (`awk -F'\t' '{print $2}' ... | sort | uniq -d`); record output to `local-temp/obsidian-rename-collisions.txt`
- [ ] If collisions exist, edit the mapping file to resolve each with a descriptive suffix (no prefix reintroduction)
- [ ] Re-run the collision check after edits; confirm zero duplicates
- [ ] Grep `nx.json`, root `package.json`, `.github/workflows/`, and deploy scripts for any reference to a prefixed `docs/*__*.md` filename; document findings
- [ ] Verify `ayokoding-cli links check` scope (read its README) and note whether it covers `docs/`
- [ ] Commit the mapping file contents via a short summary in execution notes (do **not** commit `local-temp/` itself — it is scratch space)

### Phase 1 gate

- [ ] Baseline counts recorded
- [ ] Zero collisions remain in the mapping
- [ ] Open Questions in `tech-docs.md` §9 are resolved or deferred explicitly

## Phase 2 — Delete Obsidian Vault Config

**Goal**: Remove `docs/.obsidian/` and its `.gitignore` entries.

- [ ] Run `git rm -r docs/.obsidian/`
- [ ] Edit `.gitignore` to remove the Obsidian block (the 3-line comment plus all 7 Obsidian-related ignore lines)
- [ ] Verify `find docs -name .obsidian` returns zero results
- [ ] Verify `ripgrep -i 'obsidian|smart-connections|\.trash' .gitignore` returns zero matches
- [ ] Commit: `chore(docs): delete Obsidian vault config and ignore entries`

### Phase 2 gate

- [ ] `git status` clean
- [ ] `npm run lint:md` passes

## Phase 3 — Rewrite the File Naming Convention

**Goal**: Replace `governance/conventions/structure/file-naming.md` with a concise version anchored on **standard markdown + GitHub compatibility**.

- [ ] Read the current `governance/conventions/structure/file-naming.md` to capture any non-Obsidian content worth preserving (e.g., ISO 8601 date rule, extension list)
- [ ] Write the new `governance/conventions/structure/file-naming.md` following the outline in `tech-docs.md` §4
- [ ] Confirm `wc -l` of the new file is ≤120
- [ ] Run `ripgrep -i 'obsidian|vault|hierarchical-prefix|ex-go-|hoto__|subdirectory code'` against the new file; expect zero hits
- [ ] Run `ripgrep -n 'standard markdown' governance/conventions/structure/file-naming.md`; expect at least one hit
- [ ] Run `ripgrep -n 'GitHub' governance/conventions/structure/file-naming.md`; expect multiple hits
- [ ] Confirm the new convention explicitly forbids GitHub-unsafe characters (`:`, `?`, `*`, `<`, `>`, `|`, `"`, backslash, spaces, uppercase) and requires case-insensitive-unique filenames per directory
- [ ] Update `governance/conventions/README.md` entry for file-naming to reflect the new scope (no prefix framing; cite markdown + GitHub rationale)
- [ ] Update `CLAUDE.md` (project root and any subproject) references to the file-naming convention if any cite the prefix scheme
- [ ] Grep for other files that cite the prefix scheme (e.g., `governance/conventions/structure/plans.md` mentions "not applicable to plans/"); leave that mention intact but confirm it still renders correctly
- [ ] Run `npm run lint:md`
- [ ] Commit: `docs(governance): rewrite file-naming convention on standard-markdown and GitHub basis`

### Phase 3 gate

- [ ] Rewritten file passes all ripgrep checks (zero Obsidian, positive GitHub + standard markdown)
- [ ] `npm run lint:md` passes
- [ ] Cross-references to file-naming.md still resolve

## Phase 3b — Remove rhino-cli docs naming validator

**Goal**: Delete the rhino-cli Go command and supporting files that enforce the prefix scheme, so that Phase 4's rename does not break the pre-push hook.

**Critical sequencing**: This phase MUST land before Phase 4. See `tech-docs.md` §6.

- [ ] Before deleting anything, run `nx run rhino-cli:build` and `nx run rhino-cli:test:quick` as a baseline; record coverage percentage
- [ ] Grep `apps/rhino-cli/internal/docs/links_*.go` for imports of types defined in `types.go`, `validator.go`, `fixer.go`, `scanner.go`, `reporter.go`, `link_updater.go`, or `prefix_rules.go`; record which types (if any) must be preserved or relocated
- [ ] Grep the rest of the monorepo for Go imports of `"apps/rhino-cli/internal/docs"` to identify any external consumers; resolve before deletion
- [ ] `git rm apps/rhino-cli/cmd/docs_validate_naming.go apps/rhino-cli/cmd/docs_validate_naming_test.go apps/rhino-cli/cmd/docs_validate_naming.integration_test.go`
- [ ] `git rm apps/rhino-cli/internal/docs/prefix_rules.go apps/rhino-cli/internal/docs/prefix_rules_test.go`
- [ ] `git rm apps/rhino-cli/internal/docs/validator.go apps/rhino-cli/internal/docs/validator_test.go`
- [ ] `git rm apps/rhino-cli/internal/docs/fixer.go apps/rhino-cli/internal/docs/fixer_test.go`
- [ ] `git rm apps/rhino-cli/internal/docs/scanner.go apps/rhino-cli/internal/docs/scanner_test.go`
- [ ] `git rm apps/rhino-cli/internal/docs/reporter.go apps/rhino-cli/internal/docs/reporter_test.go`
- [ ] `git rm apps/rhino-cli/internal/docs/link_updater.go apps/rhino-cli/internal/docs/link_updater_test.go`
- [ ] If `types.go` is now orphaned (no `links_*.go` imports remain), `git rm apps/rhino-cli/internal/docs/types.go`; otherwise keep it
- [ ] Audit `apps/rhino-cli/internal/docs/testdata/` — delete fixtures only referenced by removed tests, keep fixtures referenced by `links_*_test.go`
- [ ] Edit `apps/rhino-cli/cmd/docs.go` to remove the `validate-naming` subcommand registration; keep `validate-links`
- [ ] Edit `apps/rhino-cli/README.md` to remove the `validate-naming` section and any mention of `--staged-only`, `--fix`, `--apply`, `--no-update-links`, `-o json`, `-o markdown` flags that were specific to that command
- [ ] Grep `.claude/agents/` and `.claude/skills/` for `validate-naming`; remove any instructions that tell an agent to invoke the removed command
- [ ] Grep `governance/` for `validate-naming`; remove any references to the removed command
- [ ] Grep `nx.json`, root `package.json`, `.github/workflows/`, and `apps/rhino-cli/project.json` for `validate-naming`; remove any task that invokes it
- [ ] Run `go build ./apps/rhino-cli/...` — must succeed
- [ ] Run `nx run rhino-cli:build` — must succeed
- [ ] Run `nx run rhino-cli:test:quick` — must pass
- [ ] Confirm coverage is still ≥90%; if not, add targeted tests to `links_*` code
- [ ] Run `nx affected -t test:quick` to confirm no other project depended on the removed code
- [ ] Commit: `refactor(rhino-cli): remove docs validate-naming command and prefix enforcement`

### Phase 3b gate

- [ ] rhino-cli builds and tests pass with coverage ≥90%
- [ ] `apps/rhino-cli/internal/docs/links_*` files are intact
- [ ] `apps/rhino-cli/cmd/docs.go` no longer registers `validate-naming`
- [ ] Zero references to `validate-naming` remain outside `plans/done/` and this plan folder
- [ ] `git status` clean

## Phase 4 — Rename Prefixed Files in `docs/`

**Goal**: Execute the `git mv` loop against the mapping file.

- [ ] Confirm `local-temp/obsidian-rename-mapping.tsv` is up to date (regenerate if the working tree changed since Phase 1)
- [ ] Re-run the collision check; confirm zero duplicates
- [ ] Execute the `git mv` loop from `tech-docs.md` §2.3
- [ ] Verify `find docs -type f -name '*__*.md'` returns zero results
- [ ] Verify `find docs/metadata -type f | sort` is unchanged from baseline (metadata exemption honored)
- [ ] Verify `find docs -type f -name 'README.md' | wc -l` is unchanged from baseline (README exemption honored)
- [ ] Sample 5 renamed files and run `git log --follow` on each; confirm history is preserved
- [ ] Commit: `refactor(docs): rename prefixed files to kebab-case (300+ files)`

### Phase 4 gate

- [ ] Zero `*__*.md` files under `docs/`
- [ ] `README.md` and `docs/metadata/` counts match baseline
- [ ] Git history continuous on sampled files
- [ ] Every new filename matches the GitHub-safe regex `^[a-z0-9-]+\.[a-z]+$` (verified via `find docs -type f | awk -F/ '{print $NF}' | grep -vE '^[a-z0-9][a-z0-9-]*\.[a-z]+$|^README\.md$'` returning no results outside `docs/metadata/`)
- [ ] No two files in the same directory collide after lowercasing (case-insensitive clone safety)
- [ ] `git status` clean

## Phase 5 — Update All Internal Links

**Goal**: Rewrite every reference to the old prefixed filenames.

- [ ] Execute the basename-rewriting sed loop from `tech-docs.md` §3.2 (with all exclusion globs)
- [ ] Run the leftover-reference scan: `ripgrep --glob '!plans/done/**' --glob '!local-temp/**' --glob '!.opencode/**' --glob '!apps/oseplatform-web/content/updates/**' --glob '!docs/metadata/external-links-status.yaml' '__[a-z0-9-]+\.md'`
- [ ] Resolve any remaining matches by manual edit (e.g., inline code spans that the basename scan missed)
- [ ] Spot-check `CLAUDE.md`, root `README.md`, `AGENTS.md`, `ROADMAP.md`, and `governance/README.md` — follow 5 arbitrary links in each; confirm each target exists
- [ ] Spot-check the governance subsection indices (`governance/conventions/README.md`, `governance/development/README.md`, `governance/workflows/README.md`, `governance/principles/README.md`)
- [ ] Run `npm run lint:md`
- [ ] If `ayokoding-cli links check` covers `docs/`, run it and confirm zero broken internal links
- [ ] Run `npm run format:md` to normalize whitespace after bulk edits
- [ ] Commit: `refactor(docs): update internal links for renamed files`

### Phase 5 gate

- [ ] Zero leftover prefixed references outside allowed historical paths
- [ ] Every rewritten link uses the GitHub-compatible form `[Text](./relative/path.md)` with the `.md` extension (spot-checked with `ripgrep '\]\([^)]*\.md\)' docs/` and manual review)
- [ ] Zero wiki-link-shaped references introduced (`ripgrep '\[\[' docs/ governance/ .claude/` returns zero hits)
- [ ] `npm run lint:md` passes
- [ ] Manual spot-checks confirm cross-links resolve
- [ ] `git status` clean

## Phase 6 — Scrub Obsidian References from Governance, Agents, and Skills

**Goal**: Remove the remaining Obsidian-specific rules and anti-patterns.

### Governance edits (use Edit tool)

- [ ] `docs/README.md` — remove "optimized for Obsidian" tip block; confirm the rest of the file still reads cleanly
- [ ] `docs/how-to/organize-work.md` (renamed from `hoto__organize-work.md` in Phase 4) — remove Obsidian references
- [ ] `docs/explanation/software-engineering/architecture/c4-architecture-model/tooling-standards.md` (renamed) — remove Obsidian references
- [ ] `README.md` (repo root) — confirm/remove any Obsidian references (TBD from Phase 1 inventory)
- [ ] `ROADMAP.md` — remove Obsidian references
- [ ] `governance/conventions/README.md` — remove Obsidian mention in the formatting subsection description
- [ ] `governance/conventions/formatting/linking.md` — rewrite opening paragraph and the "Why GitHub-Compatible Links?" section per `tech-docs.md` §4b, anchoring rationale on "standard markdown + GitHub compatibility"; reframe the wiki-link rejection ("GitHub does not render `[[...]]`") without mentioning Obsidian; keep all existing link-syntax rules intact
- [ ] `governance/conventions/formatting/linking.md` — verify with `ripgrep -i obsidian` (zero hits), `ripgrep -n 'standard markdown'` (at least one hit), `ripgrep -n 'GitHub'` (multiple hits)
- [ ] `governance/conventions/formatting/diagrams.md` — remove Obsidian platform mention
- [ ] `governance/conventions/formatting/emoji.md` — remove "Obsidian" from the render-consistency list
- [ ] `governance/conventions/formatting/indentation.md` — remove Obsidian references
- [ ] `governance/conventions/formatting/nested-code-fences.md` — remove Obsidian preview recommendation
- [ ] `governance/conventions/formatting/mathematical-notation.md` — remove "Obsidian/GitHub dual compatibility" framing
- [ ] `governance/conventions/formatting/color-accessibility.md` — remove Obsidian mention from cross-platform consistency notes
- [ ] `governance/conventions/writing/conventions.md` — delete the "TAB indentation for bullet items (Obsidian compatibility)" checklist item
- [ ] `governance/conventions/writing/quality.md` — remove Obsidian references (if any after re-grep)
- [ ] `governance/conventions/tutorials/general.md` — remove Obsidian references
- [ ] `governance/conventions/hugo/shared.md` — remove the docs/-vs-Obsidian contrast language; keep the Hugo-specific rules
- [ ] `governance/development/agents/ai-agents.md` — delete the `[[ex-de__ai-agents]]` Obsidian wiki-link anti-pattern example and remove Obsidian from the cross-platform-consistency sentence
- [ ] `governance/workflows/meta/workflow-identifier.md` — replace "especially Obsidian" and the Obsidian YAML-parser sentences with generic "some YAML parsers" language; keep the quoting rule
- [ ] Run `npm run lint:md`

### Extended governance scrub — prefix-scheme narrative removal

Files from `tech-docs.md` §1.3.b that explain the prefix encoding in narrative prose. The basename sed loop (Phase 5) handled any filename references; this step cleans up the explanations that surrounded them.

- [ ] `governance/conventions/structure/README.md` — rewrite any description of the prefix scheme to describe the new kebab-case rule
- [ ] `governance/conventions/structure/diataxis-framework.md` — remove prefix examples; keep Diátaxis structure
- [ ] `governance/conventions/structure/programming-language-docs-separation.md` — update examples to use unprefixed filenames
- [ ] `governance/conventions/structure/plans.md` — confirm the "not applicable to plans/" note still makes sense after the rewrite; update wording if needed
- [ ] `governance/conventions/writing/readme-quality.md` — remove prefix-scheme examples
- [ ] `governance/conventions/tutorials/README.md`, `programming-language-content.md` — remove prefix examples
- [ ] `governance/conventions/hugo/ayokoding.md` — remove any contrast against the docs/ prefix scheme
- [ ] `governance/principles/general/simplicity-over-complexity.md` — update any example that cited the prefix scheme as an "explicit over implicit" win
- [ ] `governance/principles/software-engineering/README.md` — update any linked example
- [ ] `governance/principles/content/documentation-first.md`, `progressive-disclosure.md` — update examples
- [ ] `governance/development/agents/skill-context-architecture.md` — update examples
- [ ] `governance/development/pattern/database-audit-trail.md` — update any linked example
- [ ] `governance/development/quality/criticality-levels.md`, `three-level-testing-standard.md` — update any linked example
- [ ] `governance/workflows/infra/development-environment-setup.md` — update any linked example

### Root navigation and subproject docs

- [ ] `CLAUDE.md` (repo root) — update any narrative that describes the prefix scheme; confirm all docs/ links resolve
- [ ] `AGENTS.md` (repo root) — same treatment as CLAUDE.md
- [ ] `README.md` (repo root) — update any docs/ references
- [ ] `ROADMAP.md` — update any docs/ references
- [ ] `apps/README.md` — update any docs/ references
- [ ] `specs/README.md` — update any docs/ references
- [ ] All `apps/*/README.md` files containing docs/ references — confirm links resolve (the basename sed loop handled the filename part; narrative text may still need touch-up). Specifically check: `apps/rhino-cli/README.md`, `apps/a-demo-be-*/README.md`, `apps/a-demo-fe-*/README.md`, `apps/organiclever-*/README.md`
- [ ] All `apps/*/playwright.config.ts` files with docs/ references — confirm paths resolve
- [ ] `docs/tutorials/README.md`, `docs/how-to/README.md`, `docs/reference/README.md`, `docs/explanation/README.md` — regenerate the children-file lists with new names
- [ ] Every other `docs/**/README.md` subdirectory index — regenerate children-file lists with new names

### Agent edits (Edit tool for targeted edits, Bash sed for bulk substitutions)

The following `.claude/agents/*` files need both (a) Obsidian word scrub and (b) narrative cleanup. The basename sed loop in Phase 5 already fixed their filename references; this step handles anything that survived:

- [ ] `.claude/agents/docs-maker.md` — remove Obsidian wiki-link warning; confirm prefix-scheme descriptions are removed
- [ ] `.claude/agents/docs-file-manager.md` — remove Obsidian wiki-link rule; confirm prefix-scheme descriptions are removed
- [ ] `.claude/agents/repo-governance-checker.md` — remove any instructions tied to prefix-validation (no longer a thing)
- [ ] `.claude/agents/repo-governance-fixer.md` — same treatment as checker
- [ ] `.claude/agents/swe-typescript-developer.md` — verify all programming-language doc links resolve
- [ ] `.claude/agents/swe-rust-developer.md` — verify links
- [ ] `.claude/agents/swe-python-developer.md` — verify links
- [ ] `.claude/agents/swe-kotlin-developer.md` — verify links
- [ ] `.claude/agents/swe-java-developer.md` — verify links
- [ ] `.claude/agents/swe-golang-developer.md` — verify links
- [ ] `.claude/agents/swe-fsharp-developer.md` — verify links
- [ ] `.claude/agents/swe-elixir-developer.md` — verify links
- [ ] `.claude/agents/swe-dart-developer.md` — verify links
- [ ] `.claude/agents/swe-csharp-developer.md` — verify links
- [ ] `.claude/agents/swe-clojure-developer.md` — verify links
- [ ] `.claude/agents/swe-e2e-test-developer.md` — verify links
- [ ] Run `ripgrep -i obsidian .claude/agents/` — expect zero matches
- [ ] Run `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-)' .claude/agents/` — expect zero matches

### Skill edits (Edit tool for targeted edits, Bash sed for bulk substitutions)

- [ ] `.claude/skills/docs-validating-links/SKILL.md` — remove "Error 3: Obsidian wiki links" block; update error numbering; remove any reference to the rhino-cli `validate-naming` command
- [ ] `.claude/skills/docs-validating-factual-accuracy/SKILL.md` — remove prefix-scheme references
- [ ] `.claude/skills/swe-developing-applications-common/SKILL.md` — verify all docs links resolve
- [ ] `.claude/skills/swe-developing-e2e-test-with-playwright/SKILL.md` — verify all docs links resolve
- [ ] `.claude/skills/swe-programming-typescript/SKILL.md` — verify all docs links resolve
- [ ] `.claude/skills/swe-programming-rust/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-python/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-kotlin/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-java/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-golang/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-fsharp/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-elixir/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-dart/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-csharp/SKILL.md` — verify links
- [ ] `.claude/skills/swe-programming-clojure/SKILL.md` — verify links
- [ ] `.claude/skills/repo-assessing-criticality-confidence/SKILL.md` — remove any prefix-scheme examples
- [ ] Run `ripgrep -i obsidian .claude/skills/` — expect zero matches
- [ ] Run `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-)' .claude/skills/` — expect zero matches

### Final scrub verification

- [ ] Run the Obsidian-word check: `ripgrep -i obsidian --glob '!plans/done/**' --glob '!local-temp/**' --glob '!.opencode/**' --glob '!apps/oseplatform-web/content/updates/**' --glob '!docs/metadata/external-links-status.yaml' --glob '!plans/in-progress/2026-04-11__remove-obsidian-compat/**'` — expect zero matches
- [ ] Run the prefix-pattern check: `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-|ex-ru-|ex-wf-|ex-de-|ex-co-)'` with the same exclusions **plus** `--glob '!apps/ayokoding-web/content/en/learn/software-engineering/automation-tools/**'` and the other false-positive paths from `tech-docs.md` §1.3.c — expect zero matches
- [ ] Run `npm run lint:md`
- [ ] Commit: `docs: scrub Obsidian references and prefix-scheme narrative from governance, agents, skills, and navigation`

### Phase 6 gate

- [ ] Zero active Obsidian references remain outside allowed historical paths
- [ ] Zero prefix-scheme narrative remains outside the false-positive allowlist
- [ ] All 12 `.claude/agents/swe-*-developer.md` agents have resolving docs links
- [ ] All 11 `.claude/skills/swe-programming-*/SKILL.md` skills have resolving docs links
- [ ] All `docs/**/README.md` index files list children by new filenames
- [ ] `governance/conventions/formatting/linking.md` cites "standard markdown" and "GitHub" as the sole rationale (verified by ripgrep)
- [ ] `governance/conventions/structure/file-naming.md` and `governance/conventions/formatting/linking.md` are both internally consistent (the file-naming rules produce filenames that the linking rules can reference)
- [ ] `npm run lint:md` passes

## Phase 7 — Sync .claude/ → .opencode/

**Goal**: Regenerate OpenCode mirrors so both stacks see the same agent and skill definitions.

- [ ] Run `npm run sync:claude-to-opencode`
- [ ] Run `git diff --stat .opencode/` and confirm every agent and skill that was edited in Phase 6 has a corresponding mirror change (should see ~30 mirrored files)
- [ ] Spot-check 3 mirrors: `git diff .opencode/agent/docs-maker.md`, `git diff .opencode/skill/swe-programming-typescript/SKILL.md`, `git diff .opencode/skill/docs-validating-links/SKILL.md`
- [ ] Verify `ripgrep -i obsidian .opencode/` returns zero matches
- [ ] Verify `ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-)' .opencode/` returns zero matches
- [ ] Commit: `chore(opencode): sync agent and skill mirrors after Obsidian and prefix scrub`

### Phase 7 gate

- [ ] Sync script exits clean
- [ ] Mirror diffs match expected edits across all updated agents and skills
- [ ] `git status` clean

## Phase 8 — Final Validation and Pre-Push

**Goal**: Make sure everything still works together before pushing.

- [ ] Run `npm run lint:md`
- [ ] Run `npm run format:md:check`
- [ ] Run `npx nx affected -t typecheck lint test:quick spec-coverage` to warm cache (per CLAUDE.md pre-push guidance)
- [ ] Run `git log --oneline` since plan start; confirm commits are split by domain and follow Conventional Commits
- [ ] Run the pre-commit hook manually (`.husky/pre-commit`) on a trivial edit to confirm `.claude/` validator passes
- [ ] Review `git diff origin/main` and sanity-check that no unintended file changes slipped in
- [ ] Re-run the final Obsidian scrub check from Phase 6
- [ ] Re-run `find docs -type f -name '*__*.md'` — zero results
- [ ] Re-run `find docs -name .obsidian` — zero results

### Phase 8 gate

- [ ] All lint checks pass
- [ ] Affected Nx targets pass
- [ ] Commit history is clean and well-segmented
- [ ] All validation checks from `tech-docs.md` §8 pass

## Phase 9 — Archive the Plan

**Goal**: Move the completed plan to `done/` and update indices.

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
2. `docs(governance): rewrite file-naming convention on standard-markdown and GitHub basis` — Phase 3
3. `refactor(rhino-cli): remove docs validate-naming command and prefix enforcement` — Phase 3b
4. `refactor(docs): rename prefixed files to kebab-case (300+ files)` — Phase 4 (pure rename)
5. `refactor(docs): update internal links for renamed files` — Phase 5
6. `docs: scrub Obsidian references and prefix-scheme narrative from governance, agents, skills, and navigation` — Phase 6
7. `chore(opencode): sync agent and skill mirrors after Obsidian and prefix scrub` — Phase 7
8. `docs(plans): archive remove-obsidian-compat plan` — Phase 9

Each commit is independently revertible (see `tech-docs.md` §9). Phases 3b and 4 are coupled: reverting Phase 4 requires reverting Phase 3b simultaneously to restore consistent state.

## Execution Notes

Reserved for recording baseline counts, collision resolutions, surprise findings, and any deviation from the plan as it is executed. Append entries under dated subheadings:

### 2026-04-11 — Plan created

- Baseline counts (to be filled during Phase 1): total docs md files: `<TBD>`, prefixed files: `<TBD>`, Obsidian reference files: `<TBD>`
