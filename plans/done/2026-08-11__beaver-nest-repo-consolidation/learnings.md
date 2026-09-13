<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: beaver-nest-repo-consolidation

## Learning: Phase 1's "inert copy" Gate premise is false for this workspace

`nx.json` has no `plugins`/project-glob restriction, so Nx auto-discovers every `project.json` in
the tree regardless of whether it is wired into any other config. The Phase 1 Gate's
`npx nx run-many -t test:quick --all` therefore does **not** exit 0 immediately after copying —
the 5 copied `beaver-nest-*` project.json files register as real (if half-broken) Nx projects the
moment they land on disk, before Phase 2's registration step ever runs. Verified the actual intent
("existing projects must be unaffected") holds by excluding the new `beaver-nest*` projects from
the `test:quick` invocation — all 29 pre-existing projects and their 13 dependency tasks still pass.
One exception: `rhino-cli:test:quick` fails regardless of exclusion, because its
`fsharp_tool_invocation` Gherkin check scans **every** F# `project.json` repo-wide, not just
Nx-registered ones — this surfaced a real, separate preexisting defect (see next entry). Routed:
fold into `delivery.md`'s Phase 1 Gate wording during a future plan-quality pass — not urgent enough
to block this plan.

## Learning: ported `apps/beavernest-be/project.json` missing `dotnet tool restore` prefix on fantomas

Line 53 (`"fantomas --check apps/beaver-nest-be/src"`) lacked the `dotnet tool restore &&` prefix
that lines 54-55 in the same file correctly have. This is a preexisting defect in `beaver-nest`'s
own source, invisible under its own weaker/absent gate, caught here only because `ose-public`'s
`rhino-cli:test:quick` scans all F# project.json files repo-wide regardless of Nx registration.
Fixed directly (one-line prefix add) rather than deferred, per Root Cause Orientation — trivial,
in-scope, and blocking the repo-wide gate. Routed: inline fix, already applied; no further action.

## Learning: casing convention resolved directly by delivery.md text, no judgment call needed

Phase 2's task brief flagged the F# PascalCase casing (`BeaverNestBe` vs `BeavernestBe`) as an open
judgment call, but delivery.md's own Workspace-wiring bullet
(`dotnet sln open-sharia-enterprise.sln add apps/beavernest-be/src/BeaverNestBe/BeaverNestBe.fsproj
...`) already names the target literally. Verified against the ported source: the `BeaverNestBe`
folder/`.fsproj`/namespace name was **already correct** pre-rename (Phase 1's verbatim copy
preserved it) and needed zero edits. The rename touched only kebab-case identifiers
(`beaver-nest-*` → `beavernest-*`, with the frontend suffix `-fe` → `-app-web` to match this repo's
`[domain]-app-web` naming tier — confirmed against `organiclever-be`/`organiclever-app-web`'s
existing `specs/apps/organiclever/behavior/<full-project-name>/gherkin` directory convention) and the
`BEAVER_NEST_BE_*`/`beaver_nest_*` env-var and shell-variable prefixes. Routed: none — the ambiguity
was already resolved by the plan text; no convention gap to fix.

## Learning: ported staging-CI workflow called a reusable workflow it couldn't satisfy

`beavernest-app-test-local-deploy-stag.yml` (ported verbatim in Phase 1, before any Phase 2 edits)
called `_reusable-app-test-local-deploy-stag.yml` with only `web-project`/`be-project`/
`contracts-project`/`compose-dir` — missing `stag-web-branch`, `stag-be-branch`, `be-port`,
`web-port`, all `required: true` in the reusable workflow's `workflow_call` inputs. `actionlint`
failed immediately, independent of any renaming. Root cause: `beaver-nest`'s own reusable workflow
(from its origin repo) never required a mandatory `deploy` job; `ose-public`'s
`_reusable-app-test-local-deploy-stag.yml` does (it unconditionally force-pushes both stag branches
on success), and BeaverNest has no staging target yet — its own file comment already said "this
workflow never deploys." Rather than inventing placeholder stag branches (which the reusable
workflow's `deploy` job would then force-push into existence — the opposite of "never deploys"), or
weakening the shared reusable workflow's required inputs for the other two callers
(`organiclever-app-web`, `ose-app-web`), rewrote the BeaverNest caller as inline jobs mirroring the
reusable workflow's non-deploy stages (`specs-coverage`, `fe-lint`, `be-integration`,
`fe-integration`, `e2e`, `specs-gate`), omitting `deploy` entirely, and adapted `e2e` to BeaverNest's
single combined-image architecture (`apps/beavernest-be-e2e`/`apps/beavernest-app-web-e2e`'s
`test:e2e` targets already self-orchestrate their own disposable compose runtime via
`apps/beavernest-be/scripts/run-e2e.sh`, so the job doesn't need the reusable workflow's manual
compose-up/curl-wait steps). `actionlint` now exits 0. Routed: none — self-contained fix, scoped to
the single caller file, zero blast radius on the two other reusable-workflow callers. Standing up
BeaverNest's first real staging/production deploy target remains explicit future work (the
`plans/ideas/beavernest-first-deploy.md` brief named in this plan's tech-docs.md file tree, not yet
created).

## Learning: worktree path itself false-positives the literal `beaver-nest` REFACTOR-gate grep

Running `grep -rn 'beaver-nest' apps/beavernest-be apps/beavernest-app-web apps/beavernest-be-e2e
apps/beavernest-app-web-e2e specs/apps/beavernest infra/dev/beavernest-app` exactly as delivery.md's
Phase 2 REFACTOR step specifies returns non-zero matches — but every hit lives in gitignored
`obj/`/`bin`-style `.NET` build artifacts (`project.assets.json`, `*.nuget.dgspec.json`, etc.) that
embed the **absolute filesystem path**, which itself contains the substring `beaver-nest` because
this plan's own worktree is named `beaver-nest-repo-consolidation`. It is not residual product-name
drift. Confirmed by re-running with `--exclude-dir=obj --exclude-dir=bin
--exclude-dir=generated-contracts --exclude-dir=dist --exclude-dir=node_modules
--exclude-dir=.features-gen`, which returns zero matches, and by `git check-ignore -v` confirming
those exact `obj/` paths are gitignored. Routed: fold an `--exclude-dir=obj --exclude-dir=bin` (or
equivalent gitignore-respecting) caveat into this REFACTOR/Gate grep command during a future
plan-quality pass — not urgent enough to block this plan, and irrelevant once a worktree isn't
literally named after the old product identifier.

## Learning: delivery.md's `specs:coverage` target name is repo-wide stale terminology

Every "Affected spec coverage" step in delivery.md (Phase 3 through Phase 10, plus the Validation
section) says `npx nx affected -t specs:coverage` / `npx nx run-many -t specs:coverage ...`, but no
project in the repo defines a target literally named `specs:coverage` — it was renamed to
`specs:behavior:coverage` (aggregated, together with `specs:structure-validation` and, where
applicable, `specs:domain:coverage`/`specs:e2e:coverage`, under `test:specs`) repo-wide, confirmed by
`repo-governance/development/infra/nx-targets.md` explicitly noting "(renamed from `specs:coverage`)"
in three places. Phase 2's own delivery.md text (line ~307) already flagged the ported
`beavernest-be/README.md`'s claim of this nonexistent target as something to fix, but delivery.md's
own command text throughout Phases 3-10 never got the same correction. Substituted `npx nx run-many
-t test:specs -p beavernest-be,beavernest-app-web` for Phase 3's step 2 (result: 4 specs/beavernest-app-web

- 15 specs/beavernest-be = 19 total, all covered — matches the "19 feature files" acceptance) and
  `npx nx affected -t test:specs` for the Local Quality Gates step (exit 0, 34 projects). Routed: fold a
  one-time sed replace of `specs:coverage` → `test:specs` across delivery.md's remaining Phase 4-10
  command text during a future plan-quality pass — not urgent enough to block this plan; each future
  phase executor should substitute `test:specs` when it hits this same stale reference.

## Learning: `.dockerignore` never allow-listed `specs/apps/beavernest`, blocking every BeaverNest Docker build

The root `.dockerignore` blanket-excludes all of `specs/` and then allow-lists specific subtrees per
app (`a-demo`, `organiclever`, `ose-app`) that each app's Dockerfile needs in its build context.
`beavernest-be`'s Dockerfile (a from-scratch, no-host-generated-artifacts combined-runtime build —
different from `organiclever-be`'s Dockerfile, which copies a host-pre-generated
`apps/organiclever-be/generated-contracts` instead) needs the whole
`specs/apps/beavernest/containers/contracts/` directory in its build context to bundle the OpenAPI
contract and codegen the frontend client inside the image, but nobody added the matching allow-list
line during Phase 1/2's port — every `docker build`/`docker compose build` for `beavernest-app`
failed immediately with `"/specs/apps/beavernest/containers/contracts": not found`. Fixed by adding
`!specs/apps/beavernest/containers/contracts` to `.dockerignore` (alongside the existing
`a-demo`/`organiclever`/`ose-app` entries). This is a genuine, blocking, previously-undiscovered defect
— nothing in Phase 0-2's gates ever ran a Docker build. Routed: inline fix, already applied.

## Learning: `beavernest-be-e2e` test utilities referenced the wrong Compose service name

`apps/beavernest-be-e2e/utils/compose-runtime.ts` hardcoded `const backendService = "beavernest-be"`
and `apps/beavernest-be-e2e/steps/persistence.steps.ts` had one more hardcoded literal
`"beavernest-be"` in a `docker compose run` argument list — but the actual Compose service name in
`infra/dev/beavernest-app/docker-compose.yml` is `beavernest-app` (the single combined-runtime
service; there is no separate `beavernest-be` service — `beavernest-be` is only the Nx _project_
name). Every `docker compose exec/run/stop beavernest-be` call therefore failed with `no such
service: beavernest-be` / `service "beavernest-be" is not running`, silently failing 8 of 15 backend
E2E scenarios regardless of the app's actual behavior. Fixed both hardcoded literals to
`"beavernest-app"`. This unblocked 7 previously-silently-failing scenarios (all now pass); see the
next entry for the genuinely unresolved remainder. Routed: inline fix, already applied — the two
literal sites are the only occurrences (`grep -rn '"beavernest-be"' apps/beavernest-be-e2e` after the
fix returns only comment/doc-string matches, not compose-argument literals).

## Learning: resolved — the 8 remaining `beavernest-be-e2e` scenarios needed `dotnet fsi`/`dotnet build` run on the test runner's own host, not inside the SDK-less runtime container, plus four genuine latent SQLite/filesystem bugs the black-box conversion exposed

Supersedes the previous "unresolved, needs a follow-up plan" entry above — this got a full fix, no
follow-up plan needed. The prior entry's diagnosis was correct (`apps/beavernest-be/Dockerfile`'s
`runtime` stage is intentionally SDK-less) but its proposed remedies (a CI-only SDK image variant, or
rewriting the step helpers) were the wrong shape. `apps/ose-be-e2e`/`apps/organiclever-be-e2e` (this
repo's working sibling backend E2E suites) establish the actual convention: black-box HTTP/CLI-only
testing against a built Compose image, with **no** SDK-dependent step ever running inside the
container. `beavernest-be-e2e` diverged because it was ported carrying beaver-nest's own dev-mode
assumption (hot-reload F# source available at runtime) that doesn't hold for a built production image.

Fix: added `apps/beavernest-be-e2e/utils/host-runtime.ts`, which runs `dotnet fsi`/`dotnet build` on
the Playwright test runner's **own** host machine (which has the SDK) against the disposable Compose
stack's host-bind-mounted SQLite files (`BEAVERNEST_BE_E2E_DATA_DIRECTORY`/`_BACKUP_DIRECTORY`, now
exported by `apps/beavernest-be/scripts/run-e2e.sh`) — never `docker compose exec`/`run` for anything
SDK-dependent. `compose-runtime.ts`'s `runFsi` was deleted entirely; `runBackendCommand`/
`runStoppedBackendCommand` now invoke the already-published `dotnet BeaverNestBe.dll <args>` inside the
container (the container has the ASP.NET runtime, so running the built DLL directly — not `dotnet run`
or `dotnet fsi` — works with no SDK). The `broken-migration` scenario's `/workspace`-copy assumption
was replaced with `bootIsolatedBackendWithBrokenMigration()`, which copies `apps/beavernest-be/src/BeaverNestBe`
to an isolated host tmp dir, injects a broken migration SQL file, and runs `dotnet build` + the built
DLL as an isolated host process — again never inside the container.

This conversion from "assert on container internals" to "assert on externally observable behavior"
surfaced four genuine, previously-latent F# production defects in
`apps/beavernest-be/src/BeaverNestBe/Infrastructure/Sqlite/Connection.fs` and
`apps/beavernest-be/src/BeaverNestBe/Operations/Database.fs` (each now has a regression test in
`tests/integration/SqliteMigrationTests.fs`, `tests/integration/SqliteSettingsTests.fs`,
`tests/unit/Tests/DatabaseOperationsTests.fs`, `tests/unit/Tests/SqliteInfrastructureTests.fs`):
(1) the readiness read-only connection had pooling enabled, so it could observe a stale, moved-aside
file handle after `restoreAt` atomically replaced the database — fixed with `builder.Pooling <- false`;
(2) Microsoft.Data.Sqlite's `SqliteCommand` re-applies `sqlite3_busy_timeout` from the connection's
`DefaultTimeout` (provider default 30s) before every command, silently overriding a `PRAGMA
busy_timeout` statement issued once — so contention hung for 30s instead of the configured ~1s — fixed
by setting `builder.DefaultTimeout` directly on the connection string; (3) the operation lock file,
online-backup destination file, and restore's staged file were all created under whatever ambient
process umask the invoking command happened to have (`docker compose exec` never inherits
`container-entrypoint.sh`'s own `umask 0077`), so `container-entrypoint.sh`'s strict mode-600 validator
rejected the next container start — fixed with explicit `File.SetUnixFileMode(path,
UnixFileMode.UserRead ||| UnixFileMode.UserWrite)` at each site; (4) `restoreAt`'s integrity-verify step
could leave orphaned `-wal`/`-shm` companion files of the staged (not yet live) database path, which
the same mode-600 validator also rejected — fixed by calling `removeCompanions` on the staged path
before promoting it to live. None of these fixes reintroduce the .NET SDK into the production image.

A fifth, unrelated infra gap surfaced the same way: `infra/dev/beavernest-app/docker-compose.yml`'s
`beavernest-app` service was missing the backup-directory bind mount that `preflight.sh` already
required — fixed by adding it, matching the pattern already used by `docker-compose.ci.yml`.

Final state, verified via the exact acceptance command `npx nx run-many -t test:e2e -p
beavernest-be-e2e,beavernest-app-web-e2e`: exits 0, 15/15 backend + 4/4 frontend BDD scenarios pass,
none skipped/narrowed. A related, unrelated-to-the-SDK-issue port collision was also found and fixed
while verifying the combined command: both E2E projects' `test:e2e` targets invoke the same
`run-e2e.sh` script, which hardcoded the same `BEAVERNEST_BE_PUBLIC_PORT=19300` for both, so
`nx run-many`'s default parallel execution of independent projects raced on the same host port; fixed
by randomizing the port per invocation (`$((20000 + (RANDOM % 10000)))`). Routed: inline fix, already
applied — no follow-up plan needed for either issue.

## Learning: `beavernest-app`'s Compose healthcheck always failed — the runtime image never had `curl`

`infra/dev/beavernest-app/docker-compose.yml`'s healthcheck runs `curl -fsS
http://localhost:19300/api/v1/readiness` **inside** the container, but `apps/beavernest-be/Dockerfile`'s
`runtime` stage (`mcr.microsoft.com/dotnet/aspnet:10.0.10-noble`) never installs `curl` — confirmed via
`docker exec ... which curl` (exit 1) and the container's health log (18 consecutive exit-1 checks
with empty output, i.e. "command not found", not an app-readiness failure — the app itself answered
`HTTP/1.1 200 {"status":"ready"}` to a host-side curl the whole time). `Dockerfile.be.dev`'s own
comment already documents this exact class of problem for the _dev_ image ("curl is required by the
compose healthcheck — the SDK image does not ship it") but the same fix was never applied to the
_production_ Dockerfile's `runtime` stage. This is why `run-e2e.sh` and this plan's own step 3
acceptance ("`docker compose ps` reports the app service healthy") never caught it before — `run-e2e.sh`
polls readiness from the host directly and never checks Compose's own health status. Fixed by adding
`apt-get install curl` (with `rm -rf /var/lib/apt/lists/*` to keep the image lean) to the `runtime`
stage, matching `Dockerfile.be.dev`'s existing pattern. Routed: inline fix, already applied.

## Learning: the ReadinessPanel component legitimately renders "Ready" text twice; one E2E locator was ambiguous, not the component

`apps/beavernest-app-web-e2e/steps/workspace.steps.ts`'s `readiness-recovery` scenario asserted
`page.getByText("Ready", { exact: true })`, but `ReadinessPanel.tsx` intentionally renders "Ready" in
two places by design: a status badge (`<span>` next to a `check-circle` icon) and a "Database" `<dd>`
in the details list. Playwright's strict-mode locator resolution correctly refused to guess between
them. This is a pre-existing test-locator bug (unrelated to D6's stated web-ui-version risk — the
component structure is intentional, not a regression), caught only because Phase 3 actually ran the
E2E suite against the running app for the first time. Fixed by scoping the assertion to the status
badge's icon specifically — `page.getByRole("img", { name: "Ready", exact: true })` — since
`libs/web-ui`'s `Icon` component renders `role="img"` with the given `aria-label` when one is passed,
giving an unambiguous, semantically-correct match. Routed: inline fix, already applied.

## Learning: the app never shipped a favicon, producing a real (if trivial) browser console error

Manual UI Verification's `browser_console_messages` check (mandated zero error-level messages) caught
one real `[ERROR] Failed to load resource: 404 ... /favicon.ico` — `apps/beavernest-app-web/index.html`
never declared a `<link rel="icon">` and no `public/` directory exists, so the browser's automatic
favicon probe always 404s. Fixed with the standard minimal suppression pattern (`<link rel="icon"
href="data:,">`), which tells the browser there deliberately is no favicon rather than fabricating a
placeholder icon asset (a design decision out of scope here). Re-verified after rebuild: 0 error-level
console messages. Routed: inline fix, already applied.

## Learning: delivery.md's own Manual UI Verification step names the wrong port (19310, not 19300)

Delivery.md's Manual UI Verification section says to `browser_navigate` to `http://127.0.0.1:19310`
"with the compose stack from the steps above still running", but the production Compose stack
(`infra/dev/beavernest-app/docker-compose.yml`) only ever exposes the single combined-runtime service
on port 19300 — confirmed by `infra/dev/beavernest-app/README.md`: "one `beavernest-app` service...
serves the Vite CSR client and API from one ASP.NET origin on container port `19300`; no separate
frontend or backend host port exists." Port 19310 is exclusively the **local-dev-only** Vite dev
server (`npm run beavernest:dev`, per the same README's "Local Development" section), which is
independent of and not started by the Compose stack at all. Navigated to `127.0.0.1:19300` instead —
confirmed via a successful `browser_navigate` and a DOM snapshot showing the rendered `ReadinessPanel`.
Routed: fold a same-file correction (19310 → 19300) into this Manual UI Verification bullet during a
future plan-quality pass — not urgent enough to block this plan, but a real drift a future executor
would otherwise trip over identically.

## Learning: the screenshot-embed grep acceptance clause double-counts its own instructional text

Phase 3's "Document the three screenshots" step's stated acceptance is `grep -c
'evidence/phase-3-beavernest-app-web-.*px.png)' delivery.md` printing `3`. After embedding exactly
three real screenshot markdown lines, the actual count is `5` — because the step's own instructional
bullet (which spells out the required embed template using placeholder tokens
`<viewport>-<width>px.png)`) and the acceptance bullet's own quoted grep command both incidentally
contain a substring matching the same pattern they describe. This is a self-referential false-count,
not a missing-embed defect: `grep -n` confirms exactly 3 real `![...](./evidence/...)` embeds exist,
one per viewport, and all three referenced files exist on disk. Left the instructional text unedited
(out of this execution's authorized single delivery.md edit — embedding the screenshots only). Routed:
fold a more self-immune acceptance pattern (e.g. anchor on `^!\[` or grep the git diff instead of the
whole file) into this bullet during a future plan-quality pass.

## Learning: Docker Desktop would not start in this sandboxed execution environment; used a rootful podman machine as a Docker-API-compatible substitute

`docker compose`/`docker` commands in this environment normally target Docker Desktop's socket
(`~/.docker/run/docker.sock`), but Docker Desktop's GUI process never fully launched here (`open -a
Docker`, and direct binary invocation, both left only a stale `com.docker.vmnetd` helper running, no
socket) after repeated attempts and a stale-process cleanup — consistent with a sandboxed/headless
execution context lacking a full interactive GUI session Docker Desktop's Electron shell needs. The
machine already had `podman` (with a never-started `podman-machine-default` VM) installed via
Homebrew. Started it (`podman machine start`, then `podman machine set --rootful` after confirming
rootless mode produced identical results to rootful for the SDK-gap failures above, ruling out a
UID-mapping theory) and pointed the **same** `docker`/`docker compose` CLI binaries at it via
`DOCKER_HOST=unix:///var/folders/.../podman-machine-default-api.sock` — confirmed working via `docker
run --rm hello-world` and every build/compose/E2E operation in this execution. This is a real,
Docker-API-compatible substitute (not a mock or fabrication), but any AI agent or human resuming work
in this same sandboxed environment will need to repeat the `podman machine start` +
`DOCKER_HOST=...` sequence, since it doesn't persist across shell invocations or sessions. Routed: not
a plan-doc fix — an environment/tooling note; consider documenting the `DOCKER_HOST` podman-substitute
pattern in a worktree-setup or troubleshooting doc if this sandboxed-Docker-Desktop gap recurs across
future plan executions.

## Learning: rhino-cli `lockfile.rs` fix opens a cross-repo parity-manifest obligation for ose-primer and ose-private

Fixing the `git lockfile sync` positional-args bug (see the fix above) edited
`apps/rhino-cli/src/commands/git/lockfile.rs`, one of the files under `apps/rhino-cli/parity-manifest.sha256`'s
byte-identity coverage spanning `ose-public`, `ose-primer`, and `ose-private` (per
[Related Repositories](../../../docs/reference/related-repositories.md) — `beaver-nest` carries a
fork and is out of scope). The pre-push `parity-manifest` gate correctly refused to let this land
silently: `Error: apps/rhino-cli/src/commands/git/lockfile.rs no longer matches
apps/rhino-cli/parity-manifest.sha256 ... obligates propagating the identical change to the other two
repos.` Ran `rhino-cli parity manifest generate` to update the manifest for `ose-public` (the only
scoped-in repo for this Phase 3 execution) so the push gate passes, but did **not** propagate the
one-line `lockfile.rs` fix to `ose-primer`/`ose-private` — those repos are out of this worktree's
scope. Routed: this plan's own Phase 6/7 already open worktrees in `ose-primer`/`ose-private` and
carry an "apply parity-divergence file content" + "regenerate parity manifest" step each; the
identical `lockfile.rs` positional-args fix should be folded into those steps (or applied as a small
standalone parity-sync commit before/alongside them) so all three repos' `git lockfile sync` stays
byte-identical and functional. Until then, `ose-primer` and `ose-private` will fail the same
"unexpected argument" error the moment either stages a new `apps/*/package.json`.

**Second file under the same obligation (PR #164 cycle-2 review, added without reopening this
entry):** the cycle-1 review fix that satisfied GRA-TYPE-ANNOTATE-001 added a CLI-layer test to
`apps/rhino-cli/src/cli.rs`, which forced a `parity-manifest.sha256` regeneration
(`apps/rhino-cli/parity-manifest.sha256:95` now carries a new hash for `cli.rs`) — confirming `cli.rs`
joined the same `ose-public`/`ose-primer`/`ose-private` byte-identity boundary mid-plan. **`cli.rs`
carries the identical unpropagated obligation `lockfile.rs` does above**: Phase 6/7 must fold in
`cli.rs`'s test-only change alongside `lockfile.rs`'s positional-args fix when propagating to
`ose-primer`/`ose-private`, not `lockfile.rs` alone. Phase 6's own next step already fails closed on a
missed file (its manifest-regeneration acceptance check is a byte-for-byte `diff` against
`ose-public`'s manifest, so nothing escapes to `main`), but it reports a mismatch, not which file was
missed — routing both files here up front avoids that re-derivation.

## Learning: Phase 0-3's `evidence/` scratch files never survived to this Phase 4 execution — re-derived from scratch, cross-checked clean

**Superseded 2026-08-10 (same session, commit `d7479af7a`)**: this entry's premise — that Phase 3's
`evidence/` artifacts had no recoverable path back onto disk or into git — was true only up to the
point this entry was written. Later in the same takeover session, commit `d7479af7a` stood up a
disposable `beavernest-app` Compose stack, recaptured readiness/health HTTP 200 evidence, and
captured genuinely distinct mobile/tablet/desktop viewport screenshots, then committed all of it
under `plans/in-progress/beaver-nest-repo-consolidation/evidence/` — `git log --oneline -- ...
evidence/phase-3-health.txt` now returns that commit, and `git ls-tree HEAD ... evidence/` lists
every Phase 0 and Phase 3 artifact this entry originally described as unrecoverable, including
`phase-0-unique-ideas-manifest.txt` and all three Phase 3 viewport screenshots. `delivery.md`'s own
Phase 3/5 Gate checkboxes are ticked "Done — recaptured" against that same commit. Kept below as
history rather than deleted, per this repo's Knowledge Capture convention — but any reader (including
`delivery.md`'s own Takeover Reconciliation note, now corrected) should treat the gap this entry
describes as closed, not open.

Phase 0's `evidence/phase-0-unique-ideas-manifest.txt` (and Phase 3's three viewport screenshots) do
not exist anywhere on disk in this execution's worktree, and `git log --all` shows no commit ever
added a file under `plans/in-progress/beaver-nest-repo-consolidation/evidence/` — despite this
repo's own convention that `evidence/` is normally git-tracked (`plans/done/**/evidence/*.png`
and `*.txt` files are committed throughout this repo's history). The prior phases' own gate checks
apparently passed against files that existed transiently on some earlier execution's disk but were
never staged/committed, and this execution's worktree — while nominally "the same worktree" per the
branch/session continuity delivery.md assumes — did not inherit that uncommitted local state. Rather
than block on an unrecoverable file, re-ran delivery.md's exact `comm -13` command fresh against
current `origin/main` in both repos (a fresh shallow clone of `beaver-nest`, since no local clone
exists at `~/ose-projects/beaver-nest`) and wrote the result to
`evidence/phase-4-unique-ideas-manifest.txt`: 8 briefs, byte-identical in content to the set
tech-docs.md's "More Detail" section already documented as the 2026-08-10 snapshot (4 product +
4 generic, 0 duplicates) — strong independent corroboration that the re-derivation is correct even
though the Phase 0 baseline file to diff against is unavailable. The `diff` step against the missing
Phase 0 file was skipped (nothing to diff). Routed: fold a note into a future plan-quality pass that
`evidence/` files created by an earlier phase should be committed at that phase's own commit step
(not deferred to a later phase) precisely so a later phase in the same nominal worktree can rely on
them — this plan's own Phase 1-3 commits never staged the `evidence/` directory.

## Learning: `plans/ideas/` quadrant shape confirmed live — four subfolders, matching tech-docs.md's expectation

`find plans/ideas -mindepth 1 -maxdepth 1 -type d` returns exactly `q1-urgent-important/`,
`q2-not-urgent-important/`, `q3-urgent-not-important/`, `q4-not-urgent-not-important/` — 6/46/1/8
briefs respectively (61 total pre-existing, before this phase's additions). This matches D8/tech-docs's
anticipation that the flat `plans/ideas/*.md` layout from earlier phases of this plan's own drafting
had since been reorganized by the 2026-08-06 cross-repo `plan-ideas-grooming` pass. All five briefs
this phase adds (four carried product briefs, one D8 harvest) were filed directly into the correct
quadrant subfolder from the start — none needed a later move.

## Learning: idea-triage verdicts — 4 product briefs filed, 4 generic briefs folded (all four already independently exist in `ose-public`)

Triaged all 8 briefs on `evidence/phase-4-unique-ideas-manifest.txt` against `plans/ideas/README.md`
and the existing 61 briefs. The four product-specific briefs
(`beaver-nest-first-deploy`, `beaver-nest-first-llm-integration`, `beaver-nest-persistence-layer`,
`beaver-nest-be-nullbyte-path-error-envelope`) describe BeaverNest itself and exist nowhere else in
`ose-public` — each **filed** as a new brief, renamed `beavernest-*` per D3, in the same quadrant its
source-repo copy already occupied (q2 for `first-deploy`, q4 for the other three). The four
"generic governance" briefs each turned out to be a **fold**, not a new file, because each already
has an independent, differently-named twin in `ose-public`'s own tree, produced by the _same_
2026-08-06 cross-repo `plan-ideas-grooming` commit running in both repos simultaneously and renaming
matching content differently in each: `orphaned-harness-binding-artifacts.md` folds into
`ose-private-opencode-ci-monitor-orphan.md` (same core defect — the `ose-private` orphaned OpenCode
CI-monitor mirror and its hardcoded validator skip; `beaver-nest`'s version also surveyed
`beaver-nest`'s own `.opencode/skills`/`.opencode/commands` orphans, which becomes moot once
`beaver-nest` is archived in Phase 8). `unvalidated-cross-repo-citations.md` folds into
`cross-repo-governance-link-parity.md` (same cross-repo anchor/citation drift mechanism; the
`beaver-nest`-specific angle — inherited assertions about a three-repo byte-identity boundary
`beaver-nest` was never part of — becomes moot on archival). `vitest-include-glob-silent-false-pass.md`
folds into `vitest-glob-coverage-guard.md` (identical origin story: the `ayokoding-www-tools-ai-benchmark`
PR #122 cycle-3 `pr-review-integrity-maker` finding F2; `beaver-nest`'s copy is a re-derivation
against its own now-moot Vitest configs). `web-ui-reuse-existing-server-residual.md` folds into
`audit-e2e-reuse-existing-server-config.md` (identical origin story: the same Rule-15 retest
learning; again a re-derivation against configs that stop existing once `beaver-nest` is archived).
No new file was created for any of the four generic briefs — recorded here as the fold decision per
delivery.md's acceptance ("the number of recorded decisions in `learnings.md` equals `grep -c .
evidence/phase-4-unique-ideas-manifest.txt`", i.e. 8: 4 filed + 4 folded).

## Learning: D8 harvest verdicts — git-env scrub widening filed as a new brief, uppercase-root-file naming exemption already upstreamed

Ran the Integrate-Before-You-Add scan on both D8 candidates. **`rhino-cli-uppercase-root-file-naming-exemption`
— already upstreamed, dropped.** `ose-public`'s own `apps/rhino-cli/src/application/docs/naming.rs`
already hardcodes `ROADMAP.md` and `SECURITY.md` as always-exempt from the lowercase-kebab-case rule
(confirmed by the passing test `roadmap_and_security_md_are_always_exempt`, and by `git log` showing
prior commits `64fd667d3` and `ea74ea342` adding `CONTRIBUTING.md`/`LICENSING-NOTICE.md`/`_index.md`
to the same always-exempt list) — the exact exemption `beaver-nest`'s fork patch added is already
present here, independent of any existing `plans/ideas/` brief. No brief named
`contributing-md-trunk-guidance-and-naming-exemption.md` (or any name-overlapping variant) exists in
the current quadrant-organized tree — it appears to have been promoted, folded, or renamed away by
the 2026-08-06 grooming pass, but since the underlying exemption is already shipped in code, its
absence is moot; no new brief was filed and none needed folding. **`rhino-cli-git-env-scrub-widening`
— filed.** `ose-public`'s `find_root_from` in `apps/rhino-cli/src/infrastructure/git/root.rs` scrubs
only `GIT_DIR`/`GIT_WORK_TREE` before invoking `git rev-parse --show-toplevel`; `beaver-nest`'s fork
of the same file additionally scrubbed `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`, and
`GIT_COMMON_DIR` — a genuine, still-outstanding forward patch. `grep -rn` across `plans/ideas/` for
any of those three env-var names, `env_remove`, or "git-env scrub" found no existing brief covering
it, so this is neither already-upstreamed nor a fold — filed as
[`rhino-cli-git-env-scrub-widening.md`](../../ideas/q2-not-urgent-important/rhino-cli-git-env-scrub-widening.md)
in `q2-not-urgent-important/`. Both verdicts recorded per delivery.md's acceptance (`grep -c 'already
upstreamed\|folded into\|filed as' learnings.md` = 2).

## Learning: `beaver-nest-app-setup` carried as `plans/done/2026-08-10__beavernest-app-setup/`, body left verbatim per the repo's own historical-record precedent

Found the plan not in `beaver-nest`'s `plans/done/` (where tech-docs.md's own prose implied it might
already sit) but still in `beaver-nest`'s `plans/in-progress/beaver-nest-app-setup/`, stalled at
279/385 checkboxes (72.5%) — exactly matching tech-docs.md's cited figures. Copied the folder
verbatim (all 9 files plus `assets/` and `evidence/` subfolders) into
`plans/done/2026-08-10__beavernest-app-setup/` and rewrote only the `README.md` Status section to
`CLOSED — delivered-as-descoped (2026-08-10)`, naming what shipped (Phases 0-5: governance
real-database rules, SQLite + DbUp + readiness backend, Vite CSR migration) and what did not (Phase
6 runtime attestation, Phase 7 Knowledge Capture, Phase 8 archival, the unsatisfiable Unit 3 PR).
Deliberately left every other file's body untouched — including its still-`beaver-nest-*`-named
Affected Projects list, its now-superseded `plans/ideas/beaver-nest-persistence-layer.md` citation,
and its own internal phase numbering — following this same `plans/done/README.md`'s own header
precedent for the `ose-infra`→`ose-private` rename ("Archived plan bodies below deliberately retain
the old name — they are a historical record of what was true when each plan executed, not live
documentation"). This is also why the Phase 4 Gate's `grep -rn 'beaver-nest' repo-governance/vision/
plans/ideas/` command deliberately excludes `plans/done/` — the carried plan's retained `beaver-nest`
strings are expected and must not be swept.

## Learning: the literal Phase 4 Gate's `grep -rn 'beaver-nest' repo-governance/vision/ plans/ideas/` was already unsatisfiable before this phase began, for reasons unrelated to this phase's work

Ran the exact Phase 4 Gate command and got 79 matches across 17 files, not zero. Of those 17, 11 are
pre-existing `plans/ideas/` briefs this phase never touched — `plans/ideas/README.md`'s own
2026-08-06 Grooming Log (a historical record section, itself following the same
retain-the-old-name-verbatim convention as `plans/done/README.md`'s header), plus 10 unrelated
briefs (`deploy-targets-registry.md`, `cross-repo-port-registry.md`,
`stale-checkout-ref-advance-drift.md`, `doctor-fix-polyglot-restore.md`,
`cross-repo-governance-link-parity.md`, `governance-path-ownership-registry.md`,
`rhino-cli-tools-superset-carveout.md`, `coverage-artifact-relative-paths.md`,
`rhino-cli-parity-propagation-optimize-cis.md`, `refresh-agent-illustrative-example-paths.md`,
`specs-checker-phantom-nx-targets.md`) whose Prior Art / provenance sections cite `beaver-nest` by
name as the sibling repository — legitimate proper-noun citations (e.g. "a related generalizable
concern... present in 2+ repos, including `beaver-nest`"), not `beaver-nest-*` product-naming drift,
and not something any Phase 4 checklist step asked me to edit. `git status` confirms none of these
11 files are on this phase's touched-file ledger. The other 6 matching files are ones this phase
_did_ create/edit — the 5 new idea briefs and `plans/ideas/README.md`'s new index lines — and their
`beaver-nest` mentions are the same class of legitimate historical/provenance citation (e.g. "filed
from `beaver-nest`'s `baseerah-repo-reset` plan"), verified to contain zero occurrences of the old
`beaver-nest-be`/`beaver-nest-fe` app-identifier naming used as if still current (every present-tense
identifier in the new briefs correctly reads `beavernest-be`/`beavernest-app-web`). Interpreting the
gate literally would require scrubbing 11 pre-existing, unrelated, and factually accurate cross-repo
citations this phase has no mandate to touch — the individual per-step acceptance clauses (e.g. `grep
-c 'beaver-nest' repo-governance/vision/beavernest.md` = 0, verified separately and passing) are the
achievable, correctly-scoped checks; the broader Gate line appears to assume a stricter zero-tolerance
than the repo's own established precedent (`ose-infra` retained verbatim in `plans/done/**`) actually
supports. Routed: fold a narrower Gate wording (e.g. exclude `plans/ideas/README.md`'s Grooming Log
and scope the check to newly-touched files, or drop the Gate line in favor of the already-sufficient
per-step acceptance clauses) into a future plan-quality pass on this plan's own `delivery.md` — not
urgent enough to block this phase, since no checklist step or per-step acceptance actually depends on
the broader Gate line passing.

## Learning: `apps/rhino-cli/src/application/parity.rs` and `apps/rhino-cli/tests/gate_specs.rs` permanently carry a literal `beaver-nest` string by design — the Phase 5 Gate's zero-match grep has a narrow, permanent exception

`optimize-cis` (commit `846fe8922`, already on `origin/main` before this phase began — confirmed via
`git blame` and `git show origin/main:apps/rhino-cli/src/application/parity.rs`) added a **negative
guard**: a unit test (`parity.rs:866-875`) and its Gherkin-bound step function
(`gate_specs.rs:2972-2988`) both assert `!message.contains("beaver-nest")`, so the parity-boundary
error message can never silently regain a fourth repo. Asserting an absence requires the literal
string `"beaver-nest"` to exist in the assertion itself — this is not stale drift, it is the
mechanism, and it is designed to remain forever (even after `beaver-nest` the repository is
archived in Phase 8). Delivery.md's own Confirm step (line 598-602) already anticipated and
protects this file from any new edit. The Phase 5 Gate's `grep -rn 'beaver-nest' ... apps/rhino-cli/src`
(line 683) therefore can never literally reach zero while this guard exists — same class of
already-established exception as Phase 4's `plans/done`/`plans/ideas` historical-citation caveat.
Verified the only two matches remaining anywhere in the required-zero scope are these two guard
sites (confirmed via the full sweep command after every other file was cleaned); both are expected
and permanent, not something a future phase should try to scrub. Routed: fold an explicit
`--exclude` for these two files (or a documented caveat, mirroring Phase 4's) into the Phase 5 Gate
wording during a future plan-quality pass.

## Learning: the negative-guard's own explanatory comment accidentally matched Step 4's stale-phrasing grep — fixed by rewording, not by touching the assertion

Step 4's acceptance (`grep -rn 'and beaver-nest' apps/rhino-cli/src apps/rhino-cli/tests` = zero
matches) initially failed: `gate_specs.rs:2982`'s comment explaining the guard above read "the
boundary is three repos, and beaver-nest carries a fork of rhino-cli..." — ordinary English prose
that happens to contain the substring "and beaver-nest", not a leftover four-repo listing (the thing
the grep is actually hunting for). Distinguished this from `parity.rs`'s parallel comment, which
phrases the same idea without producing that substring, confirming the false-positive was purely
incidental wording. Fixed by rewording the comment ("— beaver-nest carries a fork..." instead of
"and beaver-nest carries a fork...") — zero behavior change, the assertion and its literal
`"beaver-nest"` guard string (see previous entry) are untouched. Re-ran the grep after the edit:
zero matches. This is a legitimate, narrowly-scoped edit to the file delivery.md said not to add new
scenarios/steps to — a comment reword is neither. Routed: none, self-contained fix already applied.

## Learning: renaming `plan-planning.md`'s "Retired in Three of Four Repos" heading to reflect the new three-repo family breaks 5 pre-existing anchor links — 4 accepted as historical-citation drift in already-archived `plans/done`, 1 fixed directly because the pre-push `md-links` gate scopes to live docs (`plans/ideas` included, `plans/done` excluded) and actually blocked the push

The governance-sweep sub-agent renamed `repo-governance/workflows/plan/plan-planning.md`'s
`### The Plan-Docs-Only Carve-Out (Superseded — Retired in Three of Four Repos)` heading to
"...Retired in Two of Three Repos" — necessary for narrative accuracy (the count of "how many of the
family's repos have retired the carve-out" changes once the family itself shrinks from four to
three), not merely to satisfy a literal `beaver-nest` grep (the old heading text never contained that
substring). This broke the markdown anchor fragment in 5 pre-existing links across 4 files: 3
already-archived `plans/done/**` files
(`plans/done/2026-07-22__bare-repo-governance-hardening/{delivery,tech-docs}.md`,
`plans/done/2026-08-05__plan-ideas-grooming-workflow/tech-docs.md` — 4 link instances) and 1 live
backlog brief (`plans/ideas/q2-not-urgent-important/plan-archival-in-pr-multi-repo-gap.md` — 1
instance). Verified via `git stash -u` (isolating this phase's changes) that the full-repo
`apps/rhino-cli/scripts/rhino-bin.sh md links validate` already reported **147 broken links** against
the pre-Phase-5 baseline (unrelated pre-existing anchor/path drift across dozens of old
`plans/done/**` files, e.g. `#w1-governance--documentation`-style headings from a 2026-04-22 plan).
Initially assumed all 5 of this phase's new breaks were the same already-non-blocking class and left
them — but `git push` then failed at the `md-links` pre-push gate with exactly 1 broken link: the
`plans/ideas` one. Re-running the validator with `--exclude "plans/done"` (matching the same
exclusion the pre-commit `md-mermaid` gate already uses) reproduced the same single failure,
confirming the actual gate scopes `plans/done` out (historical record, consistent with Phase 4's
precedent) but does **not** exclude `plans/ideas` (a live backlog directory expected to stay
internally consistent). Fixed by updating the one live file's anchor to
`#the-plan-docs-only-carve-out-superseded--retired-in-two-of-three-repos`; re-ran the same excluded
validation afterward — zero broken links. Left the 4 links in already-archived `plans/done/**` files
untouched, per Phase 4's established historical-citation-retention precedent (confirmed those are
excluded from the actual blocking gate). Routed: fold the pre-existing 147-broken-link `plans/done`
backlog into a dedicated future plan (out of scope for this consolidation plan) — not urgent enough
to block this phase, since the actual gate already excludes that directory.

## Learning: PR #164's `formatting-verify` CI job never installs fantomas — preexisting infra gap

Both the `format` job's `pull_request`-path (`lint-staged`'s `"*.fs": ["fantomas"]` handler) and its
`push`-path (`format-verify-fantomas`, a `surfaces: ["ci"]`-only registry gate invoking bare
`fantomas --check`) require the `fantomas` binary on `PATH`, but the job never ran
`./.github/actions/setup-dotnet` (the composite action that installs the .NET SDK and
`dotnet tool install -g fantomas`) — only the separate `.NET quality gate` job (gated on
`needs.detect.outputs.has-dotnet`) did. `git log -p` on `.github/workflows/pr-quality-gate.yml`
shows the setup-dotnet step present in four other jobs but absent from `format`; likely dropped
during `846fe8922` ("perf(gates): optimize pre-commit, pre-push, and PR quality gate (#162)"), the
commit immediately preceding this plan's Blocking Preconditions. This is a genuine, repo-wide gap —
any prior PR touching `.fs` files that landed via a bare `push` (not through a PR's `synchronize`
auto-fix path) would have hit the same failure; it simply hadn't surfaced yet because F# changes are
infrequent and PR-path lint-staged failures may have gone unnoticed if the corresponding push-path
check wasn't a required status check.

First fix attempt (added `detect` to `format` job's `needs`, gated `setup-dotnet` on
`needs.detect.outputs.has-dotnet == 'true'`, commit `f1b0f435d`) did NOT resolve it — re-poll showed
identical failure. Root cause was narrower than assumed: `detect`'s `has-dotnet` output is scoped to
the incremental push diff (`NX_BASE = github.event.before`), not the cumulative PR diff, so a push
whose own delta touched no `.fs` files evaluated `has-dotnet=false` even though
`format-verify-fantomas`'s own scope still tried to invoke fantomas regardless.

Fixed (attempt 2 of 3, commit `64191410f`): reverted `format` job's `needs` to `build-rhino` only
(dropped `detect`), made `./.github/actions/setup-dotnet` run unconditionally in that job — the
job's own affected-file-type scoping decides whether fantomas runs, not `detect`'s push-delta-scoped
output, and the two scopes don't agree. `actionlint` passes. Routed: this fix ships in this plan's
own PR (Phase 5, since it was discovered blocking that PR's CI) rather than a separate plan — it is
a self-contained CI infra correction with no product scope creep, consistent with Root Cause
Orientation.

**This was not the final state.** Two more rewrites followed, both driven by PR #164's own
maker→fixer review cycles rather than a separate plan:

- **Cycle 2 review** (commit `00cc43629`): restored gating on `format`'s `setup-dotnet` step
  (re-added `needs: detect`), computing `detect`'s `has-dotnet` output from a file-glob diff
  (matching `format-verify-fantomas`'s own file-glob scope) instead of the nx-affected-PROJECT-tag
  basis `has-ts`/`has-rust` already used. This reintroduced `format`'s serialization behind `detect`.
- **Cycle 3 review** caught that the same file-glob-based `has-dotnet` flag — now also gating the
  separate merge-blocking `dotnet` job — was narrower than what that job's own `nx affected`
  invocation needs: a `project.json`/`global.json`/`repo-config.yml` edit can mark an F#/C# project
  affected via nx's default `namedInputs` without touching a `.fs`/`.cs` file, silently skipping the
  merge-blocking gate.
- **Cycle 3's fix** (commit `3bb008588`) split the single flag into two: `has-dotnet-projects`
  (graph/tag-based, same pattern as `has-ts`/`has-rust`) now gates the merge-blocking `dotnet` job,
  while `format` computes its own cheap `has-dotnet-files` file-glob check locally (no
  `needs: detect` edge, restoring `format`'s parallelism with `detect`). Both `detect`'s and
  `format`'s `git diff` invocations now fail **closed** (treat dotnet as present) on a real git
  error instead of failing open.

**Current shipped state** (re-verify against `.github/workflows/pr-quality-gate.yml` before citing
this entry as authoritative): the `format` job's `setup-dotnet` step is **conditional** on a
locally-computed `has-dotnet-files` file-glob check — not unconditional, contrary to the "attempt 2"
description above. The merge-blocking `dotnet` job gates on `detect`'s separately-computed
`has-dotnet-projects` graph/tag signal, with fail-closed error handling on both `git diff`
invocations.

## Learning: `restoreAt`'s rollback-of-rollback path was itself unhandled — a second PR-review-driven fix on top of cycle 4's rollback introduction

Cycle 4's review (commit `0ff5457a6`) introduced `promoteStagedOverPreviousLive` to fix a real gap:
`restoreAt`'s final promote (staged database over live) had no rollback at all if that move threw,
leaving the service with nothing at `live` instead of reverting to the pre-restore database. The fix
added a rollback move (`preserved` back onto `live`) inside the promote's `with` handler.

That rollback move itself had no fault handling of its own. If it also threw, the exception either
escaped uncaught or, via `restoreAt`'s outer `try/with`, collapsed to the exact same `"restore
failed"` string a clean rollback would return — an operator running `beavernest-be restore` had no
way to tell "safe to retry" apart from "the live database is now missing entirely, recover
manually" from the return value alone.

**Fixed in cycle 5** (commit `bba04adfb`): nested the rollback move in its own `try/with`, returning
a new, distinguishable error string (`"restore failed and rollback failed - live database is
missing; recover it manually from the preserved copy"`) when the rollback itself fails. Added a
regression test that fails both the primary promote and the rollback move and asserts the new error
string (RED against the prior implementation, GREEN after), plus two new
`verified-restore.feature` scenarios covering the rollback-succeeds and rollback-also-fails paths.

**Follow-up in the same cycle** (commit `3a48a2cdc`): the two new scenarios are fault-injected
through `promoteStagedOverPreviousLive`'s testable `moveFile` seam (F# TickSpec, unit-level) — a
real filesystem-move failure cannot be deterministically injected into the published CLI binary
running inside the disposable e2e Compose container. Tagged them `@unit` and added the established
`tags: "not @unit"` playwright-bdd filter (matching the `ose-be-e2e` precedent) so
`beavernest-be-e2e`'s Playwright suite never tries to collect them, with throwing stand-in step
definitions so a tag-filter regression fails loudly instead of silently reporting a false pass.
