# Technical Documentation: ayokoding-web CI and Quality Gate Standardization

## Current State

### Nx Target Configuration (`project.json`)

ayokoding-web declares these targets:

| Target             | Command                                   | Cache           | Inputs                                   |
| ------------------ | ----------------------------------------- | --------------- | ---------------------------------------- |
| `codegen`          | `echo 'No codegen needed...'`             | inherited       | default                                  |
| `dev`              | `next dev --port 3101`                    | no              | —                                        |
| `build`            | `next build`                              | yes             | default                                  |
| `start`            | `next start --port 3101`                  | no              | —                                        |
| `typecheck`        | `tsc --noEmit`                            | yes (inherited) | default                                  |
| `lint`             | `npx oxlint@latest .`                     | yes (inherited) | default                                  |
| `test:unit`        | `npx vitest run`                          | yes             | `default` + Gherkin specs                |
| `test:quick`       | vitest + coverage + link check (parallel) | yes (inherited) | **default only (missing Gherkin specs)** |
| `test:integration` | `npx vitest run --project integration`    | no              | default                                  |

> **Cache inheritance note**: `test:quick` has no explicit `cache` or `inputs` field in `project.json`. The `yes (inherited)` cache value is confirmed from `nx.json` workspace defaults — `test:quick` is listed as a cacheable target in the workspace-level cache configuration.
>
> **Integration target state**: The `test:integration` Nx target already exists in `project.json` (command: `npx vitest run --project integration`), but the `integration` vitest project is **not yet declared** in `vitest.config.ts`. Running `test:integration` before Phase 7 will fail with "No project named 'integration' found in Vitest config." Phase 7 adds the missing vitest project config — it does not need to add the Nx target.

### CI Workflows

**PR Quality Gate** (`pr-quality-gate.yml`):

```yaml
# Current — runs all three gates (correct)
- name: Run typecheck
  run: npx nx affected -t typecheck
- name: Run lint
  run: npx nx affected -t lint
- name: Run test:quick
  run: npx nx affected -t test:quick
```

This is already well-structured with named steps. Improvement opportunity: add markdown linting as a separate named step.

**Scheduled Workflow** (`test-and-deploy-ayokoding-web.yml`):

```
Jobs: unit → e2e → detect-changes → deploy
                                      ↓
                              (needs: unit, e2e)
```

Missing: `integration` job between `unit` and `deploy`.

### Testing Architecture

```
specs/apps/ayokoding-web/**/*.feature
        ↓
┌───────────────────────────────────┐
│ test:unit (vitest)                │
│ ├── unit project (Node.js env)   │  BE/tRPC step tests
│ └── unit-fe project (jsdom env)  │  FE component step tests
│                                   │
│ Coverage: 80% lines (rhino-cli)  │
│ Link check: ayokoding-cli        │
└───────────────────────────────────┘
        ↓ (composed inline in test:quick)

┌───────────────────────────────────┐
│ test:integration (vitest)         │
│ └── integration project           │  (DOES NOT EXIST — to be created in Phase 7)
│     cache: false                  │
└───────────────────────────────────┘
        ↓ (not in any CI workflow)

┌───────────────────────────────────┐
│ test:e2e (Playwright)             │
│ ├── ayokoding-web-be-e2e          │  tRPC API tests
│ └── ayokoding-web-fe-e2e          │  UI tests
│     Runs against Docker compose   │
└───────────────────────────────────┘
```

## Target State

### Change 1: Fix nx-targets.md Tag Table

In `governance/development/infra/nx-targets.md`, update the Current Project Tags table:

```diff
- | `ayokoding-web`           | `["type:app", "platform:hugo", "domain:ayokoding"]`                     |
+ | `ayokoding-web`           | `["type:app", "platform:nextjs", "lang:ts", "domain:ayokoding"]`        |
```

### Change 2: Add test:integration to Scheduled CI

Add a new `integration` job to `test-and-deploy-ayokoding-web.yml`:

```yaml
integration:
  name: Integration Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    -  # Volta + Node setup (same as unit job)
    - run: npm ci
    - name: Run integration tests
      run: npx nx run ayokoding-web:test:integration
```

Update the `deploy` job dependency:

```diff
  deploy:
-   needs: [unit, e2e, detect-changes]
+   needs: [unit, integration, e2e, detect-changes]
```

Update the `deploy` job `if:` condition:

```diff
  deploy:
    if: >-
-     (needs.detect-changes.outputs.has_changes == 'true' || inputs.force_deploy == 'true')
-     && needs.unit.result == 'success'
-     && needs.e2e.result == 'success'
+     (needs.detect-changes.outputs.has_changes == 'true' || inputs.force_deploy == 'true')
+     && needs.unit.result == 'success'
+     && needs.integration.result == 'success'
+     && needs.e2e.result == 'success'
```

### Change 3: Add Gherkin Spec Inputs to test:quick

In `apps/ayokoding-web/project.json`, add explicit inputs to `test:quick`:

```diff
  "test:quick": {
    "executor": "nx:run-commands",
+   "inputs": ["default", "{workspaceRoot}/specs/apps/ayokoding-web/**/*.feature"],
    "dependsOn": ["ayokoding-cli:build"],
```

This mirrors the `test:unit` inputs declaration and ensures cache invalidation on spec changes.

### Change 4: Improve PR Quality Gate Step Names (No Change Needed)

The `pr-quality-gate.yml` already has well-named steps:

- `name: Typecheck (affected)`
- `name: Lint (affected)`
- `name: Test quick (affected)`
- `name: Markdown linting`

No changes needed. This goal is already satisfied — verified against the actual workflow file.

### Change 5: Introduce Repository Pattern for Content Layer

#### Architecture: Current vs Target

**Current** — tRPC procedures call module functions directly, no injection:

```
tRPC procedures ──→ reader.ts (fs.readFile, fs.readdir)
                ──→ index.ts (module-level singleton cache)
                ──→ parser.ts (markdown → HTML)
                ──→ search-index.ts (FlexSearch, module-level Map)

sitemap.ts ────────→ index.ts (getContentIndex() directly)
feed.xml/route.ts ─→ index.ts (getContentIndex() directly)
generateStaticParams → index.ts (getContentIndex() directly)

Unit tests: vi.mock() on 4 modules with inline mock data
Integration tests: (effectively none for content layer)
```

**Target** — repository interface with dependency injection:

```
ContentRepository (interface)
├── readAllContent(): Promise<ContentMeta[]>
└── readFileContent(filePath: string): Promise<{ content: string; frontmatter: Record<string, unknown> }>

InMemoryContentRepository (unit tests)
├── Stores ContentMeta[] and file contents in Maps
├── Populated from fixture data (must pre-populate content for ALL fixture items)
├── readFileContent() must return meaningful content for each filePath key
│   so that ContentService.search() can call buildSearchIndex without I/O
└── No filesystem access

FileSystemContentRepository (production + integration tests)
├── Wraps current reader.ts functions
├── Reads from real content/ directory
└── Respects CONTENT_DIR env var and SHOW_DRAFTS flag

ContentService
├── constructor(repository: ContentRepository)
├── getBySlug(locale, slug) → ContentPage
├── listChildren(locale, parentSlug) → ContentMeta[]
├── getTree(locale, rootSlug?) → TreeNode[]
├── search(locale, query, limit) → SearchResult[]
├── getIndex() → ContentIndex (for sitemap, RSS, generateStaticParams)
└── Encapsulates: index building, tree computation, prev/next, search indexing, markdown parsing

tRPC procedures ──→ ContentService (via tRPC context)
sitemap.ts ────────→ ContentService (singleton)
feed.xml/route.ts ─→ ContentService (singleton)
generateStaticParams → ContentService (singleton)
```

#### File Structure (Target)

```
src/server/content/
├── types.ts                        # Existing — no changes
├── repository.ts                   # NEW: ContentRepository interface
├── repository-fs.ts                # NEW: FileSystemContentRepository (wraps reader.ts)
├── repository-memory.ts            # NEW: InMemoryContentRepository (test fixture data)
├── service.ts                      # NEW: ContentService (refactored from index.ts + search-index.ts)
├── parser.ts                       # Existing — pure function, no changes needed
├── shortcodes.ts                   # Existing — no changes
├── reader.ts                       # Existing — becomes internal to FileSystemContentRepository
├── index.ts                        # REMOVE: logic moves into ContentService
└── search-index.ts                 # REMOVE: logic moves into ContentService
```

#### Dependency Injection via tRPC Context

```typescript
// src/server/trpc/init.ts — add ContentService to context
import { ContentService } from "@/server/content/service";
import { FileSystemContentRepository } from "@/server/content/repository-fs";

const contentService = new ContentService(new FileSystemContentRepository());

export const createTRPCContext = () => ({ contentService });

// Change initTRPC.create(...) to initTRPC.context<...>().create(...)
const t = initTRPC.context<{ contentService: ContentService }>().create({
  transformer: superjson,
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
```

```typescript
// src/app/api/trpc/[trpc]/route.ts — pass context factory to fetch handler
import { createTRPCContext } from "@/server/trpc/init";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });
```

```typescript
// src/lib/trpc/server.ts — pass real ContentService context to server caller
import { createTRPCContext } from "@/server/trpc/init";

const createCaller = createCallerFactory(appRouter);
export const serverCaller = createCaller(createTRPCContext());
```

```typescript
// test/unit/be-steps/helpers/test-caller.ts — pass InMemoryContentRepository context
import { createCallerFactory } from "@/server/trpc/init";
import { ContentService } from "@/server/content/service";
import { InMemoryContentRepository } from "@/server/content/repository-memory";

const createCaller = createCallerFactory(appRouter);
export const testCaller = createCaller({
  contentService: new ContentService(new InMemoryContentRepository(populateFixtureData())),
});
```

```typescript
// src/server/trpc/procedures/content.ts — use context instead of imports
export const contentRouter = router({
  getBySlug: publicProcedure
    .input(...)
    .query(async ({ input, ctx }) => {
      return ctx.contentService.getBySlug(input.locale, input.slug);
    }),
});
```

#### Test Architecture (Target)

```
specs/apps/ayokoding-web/be/gherkin/**/*.feature
                ↓ (same specs, different repository)
┌────────────────────────────────────────────────┐
│ test:unit (vitest, "unit" project)             │
│                                                │
│ InMemoryContentRepository ──→ ContentService   │
│ ├── Fixture data in Maps                       │
│ ├── No vi.mock() on content modules            │
│ ├── Tests service logic: indexing, tree,       │
│ │   prev/next, search, slug resolution         │
│ └── Coverage measured here                     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ test:integration (vitest, "integration" proj)  │
│                                                │
│ FileSystemContentRepository ──→ ContentService │
│ ├── Reads real content/ directory              │
│ ├── Verifies frontmatter parsing, glob,        │
│ │   slug derivation against real files         │
│ ├── No HTTP calls (calls service directly)     │
│ └── cache: false (filesystem is non-det.)      │
└────────────────────────────────────────────────┘
```

**Pattern alignment with demo-be**: This mirrors the demo-be-golang-gin pattern where `MemoryStore` and `GORMStore` both implement `Store`, and unit/integration BDD suites differ only in which implementation is wired into the scenario context.

#### Coverage Exclusion Changes

Net changes to coverage exclusions (now testable through ContentService):

```diff
  exclude: [
    "src/components/ui/**",
    "src/components/layout/**",
    "src/components/content/**",
    "src/components/search/**",
    "src/app/**",
    "src/lib/hooks/**",
    "src/lib/trpc/client.ts",
    "src/lib/trpc/provider.tsx",
    "src/lib/trpc/server.ts",
    "src/middleware.ts",
-   "src/server/content/index.ts",
    "src/server/content/parser.ts",
    "src/server/content/reader.ts",
+   "src/server/content/repository-fs.ts",
-   "src/server/content/search-index.ts",
    "src/server/content/types.ts",
    "src/server/trpc/procedures/**",
    "src/test/**",
  ],
```

The net change is: remove `index.ts` and `search-index.ts` from the exclusion list; add `repository-fs.ts`. `reader.ts` remains excluded and stays in its alphabetical position.

`reader.ts` and `repository-fs.ts` stay excluded (thin I/O wrappers — covered by integration tests). `parser.ts` stays excluded (heavy rehype pipeline — covered by integration tests). `types.ts` stays excluded (type-only). tRPC procedures stay excluded (thin delegation to ContentService). The newly testable service logic (`service.ts`) is **not** excluded — covered by unit tests through `InMemoryContentRepository`.

### Change 6: Add Oxlint Project Config for Unused Code Errors

**Current state**: `npx oxlint@latest .` runs with zero configuration. No `.oxlintrc.json` exists. TypeScript's `noUnusedLocals`/`noUnusedParameters` (both `true`) catch unused variables/parameters at typecheck time, but the linter adds no additional enforcement.

**Verified**: `apps/ayokoding-web/tsconfig.json` already has `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noUncheckedIndexedAccess: true`. No TypeScript changes needed.

**Target**: Create `apps/ayokoding-web/oxlint.json` following the `demo-be-ts-effect` pattern:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn",
    "eqeqeq": "error"
  }
}
```

> **Schema note**: The `demo-be-ts-effect` pattern uses `"./node_modules/oxlint/configuration_schema.json"` — a local reference to the oxlint package's bundled schema. This enables IDE autocomplete and validation without relying on an external URL.

Also create matching configs for `apps/ayokoding-web-be-e2e/oxlint.json` and `apps/ayokoding-web-fe-e2e/oxlint.json`.

### Change 7: Create FE Unit Step Files for All FE Gherkin Specs

**Current state**: The `unit-fe` vitest project is defined but has zero step files. The `test/unit/fe-steps/` directory does not exist.

**Target**: Create step files for all 6 FE Gherkin specs:

```
test/unit/fe-steps/
├── helpers/
│   └── test-setup.ts           # jsdom setup, mock providers, render helpers
├── content-rendering.steps.tsx  # specs/apps/ayokoding-web/fe/gherkin/content-rendering.feature
├── navigation.steps.tsx         # specs/apps/ayokoding-web/fe/gherkin/navigation.feature
├── search.steps.tsx             # specs/apps/ayokoding-web/fe/gherkin/search.feature
├── responsive.steps.tsx         # specs/apps/ayokoding-web/fe/gherkin/responsive.feature
├── i18n.steps.tsx               # specs/apps/ayokoding-web/fe/gherkin/i18n.feature
└── accessibility.steps.tsx      # specs/apps/ayokoding-web/fe/gherkin/accessibility.feature
```

All FE unit tests must use:

- jsdom environment (already configured in `unit-fe` vitest project)
- `@testing-library/react` for component rendering
- Mocked tRPC client (no real API calls)
- Mocked router/navigation (no real routing)
- `@amiceli/vitest-cucumber` for Gherkin consumption (same as BE unit tests)

### Change 8: Enforce Unit Test Purity — Move integration-content.unit.test.ts

**Current state**: `test/unit/be-steps/integration-content.unit.test.ts` performs real filesystem reads (`fs.stat`, `fs.readdir`) against the `content/` directory. It is matched by the `unit` vitest project's `**/*.unit.{test,spec}.{ts,tsx}` glob.

**Target**: Move to integration project:

```diff
- test/unit/be-steps/integration-content.unit.test.ts
+ test/integration/be-steps/integration-content.integration.test.ts
```

Rename from `.unit.test.ts` to `.integration.test.ts` to match the integration project's include pattern. Update the `integration` vitest project to also include `**/*.integration.{test,spec}.{ts,tsx}`.

### Change 9: Convert BE E2E to Consume Gherkin Specs via playwright-bdd

**Current state**: `ayokoding-web-be-e2e/src/tests/` has 4 plain Playwright spec files. No Gherkin consumption. Missing `navigation-api` coverage.

**Target**: Install `playwright-bdd` and restructure tests:

```
apps/ayokoding-web-be-e2e/
├── playwright.config.ts         # Updated: add playwright-bdd defineBddConfig
├── .features-gen/               # Auto-generated by playwright-bdd from .feature files
├── src/
│   └── steps/
│       ├── helpers/
│       │   └── api-client.ts    # Shared HTTP client for tRPC API calls
│       ├── health-check.steps.ts
│       ├── content-api.steps.ts
│       ├── search-api.steps.ts
│       ├── navigation-api.steps.ts  # NEW: was missing
│       └── i18n-api.steps.ts
└── project.json                 # Updated: add Gherkin spec inputs
```

Update `project.json` to include spec inputs:

```diff
  "test:e2e": {
+   "inputs": ["default", "{workspaceRoot}/specs/apps/ayokoding-web/be/gherkin/**/*.feature"],
```

### Change 10: Convert FE E2E to Consume Gherkin Specs via playwright-bdd

**Current state**: `ayokoding-web-fe-e2e/src/tests/` has 6 plain Playwright spec files corresponding to the 6 FE Gherkin specs by name, but they do not load `.feature` files.

**Target**: Install `playwright-bdd` and restructure tests:

```
apps/ayokoding-web-fe-e2e/
├── playwright.config.ts         # Updated: add playwright-bdd defineBddConfig
├── .features-gen/               # Auto-generated by playwright-bdd
├── src/
│   └── steps/
│       ├── helpers/
│       │   └── page-helpers.ts  # Shared navigation, wait, assertion helpers
│       ├── content-rendering.steps.ts
│       ├── navigation.steps.ts
│       ├── search.steps.ts
│       ├── responsive.steps.ts
│       ├── i18n.steps.ts
│       └── accessibility.steps.ts
└── project.json                 # Updated: add Gherkin spec inputs
```

Update `project.json` to include spec inputs:

```diff
  "test:e2e": {
+   "inputs": ["default", "{workspaceRoot}/specs/apps/ayokoding-web/fe/gherkin/**/*.feature"],
```

### Updated Testing Architecture (Full Target State)

```
specs/apps/ayokoding-web/
├── be/gherkin/**/*.feature (5 features)
│   ├──→ test:unit       (vitest, "unit" project)        Mock-only: InMemoryContentRepository → ContentService
│   ├──→ test:integration (vitest, "integration" project) Real fs: FileSystemContentRepository → ContentService
│   └──→ test:e2e        (playwright-bdd, ayokoding-web-be-e2e)  Real HTTP against running server
│
└── fe/gherkin/**/*.feature (6 features)
    ├──→ test:unit       (vitest, "unit-fe" project)      Mock-only: jsdom + mocked tRPC + @testing-library/react
    └──→ test:e2e        (playwright-bdd, ayokoding-web-fe-e2e)   Real browser against running server
```

**Key principles**:

- All test levels consume the SAME Gherkin specs — only step implementations differ
- Unit tests are mock-only (no filesystem, no HTTP, no real server)
- Integration tests use real resources (filesystem) but no HTTP
- E2E tests use real HTTP against a running server with a real browser

## Risks and Mitigations

| Risk                                                      | Likelihood | Impact | Mitigation                                                                                           |
| --------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Integration tests add CI time                             | Medium     | Low    | Run in parallel with unit and e2e jobs                                                               |
| Integration tests flaky in CI                             | Low        | Medium | ayokoding-web uses MSW (in-process), not real DB — deterministic                                     |
| Cache input change triggers rebuilds                      | Certain    | Low    | One-time cache miss, subsequent runs benefit from correct caching                                    |
| Repository refactor breaks existing tests                 | Medium     | Medium | Incremental approach: introduce interface first, then migrate tests one file at a time               |
| Coverage threshold harder to meet with more code included | Low        | Medium | Service logic is well-structured; InMemoryContentRepository enables thorough unit testing            |
| Integration tests sensitive to content/ directory changes | Medium     | Low    | Integration tests assert structural properties (non-empty, ordered, valid HTML) not specific content |
| playwright-bdd adds complexity to E2E projects            | Medium     | Medium | Well-established library; follows same Gherkin pattern as vitest-cucumber; one-time setup cost       |
| FE unit tests require extensive component mocking         | Medium     | Medium | Start with structural/smoke scenarios; use @testing-library/react best practices; mock at boundaries |
| Oxlint error rules may break existing code                | Low        | Low    | Run oxlint with new config first, fix any existing violations in the same commit                     |

## Out of Scope

- Changing the 80% coverage threshold (it exceeds the standard — no action needed)
- Modifying the pre-push hook (already correct)
- Introducing a database or external CMS — the repository pattern abstracts filesystem access, not storage migration
- Refactoring `parser.ts` — it remains a pure function called by ContentService
- Adding new Gherkin feature files — this plan only ensures existing specs are consumed at all test levels
- Changing Playwright test runner config beyond playwright-bdd integration (e.g., browser matrix, retries)
