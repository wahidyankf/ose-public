# P3-E2E reality check: playwright-bdd per-project testDir

Versions in the worktree: `playwright-bdd` 9.2.1, `@playwright/test` 1.61.0.

## Probe

A throwaway config, `playwright.probe.config.ts` in `apps/ayokoding-web-e2e`, was written and deleted in
the same unit. It held:

- two `defineBddConfig` calls over `specs/apps/ayokoding/web/behaviours/**/*.feature`, with the shared
  steps glob `./tests/e2e/steps/**/*.steps.ts`, distinct `outputDir` values (`.features-gen/probe-a` with
  `tags: "@fixture"`, `.features-gen/probe-b` with `tags: "not @fixture"`);
- one ordinary `testDir` project (`tests/e2e`, `testMatch` of the three named specs).

The probe used three projects: `bdd-a` (`testDir` of the first call), `bdd-b` (`testDir` of the second call), and
`specs` (ordinary `testDir`).

## Commands and results

- `npx bddgen --config=playwright.probe.config.ts`: exit 0.
- `npx playwright test --list --config=playwright.probe.config.ts`: exit 0, `Total: 115 tests in 13 files`.
  - `[bdd-b]`: 103 tests across 10 generated spec files.
  - `[specs]`: 12 tests across the three ordinary specs.
  - `[bdd-a]`: 0 tests. `.features-gen/probe-a` was not generated, because no scenario carries `@fixture` yet.
- Raw list output: [playwright-probe-list.raw.txt](./playwright-probe-list.raw.txt).

## Finding

The per-project `testDir` mechanism works with two `defineBddConfig` calls that use distinct `outputDir` values. The
count matches the plan's 2026-11-28 check (115 tests in 13 files), and the ordinary `testDir` specs are found. The
`bdd-a` project shows that a tag filter that selects nothing produces no generated directory and no tests; this is not
an error. Source: `node_modules/playwright-bdd/dist/config/env.js` keys stored configs by `outputDir`, and throws only
when two calls share an `outputDir` with different options.

The probe files are deleted. Its generated `.features-gen` output is deleted.
