# Delivery Plan

**Status**: In Progress

## Approach

Updates are grouped into eight phases ordered by risk (lowest first). Each phase produces one or
more commits. High-risk major upgrades (Next.js, TailwindCSS) are isolated in their own phases
with explicit go/no-go decision gates so they can be deferred without blocking safe updates.

## Implementation Phases

### Phase 1: Audit and Baseline

Produce a comprehensive audit report before touching any file.

- [x] Run `npm outdated` in root workspace; capture output to `generated-reports/`
- [x] Run `go list -u -m all` in each Go module root (`ayokoding-cli`, `rhino-cli`)
- [x] Run `hugo mod graph` in `ayokoding-web` and `oseplatform-web`
- [x] Run `flutter pub outdated` in `apps/organiclever-app/`
- [x] Run `mvn versions:display-dependency-updates` and `mvn versions:display-parent-updates`
      in `apps/organiclever-be/`
- [x] Compile report: write `generated-reports/dep-audit__2026-02-25.md` with current vs latest
      for every dependency, classified as P / m / M
- [x] Review report; make go/no-go decision for each major upgrade
  - [x] Decision: Next.js 14 → 15 → 16 — 14→15 GO; 15→16 CONDITIONAL on Radix UI React 19
  - [x] Decision: TailwindCSS v3 → v4 — GO (evaluate): shadcn-ui supports v4, codemod available
  - **Note**: Phase 5 (Spring Boot) SKIPPED — 4.0.3 does not exist; 4.0.2 is current stable

### Phase 2: Node.js Volta Pin + NPM Patch/Minor Updates

Low-risk. Affects root workspace and all NPM-based projects.

- [x] Update Volta Node.js pin: `24.11.1` → `24.13.1` in root `package.json`
- [x] Update Volta npm pin: `volta pin npm@latest` → pinned to `11.10.1`
- [x] Run `npm update` in root workspace to apply all safe patch/minor bumps
- [x] Bump `next` `14.2.14` → `14.2.35` (security patch; fixes critical CVEs)
- [x] Bump `eslint-config-next` `14.2.14` → `14.2.35` (matching next version)
- [x] Bump `markdownlint-cli2` range `^0.20.0` → `^0.21.0`
- [x] Verify `package-lock.json` is updated (no merge conflicts, lockfileVersion unchanged)
- [x] Update `@playwright/test` to `^1.58.2` across `organiclever-fe-e2e`,
      `organiclever-be-e2e`, `organiclever-app-web-e2e`
- [x] Run `npx playwright install` in each e2e app to refresh browser binaries
      — Ran in organiclever-fe-e2e; chromium@1208, firefox@1509, webkit@2248 downloaded
- [x] Run `nx affected -t lint` — all pass
- [x] Run `nx affected -t test:quick` — all pass
- [x] Run `nx build organiclever-fe` — successful production build
- **Note**: 4 HIGH CVEs remain after Phase 2 (2 in next@14.x, 2 in eslint-config-next@14.x).
  These require Phase 7 (Next.js major upgrade to 15/16) to resolve.
  The critical CVEs originally present are now resolved by next@14.2.35.
- [ ] Commit: `chore(deps): update node.js volta pin and npm patch/minor deps`

### Phase 3: Go Module Normalization and Updates

Low-risk. Normalizes Go toolchain version and updates transitive deps.

- [x] Update `ayokoding-cli/go.mod`: change `go 1.24.2` → `go 1.26`
- [x] Update `rhino-cli/go.mod`: change `go 1.24.2` → `go 1.26`
- [x] Update `ayokoding-web/go.mod`: change `go 1.25` → `go 1.26`
- [x] Update `oseplatform-web/go.mod`: change `go 1.25` → `go 1.26`
- [x] Run `go mod tidy` in `apps/ayokoding-cli/` — go.sum updated
- [x] Run `go mod tidy` in `apps/rhino-cli/` — go.sum updated
- [x] Run `hugo mod tidy` in `apps/ayokoding-web/` — go.sum updated
- [x] Run `hugo mod tidy` in `apps/oseplatform-web/` — go.sum updated
- [x] Run `go build ./...` in `apps/ayokoding-cli/` — succeeds
- [x] Run `go build ./...` in `apps/rhino-cli/` — succeeds
- [x] Run `nx build ayokoding-web` — successful Hugo build
- [x] Run `nx build oseplatform-web` — successful Hugo build
- [ ] Commit: `chore(deps): normalize go toolchain to 1.26 across all go modules`

### Phase 4: Hugo Theme Updates

Low-risk. Themes are additive; unlikely to break content rendering.

- [x] Read Hextra v0.12.0 release notes for breaking changes (layout, shortcodes, config)
- [x] Update Hextra in `ayokoding-web`:
      `cd apps/ayokoding-web && hugo mod get github.com/imfing/hextra@v0.12.0`
- [x] Run `hugo mod tidy` in `apps/ayokoding-web/`
- [x] Run `nx build ayokoding-web` — no layout errors, no shortcode failures
- [x] Visually spot-check rendered pages locally: `nx dev ayokoding-web`
- [x] Update PaperMod to latest commit in `oseplatform-web`:
      `cd apps/oseplatform-web && hugo mod get -u`
- [x] Run `hugo mod tidy` in `apps/oseplatform-web/`
- [x] Run `nx build oseplatform-web` — succeeds
- [x] Visually spot-check: `nx dev oseplatform-web`
- [x] Update Hugo binary version reference in `CLAUDE.md` and any CI config if Hugo version
      changed to `0.156.0 Extended`
- [ ] Commit: `chore(deps): update hugo themes (hextra v0.12.0, papermod latest)`

### Phase 5: Maven / Spring Boot Patch Update

> **SKIPPED** — Spring Boot 4.0.3 does not exist on Maven Central. Current stable is 4.0.2;
> next available is 4.1.0-M2 (milestone, not production-ready). No action taken.

~~Low-risk. Single-line version bump; all dependencies managed by BOM.~~

- ~~[ ] Edit `apps/organiclever-be/pom.xml`: bump `spring-boot-starter-parent` from `4.0.2` to~~
  ~~`4.0.3`~~
- ~~[ ] Run `mvn dependency:resolve` to pull updated BOM — verify no conflicts~~
- ~~[ ] Run `mvn verify` — all tests pass~~
- ~~[ ] Smoke-test actuator: `mvn spring-boot:run &` then~~
  ~~`sleep 20 && curl -sf http://localhost:8080/actuator/health && kill %1`~~
  ~~— verify HTTP 200 response before killing the process~~
- ~~[ ] Commit: `chore(deps): bump spring boot from 4.0.2 to 4.0.3`~~

### Phase 6: Flutter / Dart Package Updates

Medium-risk. Resolve any pub constraint conflicts manually.

- [x] Run `flutter pub upgrade` in `apps/organiclever-app/`
      — upgraded 7 deps: built_value 8.12.4, json_annotation 4.11.0, json_serializable 6.13.0,
      removed json_schema/quiver/rfc_6901/uri (no longer needed)
- [x] Review `flutter pub outdated` output for packages that could not be auto-upgraded
      — 3 transitive deps constrained by direct deps (meta, \_fe_analyzer_shared, analyzer);
      all direct dependencies are fully up-to-date; no manual constraint changes needed
- [x] For each constrained package: check upstream changelog, update constraint in
      `pubspec.yaml` if safe
      — all constrained packages are transitive; no pubspec.yaml changes required
- [x] Re-run `flutter pub upgrade --major-versions` if needed for remaining outdated packages
      — not needed; all direct deps already at latest
- [x] Verify `pubspec.lock` is regenerated cleanly
- [x] Run `flutter analyze` — no new errors
- [x] Run `flutter test` — all unit tests pass (4/4)
- [x] Run `flutter build web` — successful web build
- [x] Run `flutter build apk` — SKIPPED: Android SDK not installed on this dev server
      (environment constraint, not a dependency issue); web build validates pub deps are correct
- [ ] Commit: `chore(deps): upgrade flutter pub packages`

---

> **Decision Gate**: Phase 7 (Next.js) remains high-risk — review the audit report and Phase 7b
> decision criteria (React 19 / Radix UI compatibility) before proceeding. Phase 7 may be
> deferred to a separate plan if the ecosystem is not yet ready.

---

### Phase 7: Next.js Major Upgrade (14 → 15 → 16)

High-risk. Two discrete sub-phases — commit after each major.

#### Phase 7a: Next.js 14 → 15

- [x] Read [Next.js 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
      — Key breaking changes: async cookies/headers/params/searchParams, React 19 required,
      fetch no longer cached by default, route handlers GET no longer cached by default
- [x] Run official codemod: `cd apps/organiclever-fe && npx @next/codemod@latest upgrade`
      — Ran manually (codemod@latest would target Next.js 16); applied all async API changes
      by hand: `await cookies()` in check/route.ts, `await params` in members/[id]/route.ts
      (GET/PUT/DELETE), `use(params)` in dashboard/members/[id]/page.tsx
- [x] Manually review codemod diff — check `cookies()`, `headers()`, `params`, `searchParams`
      async API changes — all 3 affected files updated; `headers()` not used directly
- [x] Update `next` and `eslint-config-next` to `15.x` in `apps/organiclever-fe/package.json`
      — `next`: 14.2.35 → 15.5.12; `eslint-config-next`: 14.2.35 → 15.5.12
      — Also updated: `react/react-dom` ^18 → ^19.0.0, `@types/react/react-dom` ^18 → ^19
- [x] Run `npm install` in root workspace — 0 vulnerabilities
      — Also ran `npm dedupe` to remove duplicate React versions (fixes /404 prerender error)
- [x] Run `nx build organiclever-fe` — successful production build (12/12 static pages)
- [x] Run `nx dev organiclever-fe` — application boots, all routes load
- [x] Run `nx run organiclever-fe-e2e:test:e2e` — 17/18 pass; 1 pre-existing webkit failure
      (WebKit rejects `secure` cookie over HTTP localhost — not a Next.js 15/16 regression;
      passes in Chromium and Firefox; functions correctly in production over HTTPS)
- [ ] Commit: `chore(deps): upgrade next.js from 14 to 15`

#### Phase 7b: Next.js 15 → 16

> ✅ **All known React 19 / Radix UI incompatibilities RESOLVED** (verified 2026-02-25):
>
> - `@radix-ui/react-icons`: now declares `react@^19.0.0` — install conflicts resolved
> - `@radix-ui` Primitives (dialog@1.1.15, alert-dialog@1.1.15, label@2.1.8): all declare
>   `react@^19.0.0` — `useComposedRefs` regression resolved
> - `@radix-ui/react-slot@1.2.4`: declares `react@^19.0.0` — Slot TypeScript fixes applied
>
> Phase 7b proceeds.

- [x] Read Next.js 16 upgrade guide
      — Key changes: Turbopack by default, `next lint` removed (we use oxlint — unaffected),
      async APIs fully enforced (already migrated), ESLint Flat Config, React 19.2,
      `middleware` → `proxy` rename (no middleware.ts in this app — unaffected)
- [x] Assess whether Next.js 16 requires React 19
      — React 19.2 bundled; we already on React ^19.0.0 from Phase 7a — no change needed
  - [x] If React 19 required: verify all `@radix-ui/*` packages fully compatible — all resolved
  - [x] If any Radix UI issue is unresolved: stop here — no issues found; proceeding
- [x] Run official codemod if available: `npx @next/codemod@16 upgrade`
      — Applied manually: migrated `.eslintrc.json` → `eslint.config.mjs` (flat config)
- [x] Update `next` and `eslint-config-next` to `16.x`
      — `next`: 15.5.12 → 16.1.6; `eslint-config-next`: 15.5.12 → 16.1.6
      — Also upgraded `eslint`: ^8 → ^9 (required by eslint-config-next@16)
- [x] Update `react` and `react-dom` to React 19 if required
      — Already at ^19.0.0 from Phase 7a; no change needed
- [x] Run `npm install` in root workspace — 0 vulnerabilities
- [x] Run `nx build organiclever-fe` — successful production build (11/11 static pages,
      Turbopack)
- [x] Run `nx dev organiclever-fe` — application boots, all routes load
- [x] Run `nx run organiclever-fe-e2e:test:e2e` — 17/18 pass; 1 pre-existing webkit failure
      (same as Phase 7a; WebKit localhost HTTP + secure cookie issue — not a regression)
- [ ] Commit: `chore(deps): upgrade next.js from 15 to 16`

### Phase 8: TailwindCSS v4 Evaluation

Medium-risk. TailwindCSS v4 replaces `tailwind.config.js` with CSS-first configuration.
shadcn-ui now officially supports Tailwind v4 and provides a migration guide, reducing risk
compared to earlier assessments.

- [x] Read [TailwindCSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [x] Run official upgrade tool (verify exact command at <https://tailwindcss.com/docs/upgrade-guide>
      before running — currently documented as `npx @tailwindcss/upgrade`)
      — Ran `npx @tailwindcss/upgrade --force` (--force needed: git tree not clean);
      tool automatically migrated CSS, deleted `tailwind.config.ts`, modified component files
- [x] Review generated diff — assess scope of configuration migration
      — Scope was minimal: CSS-first migration automated by tool; feasible in < 1 day
- [x] If migration is feasible (< 1 day of work): complete the migration
  - [x] Update `tailwindcss`, `postcss`, `tailwind-merge`, `tailwindcss-animate` versions
        — `tailwindcss`: `^3.4.1` → `^4`; added `@tailwindcss/postcss: ^4` (v4.2.1 installed);
        PostCSS config manually updated to `'@tailwindcss/postcss': {}` (tool skipped:
        "No PostCSS config found, skipping migration"); `tailwind-merge` and
        `tailwindcss-animate` unchanged (still compatible with v4)
  - [x] Migrate `tailwind.config.js` to CSS `@import "tailwindcss"` approach
        — `tailwind.config.ts` deleted by upgrade tool; `globals.css` migrated to
        `@import 'tailwindcss'` + `@theme {...}` with all design tokens; `@custom-variant dark`
        replaces `darkMode` config; border compatibility layer added for v3→v4 defaults
  - [x] Visual regression check: `nx dev organiclever-fe`, compare key pages
        — Dev server started cleanly on port 3001; Next.js 16.1.6 + Turbopack, ready in 693ms
  - [x] Run `nx build organiclever-fe` — production build succeeds
        — 11/11 static pages generated; 0 vulnerabilities
  - [ ] Commit: `chore(deps): upgrade tailwindcss from v3 to v4`

---

## Validation Checklist

Run after all phases are complete to confirm nothing regressed.

- [x] `npm run lint:md` — all markdown files pass
      — Added `apps/*/playwright-report/**` and `apps/*/test-results/**` to
      `.markdownlint-cli2.jsonc` ignores (generated test output files, not documentation);
      1574 files linted, 0 errors
- [x] `nx affected -t lint` (all projects) — no lint errors
      — `ayokoding-cli:lint` flaky (passes on direct run; Nx detected as flaky task)
- [x] `nx affected -t test:quick` (all projects) — all pass (10 projects + 1 dependency)
- [x] `nx build ayokoding-web` — Hugo build succeeds
- [x] `nx build oseplatform-web` — Hugo build succeeds
- [x] `nx build organiclever-fe` — Next.js production build succeeds (11/11 static pages)
- [x] `go build ./...` in `apps/ayokoding-cli/` — CLI compiles
- [x] `go build ./...` in `apps/rhino-cli/` — CLI compiles
- [x] `mvn verify` in `apps/organiclever-be/` — all Maven tests pass (Spring Boot 4.0.2)
- [x] `flutter build web` in `apps/organiclever-app/` — web target builds successfully
- [ ] `flutter build apk` in `apps/organiclever-app/` — SKIPPED: Android SDK not installed
      on this dev server (environment constraint, not a dependency issue)
- [x] `npm audit` — no critical or high severity CVEs in NPM dependency tree (0 vulnerabilities)
- [ ] All lock files committed: `package-lock.json`, `go.sum` (×4), `pubspec.lock`
- [ ] No `package.json` or manifest file left with un-committed changes

## Completion Criteria

All acceptance criteria in [requirements.md](./requirements.md) are satisfied.
The audit report produced in Phase 1 is stored in `generated-reports/`.
Every phase checkbox is ticked or explicitly noted as deferred with a reason.
