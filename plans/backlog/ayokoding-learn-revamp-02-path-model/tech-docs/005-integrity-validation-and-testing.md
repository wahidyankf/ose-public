# 005 — Integrity Validation and Testing

## Function Contracts

All new logic is pure and lives in `src/features/course-paths/core/` (relative to
`apps/ayokoding-www/`). No IO, no `console`, no randomness.

```ts
// core/path-core.ts
export function computeCore(
  goals: readonly string[],
  prerequisitesByCourse: PrerequisitesByCourse,
  assumes?: readonly string[],
): ReadonlySet<string>;

// core/path-phases.ts
export function corePhases(manifest: PathManifest): readonly PathPhase[];
export function extensionPhases(manifest: PathManifest): readonly PathPhase[];
export function phaseOfCourse(
  manifest: PathManifest,
  courseId: string,
): { phase: PathPhase; phaseIndex: number; position: number } | null; // position is 1-based in the path

// core/manifest-integrity.ts (existing file, extended)
export function checkManifestIntegrity(
  manifest: PathManifest,
  libraryCourseIds: readonly string[],
): { unresolvedIds: string[]; duplicateIds: string[] }; // unchanged signature; now spans all phases

export interface PathModelContext {
  prerequisitesByCourse: PrerequisitesByCourse;
  outlineCourseIds: ReadonlySet<string>;
  libraryCourseIds: readonly string[];
}

export interface PathModelViolations {
  unresolvedIds: string[];
  duplicateIds: string[];
  duplicatePhaseIds: string[];
  emptyPhaseIds: string[]; // also enforced by the schema; kept for synthetic inputs
  coreAfterExtension: string[]; // phase IDs of core phases that follow an extension phase
  closure: { courseId: string; missingPrerequisite: string }[];
  outlineInCore: string[];
  goalsOutsideCore: string[];
  coreMismatch: { missing: string[]; extra: string[] } | null; // only when goals are declared
  unusedAssumes: string[];
  assumesInsidePath: string[];
  unresolvedAssumes: string[];
  skillsExtension: string[]; // extension phase IDs in a skills/ path
  markerNotAllowed: boolean; // decision 39: marker on a path or value the allowlist does not name
}

export function checkPathModelIntegrity(manifest: PathManifest, context: PathModelContext): PathModelViolations;
export function isCleanPathModel(violations: PathModelViolations): boolean;

// core/skills-restructure-allowlist.ts (new; deleted by plan 07)
export const SKILLS_RESTRUCTURE_ALLOWLIST: ReadonlyMap<string, "plan-06" | "plan-07">;
export function isMarkedShape(file: PathManifestFile): boolean;
export function isPendingSkillsRestructure(manifest: PathManifest): boolean;
export function checkMarkerUsage(manifests: readonly PathManifest[]): {
  unusedAllowlistEntries: string[]; // allowlisted path IDs with no manifest carrying the matching marker
  unexpectedMarkers: string[]; // path IDs carrying a marker the allowlist does not name
};
```

`checkPathModelIntegrity` sets `markerNotAllowed` again even though the schema already rejects such a
file, so a synthetic manifest built in a test (which skips the schema) cannot slip through.

## Rules

| ID  | Rule                                                                                                                                           | Field in `PathModelViolations`                             | Decision |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| R1  | Every course ID resolves to a library course.                                                                                                  | `unresolvedIds`                                            | existing |
| R2  | A course appears at most once across all phases.                                                                                               | `duplicateIds`                                             | existing |
| R3  | Phase IDs are unique; no phase is empty; every core phase precedes every extension phase.                                                      | `duplicatePhaseIds`, `emptyPhaseIds`, `coreAfterExtension` | 3        |
| R4  | **Closure.** For each core course, each prerequisite is a course earlier in the path (necessarily core, by R3) or is listed in `assumes`.      | `closure`                                                  | 9        |
| R5  | **No outline in core.** A core course must not have `status: outline`.                                                                         | `outlineInCore`                                            | 6, 9     |
| R6  | **Goals.** Each goal sits in a core phase, and the set of core courses equals `computeCore(goals, …, assumes)`.                                | `goalsOutsideCore`, `coreMismatch`                         | 7, 11    |
| R7  | **Exact `assumes`.** Each assumed ID resolves, is not in the path, and is a prerequisite of at least one core course.                          | `unresolvedAssumes`, `assumesInsidePath`, `unusedAssumes`  | 10       |
| R8  | **Skills shape.** A `skills/` path has no extension phase.                                                                                     | `skillsExtension`                                          | 17       |
| R9  | **Closed marker.** Only an allowlisted path carries `restructurePendingIn`, with its own value; every allowlist entry is used by its manifest. | `markerNotAllowed`; `checkMarkerUsage` over the set        | 39       |
| R10 | **Ordering** (existing `checkPrerequisiteConsistency`). Across the full flattened order, no course precedes an in-path prerequisite.           | (existing result type)                                     | existing |

R4 together with R7 makes `assumes` exactly the set of outside prerequisites of core courses.
Extension courses may still have outside prerequisites; the course page lists them as links ("link,
don't walk").

**Marked skills manifests (decision 39).** When `isPendingSkillsRestructure(manifest)` is true,
`checkPathModelIntegrity` skips R4, R5, R6, R7, and R8 and leaves their fields empty. R1, R2, R3, R9,
and R10 still run. The schema already skips the core-outcome rule for them. Nothing else in this
module reads the marker. Plans 06 and 07 remove the marker from their paths, and from then on every
rule applies to them.

## Where the Rules Run

| Place                                | Rules                                                                                | On failure                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `PathManifestSchema` (zod)           | shape, R3's empty-phase part, core outcome, R9 per file (allowlist and marked shape) | `loadManifests` skips the manifest with `console.warn` (today's behaviour) |
| `loadManifests`                      | R1                                                                                   | skip with `console.warn` (unchanged)                                       |
| Unit tests over synthetic manifests  | R1–R10, each in isolation                                                            | test fails                                                                 |
| Unit tests over the 8 real manifests | R1–R10 with real frontmatter, plus `checkMarkerUsage` over the set                   | test fails and prints every violation, including `coreMismatch`            |

## Test Files

Paths are relative to `apps/ayokoding-www/`.

| File                                                                                                                                          | New / edited | Proves                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/features/course-paths/core/schemas.test.ts`                                                                                       | edited       | New shape parses; core phase without outcome fails; legacy `courseOrder` file fails after contract; derived `courseOrder`; marker rejected on a career path, an unlisted skills path, a wrong plan value, or a non-`all-courses` shape |
| `tests/unit/features/course-paths/core/path-core.test.ts`                                                                                     | new          | `computeCore`: single goal, two goals, stop at `assumes`, diamond dependencies, unknown IDs ignored                                                                                                                                    |
| `tests/unit/features/course-paths/core/path-phases.test.ts`                                                                                   | new          | `corePhases`, `extensionPhases`, `phaseOfCourse` positions across phase boundaries                                                                                                                                                     |
| `tests/unit/features/course-paths/core/skills-restructure-allowlist.test.ts`                                                                  | new          | Exactly four entries, all keys start with `skills/`, values match their plan; `isMarkedShape`; `isPendingSkillsRestructure`; `checkMarkerUsage` reports an unused entry and an unexpected marker                                       |
| `tests/unit/features/course-paths/core/manifest-integrity.test.ts`                                                                            | edited       | R1–R9 each with one passing and one failing synthetic manifest; a marked manifest skips R4–R8 but still fails R1, R2, R3                                                                                                               |
| `tests/unit/features/course-paths/core/path-nav.test.ts`                                                                                      | edited       | Next/Prev across a phase boundary                                                                                                                                                                                                      |
| `tests/unit/features/course-paths/manifests/path-model-integrity.unit.test.ts`                                                                | new          | All 8 real manifests: zero violations under R1–R10                                                                                                                                                                                     |
| `tests/unit/features/course-paths/manifests/legacy-membership.ts`                                                                             | new (data)   | Frozen pre-change course sets per path ID                                                                                                                                                                                              |
| `tests/unit/features/course-paths/manifests/manifest-membership.unit.test.ts`                                                                 | new          | Each real manifest's set equals its frozen set                                                                                                                                                                                         |
| `tests/unit/features/course-paths/manifests/legacy-skills-order.ts`                                                                           | new (data)   | Frozen pre-change ordered course lists of the four skills paths                                                                                                                                                                        |
| `tests/unit/features/course-paths/manifests/skills-order.unit.test.ts`                                                                        | new          | Each marked skills manifest's derived `courseOrder` equals its frozen order; `checkMarkerUsage` over the real set is clean                                                                                                             |
| `tests/unit/features/content/course-frontmatter.unit.test.ts`                                                                                 | new          | Every course `_index.md` parses with `frontmatterSchema`; under 1,000 words ⇒ `status: outline`                                                                                                                                        |
| `tests/unit/features/content/core/schemas.test.ts`                                                                                            | edited       | `status` accepts `outline` and absence; rejects other values                                                                                                                                                                           |
| `tests/unit/features/course-paths/manifests/careers/*.unit.test.ts`, `skills/*.unit.test.ts`                                                  | edited       | Read `phases`; keep their existing assertions (for example IE has `capstone-full-stack-app` before `computer-science-foundations`)                                                                                                     |
| `tests/unit/features/course-paths/shell/*.test.tsx` and `tests/unit/fe-steps/*.steps.tsx`                                                     | edited       | Build fixtures with a shared helper `manifestFixture({ phases })` instead of literal `courseOrder`                                                                                                                                     |
| `tests/unit/features/course-paths/shell/path-landing.test.tsx`, `path-rail.test.tsx`, `syllabus-preview.test.tsx`, `arc-landing.test.tsx`     | edited       | Career paths: phase headings, outcomes, extension heading, Outline badge, "Before you start", first-phase preview. Marked skills paths: today's flat list, none of those parts                                                         |
| `tests/unit/features/course-paths/shell/phase-section.test.tsx`, `phase-group.test.tsx`, `assumed-courses.test.tsx`, `outline-badge.test.tsx` | new          | Each new component renders its parts, in en and id                                                                                                                                                                                     |
| `tests/unit/features/course-paths/shell/course-library.test.ts`                                                                               | edited       | `outlineCourseIds` is derived locale-independently                                                                                                                                                                                     |
| `tests/unit/features/course-paths/content/path-copy.unit.test.ts`                                                                             | new          | No jargon in `content/en/learn/paths/_index.md` or under `content/en/learn/paths/careers/**`; AI descriptions say "for developers who already code". Plans 06 and 07 widen the scope                                                   |
| `tests/unit/fe-steps/*.steps.tsx` for the five new features                                                                                   | new          | Unit bindings for every new scenario                                                                                                                                                                                                   |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-paths.steps.ts`                                                                             | edited       | E2E bindings for the browser-visible scenarios against `generalist-track`                                                                                                                                                              |
| `tests/unit/features/course-paths/manifest-fixture.ts`                                                                                        | new          | Shared builder for synthetic manifests (one core phase by default)                                                                                                                                                                     |

The repository word count for the outline guard is "whitespace-split tokens across every `.md` file
in the course directory", implemented as a small helper inside the test file. It is test code, not a
product feature.

## Gherkin-to-Test Map

| Feature file                        | Unit binding                                          | Integration          | E2E binding                          |
| ----------------------------------- | ----------------------------------------------------- | -------------------- | ------------------------------------ |
| `path-phases.feature` (7 scenarios) | `tests/unit/fe-steps/path-phases.steps.tsx`           | exempt (comment)     | `course-paths.steps.ts`; 7 exempt    |
| `outline-course-status.feature` (4) | `tests/unit/fe-steps/outline-course-status.steps.tsx` | exempt               | scenario 1 only; 2–4 exempt          |
| `path-assumes.feature` (2)          | `tests/unit/fe-steps/path-assumes.steps.tsx`          | exempt               | scenario 1 only; 2 exempt            |
| `core-closure.feature` (14)         | `tests/unit/fe-steps/core-closure.steps.ts`           | exempt               | exempt                               |
| `path-copy.feature` (2)             | `tests/unit/fe-steps/path-copy.steps.ts`              | exempt               | exempt                               |
| 5 modified features                 | existing step files, wording updated                  | unchanged exemptions | existing step files, wording updated |

Static closure: `ayokoding-www:test:coverage:behaviour` and `ayokoding-www-fe-e2e:test:coverage:behaviour`
must pass, proving every scenario has its declared bindings.

## Manual API Wire Checks (tRPC)

The tRPC payload changes additively, so the plan checks it at the HTTP boundary on the dev server
(port 3101). The batch URL format comes from `apps/ayokoding-www-fe-e2e/tests/e2e/steps/backend-helpers.ts`.

| Case    | Command                                                                                                                                                                                                                           | Expected                                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Success | `rtk curl -sS -D local-tmp/ayokoding-learn-02/trpc-en.headers -o local-tmp/ayokoding-learn-02/trpc-en.json 'http://localhost:3101/api/trpc/coursePaths.getRouteData?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%22en%22%7D%7D'`   | Status `200`; `content-type: application/json`; body `[0].result.data.json.manifests` has 8 entries; each has `phases` (non-empty, each with `id`, `title`, `kind`, `courses`), `courseOrder` equal to the flattened phases, and `assumes`; the 4 skills entries have one `all-courses` phase and their `restructurePendingIn`; the 4 career entries have no marker; `outlineCourseIds` has 62 entries |
| Failure | `rtk curl -sS -D local-tmp/ayokoding-learn-02/trpc-bad.headers -o local-tmp/ayokoding-learn-02/trpc-bad.json 'http://localhost:3101/api/trpc/coursePaths.getRouteData?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%22xx%22%7D%7D'` | Status `400`; JSON body `[0].error.json.data.code` is `BAD_REQUEST` (the locale schema rejects `xx`)                                                                                                                                                                                                                                                                                                   |

Both checks run once with the default manifests (8 published paths). The response bodies are working
files under `local-tmp/`; the evidence file records status lines, header names, and the asserted
fields, not the full bodies.
