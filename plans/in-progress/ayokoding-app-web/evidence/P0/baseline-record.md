# Phase 0 baseline record — ayokoding-app-web (Go+htmx)

Source revision (latest merged origin/main at execution start): `af40b276d`
Worktree: `worktrees/ayokoding-app-web`, branch `ayokoding-app-web-exec`, clean at start.
Bootstrap: `npm install` (transactional) exit 0; `rtk npm run doctor` — 25 toolchains, no findings.
Go toolchain on host: `go1.27.2` (satisfies the `go 1.26` floor set by the ayokoding-cli precedent).
Ports 3101/3102/3191 free at start; old app started on 3101 for reference captures
(HIPPO service via next-with-port, log at /tmp/ayokoding-www-3101.log; left running for parity
reference — owned by this plan, stop at Phase 3 close).

Reference screenshots (`P0/reference/`, copied to plan `evidence/P0/`): landing en+id, Learn hub
en (`/en/learn`), course catalog en (`/en/learn/courses`, 182 courses / 14 categories), path
landing en (`/en/learn/paths/careers/fundamentally-strong`), benchmark en, calculator en —
each at 375, 768, 1280 px, zero browser console errors on every page. An early capture used a
wrong catalog URL (`/en/paths`, 404 with 2 benign console errors); those files were deleted and
recaptured at the correct routes.

## Old-app baselines (ayokoding-www)

- `test:quick` → FAIL. Root cause (single, both layers): `tests/unit/be-steps/course-metadata.steps.ts`,
  "Course metadata check failed for 2 courses": `just-enough-csharp` estimatedHours stored 3 vs
  computed 11; `windows-app-development` stored 6 vs 7. Pre-existing content drift on main
  (execution branch touches plans/ only). All other unit tests pass: 4287 passed / 4 failed.
  Full log: `local-tmp/plan/ayokoding-app-web/P0/unit-baseline.log`.
- `test:integration` → FAIL, same single root cause. 188 passed / 4 failed (same 4 assertions).
  Full log: `local-tmp/plan/ayokoding-app-web/P0/integration-baseline.log`.

Disposition: content drift is owned by course content, outside this plan (the plan never edits
course bodies). Parity implements the recorded merged values at `af40b276d`; ledger notes the
drift so P2-Courses fixtures do not enshrine the stale hours as expected values.

## Gherkin inventory

- Old corpus `specs/apps/ayokoding/www/behaviours`: 63 features, 509 expanded scenarios (Cucumber
  parser enumeration). Row-per-identity ledger: `P0/disposition-ledger.csv`.
- New corpus `specs/apps/ayokoding/web/behaviours`: 10 placeholder features, 69 scenarios.

## Live plans at this revision

In progress: ayokoding-app-web (this plan), ayokoding-learn-revamp-10-legacy-unique-migration.
Backlog: 06, 07, 08 accounting/ERP/capstones; 09 filler; 11 language audit; 12 systems audit;
13 product audit; 14 legacy removal; ferret-init-02-local-backend.

## Shared sources at this revision

- Content roots: `apps/ayokoding-www/content/{en,id}`.
- Manifest roots: `apps/ayokoding-www/src/features/course-paths/manifests/{careers,skills}`.
- Tool data modules (six bounded adapters, unchanged): ai-benchmark models/benchmarks/operators,
  cost-of-living cities/roles/fx.
- Redirect order: `apps/ayokoding-www/src/redirects` + `next.config.ts` (reconcile at each boundary).
