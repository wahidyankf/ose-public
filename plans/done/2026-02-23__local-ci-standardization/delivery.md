# Delivery

## Commit Strategy

Commit after each phase using
[Conventional Commits](../../../governance/development/workflow/commit-messages.md) format.
One commit per phase keeps the history readable and makes individual phases easy to revert.

All commits go directly to `main` (Trunk Based Development — no feature branches needed for
this configuration-only change).

See [README.md](./README.md) for suggested commit messages per phase.

---

## Implementation Order

Changes are ordered from highest impact to lowest. Complete each phase before the next.

---

## Phase 1: Workspace Defaults (nx.json)

Update workspace-level caching and target defaults first so newly added targets inherit correct
caching behavior.

- [x] **1.1** Update `nx.json` `targetDefaults`: add `typecheck`, `test:quick`, `test:unit`,
      `test:integration`, `test:e2e`; remove non-standard `test` entry
- [x] **1.2** Remove `tasksRunnerOptions` block from `nx.json` entirely — redundant legacy
      config; caching is fully handled by `cache: true/false` in `targetDefaults`
- [x] **1.3** `package.json`: Update `"test"` script from `nx run-many -t test` →
      `nx run-many -t test:quick`
- [x] **1.4** `package.json`: Update `"affected:test"` script from `nx affected -t test` →
      `nx affected -t test:quick`

**Verify**: `cat nx.json` — confirm `targetDefaults` has the 7 canonical targets; `test` and
`tasksRunnerOptions` are gone. `grep "affected:test\|\"test\"" package.json` — confirm both
reference `test:quick`, not bare `test`.

---

## Phase 2: Critical Missing test:quick (Highest Safety Risk)

These two apps are **excluded from the pre-push hook and PR merge gate** until fixed.

- [x] **2.1** `oseplatform-web/project.json`: Add `test:quick` (runs `bash build.sh` with outputs)
- [x] **2.2** `oseplatform-web/project.json`: Fix `clean` to include `.hugo_build.lock`
- [x] **2.3** `organiclever-fe/package.json`: Add vitest devDependencies via
      `npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react vite-tsconfig-paths`
      (run from `apps/organiclever-fe`)
- [x] **2.4** Create `apps/organiclever-fe/vitest.config.ts` with `unit` and `integration`
      named projects (see tech-docs.md for full content; vitest 4 uses `vitest.config.ts` + `projects`)
- [x] **2.5** `organiclever-fe/project.json`: Update `lint` to `npx oxlint@latest .` (replaces
      `next lint`)
- [x] **2.6** `organiclever-fe/project.json`: Add `typecheck` (runs `tsc --noEmit`)
- [x] **2.7** `organiclever-fe/project.json`: Add `test:quick` (`npx vitest run --project unit`)
- [x] **2.8** `organiclever-fe/project.json`: Add `test:unit` (`npx vitest run --project unit`)
- [x] **2.9** `organiclever-fe/project.json`: Add `test:integration`
      (`npx vitest run --project integration`)

**Verify**:

- `nx run oseplatform-web:test:quick`, `nx run organiclever-fe:test:quick`,
  `nx run organiclever-fe:typecheck`, `nx run organiclever-fe:test:unit`,
  `nx run organiclever-fe:test:integration`, and
  `nx run organiclever-fe:lint` all return exit code 0.
- The `clean` fix for oseplatform-web includes `.hugo_build.lock`:

  ```bash
  grep -F ".hugo_build.lock" apps/oseplatform-web/project.json
  # Expected: one match
  ```

---

## Phase 3: Missing lint on Hugo Sites and Go CLIs

These four apps cannot participate in `nx affected -t lint` until fixed.

- [x] **3.1** `ayokoding-cli/project.json`: Add `lint` (`golangci-lint run ./...`)
- [x] **3.2** `rhino-cli/project.json`: Add `lint` (`CGO_ENABLED=0 golangci-lint run ./...`)
- [x] **3.3** `ayokoding-web/project.json`: Add `lint` (`markdownlint-cli2 "apps/ayokoding-web/content/**/*.md"` — workspace root cwd to pick up `.markdownlint-cli2.jsonc`)
- [x] **3.4** `oseplatform-web/project.json`: Add `lint` (`markdownlint-cli2 "apps/oseplatform-web/content/**/*.md"` — workspace root cwd)

**Verify**: `nx run ayokoding-cli:lint`, `nx run rhino-cli:lint`, `nx run ayokoding-web:lint`,
`nx run oseplatform-web:lint` — all exit 0.

---

## Phase 4: Spring Boot Standardization

Multiple renames and additions — apply all together.

- [x] **4.1** `organiclever-be/project.json`: Rename `serve` → `dev` (same command)
- [x] **4.2** `organiclever-be/project.json`: Rename `test` → `test:unit` (same command)
- [x] **4.3** `organiclever-be/project.json`: Add `test:quick` (`mvn test`)
- [x] **4.4** `organiclever-be/project.json`: Add `start` using glob pattern
      (`sh -c 'java -jar target/organiclever-be-*.jar'`) — see tech-docs.md for full JSON
- [x] **4.5** `organiclever-be/project.json`: Add `outputs: ["{projectRoot}/target"]` to `build`

**Verify**:

- `nx run organiclever-be:dev` — starts Spring Boot dev server
- `nx run organiclever-be:test:quick` — runs Maven tests
- `nx run organiclever-be:test:unit` — runs Maven tests (same result)
- The old `serve` and `test` targets no longer exist in `project.json`:

  ```bash
  grep -E '"serve"\s*:|"test"\s*:' apps/organiclever-be/project.json
  # Expected: no matches
  ```

---

## Phase 5: Flutter Standardization

- [x] **5.1** `organiclever-app/project.json`: Rename `test` → `test:unit` (keep `dependsOn: ["install"]`)
- [x] **5.2** `organiclever-app/project.json`: Add `typecheck` (`flutter analyze`)
- [x] **5.3** `organiclever-app/project.json`: Add `dependsOn: ["install"]` to `test:quick`
- [x] **5.4** `organiclever-app/project.json`: Remove `lint` — redundant with `typecheck` (same
      `flutter analyze` command; running both doubles execution per push with zero additional coverage)

**Verify**:

- `nx run organiclever-app:test:unit` — runs Flutter tests (install runs first)
- `nx run organiclever-app:test:quick` — runs Flutter tests (install runs first)
- `nx run organiclever-app:typecheck` — runs `flutter analyze`
- The old `test` target no longer exists in `organiclever-app/project.json`:

  ```bash
  grep -E '"test"\s*:' apps/organiclever-app/project.json
  # Expected: no match — bare "test" target renamed to "test:unit"
  ```

- The `lint` target no longer exists in `organiclever-app/project.json`:

  ```bash
  grep '"lint"' apps/organiclever-app/project.json
  # Expected: no match (lint removed per Flutter exception in nx-targets.md)
  ```

---

## Phase 6: Playwright E2E Standardization (3 projects)

Apply the same set of changes to all three E2E projects. Use the full updated files from
tech-docs.md to replace each project.json entirely.

- [x] **6.1** `organiclever-fe-e2e/project.json`: Rename `e2e` → `test:e2e`
- [x] **6.2** `organiclever-fe-e2e/project.json`: Rename `e2e:ui` → `test:e2e:ui`
- [x] **6.3** `organiclever-fe-e2e/project.json`: Rename `e2e:report` → `test:e2e:report`
- [x] **6.4** `organiclever-fe-e2e/project.json`: Add `lint` (`npx oxlint@latest .`)
- [x] **6.5** `organiclever-fe-e2e/project.json`: Add `test:quick` (`npx oxlint@latest .`)
- [x] **6.6** `organiclever-be-e2e/project.json`: Same 5 changes
- [x] **6.7** `organiclever-app-web-e2e/project.json`: Same 5 changes

**Verify**:

- `nx run organiclever-fe-e2e:lint` — exits 0
- `nx run organiclever-be-e2e:lint` — exits 0
- `nx run organiclever-app-web-e2e:lint` — exits 0
- `nx run organiclever-fe-e2e:test:quick` — exits 0
- `nx run organiclever-be-e2e:test:quick` — exits 0
- `nx run organiclever-app-web-e2e:test:quick` — exits 0
- The old `e2e`, `e2e:ui`, and `e2e:report` targets no longer exist in any of the 3 project.json files:

  ```bash
  grep -E '"e2e"\s*:|"e2e:ui"\s*:|"e2e:report"\s*:' \
    apps/organiclever-fe-e2e/project.json \
    apps/organiclever-be-e2e/project.json \
    apps/organiclever-app-web-e2e/project.json
  # Expected: no matches — all three old targets renamed
  ```

---

## Phase 7: Pre-push Hook

Update the hook after all project.json targets are in place so the three gates have full coverage.

- [x] **7.1** Replace `.husky/pre-push` content with the three-target sequence (see tech-docs.md)

**Verify**:

- `cat .husky/pre-push` — confirms all three `nx affected` commands are present in order
- Make a trivial change to any file, stage it, and run `git push --dry-run` — hook fires and
  runs typecheck, lint, and test:quick without error

---

## Final Validation

- [ ] **V1** `nx run-many -t test:quick` — all 10 apps produce a result
- [ ] **V2** `nx run-many -t lint` — 9 apps produce a result (Flutter skipped by design — no `lint` target)
- [ ] **V3** `nx run-many -t typecheck` — all statically typed apps produce a result
- [x] **V4** Verify no non-standard target names remain:

  ```bash
  grep -rE '"serve"\s*:|"test"\s*:' apps/*/project.json
  # Expected: no matches — "test:quick" / "test:unit" etc. do NOT match this pattern;
  # only bare "test": or "serve": would match

  grep -rE '"e2e"\s*:' apps/*/project.json
  # Expected: no matches — "test:e2e": does NOT match; only bare "e2e": would match
  ```

- [x] **V5** Verify E2E projects have canonical names:

  ```bash
  grep '"test:e2e' apps/organiclever-fe-e2e/project.json apps/organiclever-be-e2e/project.json apps/organiclever-app-web-e2e/project.json
  # Expected: 9 matches (3 per file: test:e2e, test:e2e:ui, test:e2e:report)
  ```

- [x] **V6** Verify `nx.json` has no legacy entries:

  ```bash
  grep -E '"test"\s*:' nx.json
  # Expected: no match — bare "test" targetDefault removed
  grep '"tasksRunnerOptions"' nx.json
  # Expected: no match — legacy tasksRunnerOptions block removed
  ```

- [x] **V7** Verify pre-push hook runs all three gates:

  ```bash
  cat .husky/pre-push
  # Expected: typecheck, lint, and test:quick all present
  ```

- [x] **V8** Verify organiclever-fe vitest workspace is in place:

  ```bash
  nx run organiclever-fe:test:unit        # exits 0
  nx run organiclever-fe:test:integration # exits 0
  grep 'name:' apps/organiclever-fe/vitest.config.ts
  # Expected: shows lines containing name: "unit" and name: "integration"
  ```

- [x] **V9** Verify package.json scripts reference canonical target name:

  ```bash
  grep "test:quick" package.json
  # Expected: both "test" and "affected:test" scripts show test:quick
  ```

- [x] **V10** Verify Spring Boot build declares outputs (step 4.5):

  ```bash
  grep '"outputs"' apps/organiclever-be/project.json
  # Expected: "{projectRoot}/target"
  ```

---

## Post-Completion

Move this plan folder from `plans/in-progress/` to `plans/done/` and update both index README
files when all checklist items and acceptance criteria are verified.

---

## Future Work (Out of Scope)

These improvements are noted but not part of this plan:

- Separate Maven Surefire (unit) from Failsafe (integration) in `organiclever-be` to give
  `test:quick` a genuine subset scope
- Add `test:unit` to Hugo sites if a content validation test suite is introduced
