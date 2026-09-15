# Delivery — LMS User Identity Integration

> **Legend** — `[AI]`: an agent performs the step (default). `[HUMAN]`: only a human can perform an
> out-of-band action, supply a real secret, or approve a privileged external change. `[AI+HUMAN]`:
> agent prepares and human approves or completes.

## Execution Blocker

Do not execute this plan until all nine OSE ID initialization plans are merged and archived on
`origin/main`, including the terminal execution check for `ose-id-init-09-local-scale-and-composition`.
This is a true dependency, not a scheduling preference: LMS consumes delivered OIDC metadata, claims,
keys, personal/company context, logout behavior, and local-stack entrypoint.

## Worktree

Worktree path: `worktrees/lms-user/`

Provisioning status: pending. This plan is being revised inside the user-required `ose-id` authoring
worktree because it depends on the unlanded OSE ID plan. No LMS implementation may begin here. After the
blocker clears, plan-execution Step 0 provisions or enters the single matching `lms-user` worktree from
current `origin/main`, initializes it, and records its identity/inventory before any edit. From the
repository root, the exact new-worktree command is:

```bash
rtk git worktree add -b lms-user-base worktrees/lms-user origin/main
```

If `lms-user-base` already exists, use
`rtk git worktree add worktrees/lms-user lms-user-base`. If either command reports stale metadata, run
`rtk git worktree prune` and retry once; a second failure stops execution without deleting the path or
branch. An existing matching worktree is entered and freshness-synced, never provisioned again.

## Delivery Mode: worktree-to-pr

One short-lived LMS worktree/branch delivers one complete PR to `main`, with exact-current-head/base
quality gate, one clean leak review, applicable API/UI gates, and semantic security/logic/integrity review.

## Delivery Unit

| Unit                       | Phases | Outcome                                                                                                                                                                 |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DU1 — LMS OIDC integration | 0–6    | `ose-lms-app-web` plus E2E owner, client/resource validation, personal/company mapping, app session/logout, local authenticated stack, docs/evidence, and archived plan |

## Parallelization Model

### Delivery Boundaries

| Unit | Change phases | Worktree and branch                                                               | Delivery opportunity                                                                                      | Cohesive seam                                                                                                                                           | Resulting `main`, rollback, and flag evidence                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DU1  | 0–6           | `worktrees/lms-user/`; observed Phase-0 execution branch based on `lms-user-base` | One PR after Phase 6 only; validator, BFF/session UI, local composition, and specs cannot ship separately | OIDC client/resource validation, personal/company principal mapping, opaque LMS session, login/logout UI, OSE ID local composition, specs, and evidence | `main` has one complete local LMS↔OSE ID integration and no fallback identity. Rollback disables the LMS auth entry point, revokes/soft-deletes LMS-owned sessions, restores the protected-route unavailable state, and leaves OSE ID clients/data untouched. Evidence proves enabled/disabled modes, issuer/JWKS failure, personal/company access, local dependency stop, logout choices, and removal of temporary reachability flags. |

Parallel lanes never become separate PRs or independently reachable partial authentication paths.

### Agent Topology

Phases 0–2 are serial: delivered upstream evidence and revised Gherkin/contracts define implementation.
After contracts land, backend resource validation/principal mapping may run in parallel with the LMS
web/BFF UI session work if they own distinct files. The integration owner serializes generated OpenAPI
artifacts, project config, behaviour maps, and local-stack scripts. E2E/manual/completion/delivery is serial.
All executors share one worktree, inspect status first, and never revert another executor's changes.

### Mandatory Nx Quality Matrix

The full matrix is a green closure gate: run it at Phase 0 before new RED artifacts, then after each
implementation phase from Phase 2 onward, at the final local-quality gate, and at the exact-head
delivery/PR gate. Phase 1 is the sole intentional-RED contract phase. Its gate runs the explicit
predecessor-green build/typecheck/lint subset below, then the isolated behavior-coverage command whose
named missing bindings must be nonzero; it does not run `test:quick` after introducing those RED
bindings. While the new LMS web projects do not yet exist, green gates through Phase 2 run:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:build
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-lms-be,ose-lms-be-e2e
```

After Phase 3 creates the web owner and its dedicated E2E project, Phases 3–6 run:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t build --projects=ose-lms-be,ose-lms-app-web
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick --projects=ose-lms-be,ose-lms-be-e2e,ose-lms-app-web,ose-lms-app-web-e2e
```

Phase 0 records the existing Java backend/E2E target definitions. Phase 3 must prove the new Next.js
owner's `typecheck` is a no-emit `tsc --noEmit` invocation and its `lint` includes ESLint; the
TypeScript E2E project must also expose a real no-emit typecheck and repository-standard lint. The
two dedicated E2E projects intentionally omit `build` because they produce no deployable artifacts.
No target may be an echo, no-op, success sentinel, or duplicate alias. Each gate writes command exit
codes and inspected target/configuration proof to its phase evidence destination as `nx-quality.txt`;
outside the named Phase 1 behavior-coverage RED, any missing target, nonzero exit, emitted typecheck
artifact, or ESLint failure reopens that phase and blocks progression. Phase 1 records the exact expected
missing-binding set; any other failure is a defect, and the full matrix becomes mandatory again only
after Phase 2 closes those bindings.

## Phase 0: Unblock, Provision, and Baseline

**Input:** all nine archived OSE ID initialization plans and verified implementation on `origin/main`.

**Outcome:** one initialized LMS worktree, exact upstream contract recorded, and green LMS/OSE ID baseline.

**Proof:** sanitized transcripts under `plans/in-progress/lms-user/evidence/`.

- [ ] [AI] **Owner: root integrator; OSE ID dependency audit.** Run
      `rtk rg -n "ose-id-init-0[1-9]" plans/done/README.md`,
      `rtk apps/rhino-cli/scripts/rhino-bin.sh plan validate`, and
      `rtk git log --first-parent --format='%H %s' origin/main -- plans/done`; resolve exactly one archived
      directory and merge commit for each Plan 01–09, then read every terminal audit and full merge diff.
      Write archive path, 40-character merge SHA, `origin/main` ancestry, terminal PASS, production-disabled
      proof, and open-finding count for all nine rows to `plans/in-progress/lms-user/evidence/phase-0/01-ose-id-dependencies.md`.
      Acceptance: all commands exit 0 and all nine rows pass at the same `origin/main`; otherwise preserve
      the failing row and stop before worktree provisioning, routing it to that OSE ID plan owner.
- [ ] [AI] **Owner: root integrator; worktree identity.** From the repository root run
      `rtk git worktree list --porcelain`; enter the existing exact `worktrees/lms-user/` route or run the
      applicable exact add command in the Worktree section, followed inside it by
      `rtk git rev-parse --verify HEAD`, `rtk git branch --show-current`, and `rtk git status --short`.
      Record route, branch, creator, UTC time, 40-character starting HEAD, command outcome, and full branch
      inventory at `plans/in-progress/lms-user/evidence/phase-0/02-worktree.md`. Acceptance: one clean matching worktree is based on
      current `origin/main`; stale metadata gets only the documented one prune/retry, then stops without
      deleting a path or branch.
- [ ] [AI] **Owner: root integrator; dependency initialization.** From the execution worktree run the
      exact commands below, then `rtk git status --short` and
      `rtk git diff --exit-code -- . ':!package-lock.json'`. Save command, exit, dependency-lock change,
      and sanitized output at `plans/in-progress/lms-user/evidence/phase-0/03-initialization.txt`. Acceptance: both commands exit 0,
      only a justified deterministic lockfile change may remain, and no secret/unrelated mutation exists;
      otherwise stop, preserve the transcript, and fix initialization before contract discovery.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm install
  rtk npm run doctor -- --fix
  ```

- [ ] [AI] **Owner: OIDC integration owner; delivered-contract inventory.** Run
      `rtk rg -n "issuer|jwks|algorithm|ose-lms-app-web-local|urn:ose:lms-api|ose.context|ose.lms|lms.access|logout|revocation|fresh|Mailpit|fake Google|local-stack|production" apps/ose-id-{be,be-e2e,web,web-e2e} specs/apps/ose/id-{be,web} docs/reference/web-sites.md repo-config.yml`.
      Map each issuer/discovery, algorithm/JWKS, client/resource/scope, personal/company/entitlement,
      logout/revocation/freshness, port, fixture, runtime-guard, and public runner value to its exact source
      at `plans/in-progress/lms-user/evidence/phase-0/04-ose-id-contract-inventory.md`. Acceptance: every required value has one
      delivered authority and no conflicting source; a missing/conflicting row stops for plan amendment.
- [ ] [AI] **Owner: OIDC integration owner; registration equality.** Confirm the delivered values exactly
      match client `ose-lms-app-web-local`, callback
      `http://127.0.0.1:3400/auth/oidc/callback`, post-logout
      `http://127.0.0.1:3400/auth/signed-out`, audience `urn:ose:lms-api`, scopes
      `openid profile ose.context ose.lms`, and entitlement `lms.access` by running
      `rtk rg -n "ose-lms-app-web-local|127\.0\.0\.1:3400/auth/(oidc/callback|signed-out)|urn:ose:lms-api|openid profile ose\.context ose\.lms|lms\.access" apps/ose-id-{be,be-e2e,web,web-e2e} specs/apps/ose/id-{be,web}`.
      Store a source/value/equality table at `plans/in-progress/lms-user/evidence/phase-0/05-registration-equality.md`. Acceptance:
      each expected literal occurs in its delivered client/resource authority and no alternative alias is
      registered; any mismatch blocks execution and routes to plan amendment, never an LMS alias.
- [ ] [AI] **Owner: root integrator; project ownership check.** Run
      `rtk npm exec nx -- show projects`, `rtk git log --all --oneline -- apps/ose-lms-app-web apps/ose-lms-app-web-e2e`,
      and `rtk git status --short -- apps/ose-lms-app-web apps/ose-lms-app-web-e2e`; save results at
      `plans/in-progress/lms-user/evidence/phase-0/06-project-ownership.txt`. Acceptance: neither project/path/history exists. If one
      exists, stop for full-history reconciliation and plan amendment rather than creating a second owner.
- [ ] [AI] **Owner: baseline integrator; predecessor baseline.** Run the copyable commands below and record
      exact command, exit code, sanitized output, and cleanup inventory at
      `plans/in-progress/lms-user/evidence/phase-0/07-baseline.txt`. Fix every failure encountered, including preexisting failures in
      the affected baseline,
      at its root cause; never skip, loosen, retry, quarantine, or narrow a gate.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:quick
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:quick -p ose-id-be,ose-id-web,ose-id-be-e2e,ose-id-web-e2e
  ```

- [ ] [AI] **Owner: security integrator; credential-authority inventory.** Run
      `rtk rg -n -i "password|password_hash|refresh[_-]?token|HS256|signing[_-]?key|local issuer|/auth/(register|login|recover|reset|verify|token)" apps/ose-lms-be apps/ose-lms-be-e2e specs/apps/ose/lms-be` and
      record every match with implemented/planned/non-authority disposition at
      `plans/in-progress/lms-user/evidence/phase-0/08-credential-authority-inventory.md`. Acceptance: no implemented credential/
      issuer/storage authority or user-data migration exists; an implementation match stops for a
      compatibility/migration amendment and must never be deleted from this checklist.

### Phase 0 Gate

- [ ] [AI] **Owner: root integrator; Phase 0 gate.** Run
      `rtk apps/rhino-cli/scripts/rhino-bin.sh plan validate`,
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:quick`,
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:quick -p ose-id-be,ose-id-web,ose-id-be-e2e,ose-id-web-e2e`, and
      `rtk git status --short`; write the eight evidence links, current HEAD, and exit codes to
      `plans/in-progress/lms-user/evidence/phase-0/gate-summary.md`. Acceptance: plan and baselines exit 0, evidence agrees at one
      HEAD, dependency/worktree/contract/registration/project/credential rows all pass, and no hidden LMS
      credential migration exists. Any failure reopens its numbered Phase 0 packet.

> **Pause Safety:** no LMS behavior changed. Resume by rechecking the upstream merge and baselines.

---

## Phase 1: Replace Local-Auth Specs with OIDC Contracts (RED)

**Input:** delivered upstream contract, PRD AC-LMS criteria, and technical document 001 section 8 delta map.

**Outcome:** LMS specs describe client/resource integration and explicitly prohibit local identity-provider
behaviour; new adapters are intentionally absent.

**Proof:** contract validation plus static behaviour RED limited to new undefined bindings.

Every Phase 1 task writes command, exit code, changed-path list, and sanitized output below
`plans/in-progress/lms-user/evidence/phase-1/`. A result outside its stated observable outcome stops the
phase, preserves the RED transcript, and routes to the same task's owner; it is never waived or hidden by
changing validation scope.

- [ ] [AI] **Owner: `specs-maker`; obsolete-contract removal.** Use
      `rtk rg -n "register|password|refresh|HS256|local issuer|credential" specs/apps/ose/lms-be apps/ose-lms-be`
      to freeze the exact predecessor-only spec/contract matches in `plans/in-progress/lms-user/evidence/phase-1/obsolete-ledger.md`.
      Remove or replace only the unimplemented registration, password-login, refresh-family, HS256,
      local-logout, credential-throttling, and auth-schema contract entries under
      `specs/apps/ose/lms-be/`; preserve hello/health behavior. Run
      `rtk git diff -- specs/apps/ose/lms-be` and record it at
      `plans/in-progress/lms-user/evidence/phase-1/obsolete-contract-diff.md`. Acceptance: every ledger row has a remove/replace
      disposition and no compatibility endpoint or migration is invented. Any implemented storage/API
      match stops execution for plan amendment. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate`
      and save `plans/in-progress/lms-user/evidence/phase-1/obsolete-specs-validate.txt`; a nonzero result returns to this packet.
- [ ] [AI] **Owner: `specs-maker`; canonical RED Gherkin.** Create/update exactly
      `specs/apps/ose/lms-be/behaviours/hello/hello.feature`,
      `specs/apps/ose/lms-be/behaviours/security/resource-server.feature`,
      `specs/apps/ose/lms-be/behaviours/security/principal-context.feature`,
      `specs/apps/ose/lms-be/behaviours/security/domain-authorization-boundary.feature`,
      `specs/apps/ose/lms-be/behaviours/security/credential-authority-absence.feature`,
      `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`,
      `authentication/context-switch.feature`, `authentication/logout.feature`, and
      `session/session-retirement.feature`, and `local-stack/composition.feature` from technical
      document 001. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate`
      and save `plans/in-progress/lms-user/evidence/phase-1/specs-validate.txt`. Acceptance: app-scoped Gherkin parses, contains no
      plan metadata or positive layer tag, and covers the exact scenarios in the API mapping. A parser,
      ownership, duplicate-title, or language failure returns to this packet before contracts continue.
- [ ] [AI] **Owner: contract/spec lane; machine-readable contracts.** Update
      `specs/apps/ose/lms-be/contracts/openapi.yaml` with bearer security plus the unchanged hello success
      and closed 401/403 responses; add
      `specs/apps/ose/lms-app-web/contracts/authentication.openapi.yaml` for the seven LMS page/BFF
      operations in technical document 002. Add the new contract project at
      `specs/apps/ose/lms-app-web/contracts/project.json` with an
      `ose-lms-app-web-contracts:lint` target; do not copy OSE ID protocol operations. Run the exact
      commands below and store their output plus semantic old/new operation manifests under
      `plans/in-progress/lms-user/evidence/phase-1/contracts/`. Acceptance: every command exits 0, every indexed LMS
      operation/status/schema is present, and OSE ID paths are absent. Contract drift routes back to
      this owner; do not hand-edit generated output.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-contracts:lint
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-contracts:bundle
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-contracts:lint
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:codegen
  ```

- [ ] [AI] **Owner: architecture/spec lane; rendered documentation.** Update the exact LMS API/web
      architecture indexes and diagrams under `specs/apps/ose/lms-be/` and
      `specs/apps/ose/lms-app-web/` to show issuer, resource API, BFF, shared session store, context, and
      runner ownership. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh md mermaid validate specs/apps/ose/lms-be specs/apps/ose/lms-app-web`
      and save `plans/in-progress/lms-user/evidence/phase-1/mermaid-validate.txt`. Acceptance: the command exits 0 and every diagram
      labels ownership and accessible boundaries without clipped text. Any accessibility, link, or
      boundary mismatch returns to this packet.
- [ ] [AI] **Owner: integration owner; adapter maps and intentional RED.** Create/update exactly
      `apps/ose-lms-be/behaviour-coverage.json`,
      and `apps/ose-lms-be-e2e/behaviour-coverage.json`. Unit is mandatory; Integration/E2E are required
      for every crossed boundary. An inapplicable higher layer uses only the exact per-scenario exemption
      tag/comment and alternative proof from technical document 001—never a blanket exemption. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour -p ose-lms-be,ose-lms-be-e2e`
      and store `plans/in-progress/lms-user/evidence/phase-1/behaviour-red.txt`. Acceptance: nonzero RED lists only the deliberately
      absent new adapters; orphan, duplicate, positive-tag, invalid-exemption, or unrelated undefined
      results route back to the spec/adapter owner immediately.

### Phase 1 Gate

- [ ] [AI] **Owner: integration owner; phase gate.** Run the exact commands below and write
      `plans/in-progress/lms-user/evidence/phase-1/gate-summary.md` with every exit code and the expected RED binding list.
      Acceptance: validation/lint/bundle/codegen/Mermaid exit 0; behaviour coverage is nonzero only for
      the new absent adapters; every PRD criterion maps to a canonical scenario; and no contract lets
      LMS register credentials, issue tokens, trust email/header/debug identity, or authorize domain
      roles from ID claims. Any unexpected result reopens its owning Phase 1 packet.

  ```bash
  rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-be:build
  rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t typecheck,lint --projects=ose-lms-be,ose-lms-be-e2e
  rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh specs validate
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-contracts:lint
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-contracts:bundle
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-contracts:lint
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:codegen
  rtk ./hippo run --class ephemeral --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh md mermaid validate specs/apps/ose/lms-be specs/apps/ose/lms-app-web
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour -p ose-lms-be,ose-lms-be-e2e
  ```

> **Pause Safety:** contracts are coherent and intentionally RED through absent implementation only.

---

## Phase 2: Resource Server and Stable Principal/Context Mapping

**Input:** token/claims contract and backend security boundary.

**Outcome:** `ose-lms-be` validates OSE ID access tokens for its audience and establishes an immutable
principal plus a valid personal or company context before LMS-local authorization.

**Proof:** ordered Unit/Integration RED→GREEN→REFACTOR transcripts and absence scans under
`plans/in-progress/lms-user/evidence/phase-2/`.

- [ ] [AI] **Owner: `swe-java-dev`; RED — resource-token boundary.** Add Unit and Integration adapters
      under `apps/ose-lms-be/src/test/java/com/oseplatform/lms/security/{oidc,context}/**` for valid
      personal/company tokens; wrong issuer/audience/algorithm/key/signature; expired/not-yet-valid time;
      malformed/missing subject; unknown/mismatched context; missing/multiple company; company on a
      personal context; and missing scope/entitlement. Add exact `test:integration` and
      `test:coverage:integration` targets to `apps/ose-lms-be/project.json` if absent. Run the commands
      below and save
      `plans/in-progress/lms-user/evidence/phase-2/01-resource-token-red.txt`. Acceptance: both commands are nonzero solely because
      the new production validator/context adapter is absent, while predecessor tests remain green. A
      compile/config error or unrelated failure returns to this RED packet; do not implement production
      code until the intended assertions execute.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  ```

- [ ] [AI] **Owner: `swe-java-dev`; GREEN — resource-token boundary.** Implement only the failing seam
      under `apps/ose-lms-be/src/main/java/com/oseplatform/lms/security/{oidc,context}/**`,
      `apps/ose-lms-be/src/main/resources/application.yaml`, and
      `apps/ose-lms-be/build.gradle.kts`: exact issuer/JWKS/algorithm/audience validation and typed
      `(iss, sub, context_type, optional company_id)` mapping. Run the commands below and save
      `plans/in-progress/lms-user/evidence/phase-2/02-resource-token-green.txt`. Acceptance: Unit, Integration, and build exit 0;
      invalid tokens yield only the contract's generic 401/403. Any mismatch returns to this GREEN
      packet; do not weaken a RED assertion or add a fallback issuer.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:build
  ```

- [ ] [AI] **Owner: `swe-java-dev`; RED — profile and product authorization.** Add Unit and Integration
      tests under `apps/ose-lms-be/src/test/java/com/oseplatform/lms/security/{principal,authorization}/**`
      for unknown subject, email/name change without principal change, revoked/stale context, role-like
      upstream claims, absent LMS-local permission, and attempted company override through headers or
      query. Run the commands below and save `plans/in-progress/lms-user/evidence/phase-2/03-authorization-red.txt`. Acceptance:
      nonzero results list only the unimplemented stable-principal/local-policy behavior. An unrelated
      failure returns to this RED owner before production changes.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  ```

- [ ] [AI] **Owner: `swe-java-dev`; GREEN — profile and product authorization.** Implement the failing
      seam under `apps/ose-lms-be/src/main/java/com/oseplatform/lms/security/{principal,authorization}/**`
      and wire it into protected controllers under
      `apps/ose-lms-be/src/main/java/com/oseplatform/lms/**`. Derive immutable identity only from
      `(iss, sub)`, treat email/name as mutable profile data, reject client-selected company context, and
      load roles/permissions only from LMS policy. Run the commands below and save
      `plans/in-progress/lms-user/evidence/phase-2/04-authorization-green.txt`. Acceptance: both test layers exit 0 and the exact
      401/403 split matches technical document 002. A contract or authorization mismatch returns to this
      packet; do not consume role-like identity claims.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  ```

- [ ] [AI] **Owner: `swe-java-dev`; RED — metadata/key lifecycle.** Add deterministic Unit and
      Integration tests under `apps/ose-lms-be/src/test/java/com/oseplatform/lms/security/oidc/**` for
      discovery outage, stale cache, unknown `kid`, one controlled refresh, key rotation, and fail-closed
      dependency behavior. Run the commands below and save `plans/in-progress/lms-user/evidence/phase-2/05-jwks-red.txt`.
      Acceptance: only the missing bounded cache/refresh policy fails. Timing, external-network, retry,
      or unrelated failures return to this RED packet and must be made deterministic.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  ```

- [ ] [AI] **Owner: `swe-java-dev`; GREEN — metadata/key lifecycle.** Implement only the bounded cache,
      rotation, and one-refresh behavior under
      `apps/ose-lms-be/src/main/java/com/oseplatform/lms/security/oidc/**` and its exact configuration in
      `apps/ose-lms-be/src/main/resources/application.yaml`. Run the commands below and save
      `plans/in-progress/lms-user/evidence/phase-2/06-jwks-green.txt`. Acceptance: both layers exit 0; unknown keys never fall back
      to anonymous/debug/header identity. Any deviation returns to this GREEN packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  ```

- [ ] [AI] **Owner: `swe-java-dev`; REFACTOR and coverage.** Separate protocol validation, principal
      mapping, context, and domain authorization within the bounded `security/**` paths without changing
      observable behavior. Run the exact commands below and save `plans/in-progress/lms-user/evidence/phase-2/07-refactor.txt` plus
      the coverage report. Acceptance: all commands exit 0 and authored production-line Unit coverage is
      at least 99%. A coverage gap returns to the owning production/test packet; exclusions, weakened
      assertions, and higher-layer substitutions are forbidden.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:quick
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:behaviour
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:lint
  ```

- [ ] [AI] **Owner: security integration owner; observable credential-authority absence.** Bind scenario
      outline `Reject an LMS-local credential operation` through Unit route-catalog tests and real-router
      Integration tests under
      `apps/ose-lms-be/src/test/java/com/oseplatform/lms/security/absence/**`. Submit every method/path row
      from technical document 001 and assert the same `404` or `405`, no auth/session/token header or body,
      and no protected hello success. Also scan `apps/ose-lms-be/{src,project.json,build.gradle.kts}` and
      `specs/apps/ose/lms-be/` with the commands below; disposition generated/test/documentation vocabulary
      in `plans/in-progress/lms-user/evidence/phase-2/08-absence-ledger.md`. Acceptance: Unit and Integration exit 0, every Gherkin row
      has one binding, and no production password hash, verification/reset, provider token, signing
      private/shared secret, refresh family, local issuer, debug principal/header, or unsigned fallback
      remains. A route or production hit reopens the earliest responsible Phase 2 packet; never add an
      Integration exemption or false-positive suppression.

  ```bash
  rtk rg -n -i "password.?hash|verification.?token|reset.?token|provider.?token|signing.?private|shared.?secret|refresh.?family|local.?issuer|debug.?principal|trusted.?header|unsigned" apps/ose-lms-be specs/apps/ose/lms-be
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:behaviour
  ```

### Phase 2 Gate

- [ ] [AI] **Owner: integration owner; phase gate.** Run the commands below and save every exit code and
      artifact link in `plans/in-progress/lms-user/evidence/phase-2/gate-summary.md`. Acceptance: all commands exit 0, Unit coverage
      is at least 99%, AC-LMS-OIDC-02/PROFILE-01/AUTHZ-01 and absence are green, and every protected path
      establishes the exact OSE ID subject/context/entitlement before LMS-local roles. Any failure
      reopens the earliest owning RED/GREEN/REFACTOR packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:quick
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be:test:coverage:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-be-e2e:test:coverage:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour -p ose-lms-be,ose-lms-be-e2e
  ```

> **Pause Safety:** LMS API is a complete resource server; browser login/session is still disabled.

---

## Phase 3: LMS OIDC Client, BFF Session, Company Switch, and Logout

**Input:** delivered client registration and Phase 2 resource boundary.

**Outcome:** users enter and leave LMS through OSE ID without browser token storage or open redirects.

**Proof:** ordered client/session/UI/persistence RED→GREEN→REFACTOR transcripts under
`plans/in-progress/lms-user/evidence/phase-3/`.

- [ ] [AI] **Owner: `swe-typescript-dev`; project scaffold.** Create the repository-standard Next.js and
      Playwright projects only under `apps/ose-lms-app-web/**` and `apps/ose-lms-app-web-e2e/**`, using
      the delivered `apps/ose-id-web/{project.json,next.config.*,tsconfig*.json}` and
      `apps/ose-id-web-e2e/{project.json,playwright.config.*,tsconfig*.json}` only as structural prior art;
      do not copy OSE ID application/domain code. Use port `3400`, `OSE_LMS_APP_WEB_PORT`, and the Phase 1
      spec owners. Define exact web targets
      `build`, `typecheck`, `lint`, `test:unit`, `test:integration`, `test:coverage:unit`,
      `test:coverage:integration`, `test:coverage:behaviour`, `migrate:local`, and
      `session-retention:local`; define E2E targets `test:e2e`,
      `test:coverage:e2e`, `test:coverage:behaviour`, `local-stack`, `local-stack-cleanup`, `assert-clean`,
      `fixture-curl-config`, `fixture-curl-cleanup`, and `assert-http-capture-matrix`. Create
      `apps/ose-lms-app-web/behaviour-coverage.json` and
      `apps/ose-lms-app-web-e2e/behaviour-coverage.json` here—after both Nx projects exist—and map the
      Phase 1 web scenarios before the first web RED; do not create or invoke these owners in Phase 1.
      Run the commands below and save `plans/in-progress/lms-user/evidence/phase-3/01-scaffold.txt`. Acceptance: both projects resolve, the web application build and
      both projects' real typecheck/lint targets exit 0, and no route is enabled yet. Any duplicate owner,
      project-name drift, or scaffold failure returns to
      this packet; do not rename/fold the web app.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- show project ose-lms-app-web
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- show project ose-lms-app-web-e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:build
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t typecheck,lint --projects=ose-lms-app-web,ose-lms-app-web-e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour --projects=ose-lms-app-web,ose-lms-app-web-e2e
  ```

- [ ] [AI] **Owner: `swe-typescript-dev`; RED — OIDC transaction and session protocol.** Add Unit and
      Next-server Integration tests under
      `apps/ose-lms-app-web/{src,tests}/**/{oidc,session,csrf}*.{spec,test}.ts` for state/nonce/PKCE S256,
      exact callback/return path, code/ID-token validation, opaque cookie attributes/rotation/expiry,
      CSRF/origin, cache/referrer/security headers, replay/error, and absence of browser-serialized tokens.
      Run the commands below and save `plans/in-progress/lms-user/evidence/phase-3/02-protocol-red.txt`. Acceptance: both are
      nonzero only because the server adapters/routes are absent. Configuration or unrelated failures
      return to this RED packet; production code must not be added first.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  ```

- [ ] [AI] **Owner: `swe-typescript-dev`; RED — shared persistence prerequisite.** Add Unit contracts
      for bounded/idempotent retention commands and absence of hard-delete SQL; add migration,
      constraint, audit-column/time/pair/guard/grant, hard-delete denial, soft-delete, restart,
      multi-instance, checksum-drift, and key-absence Integration tests under
      `apps/ose-lms-app-web/tests/integration/session/**` and stack fixtures under
      `infra/dev/ose-lms/**`. Run the command below and save
      `plans/in-progress/lms-user/evidence/phase-3/02a-persistence-red.txt`. Acceptance: failures are limited to the absent
      `lms_web_schema_migrations`/`lms_web_sessions` migration and repository and prove a web-A-created
      session must be readable by web B without affinity. The retirement target is nonzero only because
      its command is absent. A fixture failure returns to this RED packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:session-retention:local
  ```

- [ ] [AI] **Owner: `swe-typescript-dev`; GREEN — shared persistence prerequisite.** Apply both exact
      physical schemas from technical document 001 under
      `apps/ose-lms-app-web/src/server/session/{migrations,repository}/**` with owned local PostgreSQL
      configuration under `infra/dev/ose-lms/**`; implement server-only Kysely + `pg`, the advisory-lock/
      checksum runner, exact `migrate:local` and bounded `session-retention:local` Nx targets,
      audit/soft-delete guards, and active predicates;
      envelope-encrypt protocol artifacts and hash cookie/CSRF lookup material. Run the commands below
      and save `plans/in-progress/lms-user/evidence/phase-3/02b-persistence-green.txt`. Acceptance: fresh/already-migrated/constraint/
      restart/multi-instance/key-absence tests and build exit 0; altered applied bytes fail closed; both
      tables pass catalog/grant/real-delete probes; and no in-memory affinity is introduced.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web:session-retention:local
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:build
  ```

- [ ] [AI] **Owner: `swe-typescript-dev`; GREEN — OIDC transaction and session protocol.** Implement only
      the failing server seam under `apps/ose-lms-app-web/src/server/{oidc,session,csrf}/**` and route
      handlers under `apps/ose-lms-app-web/src/app/{auth/oidc,api/bff/auth}/**`; wire exact delivered
      issuer/client/resource configuration through the app's env schema and `project.json`. Browser state
      contains only opaque Secure/HttpOnly/SameSite cookies. Run the commands below and save
      `plans/in-progress/lms-user/evidence/phase-3/03-protocol-green.txt`. Acceptance: Unit/Integration/build exit 0 and the wire
      contract matches technical document 002. Any mismatch returns to this GREEN packet; no browser
      token or open redirect is tolerated.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:build
  ```

- [ ] [AI] **Owner: `swe-typescript-dev`; RED — user-facing auth/context/logout.** Add component Unit and
      Next-server Integration tests under `apps/ose-lms-app-web/{src,tests}/**/*.{spec,test}.{ts,tsx}` for
      sign-in entry; callback/cancel/error; personal/company label; switch reauthorization; both logout
      modes; protected learning; focus/keyboard/status semantics; and 320/768/1280 CSS-pixel layouts.
      Add matching browser steps under `apps/ose-lms-app-web-e2e/steps/authentication/**`. Run the commands
      below and save `plans/in-progress/lms-user/evidence/phase-3/04-ui-red.txt`. Acceptance: new assertions execute and fail only
      on absent UI/routes. Accessibility harness, fixture, or unrelated failures return to this RED
      packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  ```

- [ ] [AI] **Owner: `swe-typescript-dev`; GREEN — user-facing auth/context/logout.** Implement only the
      failing views/components under `apps/ose-lms-app-web/src/{app,features}/**`: safe sign-in and result
      states, protected `/learning`, context switch, and both logout choices. Switching revokes the old
      context-bound LMS session before fresh authorization; logout revokes local state before upstream
      behavior. Run the commands below and save `plans/in-progress/lms-user/evidence/phase-3/05-ui-green.txt`. Acceptance: all
      commands exit 0 and UI exposes no OSE ID credential, consent, membership, or company-admin control.
      Any behavior/accessibility mismatch returns to this GREEN packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  ```

- [ ] [AI] **Owner: web integration owner; AC-LMS-SESSION-01 audit gate.** Run Unit command-shape tests;
      Integration inventory for both `lms_web_schema_migrations` and `lms_web_sessions`; and the built
      E2E session-retirement journey. Acceptance: both tables expose the six exact audit columns, time/
      pair constraints, hard-delete triggers, `ON DELETE RESTRICT` references, and no serving-role
      `DELETE`/`TRUNCATE`/DDL privilege; real `DELETE` fails against each table; the bounded retention
      target stamps the supplied actor, nulls all secret material, excludes the tombstone from active
      reads, preserves it for the sanitized audit probe, and remains idempotent across restart and a
      concurrent second invocation. The migration-metadata scenario alone carries its documented
      `@e2e-exempt`; no other layer exemption is permitted. Save catalog, grants, failed SQL state,
      before/after counts, non-secret digests, and E2E output in `plans/in-progress/lms-user/evidence/phase-3/06-database-audit/`.

- [ ] [AI] **Owner: web integration owner; REFACTOR and coverage.** Centralize safe-return, session,
      claims, and view-model code within the bounded web paths without copying OSE ID UI/domain logic.
      Run the commands below and save `plans/in-progress/lms-user/evidence/phase-3/07-refactor.txt` and coverage reports.
      Acceptance: all commands exit 0, authored production-line Unit coverage is at least 99%, and every
      Integration/E2E omission has only the reviewed per-scenario exemption syntax plus alternative
      proof. A failure reopens its earliest RED/GREEN packet; exclusions or weakened tests are forbidden.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:build
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t typecheck,lint --projects=ose-lms-app-web,ose-lms-app-web-e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:coverage:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:coverage:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:coverage:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour -p ose-lms-app-web,ose-lms-app-web-e2e
  ```

### Phase 3 Gate

- [ ] [AI] **Owner: web integration owner; phase gate.** Run the exact commands below and record exit
      codes/report links in `plans/in-progress/lms-user/evidence/phase-3/gate-summary.md`. Acceptance: all commands exit 0, Unit
      coverage is at least 99%, an entitled personal/company user signs in/switches/logs out safely,
      AC-LMS-SESSION-01 passes with its exact single E2E exemption, protocol artifacts remain server-side,
      and LMS has no company-admin or identity-provider behavior.
      Any failure reopens the earliest owning packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:build
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t typecheck,lint --projects=ose-lms-app-web,ose-lms-app-web-e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:coverage:unit
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web:test:coverage:integration
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:coverage:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:coverage:behaviour -p ose-lms-app-web,ose-lms-app-web-e2e
  ```

> **Pause Safety:** application behavior is complete against an already-running OSE ID stack.

---

## Phase 4: Authenticated Local Stack and Real-Process E2E

**Input:** complete client/resource integration and OSE ID reusable local runner.

**Outcome:** one LMS target owns the full dependent stack and every negative journey/cleanup path.

**Proof:** ordered runner/journey RED→GREEN→REFACTOR evidence, two clean real-process runs, one injected
failure, and resource inventory under `plans/in-progress/lms-user/evidence/phase-4/`.

- [ ] [AI] **Owner: `swe-e2e-dev`; RED — composed lifecycle.** Add lifecycle tests under
      `apps/ose-lms-app-web-e2e/steps/local-stack/**` for start/readiness/child failure/interrupt/finally/
      cleanup across LMS web/API/session PostgreSQL and the delivered OSE ID web/API/PostgreSQL/Mailpit/
      fake-Google runner. Require collision-safe explicit ports and no sleep/retry/server reuse. Run the
      command below and save `plans/in-progress/lms-user/evidence/phase-4/01-runner-red.txt`. Acceptance: nonzero results are solely
      the missing LMS composition/cleanup adapter while OSE ID's delivered runner tests stay green. An
      infrastructure or unrelated failure returns to this RED packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  ```

- [ ] [AI] **Owner: `swe-e2e-dev`; GREEN — composed lifecycle.** Implement the outer runner and owned
      fixture/cleanup code only under `apps/ose-lms-app-web-e2e/{src,steps,fixtures}/local-stack/**`, its
      `project.json`, and `infra/dev/ose-lms/**`. Invoke OSE ID's public start/ready/version/cleanup
      contract, then LMS; preserve the primary exit code and use a bounded outer `finally`, never broad
      process/container deletion. Run the commands below and save `plans/in-progress/lms-user/evidence/phase-4/02-runner-green.txt`.
      Acceptance: E2E and explicit cleanup/assert-clean exit 0 with no owned process, port, container,
      network, volume, temp key, cookie/token directory, or fixture left. A lifecycle mismatch returns to
      this GREEN packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:local-stack-cleanup
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:assert-clean
  ```

- [ ] [AI] **Owner: `swe-e2e-dev`; RED — built-process journeys.** Add Playwright/Cucumber adapters under
      `apps/ose-lms-app-web-e2e/steps/{authentication,resource-server,absence}/**` for login, cancel/error,
      token-negative matrix, personal context, none/one/many companies, switch, entitlement/membership
      removal, email change, local roles, both logout modes, issuer outage, and credential-authority
      absence. Run the command below and save `plans/in-progress/lms-user/evidence/phase-4/03-journeys-red.txt`. Acceptance: only
      missing journey fixtures/step implementations fail; Gherkin, runner readiness, and existing steps
      remain green. A scenario ownership or unrelated failure returns to this RED packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  ```

- [ ] [AI] **Owner: `swe-e2e-dev`; GREEN — built-process journeys.** Implement only missing synthetic
      fixtures and steps under `apps/ose-lms-app-web-e2e/{fixtures,steps}/**`, including deterministic
      personal/Company A/Company B identities and LMS-local role policy. Run the commands below and save
      `plans/in-progress/lms-user/evidence/phase-4/04-journeys-green.txt`. Acceptance: E2E and static behaviour coverage exit 0 with
      no real provider secret and no skipped/retried/slept scenario. A behavioral or fixture mismatch
      returns to this GREEN packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:coverage:behaviour
  ```

- [ ] [AI] **Owner: `swe-e2e-dev`; REFACTOR and resilience proof.** Remove copied OSE ID fixture/config/
      lifecycle logic from the bounded LMS E2E paths, then run the unfiltered E2E target twice from
      independently clean state and one explicit child-readiness-failure case. Run the commands below
      in order and save `plans/in-progress/lms-user/evidence/phase-4/05-refactor-run-{1,2,failure,cleanup}.txt`. Acceptance: the two
      normal runs exit 0; the injected case exits nonzero with its primary failure; every invocation ends
      with cleanup/assert-clean exit 0. Any residue or changed primary exit reopens the lifecycle GREEN
      packet; these are independent proofs, not retries.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:local-stack-cleanup
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:local-stack-cleanup
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e -- --case=child-readiness-failure
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:local-stack-cleanup
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:assert-clean
  ```

### Phase 4 Gate

- [ ] [AI] **Owner: E2E integration owner; phase gate.** Run the commands below and record exit codes,
      resource inventories, and evidence links in `plans/in-progress/lms-user/evidence/phase-4/gate-summary.md`. Acceptance: all
      commands exit 0, AC-LMS-LOCAL-01..02 and every E2E-applicable criterion pass, and there are no real
      provider secrets, reused servers, retries, sleeps, skips, or cleanup leaks. Any failure reopens the
      earliest runner/journey packet.

  ```bash
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:e2e
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:test:coverage:behaviour
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:local-stack-cleanup
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:assert-clean
  ```

> **Pause Safety:** DU1 is locally complete and reproducible; documentation/manual hardening remains.

---

## Phase 5: Documentation, Manual Verification, and Quality Audit

**Input:** complete implementation and E2E lifecycle.

**Outcome:** docs match observed behavior; manual/API/UI/security/plan audits have no unresolved defect.

**Proof:** sanitized evidence and tester/checker reports.

- [ ] [AI] **Owner: documentation lane; LMS operator documentation.** Update only
      `apps/ose-lms-be/README.md`, `apps/ose-lms-be-e2e/README.md`,
      `apps/ose-lms-app-web/README.md`, `apps/ose-lms-app-web-e2e/README.md`,
      `specs/apps/ose/lms-be/README.md`, `specs/apps/ose/lms-app-web/README.md`, and the exact LMS rows in
      `docs/reference/web-sites.md`. Document the OSE ID dependency, issuer/client/resource/env/targets,
      authenticated versus app-only startup, principal/context/role split, Mailpit, logout/freshness,
      troubleshooting, and cleanup; remove stale local password/JWT/Flyway-auth claims. Run
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec prettier -- --check apps/ose-lms-be/README.md apps/ose-lms-be-e2e/README.md apps/ose-lms-app-web/README.md apps/ose-lms-app-web-e2e/README.md specs/apps/ose/lms-be/README.md specs/apps/ose/lms-app-web/README.md docs/reference/web-sites.md` and
      `rtk apps/rhino-cli/scripts/rhino-bin.sh md links validate apps/ose-lms-be apps/ose-lms-be-e2e apps/ose-lms-app-web apps/ose-lms-app-web-e2e specs/apps/ose/lms-be specs/apps/ose/lms-app-web docs/reference/web-sites.md`.
      Save exits plus a claim/source table at `plans/in-progress/lms-user/evidence/phase-5/01-documentation.md`. Acceptance: both
      commands exit 0 and every operational claim points to a delivered target/config; any stale or
      unsupported statement returns to this packet.
- [ ] [AI] **Owner: E2E integration owner; complete-stack start.** Start the complete built stack with
      `rtk ./hippo run --class service --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:local-stack`
      and wait for its readiness output: LMS web `http://127.0.0.1:3400`, LMS API
      `http://127.0.0.1:8303`, LMS session PostgreSQL `127.0.0.1:5439`, OSE ID web
      `http://127.0.0.1:3500`, OSE ID backend `http://127.0.0.1:8501`, OSE ID PostgreSQL
      `127.0.0.1:5438`, Mailpit UI `http://127.0.0.1:8026`, and fake Google
      `http://127.0.0.1:8502`. On any readiness
      failure, save sanitized per-service readiness and owner manifest at
      `plans/in-progress/lms-user/evidence/phase-5/02-stack-readiness.md`, invoke
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:local-stack-cleanup`,
      and stop; never continue with a partial stack. Acceptance: every named endpoint is explicitly ready,
      the public descriptor is schema-valid, and no undeclared process/port exists.
- [ ] [AI] **Owner: browser verification lane; personal sign-in.** Using the repository browser tool, call `browser_navigate` to
      `http://127.0.0.1:3400/learning`, `browser_snapshot`, and `browser_click` on the accessible
      `Continue with OSE ID` button. At the delivered OSE ID page, use `browser_fill_form` with
      `personal.learner@ose.test` and its generated local secret, complete email sign-in, choose
      `Personal`, and continue. Save the snapshot, URL, cookie-name/attribute inventory, and storage/
      network redaction result at `plans/in-progress/lms-user/evidence/phase-5/03-personal-sign-in.md`. Acceptance: return to
      `/learning`, text `Context: Personal`, one opaque `HttpOnly` LMS cookie, and no token-shaped URL,
      query, DOM, storage, or log value. Any mismatch routes to Phase 3 protocol/UI GREEN and requires a
      fresh browser context after the fix.
- [ ] [AI] **Owner: browser verification lane; company switch.** Repeat from a clean browser context with `company.learner@ose.test`; select Company A, then
      use the Account menu's `Switch context` action and reauthorize Company B. After each transition,
      run `browser_snapshot`, `browser_console_messages`, `browser_network_requests`, and
      `browser_evaluate` to inspect `localStorage`, `sessionStorage`, IndexedDB, Cache Storage, and
      serialized/RSC payloads. Expect no access/refresh/ID/provider token, no Company A data after the
      switch, and no console error. Capture sanitized screenshots to
      `plans/in-progress/lms-user/evidence/phase-5-company-switch-{320,768,1280}px.png` and a per-transition URL/storage/network/
      cookie assertion table at `plans/in-progress/lms-user/evidence/phase-5/04-company-switch.md`. Any stale Company A authority,
      token artifact, or console/network failure reopens Phase 3 and reruns the full switch journey.
- [ ] [AI] **Owner: browser verification lane; negative UX matrix.** Exercise cancellation, missing entitlement, membership removal, local-role denial, changed
      email claim, expired session, OSE ID unavailable, `Sign out of LMS`, and
      `Sign out of LMS and OSE ID` using `browser_click` and `browser_snapshot`. For each, record the
      exact expected heading, safe
      URL, focus target, cookie state, and absence of tenant/token disclosure in
      `plans/in-progress/lms-user/evidence/phase-5-browser-matrix.md`; test 320/768/1280 CSS px, keyboard-only flow, 200% zoom, and
      live status. Acceptance: every named row records independently observed heading, URL, focus,
      cookie, storage, and disclosure assertions at all widths; a missing row or mismatch reopens its
      Phase 2/3 owner and the failed row plus adjacent authorization journey rerun.
- [ ] [AI] **Owner: API verification lane; literal LMS wire recipes.** With the complete stack ready,
      create `plans/in-progress/lms-user/evidence/phase-5/http/` and use only the E2E-owned
      `ose-lms-app-web-e2e:fixture-curl-config` target to mint one-use synthetic transaction/session/token
      inputs. Each generated `.curl` file contains only the method, safe headers/body, and temporary
      cookie/token reference; the callback cases also carry their fixture-issued one-time query because
      it cannot be literal. Every other recipe names its exact URL below. The files are ignored, mode
      `0600`, contain no real provider value, and are deleted by the block's exit/signal trap. Run the
      recipes below exactly, preserving response headers/body and the
      printed status in `plans/in-progress/lms-user/evidence/phase-5/http/`. Expected statuses are: discovery `200`, JWKS `200`, auth
      start `303`, successful callback `303`, current session `200`, context switch `303`, both logout
      modes `200`, protected learning `200`, signed-out protected learning `303`, valid LMS API `200`,
      missing-token API `401`, and insufficient entitlement API `403`. Any different status/schema/header, fixture leak, or unsanitized artifact
      blocks the phase and routes to the owning Phase 2/3/4 packet.

  ```bash
  rtk mkdir -p plans/in-progress/lms-user/evidence/phase-5/http local-tmp/lms-user/curl
  trap 'rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-cleanup -- --root=local-tmp/lms-user/curl' EXIT INT TERM
  rtk curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/discovery.headers --output plans/in-progress/lms-user/evidence/phase-5/http/discovery.json --write-out '%{http_code}\n' http://127.0.0.1:8501/.well-known/openid-configuration
  rtk curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/jwks.headers --output plans/in-progress/lms-user/evidence/phase-5/http/jwks.json --write-out '%{http_code}\n' http://127.0.0.1:8501/connect/jwks
  rtk curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/auth-start.headers --output plans/in-progress/lms-user/evidence/phase-5/http/auth-start.body --write-out '%{http_code}\n' 'http://127.0.0.1:3400/auth/oidc/start?returnPath=%2Flearning'

  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=callback-success --output=local-tmp/lms-user/curl/callback-success.curl
  rtk curl --config local-tmp/lms-user/curl/callback-success.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/callback.headers --output plans/in-progress/lms-user/evidence/phase-5/http/callback.body --write-out '%{http_code}\n'
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=session-company-a --output=local-tmp/lms-user/curl/session.curl
  rtk curl --config local-tmp/lms-user/curl/session.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/session.headers --output plans/in-progress/lms-user/evidence/phase-5/http/session.json --write-out '%{http_code}\n' http://127.0.0.1:3400/api/bff/auth/session
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=context-switch-company-a --output=local-tmp/lms-user/curl/context-switch.curl
  rtk curl --config local-tmp/lms-user/curl/context-switch.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/context-switch.headers --output plans/in-progress/lms-user/evidence/phase-5/http/context-switch.body --write-out '%{http_code}\n' http://127.0.0.1:3400/api/bff/auth/context-switch
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=logout-lms-only --output=local-tmp/lms-user/curl/logout-lms-only.curl
  rtk curl --config local-tmp/lms-user/curl/logout-lms-only.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/logout-lms-only.headers --output plans/in-progress/lms-user/evidence/phase-5/http/logout-lms-only.json --write-out '%{http_code}\n' http://127.0.0.1:3400/api/bff/auth/logout
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=logout-lms-and-ose-id --output=local-tmp/lms-user/curl/logout-lms-and-ose-id.curl
  rtk curl --config local-tmp/lms-user/curl/logout-lms-and-ose-id.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/logout-lms-and-ose-id.headers --output plans/in-progress/lms-user/evidence/phase-5/http/logout-lms-and-ose-id.json --write-out '%{http_code}\n' http://127.0.0.1:3400/api/bff/auth/logout
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=learning-company-a --output=local-tmp/lms-user/curl/learning.curl
  rtk curl --config local-tmp/lms-user/curl/learning.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/learning.headers --output plans/in-progress/lms-user/evidence/phase-5/http/learning.html --write-out '%{http_code}\n' http://127.0.0.1:3400/learning
  rtk curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/learning-signed-out.headers --output plans/in-progress/lms-user/evidence/phase-5/http/learning-signed-out.body --write-out '%{http_code}\n' http://127.0.0.1:3400/learning

  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=lms-api-valid-personal --output=local-tmp/lms-user/curl/lms-api-valid.curl
  rtk curl --config local-tmp/lms-user/curl/lms-api-valid.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/lms-api-valid.headers --output plans/in-progress/lms-user/evidence/phase-5/http/lms-api-valid.json --write-out '%{http_code}\n' http://127.0.0.1:8303/api/v1/hello
  rtk curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/lms-api-no-token.headers --output plans/in-progress/lms-user/evidence/phase-5/http/lms-api-no-token.json --write-out '%{http_code}\n' http://127.0.0.1:8303/api/v1/hello
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=lms-api-insufficient-entitlement --output=local-tmp/lms-user/curl/lms-api-insufficient.curl
  rtk curl --config local-tmp/lms-user/curl/lms-api-insufficient.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/lms-api-insufficient.headers --output plans/in-progress/lms-user/evidence/phase-5/http/lms-api-insufficient.json --write-out '%{http_code}\n' http://127.0.0.1:8303/api/v1/hello
  ```

- [ ] [AI] **Owner: API verification lane; closed error recipes.** Repeat the fixture-config pattern for
      unsafe return path (`400`), cancelled callback (`303` to the allowlisted result), replayed callback
      (`303` to the replay result with no second row), signed-out session (`401`), missing-CSRF context
      switch (`403`), and missing-CSRF logout (`403`). Run the commands below and store the sanitized wire artifacts
      under `plans/in-progress/lms-user/evidence/phase-5/http/errors/`. Acceptance: every exact status/problem/redirect matches
      technical document 002, no company/member hint appears, API 401 responses include
      `WWW-Authenticate: Bearer`, and cleanup removes `local-tmp/lms-user/curl/`. Any mismatch routes to
      the operation's Phase 2/3 owner; never edit the fixture to mask a product defect.

  ```bash
  rtk mkdir -p plans/in-progress/lms-user/evidence/phase-5/http/errors local-tmp/lms-user/curl
  trap 'rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-cleanup -- --root=local-tmp/lms-user/curl' EXIT INT TERM
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=auth-start-unsafe-return --output=local-tmp/lms-user/curl/auth-start-unsafe.curl
  rtk curl --config local-tmp/lms-user/curl/auth-start-unsafe.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/errors/auth-start-unsafe.headers --output plans/in-progress/lms-user/evidence/phase-5/http/errors/auth-start-unsafe.json --write-out '%{http_code}\n' 'http://127.0.0.1:3400/auth/oidc/start?returnPath=https%3A%2F%2Fevil.example'
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=callback-cancelled --output=local-tmp/lms-user/curl/callback-cancelled.curl
  rtk curl --config local-tmp/lms-user/curl/callback-cancelled.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/errors/callback-cancelled.headers --output plans/in-progress/lms-user/evidence/phase-5/http/errors/callback-cancelled.body --write-out '%{http_code}\n'
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=callback-replay --output=local-tmp/lms-user/curl/callback-replay.curl
  rtk curl --config local-tmp/lms-user/curl/callback-replay.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/errors/callback-replay.headers --output plans/in-progress/lms-user/evidence/phase-5/http/errors/callback-replay.body --write-out '%{http_code}\n'
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=session-signed-out --output=local-tmp/lms-user/curl/session-signed-out.curl
  rtk curl --config local-tmp/lms-user/curl/session-signed-out.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/errors/session-signed-out.headers --output plans/in-progress/lms-user/evidence/phase-5/http/errors/session-signed-out.json --write-out '%{http_code}\n' http://127.0.0.1:3400/api/bff/auth/session
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=context-switch-missing-csrf --output=local-tmp/lms-user/curl/context-switch-missing-csrf.curl
  rtk curl --config local-tmp/lms-user/curl/context-switch-missing-csrf.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/errors/context-switch-missing-csrf.headers --output plans/in-progress/lms-user/evidence/phase-5/http/errors/context-switch-missing-csrf.json --write-out '%{http_code}\n' http://127.0.0.1:3400/api/bff/auth/context-switch
  rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:fixture-curl-config --case=logout-missing-csrf --output=local-tmp/lms-user/curl/logout-missing-csrf.curl
  rtk curl --config local-tmp/lms-user/curl/logout-missing-csrf.curl --silent --show-error --dump-header plans/in-progress/lms-user/evidence/phase-5/http/errors/logout-missing-csrf.headers --output plans/in-progress/lms-user/evidence/phase-5/http/errors/logout-missing-csrf.json --write-out '%{http_code}\n' http://127.0.0.1:3400/api/bff/auth/logout
  ```

- [ ] [AI] **Owner: API verification lane; captured-wire assertions.** Implement the bounded committed
      assertion driver at `apps/ose-lms-app-web-e2e/src/http/assert-capture-matrix.ts` and its closed
      manifest at `apps/ose-lms-app-web-e2e/fixtures/http/manual-wire-expectations.json`. The manifest has
      exactly one row for every named curl capture above: `discovery`, `jwks`, `auth-start`,
      `callback-success`, `session-company-a`, `context-switch-company-a`, `logout-lms-only`,
      `logout-lms-and-ose-id`, `learning-company-a`, `learning-signed-out`, `lms-api-valid-personal`,
      `lms-api-no-token`, `lms-api-insufficient-entitlement`, `auth-start-unsafe-return`,
      `callback-cancelled`, `callback-replay`, `session-signed-out`, `context-switch-missing-csrf`, and
      `logout-missing-csrf`. Each row names its exact operation, expected status, media type or empty body,
      required cache/security/auth/redirect headers, closed OpenAPI schema where applicable, and stable
      problem or allowlisted redirect code. Codes are `none` for successful captures and redirects without
      a problem; `invalid_access_token` for no token; `insufficient_lms_access` for missing entitlement;
      `invalid_request` for unsafe return; `authorization_cancelled` and `oidc_response_invalid` in the two
      callback result locations; `authentication_required` for the signed-out session; and `csrf_invalid`
      for both missing-CSRF mutations. The representative `/learning` failure row independently
      requires `303`, an empty body, private/no-store, and exact relative
      `/auth/oidc/start?returnPath=%2Flearning` location. Run:

  ```bash
  rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:assert-http-capture-matrix -- --manifest=apps/ose-lms-app-web-e2e/fixtures/http/manual-wire-expectations.json --capture-root=plans/in-progress/lms-user/evidence/phase-5/http --output=plans/in-progress/lms-user/evidence/phase-5/http/assertion-summary.json --cleanup-root=local-tmp/lms-user/curl
  ```

  Acceptance: exit 0; exactly 19 unique rows report `pass` for status, headers, media/empty body,
  schema, stable code/redirect, and disclosure checks; all named header/body captures are consumed once;
  and cleanup proves the temporary fixture root absent. A missing/duplicate/unasserted capture, schema or
  header mismatch, non-allowlisted redirect, leaked token/company detail, or cleanup residue fails the
  driver, preserves only its sanitized row summary, and reopens the owning Phase 2/3 packet.

- [ ] [AI] **Owner: API verification lane; independently falsifiable token rejections.** Implement the
      bounded committed driver at
      `apps/ose-lms-app-web-e2e/src/resource-server/verify-token-negative-matrix.ts` and its closed case
      manifest at `apps/ose-lms-app-web-e2e/fixtures/resource-server/token-negative-cases.json`; expose it
      only as `ose-lms-app-web-e2e:verify-token-negative-matrix`. The manifest contains exactly these
      independent rows: `wrong-issuer`, `wrong-audience`, `unapproved-algorithm`, `invalid-signature`,
      `unknown-key`, `expired`, `not-yet-valid`, `missing-subject`, `unknown-context`,
      `personal-with-company`, `company-without-company`, and `company-with-multiple-companies`. For each
      row, the driver asks the E2E fixture authority for one synthetic one-use token reference, performs
      its own HTTP request to `http://127.0.0.1:8303/api/v1/hello`, asserts status `401`, exact generic
      `invalid_access_token`, `WWW-Authenticate: Bearer`, private/no-store, the closed problem schema, and
      absence of issuer/audience/algorithm/key/time/subject/context/company/entitlement detail. It must
      fail on the first missing, duplicated, unexpectedly accepted, or non-generic row while still
      writing a sanitized row result and cleaning token files in `finally`. Run:

  ```bash
  rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:verify-token-negative-matrix -- --manifest=apps/ose-lms-app-web-e2e/fixtures/resource-server/token-negative-cases.json --base-url=http://127.0.0.1:8303 --output=plans/in-progress/lms-user/evidence/phase-5/http/errors/token-negative-matrix.json
  ```

  Acceptance: exit 0, exactly 12 uniquely named rows each report the expected request mutation and all
  assertions as `pass`, no row reuses another row's token, and cleanup reports zero token/config files.
  Preserve a sanitized failing row and route issuer/audience/algorithm/signature/key/time/subject/context
  failures to the Phase 2 resource-token GREEN packet; never collapse rows into one aggregate curl or
  edit the fixture to mask a product defect.

- [ ] [AI] **Owner: API gate integrator; strict discovery.** Run the bounded
      `repo-governance/workflows/api/api-quality-gate.md` twice in `mode: strict`,
      using `.claude/agents/general/api-exploratory-tester.md` with `output-mode: delivery` and this exact
      plan path. LMS API discovery targets `http://127.0.0.1:8303` with
      `specs/apps/ose/lms-be/contracts/openapi.yaml`, the full resource-server/domain-authorization
      Gherkin, and valid plus every issuer/audience/algorithm/signature/key/time/scope/entitlement/
      context/local-role token fixture. BFF discovery targets `http://127.0.0.1:3400` with
      `specs/apps/ose/lms-app-web/contracts/authentication.openapi.yaml`, the sign-in/context/logout
      Gherkin, and signed-out, personal, Company A/B, stale/lost-entitlement, cancelled/replayed, and
      OSE-ID-unavailable sessions. Confirm services/contracts are ready before discovery and enumerate
      every safe operation, status, schema, auth/context boundary, replay/concurrency, rate-limit, and
      privacy rule. Store the two invocation packets, readiness proof, reports, and lifecycle states under
      `plans/in-progress/lms-user/evidence/phase-5/api-quality/{lms-api,lms-bff}/`. Acceptance: each discovery returns a complete
      report with exact base URL/contract/Gherkin/fixture inputs and no destructive success call; missing
      readiness, incomplete coverage, or `partial`/`fail` stops and routes to the owning Phase 2/3 packet.
- [ ] [AI] **Owner: API gate integrator; bounded finding lifecycle.** For each API run, perform exactly one full discovery, triage original `AET-###` findings at
      the strict threshold, and append each as an unchecked task. Use `swe-java-dev` for LMS backend or
      `swe-typescript-dev` for LMS BFF fixes, once per bounded run, with a reproducing regression test;
      rebuild/restart once and run one scoped verification of original IDs plus affected operations.
      Record base URL, contract/spec/fixture inputs, AET IDs, commands, sanitized evidence,
      `final-status`, and `lifecycle-status`. `partial`, `fail`, pending lifecycle evidence, contract
      drift, or unchecked findings block the phase. Accept/reject each genuine `SG-###` explicitly; never
      relabel a defect to defer it. Write one row per original ID, fix commit/working-tree diff, regression
      command, verification result, and terminal disposition to
      `plans/in-progress/lms-user/evidence/phase-5/api-quality/finding-lifecycle.md`; any open row blocks this checkbox and reopens
      the operation's Phase 2/3 owner.
- [ ] [AI] **Owner: UI gate integrator; static UI lifecycle.** Run the bounded `repo-governance/workflows/ui/ui-quality-gate.md` in `mode: strict` over every
      new LMS web route, auth/session component, style, story, responsive state, and shared-primitive call
      site. Invoke `.claude/agents/swe/swe-ui-checker.md` once for all seven static dimensions. If it
      reports in-threshold findings, invoke `.claude/agents/swe/swe-ui-fixer.md` once for revalidated
      high-confidence fixes, preserve false-positive/below-threshold dispositions, then invoke the checker
      once in scoped verification. Record report paths, original IDs, affected components, lifecycle
      evidence, and final status at `plans/in-progress/lms-user/evidence/phase-5/ui-quality/`; `partial`, `fail`, pending lifecycle
      evidence, or an unresolved original finding blocks the phase and routes to Phase 3 UI ownership.
- [ ] [AI] **Owner: live-test integrator; sequential tester run.** After visual sign-off, execute the Rule-15 in-place delivery variant described by
      `repo-governance/workflows/web/web-ux-test-fixing-planning.md` sequentially against `/learning`,
      sign-in start/callback/result, personal/company context, switch, both logout modes, error/loading/
      empty, and dependency-unavailable states. Invoke `.claude/agents/web/web-exploratory-tester.md`
      first with canonical specs, `.claude/agents/web/web-usability-tester.md` second and spec-blind, and
      `.claude/agents/web/web-design-tester.md` third with selected mockups, runtime tokens, and shared
      primitives. Every call uses `output-mode: delivery`, this plan path, all supported locales,
      breakpoints 320, 375, 768, 1024, 1280, and 1440 CSS px, the recurrence-class list, and changed-
      surface list. Save the three exact invocation packets and reports under
      `plans/in-progress/lms-user/evidence/phase-5/live-testers/{exploratory,usability,design}/`. Acceptance: each tester completes in
      order against the same candidate HEAD and stack; missing input, sampled-only coverage, or nonterminal
      status stops before the next tester and routes to the failing tester owner.
- [ ] [AI] **Owner: live-test integrator; coverage reconciliation.** Reconcile the three live coverage maps into one control × route/state × locale × breakpoint ×
      personal/company/error matrix. Exercise or explicitly explain every cell, declared invariant,
      recurrence class, and changed surface. Append every `EWT-###`, `UWT-###`, and `DWT-###` as an
      unchecked task; fix with a reproducing test where behavioral, retest the affected live journey,
      and tick only with sanitized evidence. Explicitly accept/reject `SG-###` and `USS-###`. A missing
      tester, sampled matrix, unresolved finding, fallback identity, token/tenant leak, console/
      accessibility/design regression, or unexplained gap blocks archival. Store every matrix cell,
      finding ID, fix/regression command, retest result, and accepted/rejected proposal at
      `plans/in-progress/lms-user/evidence/phase-5/live-testers/coverage-and-findings.md`; an incomplete/open row reopens its Phase 3
      or Phase 4 owner.
- [ ] [AI] **Owner: quality integrator; complete automated gate.** Run the exact commands below and save
      command, exit, report path, and candidate HEAD at `plans/in-progress/lms-user/evidence/phase-5/quality-gate.txt`:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t build --projects=ose-lms-be,ose-lms-app-web,ose-id-be,ose-id-web
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t typecheck,lint,test:quick,test:coverage:behaviour --projects=ose-lms-be,ose-lms-be-e2e,ose-lms-app-web,ose-lms-app-web-e2e,ose-id-be,ose-id-be-e2e,ose-id-web,ose-id-web-e2e
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run-many -t test:integration,test:e2e -p ose-lms-be,ose-lms-be-e2e,ose-lms-app-web,ose-lms-app-web-e2e
rtk ./hippo run --class ephemeral --disk-path . -- npm exec nx -- run-many -t test:coverage:unit -p ose-lms-be,ose-lms-app-web
rtk ./hippo run --class transactional --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push
```

Acceptance: exit 0 and the Unit report is at least 99% authored production-line coverage for each
changed app. Fix every failure at root cause; affected-project commands supplement rather than replace
this gate. Any nonzero command or sub-99% report reopens its earliest RED/GREEN/REFACTOR packet and
requires this complete block at the new HEAD.

- [ ] [AI] **Owner: security integrator; diff/evidence leak scan.** Run
      `rtk git diff --check` and
      `rtk rg -n -i "client[_-]?secret|access[_-]?token|refresh[_-]?token|private[_-]?key|password|trusted[_-]?header|debug[_-]?principal|localStorage|sessionStorage|skip|retry|sleep|coverage ignore" plans/in-progress/lms-user/evidence apps/ose-lms-be apps/ose-lms-be-e2e apps/ose-lms-app-web apps/ose-lms-app-web-e2e specs/apps/ose/lms-be specs/apps/ose/lms-app-web`.
      Classify every match by exact path/line at `plans/in-progress/lms-user/evidence/phase-5/security-scan.md`. Acceptance: diff check
      exits 0 and every match is a safe test/name/redacted placeholder or is removed at its producing
      packet; any secret/private value is deleted from ignored evidence, rotated if real, and blocks delivery.
- [ ] [AI] **Owner: root integrator; preliminary execution audit.** Invoke
      `.claude/agents/plan/plan-execution-checker.md` against this exact plan, BRD/PRD, both tech docs,
      file-impact ledger, all TDD/E2E/manual/absence/cleanup evidence, and knowledge requirements at the
      candidate HEAD. Save the report path, finding IDs, head SHA, and status at
      `plans/in-progress/lms-user/evidence/phase-5/plan-execution-audit.md`. Acceptance: terminal PASS with every validated finding
      resolved and rechecked; any gap reopens its earliest responsible phase because checked boxes are not proof.

### Phase 5 Gate

- [ ] [AI] **Owner: root integrator; Phase 5 gate.** Run
      `rtk ./hippo run --class transactional --disk-path . -- apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`,
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:assert-clean`,
      and `rtk git rev-parse --verify HEAD`; write all API/UI/live/security/audit lifecycle links and exact
      HEAD to `plans/in-progress/lms-user/evidence/phase-5/gate-summary.md`. Acceptance: commands exit 0 and no unresolved behavior,
      security, tenant, API/UI, documentation, test, cleanup, dependency, or plan finding remains. A stale
      head or open record reopens its owner and invalidates this gate.

> **Pause Safety:** candidate is ready for knowledge capture, archival, and authorized delivery.

---

## Phase 6: Knowledge Capture, Archival, Delivery, and Cleanup

**Input:** Phase 5 PASS and complete authorized diff.

**Outcome:** learning entries are terminal, plan archives with DU1, exact-head PR gates pass, and landed
resources are cleaned without a second tracked delivery.

**Proof:** terminal learning disposition and archive/index validation under
`plans/in-progress/lms-user/evidence/phase-6/knowledge-and-archive/`; reviewed head/base/PR identifiers,
clean leak review, semantic review, API/UI gate reports, and merge SHA under `plans/in-progress/lms-user/evidence/phase-6/delivery/`;
terminal execution audit against the merge on `origin/main` under `plans/in-progress/lms-user/evidence/phase-6/terminal-audit/`; and
final worktree/local/remote branch inventory under `plans/in-progress/lms-user/evidence/phase-6/cleanup/`. Any absent, stale-head,
partial, failing, or unverified artifact blocks the Phase 6 gate and keeps the plan in progress.

- [ ] [AI] **Owner: documentation integrator; learning disposition.** Read
      `plans/in-progress/lms-user/learnings.md`, classify every entry through durability, sensitivity, and
      public-repository relevance, and write destination/reported/discarded plus rationale beside each
      entry. Run `rtk rg -n "pending|TODO|TBD" plans/in-progress/lms-user/learnings.md` and
      `rtk ./hippo run --class ephemeral --disk-path . -- npm exec prettier -- --check plans/in-progress/lms-user/learnings.md`;
      save exits and destination links at `plans/in-progress/lms-user/evidence/phase-6/knowledge-and-archive/learnings.md`.
      Acceptance: formatting exits 0 and the search has no unresolved entry; a durable item without one
      canonical destination blocks archival and returns to this packet.
- [ ] [AI] **Owner: root integrator; archive-in-PR.** After the Phase 5 audit passes, run
      `completion_date="$(rtk date +%F)"`, then
      `rtk mv plans/in-progress/lms-user "plans/done/${completion_date}__lms-user"`; update only
      `plans/in-progress/README.md`, `plans/done/README.md`, and links that the move breaks. From the
      archived path run `rtk apps/rhino-cli/scripts/rhino-bin.sh plan validate`,
      `rtk apps/rhino-cli/scripts/rhino-bin.sh md links validate plans`, and
      `rtk apps/rhino-cli/scripts/rhino-bin.sh md mermaid validate "plans/done/${completion_date}__lms-user"`.
      Record date, changed paths, commands, exits, and archive path at
      `plans/in-progress/lms-user/evidence/phase-6/knowledge-and-archive/archive.md` before the move and in the PR body afterward.
      Acceptance: one dated archive exists, no in-progress copy remains, and all commands exit 0; any
      collision/broken link/validation failure stops before staging and returns to this packet.
- [ ] [AI] **Owner: root integrator; authorized Git delivery preparation.** Do not stage, commit, push,
      open a PR, or merge until the user explicitly authorizes that named action. Once authorized, run
      `rtk git status --short`, `rtk git diff --check`, and the complete Phase 5 quality block; create the
      fewest build-valid Conventional Commits and one LMS PR containing only DU1. Record authorization,
      commit SHAs, changed-path inventory, PR URL, and command exits at
      `plans/in-progress/lms-user/evidence/phase-6/delivery/git-delivery.md`. Unexpected OSE ID platform or production-infrastructure
      paths stop before push and return to file-boundary reconciliation.
- [ ] [AI] **Owner: review integrator; exact-head review gates.** At the pushed PR head, record
      `rtk git rev-parse HEAD` and require the exact-head/base quality gate, one clean leak review,
      applicable API/UI gate lifecycle records, plus semantic reviews from
      `.claude/agents/pr-review/pr-review-security-maker.md`,
      `.claude/agents/pr-review/pr-review-logic-maker.md`, and
      `.claude/agents/pr-review/pr-review-integrity-maker.md`. Store head/base SHA, run/report links,
      original finding IDs, resolutions, and terminal status at
      `plans/in-progress/lms-user/evidence/phase-6/delivery/review-gates.md`. Acceptance: every required check/review is terminal PASS
      for the same head and no conversation is unresolved; any fix changes HEAD and reruns this packet.
- [ ] [AI] **Owner: root integrator; reviewed-head merge and containment.** Merge only the reviewed head
      after the repository PR Merge Protocol preconditions hold. Immediately before merge set
      `reviewed_head="$(rtk git rev-parse HEAD)"`; after merge run `rtk git fetch origin`,
      `rtk git merge-base --is-ancestor "$reviewed_head" origin/main`, and
      `rtk git log -1 --format='%H %P %s' origin/main` in the same shell; record reviewed head, merge SHA, containment exit,
      and timestamp at `plans/in-progress/lms-user/evidence/phase-6/delivery/merge-containment.md`. Invoke
      `.claude/agents/plan/plan-execution-checker.md` against that delivered merge and store its terminal
      report at `plans/in-progress/lms-user/evidence/phase-6/terminal-audit/`. A non-contained head or non-PASS audit blocks cleanup
      and reopens the earliest responsible packet; no head other than that captured immediately before
      merge is admissible.
- [ ] [AI] **Owner: root integrator; worktree and branch cleanup.** From the repository root run
      `rtk git worktree list --porcelain`, `rtk git -C worktrees/lms-user status --short`, and the branch
      containment checks from the repository branch-cleanup runbook. Only after clean delivery and
      terminal audit, remove the exact path with `rtk git worktree remove worktrees/lms-user`, delete only
      a branch classified delivered/unused by that runbook, and run `rtk git worktree prune`. Save before/
      after worktree, local-branch, remote-branch, and containment inventories at
      `plans/in-progress/lms-user/evidence/phase-6/cleanup/final-inventory.md`. Dirty/ambiguous/retained branches or any owned runtime
      resource block removal; never use force and never create a post-merge plan-only commit.

### Phase 6 Gate

- [ ] [AI] **Owner: root integrator; Phase 6 terminal gate.** Run `rtk git fetch origin`,
      `rtk git worktree list --porcelain`, `rtk git branch --list`,
      `rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-lms-app-web-e2e:assert-clean`
      from a retained repository checkout, and verify the delivered terminal-audit report. Store command
      exits, merge containment, archive/index path, audit status, and absence inventories at
      `plans/in-progress/lms-user/evidence/phase-6/cleanup/terminal-gate.md`. Acceptance: LMS OIDC integration and archived plan are
      on `origin/main`, terminal audit is PASS, no plan-owned worktree/branch/resource remains, and no
      credential authority or production identity infrastructure was introduced; any mismatch reopens
      the owning Phase 6 packet.

> **Pause Safety:** the LMS integration has reached its terminal state.
