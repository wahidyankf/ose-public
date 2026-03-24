# Requirements

## User Stories

**As a developer**, I want the `ayokoding-web` Nx project to point to the Next.js app so that I can run all standard Nx targets (`build`, `dev`, `test:quick`, `test:integration`) without knowing there was a prior Hugo version.

**As a content editor**, I want all existing content available at `apps/ayokoding-web/content/` so that content paths in agents, skills, and governance docs remain correct after migration.

**As a CI/CD system**, I want a single test-and-deploy workflow for `ayokoding-web` that runs unit tests, E2E tests, and deploys to `prod-ayokoding-web` on success so that the Hugo-specific workflow and the v2 test-only workflow are consolidated.

**As a Vercel operator**, I want the `prod-ayokoding-web` branch to deploy a Next.js build so that ayokoding.com serves the new Next.js content platform.

**As a contributor**, I want no references to `ayokoding-web-v2` outside `archived/` and `plans/done/` so that the codebase is consistent and the migration is complete.

## Functional Requirements

1. `git mv apps/ayokoding-web/content apps/ayokoding-web-v2/content` moves all content into the Next.js app before any archiving occurs.
2. `apps/ayokoding-web` (Hugo) is moved to `archived/ayokoding-web-hugo/` and its `project.json` is removed so Nx no longer loads it.
3. `apps/ayokoding-web-v2` is renamed to `apps/ayokoding-web` and all internal paths, names, and references are updated.
4. `apps/ayokoding-web-v2-be-e2e` is renamed to `apps/ayokoding-web-be-e2e` with all internal references updated.
5. `apps/ayokoding-web-v2-fe-e2e` is renamed to `apps/ayokoding-web-fe-e2e` with all internal references updated.
6. `ayokoding-cli` `nav regen` and `titles update` commands and their supporting packages are removed; the `links check` command is preserved.
7. The GitHub Actions workflow `test-ayokoding-web-v2.yml` is converted to `test-and-deploy-ayokoding-web.yml` covering unit tests, E2E tests, and deployment to `prod-ayokoding-web`.
8. The Hugo workflow `test-and-deploy-ayokoding-web.yml` is deleted.
9. All agent, skill, governance, documentation, and configuration files are updated to remove `ayokoding-web-v2` references and Hugo-specific context where applicable.
10. After Phase 10 commits, `grep -r "ayokoding-web-v2" . --exclude-dir=archived --exclude-dir=generated-reports --exclude-dir=generated-socials --exclude-dir=.git` returns no results (except this plan file in `plans/in-progress/` and entries in `plans/done/`; the grep already excludes `generated-reports/` and `generated-socials/`).

## Non-Functional Requirements

- Zero downtime: the migration does not affect `oseplatform-web` or any other active Nx project.
- All CI checks must pass on `main` after the Phase 10 commits are pushed.
- Git history is preserved for all moved files via `git mv` (not `cp` + `rm`).
- Content is available immediately after rename — no content is lost or recreated.
- The Vercel deployment for `prod-ayokoding-web` must successfully build Next.js after Phase 11 reconfiguration.

## Acceptance Criteria

```gherkin
Scenario: Migration is complete
  Given all Phase 1-10 delivery steps are checked off
  When nx run ayokoding-web:test:quick is executed
  Then it exits with code 0
  And apps/ayokoding-web/content/en/_index.md exists
  And apps/ayokoding-web/content/id/_index.md exists
  And archived/ayokoding-web-hugo/ exists with Hugo files but no content/ directory

Scenario: No stale v2 references remain
  Given all Phase 8 sweep steps are complete
  When grep -r "ayokoding-web-v2" . --exclude-dir=archived --exclude-dir=generated-reports --exclude-dir=generated-socials --exclude-dir=.git is run from the repo root
  Then the only matches are in plans/in-progress/ (this plan file) and plans/done/

Scenario: CLI cleanup is complete
  Given Phase 5 delivery steps are checked off
  When nx run ayokoding-cli:test:quick is executed
  Then it exits with code 0
  And ayokoding-cli nav regen returns "unknown command" error
  And ayokoding-cli titles update returns "unknown command" error
  And ayokoding-cli links check --content apps/ayokoding-web/content exits with code 0

Scenario: CI workflow consolidation is complete
  Given Phase 4 delivery steps are checked off
  When ls .github/workflows/ is run
  Then test-and-deploy-ayokoding-web.yml exists
  And test-ayokoding-web-v2.yml does not exist
  And test-and-deploy-ayokoding-web.yml (Hugo) does not exist

Scenario: E2E apps typecheck and lint pass after rename
  Given Phase 2 delivery steps are checked off
  When nx run ayokoding-web-be-e2e:test:quick is executed
  Then it exits with code 0 (typecheck and lint only — no Playwright tests run by test:quick)
  When nx run ayokoding-web-fe-e2e:test:quick is executed
  Then it exits with code 0 (typecheck and lint only — no Playwright tests run by test:quick)

Scenario: Pre-commit hook is consistent after CLI cleanup
  Given Phase 5 delivery steps are checked off
  And the rhino-cli step4StageAyokoding decision has been applied
  When git commit is run with content changes in apps/ayokoding-web/content/
  Then the pre-commit hook exits with code 0
  And no "unknown command" errors appear from ayokoding-cli

Scenario: Vercel deployment succeeds after reconfiguration
  Given Phase 11 Vercel dashboard reconfiguration is complete
  When Vercel builds from the prod-ayokoding-web branch
  Then the build succeeds with Next.js framework
  And ayokoding.com serves the Next.js content platform
```
