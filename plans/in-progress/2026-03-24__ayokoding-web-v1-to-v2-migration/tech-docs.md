# Technical Documentation

## Architecture Decisions

### 1. Same production branch

`prod-ayokoding-web` — Vercel configuration changes from Hugo to Next.js on the same branch. No new
branch is created; the existing branch already maps to the `ayokoding.com` domain.

### 2. Content co-location

Content moves INTO the Next.js app before archiving occurs:
`apps/ayokoding-web/content/` moves to `apps/ayokoding-web-v2/content/` (then renamed to
`apps/ayokoding-web/content/` after the rename in Phase 2). This eliminates cross-app file reads
and keeps the Next.js app self-contained.

### 3. Keep `links check` command

The `ayokoding-cli links check` command validates Hugo-style absolute paths in markdown content.
These paths remain valid because the content format (frontmatter, bilingual structure, absolute
paths) has not changed — only the rendering engine changed.

### 4. Keep `hugo-commons` lib

The `hugo-commons` library is shared with `oseplatform-cli` for link validation and must not be
removed as part of this migration.

### 5. Keep `swe-hugo-developer` agent

The `swe-hugo-developer` agent remains necessary for `oseplatform-web`, which continues to use Hugo.

### 6. Hugo conventions partially preserved

Content format (frontmatter, weights, bilingual structure) did not change — only the rendering
engine changed. Hugo content conventions in governance remain relevant for content creation. The
`governance/conventions/hugo/ayokoding.md` file receives a deprecation notice rather than deletion.

### 7. Coverage threshold

`ayokoding-web` enforces ≥80% line coverage via:

```bash
rhino-cli test-coverage validate apps/ayokoding-web/coverage/lcov.info 80
```

This runs as part of `test:quick`. The 80% threshold is intentionally distinct from demo frontends
(≥70%) and TypeScript backends (≥90%), reflecting that the ayokoding-web codebase includes content
rendering and API layers fully covered by unit tests.

## Verification Strategy

Testing for this migration follows a three-layer approach matching the delivery plan (Phase 9):

1. **Local `test:quick`**: Run `nx run ayokoding-web:test:quick` after all code changes to verify
   unit tests and coverage threshold (≥80%) pass for the renamed app.
2. **Full quality gate**: Run `nx affected -t build lint typecheck test:quick` to validate all
   affected projects in the monorepo (including rhino-cli, ayokoding-cli, and E2E apps after
   renaming).
3. **Vercel deployment validation**: After Phase 11, verify the production branch
   `prod-ayokoding-web` builds successfully in Vercel and the site is accessible at ayokoding.com.

Phase 9 of the delivery plan contains the full verification checklist. This migration is primarily
a renaming and archiving exercise — no new business logic is introduced — so correctness is
validated through build/lint/test pass rather than new test authoring.

## Post-Migration Nx Dependency Graph

After migration, `nx graph` shows:

- `ayokoding-web` depends on `ayokoding-cli` (links check in test:integration) and `rhino-cli`
  (coverage validation in test:quick)
- `ayokoding-web-be-e2e` depends on `ayokoding-web` (requires the app running for E2E tests)
- `ayokoding-web-fe-e2e` depends on `ayokoding-web` (requires the app running for E2E tests)

The archive step in Phase 1 removes `archived/ayokoding-web-hugo/project.json` from Nx, so the
Hugo app disappears from the dependency graph entirely.

## Monorepo Structure After Migration

```
apps/
  ayokoding-web/          # Next.js fullstack content platform (renamed from ayokoding-web-v2)
    content/              # Moved from old Hugo app in Phase 1
  ayokoding-web-be-e2e/   # Playwright BE E2E tests (renamed from ayokoding-web-v2-be-e2e)
  ayokoding-web-fe-e2e/   # Playwright FE E2E tests (renamed from ayokoding-web-v2-fe-e2e)
archived/
  ayokoding-web-hugo/     # Archived Hugo app (moved from apps/ayokoding-web in Phase 1)
    content/              # NOT present — content was moved to Next.js app before archiving
```
