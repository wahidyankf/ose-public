# Delivery Checklist

## Phase 0: Preparation

- [ ] **0.1** Verify main branch CI passes (`gh run list --workflow=main-ci.yml`)
- [ ] **0.2** Verify `ayokoding-web-v2` unit tests pass locally: `nx run ayokoding-web-v2:test:quick`
- [ ] **0.3** Verify `ayokoding-web-v2` BE E2E tests pass locally: `nx run ayokoding-web-v2-be-e2e:test:quick`
- [ ] **0.4** Verify `ayokoding-web-v2` FE E2E tests pass locally: `nx run ayokoding-web-v2-fe-e2e:test:quick`
- [ ] **0.5** Verify `ayokoding-cli` tests pass locally: `nx run ayokoding-cli:test:quick`
- [ ] **0.6** Verify no uncommitted changes: `git status`

## Phase 1: Move Content & Archive Hugo App

### 1a: Move content into Next.js app (MUST happen before archiving)

- [ ] **1.1** `git mv apps/ayokoding-web/content apps/ayokoding-web-v2/content`
- [ ] **1.2** Verify content directory exists at `apps/ayokoding-web-v2/content/en/` and `apps/ayokoding-web-v2/content/id/`

### 1b: Create archive directory

- [ ] **1.3** Create `archived/` directory at repo root
- [ ] **1.4** Create `archived/README.md`:
  - [ ] **1.4a** Title: "Archived Applications"
  - [ ] **1.4b** Explain purpose: contains previously active applications that have been superseded
  - [ ] **1.4c** List `ayokoding-web-hugo/` with migration date (2026-03-24), reason (replaced by Next.js), and successor (`apps/ayokoding-web`)
  - [ ] **1.4d** Note that archived apps are excluded from Nx workspace, CI, and Docker builds
  - [ ] **1.4e** Note that git history is preserved via `git mv`

### 1c: Archive Hugo app

- [ ] **1.5** `git mv apps/ayokoding-web archived/ayokoding-web-hugo`
- [ ] **1.6** Verify `archived/ayokoding-web-hugo/` contains Hugo files (hugo.yaml, layouts/, static/, etc.) but NOT `content/`
- [ ] **1.7** Remove `archived/ayokoding-web-hugo/project.json` (no longer an Nx project)

### 1d: Update .dockerignore

- [ ] **1.8** Add `archived` to `.dockerignore`
- [ ] **1.9** Remove `apps/ayokoding-web` exclusion line (Hugo app no longer at this path)
- [ ] **1.10** Remove `!apps/ayokoding-web/content` exception line (content now inside v2 app)

## Phase 2: Rename v2 Apps

### 2a: Rename main app

- [ ] **2.1** `git mv apps/ayokoding-web-v2 apps/ayokoding-web`
- [ ] **2.2** Update `apps/ayokoding-web/project.json`:
  - [ ] **2.2a** Change `"name"` from `"ayokoding-web-v2"` to `"ayokoding-web"`
  - [ ] **2.2b** Change `"sourceRoot"` from `"apps/ayokoding-web-v2/src"` to `"apps/ayokoding-web/src"`
  - [ ] **2.2c** Update `test:quick` links check path: `../../apps/ayokoding-web/content` → `content` (content is now local)
  - [ ] **2.2d** Update `test:quick` links check command: `../../apps/ayokoding-cli/dist/ayokoding-cli` → verify relative path from new cwd
  - [ ] **2.2e** Remove `"ayokoding-cli"` from `implicitDependencies` if links check is inlined or path adjusted
  - [ ] **2.2f** Update `specs` input path in `test:unit`: `{workspaceRoot}/specs/apps/ayokoding-web/**/*.feature` (already correct after rename)
- [ ] **2.3** Update `apps/ayokoding-web/package.json`:
  - [ ] **2.3a** Change `"name"` from `"ayokoding-web-v2"` to `"ayokoding-web"`

### 2b: Rename BE E2E app

- [ ] **2.4** `git mv apps/ayokoding-web-v2-be-e2e apps/ayokoding-web-be-e2e`
- [ ] **2.5** Update `apps/ayokoding-web-be-e2e/project.json`:
  - [ ] **2.5a** Change `"name"` from `"ayokoding-web-v2-be-e2e"` to `"ayokoding-web-be-e2e"`
  - [ ] **2.5b** Update all `"cwd"` paths from `"apps/ayokoding-web-v2-be-e2e"` to `"apps/ayokoding-web-be-e2e"`
- [ ] **2.6** Update `apps/ayokoding-web-be-e2e/package.json`:
  - [ ] **2.6a** Change `"name"` from `"ayokoding-web-v2-be-e2e"` to `"ayokoding-web-be-e2e"`

### 2c: Rename FE E2E app

- [ ] **2.7** `git mv apps/ayokoding-web-v2-fe-e2e apps/ayokoding-web-fe-e2e`
- [ ] **2.8** Update `apps/ayokoding-web-fe-e2e/project.json`:
  - [ ] **2.8a** Change `"name"` from `"ayokoding-web-v2-fe-e2e"` to `"ayokoding-web-fe-e2e"`
  - [ ] **2.8b** Update all `"cwd"` paths from `"apps/ayokoding-web-v2-fe-e2e"` to `"apps/ayokoding-web-fe-e2e"`
  - [ ] **2.8c** Change `"implicitDependencies"` from `["ayokoding-web-v2"]` to `["ayokoding-web"]`
- [ ] **2.9** Update `apps/ayokoding-web-fe-e2e/package.json`:
  - [ ] **2.9a** Change `"name"` from `"ayokoding-web-v2-fe-e2e"` to `"ayokoding-web-fe-e2e"`

### 2d: Update app source code references

- [ ] **2.10** Update `apps/ayokoding-web/src/server/content/reader.ts`:
  - [ ] **2.10a** Change default `CONTENT_DIR` from `../../apps/ayokoding-web/content` to `content` (relative to cwd, which is the app root)
- [ ] **2.11** Update `apps/ayokoding-web/Dockerfile`:
  - [ ] **2.11a** Change all `apps/ayokoding-web-v2` references to `apps/ayokoding-web`
  - [ ] **2.11b** Remove separate `COPY apps/ayokoding-web/content/` line (content now inside app dir)
  - [ ] **2.11c** Add `COPY apps/ayokoding-web/content/` in the runner stage for runtime fs.readFile
  - [ ] **2.11d** Update comment at top of Dockerfile referencing `ayokoding-web-v2`
- [ ] **2.12** Update `apps/ayokoding-web/vercel.json`:
  - [ ] **2.12a** Change `prod-ayokoding-web-v2` to `prod-ayokoding-web` in `ignoreCommand`
- [ ] **2.13** Update `apps/ayokoding-web/README.md`:
  - [ ] **2.13a** Change title from `ayokoding-web-v2` to `ayokoding-web`
  - [ ] **2.13b** Remove reference to "Replaces the Hugo-based ayokoding-web"
  - [ ] **2.13c** Update content path from `apps/ayokoding-web/content/ (shared with Hugo site)` to `content/` (local)
  - [ ] **2.13d** Update all `nx` commands from `ayokoding-web-v2` to `ayokoding-web`
  - [ ] **2.13e** Update Docker path from `infra/dev/ayokoding-web-v2` to `infra/dev/ayokoding-web`
  - [ ] **2.13f** Update deploy branch from `prod-ayokoding-web-v2` to `prod-ayokoding-web`
  - [ ] **2.13g** Update Related section: remove Hugo v1 link, update E2E app names
- [ ] **2.14** Check `apps/ayokoding-web/vitest.config.ts` for any `ayokoding-web-v2` references
- [ ] **2.15** Check `apps/ayokoding-web/tsconfig.json` for any `ayokoding-web-v2` references
- [ ] **2.16** Check `apps/ayokoding-web/next.config.ts` for any `ayokoding-web-v2` references

## Phase 3: Update Infrastructure

### 3a: Docker Compose

- [ ] **3.1** `git mv infra/dev/ayokoding-web-v2 infra/dev/ayokoding-web`
- [ ] **3.2** Update `infra/dev/ayokoding-web/docker-compose.yml`:
  - [ ] **3.2a** Change service name from `ayokoding-web-v2` to `ayokoding-web`
  - [ ] **3.2b** Change `dockerfile` path from `apps/ayokoding-web-v2/Dockerfile` to `apps/ayokoding-web/Dockerfile`
  - [ ] **3.2c** Update `CONTENT_DIR` env to `/app/apps/ayokoding-web/content` (verify path correct after Dockerfile changes)

### 3b: Root package.json

- [ ] **3.3** Update `package.json`:
  - [ ] **3.3a** Remove Hugo archetype lint-staged entry (`"apps/ayokoding-web/archetypes/**/*.md": "echo 'Skipping Hugo archetype'"`)
  - [ ] **3.3b** Search for any `ayokoding-web-v2` in workspace entries and update
- [ ] **3.4** Run `npm install` to regenerate `package-lock.json`

### 3c: .dockerignore final check

- [ ] **3.5** Verify `.dockerignore` does NOT exclude `apps/ayokoding-web` (the new Next.js app)
- [ ] **3.6** Verify `archived` is in `.dockerignore`

## Phase 4: Update GitHub Actions Workflows

### 4a: Remove Hugo workflow

- [ ] **4.1** Delete `.github/workflows/test-and-deploy-ayokoding-web.yml` (Hugo build/deploy — no longer needed)

### 4b: Convert test workflow to Test and Deploy

- [ ] **4.2** Rename `.github/workflows/test-ayokoding-web-v2.yml` → `.github/workflows/test-and-deploy-ayokoding-web.yml`
- [ ] **4.3** Update workflow name: `"Test - AyoKoding Web v2"` → `"Test and Deploy - AyoKoding Web"`
- [ ] **4.4** Add `permissions: contents: write` (needed for deploy push)
- [ ] **4.5** Add `workflow_dispatch` input `force_deploy` (boolean, default false)
- [ ] **4.6** Update `unit` job:
  - [ ] **4.6a** Change `ayokoding-web-v2` references in build commands to `ayokoding-web`
  - [ ] **4.6b** Change `nx run ayokoding-web-v2:test:quick` to `nx run ayokoding-web:test:quick`
  - [ ] **4.6c** Update Codecov file path from `apps/ayokoding-web-v2/coverage/lcov.info` to `apps/ayokoding-web/coverage/lcov.info`
  - [ ] **4.6d** Update Codecov flags from `ayokoding-web-v2` to `ayokoding-web`
- [ ] **4.7** Update `e2e` job:
  - [ ] **4.7a** Change Docker compose path from `infra/dev/ayokoding-web-v2` to `infra/dev/ayokoding-web`
  - [ ] **4.7b** Change Playwright install paths from `apps/ayokoding-web-v2-be-e2e` to `apps/ayokoding-web-be-e2e`
  - [ ] **4.7c** Change Playwright install paths from `apps/ayokoding-web-v2-fe-e2e` to `apps/ayokoding-web-fe-e2e`
  - [ ] **4.7d** Change `nx run ayokoding-web-v2-be-e2e:test:e2e` to `nx run ayokoding-web-be-e2e:test:e2e`
  - [ ] **4.7e** Change `nx run ayokoding-web-v2-fe-e2e:test:e2e` to `nx run ayokoding-web-fe-e2e:test:e2e`
  - [ ] **4.7f** Update artifact upload paths from `apps/ayokoding-web-v2-*-e2e/playwright-report/` to `apps/ayokoding-web-*-e2e/playwright-report/`
- [ ] **4.8** Add `detect-changes` job (like Hugo workflow had):
  - [ ] **4.8a** Fetch `prod-ayokoding-web` branch
  - [ ] **4.8b** Diff against `HEAD -- apps/ayokoding-web/`
  - [ ] **4.8c** Output `has_changes` flag
- [ ] **4.9** Add `deploy` job:
  - [ ] **4.9a** Add `needs: [unit, e2e, detect-changes]`
  - [ ] **4.9b** Add condition: `if: (needs.detect-changes.outputs.has_changes == 'true' || inputs.force_deploy == 'true') && needs.unit.result == 'success' && needs.e2e.result == 'success'`
  - [ ] **4.9c** Checkout with `fetch-depth: 0`
  - [ ] **4.9d** Force-push to `prod-ayokoding-web`: `git push --force origin HEAD:prod-ayokoding-web`

### 4c: Update main CI if needed

- [ ] **4.10** Check `.github/workflows/main-ci.yml` for `ayokoding-web-v2` references and update

## Phase 5: Clean Up ayokoding-cli

### 5a: Remove nav command

- [ ] **5.1** Delete `apps/ayokoding-cli/cmd/nav.go`
- [ ] **5.2** Delete `apps/ayokoding-cli/cmd/nav_regen.go`
- [ ] **5.3** Delete `apps/ayokoding-cli/cmd/nav_regen_test.go`
- [ ] **5.4** Delete `apps/ayokoding-cli/cmd/nav-regen.integration_test.go`

### 5b: Remove titles command

- [ ] **5.5** Delete `apps/ayokoding-cli/cmd/titles.go`
- [ ] **5.6** Delete `apps/ayokoding-cli/cmd/titles_update.go`
- [ ] **5.7** Delete `apps/ayokoding-cli/cmd/titles_update_test.go`
- [ ] **5.8** Delete `apps/ayokoding-cli/cmd/titles-update.integration_test.go`

### 5c: Remove internal packages

- [ ] **5.9** Delete `apps/ayokoding-cli/internal/navigation/` directory
- [ ] **5.10** Delete `apps/ayokoding-cli/internal/titles/` directory
- [ ] **5.11** Delete `apps/ayokoding-cli/internal/markdown/` directory (only used by navigation/titles)

### 5d: Remove config

- [ ] **5.12** Delete `apps/ayokoding-cli/config/` directory (title override YAML files: `title-overrides-en.yaml`, `title-overrides-id.yaml`)

### 5e: Update root command

- [ ] **5.13** Update `apps/ayokoding-cli/cmd/root.go`:
  - [ ] **5.13a** Remove `navCmd` subcommand registration (AddCommand call)
  - [ ] **5.13b** Remove `titlesCmd` subcommand registration (AddCommand call)
  - [ ] **5.13c** Update root command description to reflect links-only functionality

### 5f: Clean up Go modules

- [ ] **5.14** Run `cd apps/ayokoding-cli && go mod tidy` to remove unused dependencies
- [ ] **5.15** Verify `go.sum` is updated

### 5g: Remove Hugo-specific specs

- [ ] **5.16** Delete `specs/apps/ayokoding-cli/nav/` directory (contains `nav-regen.feature`)
- [ ] **5.17** Delete `specs/apps/ayokoding-cli/titles/` directory (contains `titles-update.feature`)

### 5h: Update ayokoding-cli project.json

- [ ] **5.18** Remove `run-pre-commit` target (Hugo-specific automation for titles/nav)
- [ ] **5.19** Update `test:integration` inputs if they reference nav/titles spec paths
- [ ] **5.20** Verify remaining targets are correct (`build`, `test:quick`, `test:integration`, `lint`)

### 5i: Update ayokoding-cli README.md

- [ ] **5.21** Update `apps/ayokoding-cli/README.md`:
  - [ ] **5.21a** Remove "ayokoding-web Hugo site maintenance" from description — update to "content link validation"
  - [ ] **5.21b** Remove Quick Start nav regen examples
  - [ ] **5.21c** Remove "Navigation Management" section entirely
  - [ ] **5.21d** Remove "Title Management" section entirely
  - [ ] **5.21e** Keep "Link Validation" section, update content path references
  - [ ] **5.21f** Update Architecture tree: remove nav.go, nav_regen.go, titles.go, titles_update.go, internal/navigation/, internal/titles/, internal/markdown/, config/
  - [ ] **5.21g** Remove "Integration with AI Agents" subsections for navigation-maker and title-maker
  - [ ] **5.21h** Update "Pre-commit Automation" section: remove titles/nav automation, note it's no longer used
  - [ ] **5.21i** Update Testing section: remove nav regen and titles update test suites
  - [ ] **5.21j** Update Migration Notes: add v0.4.0 → v0.5.0 noting removal of nav/titles
  - [ ] **5.21k** Update References: remove links to deleted agents

### 5j: Update ayokoding-cli specs README

- [ ] **5.22** Update `specs/apps/ayokoding-cli/README.md`:
  - [ ] **5.22a** Remove `nav/` and `titles/` from Structure table
  - [ ] **5.22b** Update "Running the Tests" section: remove nav regen and titles update commands
  - [ ] **5.22c** Update test count (from 13 to remaining links-only count)

### 5k: Verify ayokoding-cli

- [ ] **5.23** Verify `ayokoding-cli` builds: `cd apps/ayokoding-cli && go build -o dist/ayokoding-cli`
- [ ] **5.24** Verify `ayokoding-cli` unit tests pass: `nx run ayokoding-cli:test:quick`
- [ ] **5.25** Verify `ayokoding-cli` integration tests pass: `nx run ayokoding-cli:test:integration`
- [ ] **5.26** Verify `ayokoding-cli links check --content apps/ayokoding-web/content` works with new content path

## Phase 6: Update Agents & Skills

### 6a: Delete Hugo-only agents from .claude/agents/

- [ ] **6.1** Delete `apps-ayokoding-web-navigation-maker.md` (uses ayokoding-cli nav regen — removed)
- [ ] **6.2** Delete `apps-ayokoding-web-title-maker.md` (uses ayokoding-cli titles update — removed)
- [ ] **6.3** Delete `apps-ayokoding-web-structure-maker.md` (creates Hugo `_index.md` structure)
- [ ] **6.4** Delete `apps-ayokoding-web-structure-checker.md` (validates Hugo structure)
- [ ] **6.5** Delete `apps-ayokoding-web-structure-fixer.md` (fixes Hugo structure)

### 6b: Update ayokoding-web content agents in .claude/agents/

- [ ] **6.6** Update `apps-ayokoding-web-deployer.md`:
  - [ ] **6.6a** Update description: Next.js deployment via `prod-ayokoding-web`
  - [ ] **6.6b** Remove Hugo build steps (hugo, Go setup)
  - [ ] **6.6c** Update deploy commands for Next.js
- [ ] **6.7** Update `apps-ayokoding-web-general-checker.md`: replace Hugo structure/navigation references with content-only validation
- [ ] **6.8** Update `apps-ayokoding-web-general-fixer.md`: remove Hugo-specific fix references
- [ ] **6.9** Update `apps-ayokoding-web-general-maker.md`: remove Hugo navigation/weight references if Hugo-specific
- [ ] **6.10** Update `apps-ayokoding-web-link-checker.md`: update content path references, remove Hugo routing context
- [ ] **6.11** Update `apps-ayokoding-web-link-fixer.md`: update content path references
- [ ] **6.12** Update `apps-ayokoding-web-by-example-checker.md`: remove Hugo-specific compliance references
- [ ] **6.13** Update `apps-ayokoding-web-by-example-fixer.md`: remove Hugo-specific fix references
- [ ] **6.14** Update `apps-ayokoding-web-by-example-maker.md`: remove Hugo navigation compliance, update content path
- [ ] **6.15** Update `apps-ayokoding-web-in-the-field-checker.md`: remove Hugo-specific references
- [ ] **6.16** Update `apps-ayokoding-web-in-the-field-fixer.md`: remove Hugo-specific fix references
- [ ] **6.17** Update `apps-ayokoding-web-in-the-field-maker.md`: remove Hugo navigation compliance, update content path
- [ ] **6.18** Update `apps-ayokoding-web-facts-checker.md`: update content path, remove Hugo context
- [ ] **6.19** Update `apps-ayokoding-web-facts-fixer.md`: update content path references

### 6c: Update non-ayokoding-web agents that reference ayokoding-web

- [ ] **6.20** Update `swe-hugo-developer.md`:
  - [ ] **6.20a** Remove `ayokoding-web` from description (keep `oseplatform-web` only)
  - [ ] **6.20b** Remove `apps-ayokoding-web-developing-content` from skills list
- [ ] **6.21** Update `docs-software-engineering-separation-checker.md`: change `apps/ayokoding-web/` Hugo references to Next.js context (content path stays the same)
- [ ] **6.22** Update `docs-software-engineering-separation-fixer.md`: same Hugo→Next.js context update
- [ ] **6.23** Update `repo-governance-checker.md`: remove Hugo weight system reference for ayokoding-web, update `apps-ayokoding-web-developing-content` reference
- [ ] **6.24** Verify `swe-*-developer.md` agents (7 agents: clojure, csharp, dart, fsharp, golang, kotlin, rust): paths `apps/ayokoding-web/content/...` remain correct after rename — NO changes needed

### 6d: Update .claude/agents/README.md

- [ ] **6.25** Remove 5 deleted agents from the agents index
- [ ] **6.26** Update descriptions of modified agents
- [ ] **6.27** Update any Hugo references for ayokoding-web

### 6e: Update .claude/skills/ — individual skill files

- [ ] **6.28** Update `apps-ayokoding-web-developing-content/SKILL.md`:
  - [ ] **6.28a** Change title from "Hugo ayokoding-web Development Skill" to Next.js content workflow
  - [ ] **6.28b** Remove Hextra theme references
  - [ ] **6.28c** Update content path references
  - [ ] **6.28d** Remove Hugo-specific frontmatter/navigation/weight guidance if no longer applicable
- [ ] **6.29** Update `agent-developing-agents/SKILL.md`: change "Hextra guide for ayokoding-web-agents" to remove Hextra reference
- [ ] **6.30** Update `docs-applying-content-quality/SKILL.md`: change "Hugo sites (ayokoding-web, oseplatform-web)" to "ayokoding-web (Next.js), oseplatform-web (Hugo)"
- [ ] **6.31** Update `docs-creating-by-example-tutorials/SKILL.md`: update Hugo ayokoding Convention reference
- [ ] **6.32** Update `docs-creating-in-the-field-tutorials/SKILL.md`: update `apps-ayokoding-web-developing-content` reference context
- [ ] **6.33** Update `docs-validating-factual-accuracy/SKILL.md`: update ayokoding-web facts-checker reference context
- [ ] **6.34** Update `docs-validating-links/SKILL.md`: change "Hugo content links (apps/ayokoding-web/)" to remove Hugo qualifier
- [ ] **6.35** Update `docs-validating-software-engineering-separation/SKILL.md`: update `apps/ayokoding-web/` scope description (no longer Hugo)
- [ ] **6.36** Update `repo-applying-maker-checker-fixer/SKILL.md`: update ayokoding-web audit report references
- [ ] **6.37** Update `repo-assessing-criticality-confidence/SKILL.md`: update "Hugo Content (ayokoding-web)" section header
- [ ] **6.38** Update `repo-generating-validation-reports/SKILL.md`: update ayokoding domain references
- [ ] **6.39** Update `repo-practicing-trunk-based-development/SKILL.md`: verify `prod-ayokoding-web` refs (should be correct), remove any `prod-ayokoding-web-v2` refs
- [ ] **6.40** Update `repo-understanding-repository-architecture/SKILL.md`: change "Hugo sites (ayokoding-web, oseplatform-web)" to separate them
- [ ] **6.41** Update `apps-organiclever-web-developing-content/SKILL.md`: update comparison table (ayokoding-web is now Next.js)
- [ ] **6.42** Update `apps-oseplatform-web-developing-content/SKILL.md`: update "Contrast with ayokoding-web" section (no longer Hugo)
- [ ] **6.43** Verify `swe-programming-*` skills (7 skills: clojure, csharp, dart, fsharp, golang, kotlin, rust): paths `apps/ayokoding-web/content/...` remain correct — NO changes needed

### 6f: Update .claude/skills/README.md

- [ ] **6.44** Update any references to deleted agents or changed paths
- [ ] **6.45** Update any Hugo+ayokoding-web references

### 6g: Sync to .opencode/

- [ ] **6.46** Run `npm run sync:claude-to-opencode` to sync all changes
- [ ] **6.47** Verify `.opencode/agent/` matches `.claude/agents/` (5 deleted agents removed, updated agents synced)
- [ ] **6.48** Verify `.opencode/skill/` matches `.claude/skills/` (updated skills synced)
- [ ] **6.49** Update `.opencode/agent/README.md` if not auto-synced
- [ ] **6.50** Update `.opencode/skill/README.md` if not auto-synced

## Phase 7: Update Documentation

### 7a: CLAUDE.md

- [ ] **7.1** Update app list:
  - [ ] **7.1a** Change `ayokoding-web` description from "Hugo static site (Hextra theme, bilingual)" to "Next.js 16 fullstack content platform (TypeScript, tRPC)"
  - [ ] **7.1b** Remove `ayokoding-web-v2` entry (merged into `ayokoding-web`)
  - [ ] **7.1c** Rename `ayokoding-web-v2-be-e2e` → `ayokoding-web-be-e2e`
  - [ ] **7.1d** Rename `ayokoding-web-v2-fe-e2e` → `ayokoding-web-fe-e2e`
- [ ] **7.2** Update `ayokoding-cli` description: remove "navigation generation" and "title update", keep "link validation"
- [ ] **7.3** Update Project Structure tree:
  - [ ] **7.3a** Change `ayokoding-web/` comment to "AyoKoding website (Next.js 16)"
  - [ ] **7.3b** Remove `ayokoding-web-v2/` entry
  - [ ] **7.3c** Rename v2 E2E entries
  - [ ] **7.3d** Add `archived/` to tree
- [ ] **7.4** Update Hugo Sites section:
  - [ ] **7.4a** Remove `ayokoding-web` Hugo subsection entirely
  - [ ] **7.4b** Keep `oseplatform-web` Hugo subsection
  - [ ] **7.4c** Add `ayokoding-web` as a Next.js app section (or update existing v2 section)
- [ ] **7.5** Update Git Workflow section:
  - [ ] **7.5a** Remove duplicate `prod-ayokoding-web` entries (Hugo and v2 → single entry for Next.js)
  - [ ] **7.5b** Remove `prod-ayokoding-web-v2` branch reference
- [ ] **7.6** Update pre-commit automation:
  - [ ] **7.6a** Remove "When ayokoding-web content changes: rebuilds CLI, updates titles, regenerates navigation"
- [ ] **7.7** Update agent lists: remove 5 deleted agents (navigation-maker, title-maker, structure-maker, structure-checker, structure-fixer)
- [ ] **7.8** Update all `ayokoding-web-v2` references to `ayokoding-web` throughout the file
- [ ] **7.9** Update Common Development Commands if they reference ayokoding-web-v2
- [ ] **7.10** Update coverage descriptions: change `ayokoding-web-v2` to `ayokoding-web`

### 7b: AGENTS.md

- [ ] **7.11** Remove 5 deleted agents
- [ ] **7.12** Update any `ayokoding-web-v2` references to `ayokoding-web`

### 7c: Root README.md

- [ ] **7.13** Verify ayokoding.com link and description are correct (no change needed unless Hugo is mentioned)

### 7d: apps/README.md

- [ ] **7.14** Update `apps/README.md`:
  - [ ] **7.14a** Change `ayokoding-web` from "Hugo static site" to "Next.js fullstack content platform"
  - [ ] **7.14b** Add `ayokoding-web-be-e2e` and `ayokoding-web-fe-e2e` to app list
  - [ ] **7.14c** Remove any `ayokoding-web-v2` references
  - [ ] **7.14d** Update `ayokoding-cli` description: remove "navigation generation"
  - [ ] **7.14e** Update Hugo Static Site section: remove `ayokoding-web` example, keep `oseplatform-web`
  - [ ] **7.14f** Add Next.js app structure example for `ayokoding-web`
  - [ ] **7.14g** Update Running Apps section: `nx dev ayokoding-web` is now Next.js, not Hugo
  - [ ] **7.14h** Update Deployment Branches table: single `prod-ayokoding-web` entry for Next.js
  - [ ] **7.14i** Remove duplicate/outdated deployment notes
  - [ ] **7.14j** Update Language Support section: `ayokoding-web` is TypeScript/Next.js, not Hugo

### 7e: docs/reference/ files

- [ ] **7.15** Update `docs/reference/re__monorepo-structure.md`
- [ ] **7.16** Update `docs/reference/re__project-dependency-graph.md`
- [ ] **7.17** Update `docs/reference/system-architecture/re-syar__applications.md`: Hugo → Next.js
- [ ] **7.18** Update `docs/reference/system-architecture/re-syar__ci-cd.md`: workflow references
- [ ] **7.19** Update `docs/reference/system-architecture/re-syar__components.md`: tech stack
- [ ] **7.20** Update `docs/reference/system-architecture/re-syar__deployment.md`: deployment info
- [ ] **7.21** Update `docs/reference/system-architecture/re-syar__technology-stack.md`: Hugo → Next.js
- [ ] **7.22** Update `docs/reference/system-architecture/README.md` if it references ayokoding-web-v2

### 7f: docs/how-to/ files

- [ ] **7.23** Update `docs/how-to/hoto__add-programming-language.md`: update ayokoding-web references (Hugo → Next.js context)
- [ ] **7.24** Update `docs/how-to/hoto__create-new-skill.md`: update references
- [ ] **7.25** Update `docs/how-to/README.md` if it references ayokoding-web

### 7g: docs/explanation/ files

- [ ] **7.26** Update `docs/explanation/software-engineering/architecture/c4-architecture-model/ex-soen-ar-c4armo__nx-workspace-visualization.md`: update Hugo → Next.js for ayokoding-web
- [ ] **7.27** Update `docs/explanation/software-engineering/programming-languages/typescript/README.md`: update ayokoding-web reference
- [ ] **7.28** Scan remaining `docs/explanation/` files for `ayokoding-web-v2` references — update any found (most files reference `apps/ayokoding-web/content/` which stays correct)

### 7h: governance/ — conventions files

- [ ] **7.29** Update `governance/README.md`: update ayokoding-web description
- [ ] **7.30** Update `governance/repository-governance-architecture.md`: update ayokoding-web description
- [ ] **7.31** Update `governance/conventions/README.md`: update references
- [ ] **7.32** Update `governance/conventions/hugo/ayokoding.md`:
  - [ ] **7.32a** Add deprecation notice: Hugo-specific conventions for the former Hugo-based ayokoding-web, preserved because content format unchanged
- [ ] **7.33** Update `governance/conventions/hugo/README.md`: note ayokoding-web migration to Next.js
- [ ] **7.34** Update `governance/conventions/hugo/shared.md`: scope to oseplatform-web only if ayokoding-specific
- [ ] **7.35** Update `governance/conventions/hugo/indonesian-content-policy.md`: update if Hugo-specific
- [ ] **7.36** Update `governance/conventions/hugo/ose-platform.md`: verify no ayokoding-web cross-refs
- [ ] **7.37** Update `governance/conventions/linking/internal-ayokoding-references.md`: update for Next.js routing
- [ ] **7.38** Update `governance/conventions/structure/README.md`: update references
- [ ] **7.39** Update `governance/conventions/structure/file-naming.md`: update ayokoding-web context
- [ ] **7.40** Update `governance/conventions/structure/programming-language-docs-separation.md`: update ayokoding-web context
- [ ] **7.41** Update `governance/conventions/formatting/indentation.md`: update ayokoding-web context if Hugo-specific
- [ ] **7.42** Update `governance/conventions/formatting/linking.md`: update ayokoding-web context
- [ ] **7.43** Update `governance/conventions/formatting/nested-code-fences.md`: update ayokoding-web context
- [ ] **7.44** Update `governance/conventions/tutorials/README.md`: update references
- [ ] **7.45** Update `governance/conventions/tutorials/by-concept.md`: update Hugo+ayokoding references
- [ ] **7.46** Update `governance/conventions/tutorials/by-example.md`: update Hugo+ayokoding references
- [ ] **7.47** Update `governance/conventions/tutorials/cookbook.md`: update references
- [ ] **7.48** Update `governance/conventions/tutorials/general.md`: update Hugo+ayokoding references
- [ ] **7.49** Update `governance/conventions/tutorials/in-the-field.md`: update Hugo+ayokoding references
- [ ] **7.50** Update `governance/conventions/tutorials/naming.md`: update references
- [ ] **7.51** Update `governance/conventions/tutorials/programming-language-content.md`: update references
- [ ] **7.52** Update `governance/conventions/tutorials/programming-language-structure.md`: update references
- [ ] **7.53** Update `governance/conventions/writing/conventions.md`: update references
- [ ] **7.54** Update `governance/conventions/writing/factual-validation.md`: update references
- [ ] **7.55** Update `governance/conventions/writing/quality.md`: update references

### 7i: governance/ — development files

- [ ] **7.56** Update `governance/development/README.md`: update references
- [ ] **7.57** Update `governance/development/hugo/README.md`: note ayokoding-web is no longer Hugo
- [ ] **7.58** Update `governance/development/hugo/best-practices.md`: scope to oseplatform-web only
- [ ] **7.59** Update `governance/development/hugo/development.md`: scope to oseplatform-web only
- [ ] **7.60** Update `governance/development/quality/code.md`: update references
- [ ] **7.61** Update `governance/development/quality/criticality-levels.md`: update ayokoding-web context
- [ ] **7.62** Update `governance/development/quality/fixer-confidence-levels.md`: update context
- [ ] **7.63** Update `governance/development/pattern/maker-checker-fixer.md`: remove references to deleted agents
- [ ] **7.64** Update `governance/development/agents/ai-agents.md`: remove deleted agents, update Hugo→Next.js
- [ ] **7.65** Update `governance/development/agents/anti-patterns.md`: update ayokoding-web context
- [ ] **7.66** Update `governance/development/agents/best-practices.md`: update ayokoding-web context
- [ ] **7.67** Update `governance/development/infra/nx-targets.md`:
  - [ ] **7.67a** Remove ayokoding-web Hugo targets
  - [ ] **7.67b** Add/update ayokoding-web Next.js targets (previously ayokoding-web-v2)
- [ ] **7.68** Update `governance/development/infra/temporary-files.md`: update references
- [ ] **7.69** Update `governance/development/infra/github-actions-workflow-naming.md`: update workflow names
- [ ] **7.70** Update `governance/development/workflow/trunk-based-development.md`:
  - [ ] **7.70a** Remove `prod-ayokoding-web-v2` branch reference
  - [ ] **7.70b** Keep single `prod-ayokoding-web` for Next.js

### 7j: governance/ — workflow files

- [ ] **7.71** Update `governance/workflows/README.md`: update references
- [ ] **7.72** Update `governance/workflows/ayokoding-web/README.md`:
  - [ ] **7.72a** Remove Hugo-specific workflow references
  - [ ] **7.72b** Update to reflect Next.js platform
- [ ] **7.73** Update `governance/workflows/ayokoding-web/ayokoding-web-general-quality-gate.md`: remove Hugo-specific steps (title regen, nav regen)
- [ ] **7.74** Update `governance/workflows/ayokoding-web/ayokoding-web-by-example-quality-gate.md`: remove Hugo-specific references
- [ ] **7.75** Update `governance/workflows/ayokoding-web/ayokoding-web-in-the-field-quality-gate.md`: remove Hugo-specific references
- [ ] **7.76** Update `governance/workflows/docs/docs-software-engineering-separation-quality-gate.md`: update ayokoding-web paths context
- [ ] **7.77** Update `governance/workflows/docs/README.md`: update references
- [ ] **7.78** Update `governance/workflows/meta/workflow-identifier.md`: update references
- [ ] **7.79** Update `governance/workflows/plan/README.md`: update references
- [ ] **7.80** Update `governance/workflows/repository/README.md`: update references

### 7k: specs/ files

- [ ] **7.81** Update `specs/apps/ayokoding-web/README.md`:
  - [ ] **7.81a** Remove v1/v2 version table — describe Next.js app only
  - [ ] **7.81b** Update "Related" links: remove Hugo v1 reference
  - [ ] **7.81c** Change status from "In spec" to "Active"
- [ ] **7.82** Check `specs/README.md` for any `ayokoding-web-v2` references
- [ ] **7.83** Update `specs/apps/ayokoding-cli/README.md`: already handled in Phase 5

### 7l: libs/ files

- [ ] **7.84** Update `libs/golang-commons/README.md`: update `ayokoding-cli` description if it mentions Hugo nav/titles
- [ ] **7.85** Update `libs/hugo-commons/README.md`: verify ayokoding-web references (link checker still used)
- [ ] **7.86** Update `libs/README.md` if it references ayokoding-web

### 7m: Other files

- [ ] **7.87** Check `codecov.yml` for ayokoding-web-v2 references and update
- [ ] **7.88** Check `go.work` for ayokoding-web-v2 references
- [ ] **7.89** Plans in `plans/done/` — do NOT update (historical records)

## Phase 8: Final Sweep — Grep for Stale References

- [ ] **8.1** Grep entire repo for `ayokoding-web-v2` — should be zero outside `archived/`, `plans/done/`, and `generated-socials/`
- [ ] **8.2** Grep entire repo for `prod-ayokoding-web-v2` — should be zero everywhere
- [ ] **8.3** Grep for `ayokoding-web-v2-be-e2e` — should be zero outside `plans/done/`
- [ ] **8.4** Grep for `ayokoding-web-v2-fe-e2e` — should be zero outside `plans/done/`
- [ ] **8.5** Grep for `Hugo.*ayokoding-web` or `ayokoding-web.*Hugo` — verify all updated except historical docs and governance deprecation notices
- [ ] **8.6** Grep for `Hextra.*ayokoding` — verify all updated except governance deprecation notices
- [ ] **8.7** Fix any remaining stale references found

## Phase 9: Verification

### 9a: Build verification

- [ ] **9.1** Run `npm install` to regenerate lockfile
- [ ] **9.2** Run `nx build ayokoding-web` — verify Next.js builds
- [ ] **9.3** Run `nx build ayokoding-cli` — verify CLI builds

### 9b: Test verification

- [ ] **9.4** Run `nx run ayokoding-web:test:quick` — verify unit tests + coverage
- [ ] **9.5** Run `nx run ayokoding-cli:test:quick` — verify CLI tests
- [ ] **9.6** Run `nx run ayokoding-web-be-e2e:test:quick` — verify BE E2E typecheck/lint
- [ ] **9.7** Run `nx run ayokoding-web-fe-e2e:test:quick` — verify FE E2E typecheck/lint

### 9c: Full quality gate

- [ ] **9.8** Run `npx nx affected -t typecheck lint test:quick --parallel=8` — full quality gate
- [ ] **9.9** Run `npm run lint:md` — verify markdown linting passes

### 9d: Integration verification

- [ ] **9.10** Verify `nx graph` shows correct dependency graph (no orphan v2 nodes)
- [ ] **9.11** Verify Docker build: `docker compose -f infra/dev/ayokoding-web/docker-compose.yml build`
- [ ] **9.12** Verify dev server: `nx dev ayokoding-web` — spot check content renders at localhost:3101

## Phase 10: Thematic Commits & Push

Each phase gets its own commit for clean git history and easy revert if needed. Commit after each phase's verification passes.

### 10a: Commit — Archive & Rename (Phases 1-3)

- [ ] **10.1** Stage Phase 1-3 changes (archive, rename, infra)
- [ ] **10.2** Commit: `refactor(ayokoding-web): archive Hugo v1, rename v2 to primary`
  - Includes: git mv operations, project.json updates, Dockerfile, docker-compose, .dockerignore, package.json, reader.ts, vercel.json, archived/README.md

### 10b: Commit — GitHub Actions (Phase 4)

- [ ] **10.3** Stage Phase 4 changes
- [ ] **10.4** Commit: `ci(ayokoding-web): replace Hugo workflow with Next.js test-and-deploy`
  - Includes: delete Hugo workflow, rename+update v2 workflow with deploy job

### 10c: Commit — CLI Cleanup (Phase 5)

- [ ] **10.5** Stage Phase 5 changes
- [ ] **10.6** Commit: `refactor(ayokoding-cli): remove Hugo-specific nav and titles commands`
  - Includes: delete nav/titles commands, internal packages, config, specs, update root.go, README

### 10d: Commit — Agents & Skills (Phase 6)

- [ ] **10.7** Stage Phase 6 changes
- [ ] **10.8** Commit: `refactor(agents): remove Hugo agents, update ayokoding-web references`
  - Includes: delete 5 Hugo agents, update 14+ agents, update 16+ skills, sync .opencode

### 10e: Commit — Documentation (Phase 7)

- [ ] **10.9** Stage Phase 7 changes
- [ ] **10.10** Commit: `docs(ayokoding-web): update all references from Hugo to Next.js`
  - Includes: CLAUDE.md, AGENTS.md, READMEs, governance, docs, specs

### 10f: Commit — Final fixes from grep sweep (Phase 8)

- [ ] **10.11** Stage Phase 8 fixes (if any)
- [ ] **10.12** Commit: `fix(ayokoding-web): resolve remaining stale v2 references` (skip if nothing to fix)

### 10g: Push & Monitor

- [ ] **10.13** Push all commits to `main`: `git push`
- [ ] **10.14** Monitor CI workflows: `gh run list --limit=5`
- [ ] **10.15** Verify main CI passes
- [ ] **10.16** Verify test-and-deploy-ayokoding-web workflow passes

## Phase 11: Post-Migration — Vercel Dashboard Reconfiguration

The current Vercel project for ayokoding.com is configured for Hugo. It must be reconfigured for Next.js.

### Current Vercel settings (to be changed)

| Setting                        | Current (Hugo)               | New (Next.js)                                 |
| ------------------------------ | ---------------------------- | --------------------------------------------- |
| Framework Preset               | Hugo                         | Next.js                                       |
| Build Command                  | `hugo --gc --minify`         | `next build` (or use default)                 |
| Output Directory               | `public`                     | `.next` (or use default)                      |
| Install Command                | None                         | `npm install --prefix=../.. --ignore-scripts` |
| Development Command            | `hugo server -D -w -p $PORT` | `next dev --port $PORT` (or use default)      |
| Root Directory                 | `apps/ayokoding-web`         | `apps/ayokoding-web` (unchanged)              |
| Include files outside root     | Enabled                      | Enabled (unchanged — needed for monorepo)     |
| Skip deployments on no changes | Enabled                      | Enabled (unchanged)                           |
| Production Branch              | `prod-ayokoding-web`         | `prod-ayokoding-web` (unchanged)              |

### 11a: Reconfigure Vercel dashboard

- [ ] **11.1** Go to [Vercel Dashboard](https://vercel.com) → ayokoding.com project → Settings → Build and Deployment
- [ ] **11.2** Change **Framework Preset** from "Hugo" to "Next.js"
- [ ] **11.3** Change **Build Command** (Override ON):
  - Remove: `hugo --gc --minify`
  - Set to: `next build` (or clear to use Next.js default)
- [ ] **11.4** Change **Output Directory** (Override ON):
  - Remove: `public`
  - Set to: `.next` (or clear to use Next.js default)
- [ ] **11.5** Change **Install Command** (Override ON):
  - Set to: `npm install --prefix=../.. --ignore-scripts`
  - This installs from the monorepo root (same as `vercel.json` `installCommand`)
- [ ] **11.6** Change **Development Command** (Override ON):
  - Remove: `hugo server -D -w -p $PORT`
  - Set to: `next dev --port $PORT` (or clear to use default)
- [ ] **11.7** Keep **Root Directory** as `apps/ayokoding-web` (unchanged)
- [ ] **11.8** Keep **Include files outside root directory** enabled (unchanged — needed for monorepo node_modules)
- [ ] **11.9** Keep **Skip deployments when no changes** enabled (unchanged)
- [ ] **11.10** Click **Save**

### 11b: Verify Production Overrides

- [ ] **11.11** In Build and Deployment settings, expand **Production Overrides** section
- [ ] **11.12** Verify production branch is `prod-ayokoding-web` (should already be set)
- [ ] **11.13** Clear any Hugo-specific production overrides if present

### 11c: Trigger deployment

- [ ] **11.14** Trigger a test deployment: go to GitHub Actions → "Test and Deploy - AyoKoding Web" → Run workflow → set `force_deploy=true`
- [ ] **11.15** Verify the workflow pushes to `prod-ayokoding-web`
- [ ] **11.16** Verify Vercel picks up the push and builds with Next.js (not Hugo)
- [ ] **11.17** Verify [ayokoding.com](https://ayokoding.com) serves correctly from the Next.js build

### 11d: Clean up old v2 branch

- [ ] **11.18** Remove `prod-ayokoding-web-v2` branch from git remote: `git push origin --delete prod-ayokoding-web-v2`
- [ ] **11.19** If a separate Vercel project exists for ayokoding-web-v2, delete it from Vercel dashboard

### 11e: Finalize plan

- [ ] **11.20** Update this plan status to "Done" and move to `plans/done/`
