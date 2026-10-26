# Current Shared Source Inventory

## Revision and plan status

- Latest `origin/main` from `git ls-remote`: `bafba8b77f634cca89a5967f142767b81d743248` (`chore(plans): promote ayokoding app web plan (#739)`, 2026-10-26). The worktree's `origin/main` ref matches this SHA.
- The nine related Learn Revamp plans are 06–14. Plans 06, 07, 08, 09, 11, 12, 13, and 14 are in `plans/backlog/`; plan 10 is in `plans/in-progress/`. The plan index identifies plan 14 as owning legacy-content removal, redirects, Learn buckets, search, sitemap, and renderer fixtures. No unmerged sibling-worktree output was read.
- This worktree's source snapshot is unchanged from the merged revision. Current product changes from those plans are incorporated only when already present on this SHA.

## Shared content and schemas

- `apps/ayokoding-www/content/en/` contains 3,275 Markdown files; `content/id/` contains 125. Course content, section indexes, and localized pages remain read-only input to the rewrite.
- Content frontmatter is parsed by `apps/ayokoding-www/src/features/content/core/schemas.ts`: title is required; date, draft, weight, description, tags, layout/type, cascade, breadcrumb/book flags, prerequisites, outline status, and course category/format/estimated-hours metadata are supported. Draft defaults false, tags and prerequisites default to empty arrays, and weight defaults to zero.
- Eight phase-manifest JSON files exist under `apps/ayokoding-www/src/features/course-paths/manifests/`. `core/schemas.ts` validates variable-depth `careers/...` or `skills/...` kebab-case IDs, ordered core/extension phases, course references with optional framing, required core outcomes except the explicitly marked restructure shapes, optional assumptions/goals, and strict object shapes. `courseOrder` is derived from phases. The current temporary restructure marker is limited to the exact four skills paths in the allowlist.

## Redirects, tools, and public assets

- `apps/ayokoding-www/next.config.ts` loads redirect modules in this order: `localeEntryRedirects`, `contentNamespaceRedirects`, `learnReorgRedirects`, `courseRehomeRedirects`, `learnHomeRedirects`, then `learnThreeBucketRedirects`. The comments specify case-sensitive route matching; content namespace stripping precedes bare-path rules; course-specific rehome rules precede broader domain wildcards.
- Cost-of-living URL state is in `features/cost-of-living-calculator/core/url-state.ts`; it encodes cost/savings/min-role tab, region/country/city, household, school, area, gross salary, and min-role baseline inputs. Defaults are omitted and invalid values fall back safely.
- AI benchmark URL state is in `features/ai-benchmark/core/url-state.ts`; it encodes `harness`, `tier`, `sub`, and `sub-harness`, validates IDs against current datasets, omits defaults, and drops unknown values. Its datasets are in the adjacent `core/data/` directory; cost-of-living city, role, and FX datasets are in its `core/data/` directory.
- The existing app public directory has only `favicon.ico` and `favicon.png`.

## Existing app configuration

- `apps/ayokoding-www/project.json` defines the existing Next.js build/runtime and test targets. Dev/start default to port 3101 via `AYOKODING_WWW_PORT`; quick checks are sequential typecheck, lint, unit, and coverage; integration depends on build.
- `apps/ayokoding-www/next.config.ts` enables standalone output, case-sensitive routes, local worker options, a 180-second static-generation timeout, security/cache headers, standalone tracing for content/generated data and tRPC assets, external `flexsearch`, and unoptimized images.
- `apps/ayokoding-www/.env.example` documents optional content/manifests roots, draft visibility, host, and the app-specific port variable. No real environment files were read or modified.
- The separate FE and BE Playwright projects are `apps/ayokoding-www-fe-e2e/project.json` and `apps/ayokoding-www-be-e2e/project.json`; their individual server settings are recorded with the E2E config action.

## Source basis

Inventory was derived from tracked files and configuration at the SHA above. The existing route behavior and exact scenario/example ownership are recorded separately in the following Phase 0 actions.
