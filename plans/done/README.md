# Completed Plans

Archived plans and completed project planning documents.

> **2026-07-29: Sibling repository renamed from `ose-infra` to the private sibling.** Archived plan
> bodies below deliberately retain the old `ose-infra` name — they are a historical record of what
> was true when each plan executed, not live documentation. GitHub's permanent redirect from the
> old repository name keeps every existing link, clone URL, and bookmark working.

## Completed Projects

- [2026-09-21: ferret-init-01-local-cli](./2026-09-21__ferret-init-01-local-cli/README.md) —
  Shipped FERRET's standalone local CLI: a standard-library-only Python 3.14 zipapp with twelve
  commands over a private per-user SQLite store, plus a dedicated E2E project, six feature files
  and 38 scenarios, and hand-authored lifecycle registrations for Claude Code, Codex, and
  OpenCode. Metadata only — no prompt, response, tool argument, transcript, or environment value
  is stored, workspace and session identifiers are HMAC-derived, and the capture hook writes
  nothing and always exits 0 so a harness is never disturbed. Delivered `worktree-to-pr`: Phases 0 to 6 in
  this commit, with Phases 7 and 8 recorded in the closure pull request that follows the merge.
  Iron Rule 3 turned up five pre-existing defects on `main`, each fixed at its root
  in its own commit ahead of the feature commit; the last of them blocked every commit that
  staged a Python file, because the pre-commit formatter mutator wrote a `ruff` cache outside the
  paths it had been given. The candidate commit was rebuilt repeatedly, each
  time because something independent found a defect rather than because the delivery changed its
  mind: an audit found six mount-table literals in a unit fixture matching the public-safety gate's
  maintainer-path and internal-hostname shapes, which the Phase 5 gate had missed only because those
  files were still untracked when it ran; CI found two defects in this repository's own quality-gate
  lanes; a leak review found a per-user temporary-directory root left in four captured transcripts;
  and two further audits found defects in the delivery record itself, from a missing worktree
  declaration to an orphaned product-requirements fragment. The external candidate record carries
  every round with its cause.

- [2026-09-17: ose-id-init-01-foundation](./2026-09-17__ose-id-init-01-foundation/README.md) —
  Shipped `ose-id`'s local foundation: four registered Nx projects (`ose-id-be`, `ose-id-be-e2e`,
  `ose-id-web`, `ose-id-web-e2e`), an ASP.NET Core backend, a Next.js web shell, PostgreSQL schema
  ownership via EF Core migrations, health/readiness contracts, and one deterministic local
  multi-instance runner — no account, sign-in, OIDC, company, or product authorization behavior yet.
  Delivered `worktree-to-pr` across eight phases; the feature work landed on `main` as the
  `ose-public#539` squash merge `a585f5b3c`, and the terminal plan-execution audit closed in
  `ose-public#542` (`e36dfb616`). The
  local-stack runner needed nine separate concurrency/signal-delivery defects found and fixed at
  root cause before it was reliable under repeated real-process starts and stops: eight were
  PostgreSQL container/port races, and the ninth was a deeper platform defect — Volta's `node` shim
  on `PATH` does not exec-replace itself with the pinned interpreter, so a programmatic single-PID
  `SIGTERM` reached only the shim and silently orphaned the real interpreter and everything it owned;
  fixed by resolving the pinned interpreter's real path and signalling the process group it leads. A
  three-agent live-UX-tester triad (design, exploratory, usability) ran against the web shell and
  filed eight findings, all triaged before delivery.

- [2026-09-09: lms-init](./2026-09-09__lms-init/README.md) — Taught the monorepo Java, then shipped
  `ose-lms-be` (Java 25 + Spring Boot, health and hello endpoints, Actuator exposed to health only)
  and its `ose-lms-be-e2e` Playwright-BDD suite on that lane. Four delivery units, five PRs:
  `ose-public#487`, `#491`, `#493`, `#495`, `#503`, plus the parity counterpart `<private-sibling>#167`.
  Java was provisioned from nothing, and the work surfaced a general shape worth remembering:
  teaching a validator to _read_ a language is not the same as _enabling_ it, because the
  enforcement machinery encodes closed per-language lists in several other places — a JaCoCo
  coverage threshold the contract could not parse, and a `RUNTIME_RUNNER` list with no Gradle form,
  were both found by running the project config through the validator before writing it. Six
  defects were fixed at their root rather than worked around, including a Spotless failure caused
  by the Gradle daemon JVM rather than the declared toolchain, a `specs-structure` CI job racing
  itself over one shared dotnet project, and a `package-lock.json` missing its new workspace entry
  — invisible locally, fatal under `npm ci`. One pre-push failure signature was never reproduced
  across ten forced runs and is recorded as **open and unexplained** rather than retried into
  green.

- [2026-09-09: islamic-be-init](./2026-09-09__islamic-be-init/README.md) — Taught the monorepo Go,
  then shipped `islamic-be` (Go 1.26 + Gin, health endpoint) and its `islamic-be-e2e` Playwright-BDD
  suite on that lane. Six delivery units, six PRs: `ose-public#496`–`#501` plus the parity
  counterpart `<private-sibling>#169`. Both projects were later renamed to `roots-be` and
  `roots-be-e2e`; this record keeps the names in force at the time it was written.
  Go was **half-provisioned** at the start — `Brewfile`, the `gofmt`
  gate pair, and a `TestCoverage.Format.Go` arm had all survived the deletion of the last Go
  project, while the CI job, the binding extractor, the coverage-threshold arm, the tag vocabulary,
  and the env scanner had not — so a `lang: go` value read as supported and was in fact routed into
  four other languages' jobs by their exclusion-based selectors. Five plan defects were found and
  fixed during execution rather than worked around, the most serious being that the specified
  two-regex Go env scanner returns **zero** keys against a codebase that injects `os.LookupEnv` as a
  function value: the natural remedy would have been an `allowlist:` entry silencing a correct drift
  detector on a variable that is genuinely read. It was fixed in both halves instead — a third regex
  mirroring the existing F# reader-wrapper form, and a `ResolvePort` signature that keeps the key
  literal at the composition root. Knowledge Capture routed nine learnings into eight
  `repo-governance/` files — among them the rule that a declaration belongs to the delivery unit
  that makes it resolvable, that Nx's flaky-task label does not establish the flake rule's
  antecedent, that a new test harness needs its own demonstrated red, and that concurrent agents
  sharing one scratchpad filename can corrupt a merge precondition — and reported seventeen more
  without plan authorization, with handoff evidence. Eight phases. Delivery Mode: `worktree-to-pr`.
  Started 2026-09-07.

- [2026-09-04: update-tmp-folders](./2026-09-04__update-tmp-folders/README.md) — Re-founded the
  `local-tmp/` vs `generated-reports/` split on **who the artifact is for** rather than **what shape
  it has**, then propagated that definition across every rule, agent, skill, harness mirror, and the
  one code path that hardcoded a temporary directory, in both `ose-public` and the private sibling. The
  old type-based wording sent every machine-authored audit into the folder a maintainer reads as
  their outbox: 471 entries in `ose-public` and 96 in the private sibling at authoring time, against 7 and
  22 in the scratch folder. Agent working state now lands in `local-tmp/<agent-family>/`, so 23
  the private sibling checker/fixer agents and their `ose-public` counterparts each gained an explicit
  report family, and `rhino-cli` now reads its false-positive ledger from
  `local-tmp/.known-false-positives.md`. Four PRs merged — `ose-public#473`, `#474`,
  `<private-sibling>#155`, `#156`. Three findings are worth carrying forward. A count is not an inventory:
  `ose-public`'s legacy folder was swept with only a total recorded, so whether it held the
  `.execution-chain-*` files later found in the private sibling can no longer be established — sweeping
  was still right, because a stale chain carried forward would give a future report false
  parentage. The plan's own premise that every legacy artifact was untracked was false: three
  `generated-reports/plan__*__audit.md` files were tracked on `main` despite being gitignored, and
  had to be deleted deliberately. And the plan's `rules-propagation` step asked for a GPG asymmetry
  between the repositories that does not exist — recorded as a plan defect rather than silently
  ticked. Seven phases. Delivery Mode: `worktree-to-pr`, one worktree per repository. Started
  2026-09-04.

- [2026-09-04: scaffold-plan-archival-cleanup](./2026-09-04__scaffold-plan-archival-cleanup/README.md) —
  Made the plan-authoring template emit the three archival cleanup steps the governance layer
  already required — classify the `Delivery Branch Inventory`, remove the worktree, complete branch
  cleanup — in that order, and taught `plan-checker` to flag a worktree-mode plan that omits or
  misorders them, with a matching `plan-fixer` repair recipe. The obligation was never missing; only
  its scaffolding and detection were, so authored plans silently skipped it. Landed in both
  `ose-public` and the private sibling from a single-sourced plan folder. Five validation iterations
  hardened the rule itself: a one-directional heading match, a classification step that dropped the
  `escalated` outcome, an exemption that wrongly excused `main-to-pr` from branch cleanup, and a
  live plan that removed its worktree before classifying the inventory were each found and fixed
  before landing. Four phases. Delivery Mode: `worktree-to-pr`, one worktree per repository.
  Started 2026-09-04.

- [2026-09-04: adopt-beavernest-test-automation](./2026-09-04__adopt-beavernest-test-automation/README.md) —
  Adopted BeaverNest-derived test-contract discipline across `ose-public` and the private sibling: an
  enforced unit/integration/E2E ownership registry, native 99% line-coverage and exact 100%
  Gherkin/BDD coverage gates, a logical `specs/` and C4 structure, direct `project.json` commands
  in place of proxy manifests, and full retirement of the Rhino/OSE DDD engineering-spec tooling
  the prior contract depended on. Twenty-two phases, single-sourced in `ose-public` and delivered
  to both repos from matching worktrees. The terminal end-to-end completeness audit
  (`AC-TEST-09`) found one genuine cross-repo parity gap — `TestContractProject.fs` had drifted
  184 lines stale in the private sibling — and it was fully reconciled rather than deferred
  (`<private-sibling>#150`), overriding this plan's own earlier "port the fix only, don't reconcile
  drift" precedent because the terminal audit is precisely the sanctioned place for full
  reconciliation and the diff carried no private-sibling-unique logic at risk. Delivery Mode:
  `worktree-to-pr`, one worktree and one PR per repository per delivery unit. Started 2026-08-31.

- [2026-08-30: rewrite-rhino-cli-to-fsharp](./2026-08-30__rewrite-rhino-cli-to-fsharp/README.md) —
  Replaced the Rust `rhino-cli` with a behavior-equivalent F# implementation across all 13
  namespaces and 525 Gherkin scenarios, namespace by namespace behind a dispatch shim, then retired
  the Rust crate and tore down the Rust CI surface. Landed in both `ose-public` and the private sibling
  from a single-sourced plan folder. Thirteen phases, six waves. Started 2026-08-25.

- [2026-08-25: optimize-pr-process](./2026-08-25__optimize-pr-process/README.md) — Improved
  human-readable PR descriptions, review conversations, bounded convergence, and public/private
  semantic "sync" through traceable native PR artifacts. Delivery Mode: `worktree-to-pr`.

- [2026-08-21: repository-onboarding-readme-refresh](./2026-08-21__repository-onboarding-readme-refresh/README.md) —
  Refreshed the reader-facing entry points of `ose-public` — root README, `CONTRIBUTING.md`, the
  setup guide, the getting-started tutorial, and the related-repositories reference — against a
  written fact map, a twelve-clause voice contract, and a disposition ledger covering every
  tracked Markdown file in the repository — 9,299 of them at the archival commit. Proved the documented first-run path from clean checkouts on both
  supported platforms (macOS natively, Ubuntu 24.04 in a disposable container) and corrected what
  those journeys exposed. Applied the recorded GitHub About metadata and verified exact equality
  rather than assuming the write landed. Five PRs merged: `ose-public#236`, `#237`, `#238`, `#239`,
  `#240`. Two things are worth carrying forward. First, the reconciliation phase needed nine
  factual-accuracy rounds and seven voice rounds to terminate, producing corrections `C-06` through
  `C-97`; the later rounds kept finding defects the plan's own repairs had introduced, which is why
  one correction was deliberately made subtractive and both review lenses were then run against the
  same state concurrently instead of alternating. Second, `P8-005`'s acceptance clause could not be
  satisfied as written — 19 of the 23 changed paths fall outside "only sanitized plan, evidence, and
  learning paths" because two other clauses require them — and that is recorded as a stated
  deviation rather than reinterpreted away. Fourteen learnings were captured; two routed to backlog
  plans and six folded into existing idea briefs, with no new idea file created. Delivery Mode:
  `worktree-to-pr`.

- [2026-08-20: update-harness-support](./2026-08-20__update-harness-support/README.md) — Reduced
  supported coding-agent harnesses from eleven to three (Claude Code, OpenCode, OpenAI Codex CLI),
  raised Codex to generated parity, adopted `.agents/skills/` as a cross-vendor skill surface, and
  generated the platform-bindings catalog from `repo-config.yml` so the published table can no
  longer drift from the registry. Gave every binding file a declared ownership class — `source`,
  `generated`, or `vendored` — enforced by the new `harness-ownership` and `harness-catalog` gates,
  and added `harness sync triage` so a hand-edited mirror is classified by content rather than
  guessed at. Automated external-drift detection (a freshness gate) was considered and deliberately
  not shipped; re-verification against upstream stays manual and on-demand. One assertion is
  recorded BLOCKED rather than passed: codex-cli 0.146.0 exposes no non-interactive way to
  enumerate `[agents]` entries, and running `codex exec` unattended under
  `filesystem unrestricted · network enabled · approval Never` was judged an unsafe way to satisfy
  a checklist. Delivery Mode: `worktree-to-pr`, one worktree and one PR per repository
  (`ose-public#232`, `<private-sibling>#56`).

- [2026-08-18: repo-rules-sweep](./2026-08-18__repo-rules-sweep/README.md) — Settled what a leading
  `NN-` ordinal means in a governed filename: it survives only when the file is a real step in an
  ordered sequence and the ordinal is that step's own number. Stripped the rest — 2092 files across
  176 numbered directories in `ose-public`, 1905 files and 8 directories in the private sibling — after
  making `readme-index generate` order-preserving and adding a `rewrite-paths` mode so no annotated
  index lost its order or its annotations. Withdrew two filename rules that inspected a single
  basename token against a closed vocabulary without ever reading the file (`harness naming validate`,
  `repo-governance workflows naming validate`), with their gate entries, Gherkin, and fixtures.
  Realigned three rules whose enforcement misfired, including publishing the word-budget gate's
  exclude list as part of the rule. The two repositories' outcomes differ on purpose: 46 numbered
  paths remain in the private sibling against 8 here, because 40 files there have fixed-width truncated
  stems whose ordinal is their only disambiguator. Delivery Mode: `worktree-to-pr`, one worktree and
  one PR per repository.

- [2026-08-18: repo-clean-up](./2026-08-18__repo-clean-up/README.md) — Retired the dormant
  `ayokoding-cli` and `ose-cli` link-checkers, their orphaned `rust-commons` library, their spec
  trees, and the empty `beavernest-app-web` shell, then corrected every surface that documented
  them. Closed the coverage gap underneath: the `md-links` gate had excluded
  `apps/ayokoding-www/content` and `apps/ose-www/content` on the belief those CLIs covered them,
  so both trees were checked by nothing. Arming cost exactly one broken link, and a negative test
  records the gate failing and recovering on both trees. Delivery Mode: `worktree-to-pr`, one
  worktree and one PR.

- [2026-08-15: optimize-governance-md](./2026-08-15__optimize-governance-md/README.md) — Capped
  every governance Markdown file at 500 words (900 for README.md) across `ose-public` and
  the private sibling, enforced via two new rhino-cli gates (`governance word-budget validate`,
  `governance readme-index validate`) armed on `pre-push` and `ci`. Split every oversized file
  under `repo-governance/`, `.claude/agents/`, `.claude/skills/`, and root instruction files into
  progressive-disclosure children with annotated README indexes; flipped `md-frontmatter`'s
  `description` field from WARN to FAIL for governance docs. Delivered by PR1-PR17 across both
  repos. The `ose-primer` parity follow-up was retired on 2026-08-16 when that repo left the parity
  set entirely.

- [2026-08-16: ayokoding-learning-path-18-skills-erp-enterprise-depth](./2026-08-16__ayokoding-learning-path-18-skills-erp-enterprise-depth/README.md) —
  Added fifteen enterprise-depth and Sharia-compliant ERP courses, completed the conventional and
  Sharia ERP manifests at 27 and 30 courses, and published terminal path landings. Delivery Mode:
  `worktree-to-pr`; terminal delivery is recorded by this plan's sole archival PR.

- [2026-08-16: ayokoding-learning-path-17-skills-erp-foundations](./2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/README.md) —
  Added fifteen Stage-A ERP foundations and two matching deployable fifteen-course ERP paths. Delivery
  Mode: `worktree-to-pr`; terminal delivery is recorded by this plan's sole archival PR.

- [2026-08-16: ayokoding-learning-path-16-skills-accounting-sharia-extension](./2026-08-16__ayokoding-learning-path-16-skills-accounting-sharia-extension/README.md) —
  Added five Sharia accounting courses, grew only the Sharia accounting manifest to its terminal
  twenty-four courses, and completed the accounting corpus. Delivery Mode: `worktree-to-pr`; terminal
  delivery is recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-15-skills-accounting-enterprise-reporting](./2026-08-15__ayokoding-learning-path-15-skills-accounting-enterprise-reporting/README.md) —
  Added eight enterprise-reporting and accounting-architecture courses, grew both shared accounting
  manifests to nineteen courses, and completed the conventional-accounting path. Delivery Mode:
  `worktree-to-pr`; terminal delivery is recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-14-skills-accounting-foundations](./2026-08-15__ayokoding-learning-path-14-skills-accounting-foundations/README.md) —
  Added eleven accounting foundation and transactional-cycle courses, both shared accounting manifests,
  path landings, and manifest-composition coverage. Delivery Mode: `worktree-to-pr`; terminal delivery
  is recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-13-careers-ai-manifest](./2026-08-15__ayokoding-learning-path-13-careers-ai-manifest/README.md) —
  Added the `careers/immediately-effective/ai-engineer` manifest, landing anchor, generated hub entry,
  and prerequisite-order regression coverage. Delivery Mode: `worktree-to-pr`; terminal delivery is
  recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-12-careers-se-manifests](./2026-08-15__ayokoding-learning-path-12-careers-se-manifests/README.md) —
  Added the three `software-engineer`-role careers manifests, their landing anchors, generated hub entries,
  and prerequisite-order regression coverage. Delivery Mode: `worktree-to-pr`; terminal delivery is recorded
  by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-11-course-authoring-capstones](./2026-08-15__ayokoding-learning-path-11-course-authoring-capstones/README.md) —
  Authored and Playwright-verified eight Band-8 synthesis capstone course bodies. Delivery Mode:
  `worktree-to-pr`; terminal delivery is recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-10-course-authoring-jvm-and-build-your-own](./2026-08-15__ayokoding-learning-path-10-course-authoring-jvm-and-build-your-own/README.md) —
  Authored and Playwright-verified nine JVM, advanced-language, compiler, and build-your-own internals
  course bodies. Delivery Mode: `worktree-to-pr`; terminal delivery is recorded by this plan's sole
  archival PR.

- [2026-08-15: ayokoding-learning-path-09-course-authoring-interview-technique](./2026-08-15__ayokoding-learning-path-09-course-authoring-interview-technique/README.md) —
  Authored and Playwright-verified five English interview-technique course bodies and their capstone.
  Delivery Mode: `worktree-to-pr`; terminal delivery is recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-08-course-authoring-security-and-ops](./2026-08-15__ayokoding-learning-path-08-course-authoring-security-and-ops/README.md) —
  Authored and live-verified eleven English security, operations, and delivery course bodies.
  Delivery Mode: `worktree-to-pr`; terminal delivery is recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-07-course-authoring-low-level-systems](./2026-08-15__ayokoding-learning-path-07-course-authoring-low-level-systems/README.md) —
  Authored and live-verified seven English low-level systems course bodies. Delivery Mode:
  `worktree-to-pr`; terminal delivery is recorded by this plan's sole archival PR.

- [2026-08-15: ayokoding-learning-path-06-course-authoring-architecture-and-ai-harness](./2026-08-15__ayokoding-learning-path-06-course-authoring-architecture-and-ai-harness/README.md) —
  Authored and live-verified 15 English course bodies for architecture, distributed systems, and the
  AI/agent-harness cluster. Delivery Mode: `worktree-to-pr`; terminal delivery is recorded by this
  plan's sole archival PR.

- [2026-08-13: beaver-flutter](./2026-08-13__beaver-flutter/README.md) — Replaced the BeaverNest
  Vite/React client with a responsive same-origin Flutter Web client, safe diagnostics, and a
  non-root combined runtime. Delivered by PRs #182 and #183.

- [2026-08-11: pr-review-rule-convergence](./2026-08-11__pr-review-rule-convergence/README.md) —
  Replaced universal fixed-cycle PR review with behavior-based routing: executable behavior receives
  a maximum seven-cycle, early-clean review loop; static prose uses the named quality workflow.
  Documented full reachable-history secret remediation, patient runner contention, AI-only delivery,
  immediate exact-worktree cleanup, and public/private portable-policy parity. Delivered by public
  PR #171, a plan-local private direct push, Primer PR #35, and Primer plan-retrofit PR #36.

- [2026-08-11: beaver-nest-repo-consolidation](./2026-08-11__beaver-nest-repo-consolidation/README.md) —
  Consolidated BeaverNest into `ose-public` as `apps/beavernest-be` and
  `apps/beavernest-app-web`, swept the three surviving repositories, and archived
  `wahidyankf/beaver-nest`. Delivery Mode: `worktree-to-pr`; terminal retirement PR:
  [beaver-nest#4](https://github.com/wahidyankf/beaver-nest/pull/4).
  **Reversed 2026-08-21** — see the BeaverNest note below.

- [2026-08-10: beavernest-app-setup](./2026-08-10__beavernest-app-setup/README.md) — **Closed
  delivered-as-descoped.** Carried from `beaver-nest`'s stalled in-progress plan (72.5% complete,
  279/385 checkboxes) by the `beaver-nest-repo-consolidation` plan's Phase 4. Shipped: generalized
  governance real-database testing rules, the SQLite + DbUp migration + recovery backend and
  readiness contract, and the Vite client-side-rendered SPA migration with the combined same-origin
  Compose runtime. Did not ship: human runtime attestation, Knowledge Capture, and archival — Phases
  4-6 had already reached `beaver-nest`'s `main` by direct push before the plan stalled, so no PR #3
  ever opened and its review cycles never ran.

> **BeaverNest left this repository on 2026-08-21.** The three plans above (`beaver-flutter`,
> `beaver-nest-repo-consolidation`, `beavernest-app-setup`) describe work that really happened here
> and are kept as a record, but they no longer describe the repository. The product was moved to
> [`wahidyankf/beaver-nest`](https://github.com/wahidyankf/beaver-nest) and rebuilt on Phoenix
> LiveView and Elixir; the `beavernest-*` apps, their specs, dev stack, and deployer agents were all
> removed from `ose-public`. See
> [Related Repositories](../../docs/reference/related-repositories.md#beavernest-moved-out).

- [2026-08-09: optimize-cis](./2026-08-09__optimize-cis/README.md) —
  Cut fixed overhead from the pre-commit, pre-push, and PR-quality-gate lifecycle across the three
  parity repos: a resolver shim and `node_modules/.bin` dispatch removed the per-gate invocation tax,
  a grouped CI matrix replaced 45 serial jobs, a dedicated cargo `gate` profile plus coverage-to-CI
  cut local build cost, and the same topology propagated to `ose-primer` and the private sibling. Gate
  coverage held provably invariant throughout — 76 gate ids, byte-identical to the Phase 0 capture on
  all four surfaces. Three of nine metrics met their targets; the six misses are recorded with
  measured shortfalls in [`results.md`](./2026-08-09__optimize-cis/results.md) rather than rescoped.

- [2026-08-07: sdlc-gate-registry-enforcement](./2026-08-07__sdlc-gate-registry-enforcement/README.md) —
  Made the already-ratified Gate Composition Rule (`(pre-commit ∪ pre-push) == PR gate`) mechanically
  enforced via a `gates:` registry in `repo-config.yml` plus `rhino-cli gate list/run/validate`, and
  retired `main-ci.yml` after folding its unique checks into the PR gate. Landed across `ose-public`
  (Phase 1-2), `ose-primer` (Phase 3, PR #3), and the private sibling (Phase 4, PR #4). **Scope Amendment
  (2026-08-07)**: the enforced byte-identity boundary narrowed mid-execution from four repos to two
  (`ose-public` + the private sibling) — `beaver-nest` (Phase 5) is cancelled, not deferred, and
  `ose-primer` (Phase 3) keeps its already-merged landing but exits continuous enforcement in favor
  of periodic/manual sync. See the plan's own `learnings.md` Scope Amendment entry for the full
  rationale. Delivery Mode: `worktree-to-pr` (`ose-public`, `ose-primer`, the private sibling each as
  independent tracks). Completed 2026-08-07. Terminal delivery chain (`ose-public` Phase 6, Knowledge
  Capture/Archive): [PR #152](https://github.com/wahidyankf/ose-public/pull/152).
- [2026-08-06: pr-review-cycle-scout-and-typesafety](./2026-08-06__pr-review-cycle-scout-and-typesafety/README.md) —
  Added a `pr-review-scout-maker` pipeline stage 0 (risk-tier classification + specialist selection +
  shared-context assembly, moved off `pr-review-synthesis-maker`), a ninth `pr-review-types-maker`
  discipline for cross-language type-soundness (TypeScript/Rust/F#/C#), and a `Cycle: N of {total}`
  field plus per-specialist attribution bylines on every Consolidated Review Header. Dogfooded the new
  pipeline against its own delivering PR across all 3 scheduled review cycles (11 → 6 → 5 findings,
  severity ceiling CRITICAL → HIGH → HIGH, converging cleanly with zero regressions across the
  regression-watch disciplines). Delivery Mode: `worktree-to-pr`, four independent repo tracks
  (`ose-public`, `ose-primer`, the private sibling, `beaver-nest`); this entry records `ose-public`'s
  (Track A) completion per the archival-in-PR hard rule — the other three tracks and the shared
  Knowledge Capture/Finalize phases are tracked separately and land on their own repos' `origin/main`.
  Terminal delivery chain: [PR #139](https://github.com/wahidyankf/ose-public/pull/139).
- [2026-08-05: plan-ideas-grooming-workflow](./2026-08-05__plan-ideas-grooming-workflow/README.md) —
  Authored the `plan-ideas-grooming.md` workflow (merge/split/group two-pagers, Eisenhower-quadrant
  sorting, cross-repo relocation, rename-via-link-rewrite) plus the new `grooming` workflow-naming
  type token, and propagated both byte-identically to `ose-primer`, the private sibling, and
  `beaver-nest`. Each repo's own `rhino-cli` fork needed an independent `WORKFLOW_TYPES` fix — the
  four forks have already drifted from AGENTS.md's byte-identity claim; folded into the existing
  `tri-repo-rhino-cli-byte-identity-gate` idea. Delivery Mode: `main-to-origin-main`, direct push,
  no PR, no GitHub Actions CI check at any phase. Completed 2026-08-05.
- [2026-08-04: ayokoding-learning-path-05-course-authoring-platform-and-concurrency](./2026-08-04__ayokoding-learning-path-05-course-authoring-platform-and-concurrency/README.md) —
  Authored and verified 14 mobile/desktop-platform and concurrency-language course bodies, including
  Playwright evidence across three breakpoints, prerequisite rendering, and a zero-manifest ownership
  invariant. Delivery Mode: `worktree-to-pr`. Completed 2026-08-04. Terminal delivery chain: [PR
  #133](https://github.com/wahidyankf/ose-public/pull/133) merged, reverted by direct-push commit
  `919863f07` the same day, restored by
  [PR #136](https://github.com/wahidyankf/ose-public/pull/136); downstream use requires verifying
  PR #136 is merged, not merely that PR #133 was.
- [2026-08-02: ayokoding-learning-path-04-course-authoring](./2026-08-02__ayokoding-learning-path-04-course-authoring/README.md) —
  Authored and verified the plan's 21-course retained scope across AI engineering, data depth, and
  web/backend/platform productivity. Delivered with static-build repairs, Playwright evidence at
  desktop and mobile breakpoints, a zero-manifest ownership invariant, and terminal Knowledge Capture
  routing. Delivery Mode: `worktree-to-pr`. Completed 2026-08-02.
- [2026-08-02: vercel-function-cost-reduction](./2026-08-02__vercel-function-cost-reduction/README.md) —
  Removed the request-time causes that kept `ayokoding-www` dynamic, deleted its hot-path
  middleware, tightened tracing, converted three `wahidyankf-www` routes to static delivery, and
  removed secondary always-on work. Delivery is tracked by PRs #129, #130, and #131; production
  checks confirmed canonical redirects and CDN cache hits. The $57/mo → $2–4/mo projection remains
  explicitly unverified and is owned by the
  [steady-state successor](../ideas/q4-not-urgent-not-important/vercel-cost-steady-state-verification.md). Delivery
  Mode: `worktree-to-pr`. Completed 2026-08-02.
- [2026-08-01: ayokoding-www-ai-benchmark-responsive-overhaul](./2026-08-01__ayokoding-www-ai-benchmark-responsive-overhaul/README.md) —
  Full responsive re-look of the AI Model Benchmark page: DOM bars replace the scale-coupled SVG
  chart, the 38-model roster gains progressive disclosure behind a `model-card`, the prose preamble
  collapses below the chart, the desktop table stops making the document scroll horizontally, and
  the third capability class renames from `light` to `haiku`. Delivered across 15 phases (0-14) in
  two delivery-boundary PRs (#126 Unit 1, #128 Unit 2). Rule-15 three-tester retest filed 16
  findings (1 EWT deferred, 10 UWT, 2 USS spec-gaps, 2 DWT) — all fixed or triaged before archival.
  A 3-cycle PR-review gate on PR #128 caught a permanently-vacuous test assertion left over from the
  Phase 5 SVG-to-DOM rewrite and 7 stale `sortLight`→`sort-haiku` rename sites. Five Knowledge
  Capture learnings routed into `repo-governance/` (breakpoint-presence-vs-legibility,
  identical-DOM-vs-scaled-typography, progressive-disclosure density caution, amendment numeric
  sweeps, and capped-query undercounting). Delivery Mode: `worktree-to-pr`. Completed 2026-08-01.
- [2026-07-30: ayokoding-www-ai-benchmark-merged-chart](./2026-07-30__ayokoding-www-ai-benchmark-merged-chart/README.md) —
  Merged the AI Benchmark tool's separate capability and price charts into one per-model row with a
  per-band sort control, replacing `capability-chart.tsx` + `price-chart.tsx` with a single
  `benchmark-chart.tsx`. Delivered across Phases 1-9 in one delivery-boundary PR (#125): sort
  utilities + URL-state round-trip, the merged accessible chart component, wiring/dangling-reference
  cleanup, Gherkin scenario rewrite, i18n keys, manual Playwright verification (en/id × 3
  breakpoints), a 3-cycle PR-review gate, and a near-end Rule-15 three-tester retest that filed 7
  findings (1 EWT, 5 UWT, 1 DWT) — all fixed before archival, with UWT-001 and UWT-002 resolved via
  explicit `AskUserQuestion` dispositions where the obvious full fix would have reopened an
  already-reviewed design decision. One CI incident — a stuck self-hosted-runner `setup-node` step —
  diagnosed via step-level timestamp comparison and remediated via `gh run cancel` + `gh run rerun
--failed`; the diagnostic routed inline to the
  [CI Monitoring Convention](../../repo-governance/development/workflow/ci-monitoring.md). Delivery
  Mode: `worktree-to-pr`. Completed 2026-07-30.
- [2026-07-30: ayokoding-www-tools-ai-benchmark](./2026-07-30__ayokoding-www-tools-ai-benchmark/README.md) —
  Built a public `/tools/ai-benchmark` page comparing AI coding-tool capability and token pricing
  across Codex, Claude Code, Cursor, OpenCode Go, and OpenCode Zen models, banded into `opus` /
  `sonnet` / `light` classes. Delivered across 8 delivery-boundary PRs — #110 (design tokens), #112
  (typed dataset), #113 (governance-reference generator), #114 (pure functional core), #115 (route +
  table + i18n), #117 (capability + price charts), #118 (harness/class filters), and #122 (manual
  verification, reveal, Rule-15 retest) — plus this Phase 11-12 Knowledge Capture and archival unit.
  A live band-contrast defect (M-12) traced to Tailwind v4's `@theme` compiler silently dropping four
  custom-property declarations was fixed by moving them to a plain `:root` block; jsdom's inability
  to resolve `oklch()` through the cascade moved the corresponding contrast assertion to e2e. The
  near-end Rule-15 three-tester retest (web-design/exploratory/usability) filed 3 DWT, 4 EWT, 6 UWT,
  and 2 USS findings, every one fixed before archival. Knowledge Capture routed two backlog plans
  (`audit-e2e-reuse-existing-server-config`, `vitest-glob-coverage-guard`), one inline doc fix (a
  Tailwind `@theme` caveat on both `design-tokens.md` surfaces), and confirmed one already-inline fix
  (cmdk search `value` superset) as terminal. Delivery Mode: `worktree-to-pr`. Completed 2026-07-30.
- [2026-07-28: adopt-cursor-platform-binding](./2026-07-28__adopt-cursor-platform-binding/README.md) —
  Landed generated `.cursor/agents/` mirrors across all three repositories via `rhino-cli` Cursor
  converter with full tier collapse to `composer-2.5` (never `composer-2.5-fast`). Delivered as three
  delivery-boundary PRs — `ose-public` PR #111, `ose-primer` PR #18, `ose-infra` PR #20 — each
  flipping `repo-config.yml` cursor harness to `tier: generated` and running governance sweeps.
  Phase 5 live Cursor subagent probe matched the pinned literal. Knowledge Capture routed two backlog
  plans (`cross-repo-governance-link-parity`, `ose-infra-opencode-ci-monitor-orphan`) and discarded
  or inlined the rest. Delivery Mode: `worktree-to-pr`. Completed 2026-07-28.
- [2026-07-25: ayokoding-learning-path-03-navigation-ui](./2026-07-25__ayokoding-learning-path-03-navigation-ui/README.md) —
  **Wave 2, plan #3 of 5** in the split of the closed `shared-course-library-and-learning-paths`
  plan. Delivered the path-aware navigation UI atop plan 02's `course-paths` data layer: a 36-render
  design funnel (6 screens × 2 options × 3 viewports — Option B "Left path rail" won Screen 3),
  path-aware `PrevNext`/breadcrumb/prerequisite-list wiring, the `PathRail` (desktop) and
  `PathBanner`-triggered drawer (mobile) components as a pure content swap into the existing host
  shells, and the `path-landing`/`category-landing`/`arc-landing`/`course-path` rendering surfaces
  consuming the shared manifest. The no-path invariant (canonical course URLs render the generic
  sidebar with zero path chrome) verified at every phase boundary and re-confirmed on production with
  a committed screenshot at archival. Ran the near-end rule-15 live-site tester triad; every finding
  fixed before archival. Shipped as three delivery-boundary PRs — Phase 0-1 design funnel (PR #94,
  `e740ec998`), Phases 2-5 implementation (PR #95, `0834ac1b7`, admin-merged past a deliberately
  deferred MEDIUM finding under `required_conversation_resolution`), and this Phase 7-8
  knowledge-capture + archival unit — each PR-Review-cycled and CI-gated; deployed to
  `prod-ayokoding-www` after every merge. Knowledge Capture routed 3 learnings inline (`gh -f`/`-F`
  file-posting gotcha and zsh 1-indexed-array gotcha to `pr-review-fixer.md`; many-project
  `test:e2e`/`build` contention-flake heuristic to `plan-execution.md`) and discarded one
  already-documented non-gap (`ose-app-web-e2e`'s manual-prestep requirement). This plan owns 36 of
  DD-47's 42-render design matrix; the remaining 6 (Screen 4) belong to
  `ayokoding-learning-path-01-url-restructure`. Delivery Mode: `worktree-to-pr`. Completed 2026-07-25.
- [2026-07-24: ayokoding-learning-path-02-schema-and-prerequisite-dag](./2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/README.md) —
  **Wave 1, plan #2 of 5** in the split of the closed `shared-course-library-and-learning-paths`
  plan. Delivered the data layer of the shared-course-library architecture: the `PathManifest` zod
  schema, the six-module pure `course-paths` functional core (`schemas`, `manifest`, `path-nav`,
  `path-context`, `prerequisites`, `manifest-integrity`), the canonical `prerequisites:` frontmatter
  contract, the `<MANIFESTS>` directory, an optional-`pathId` extension to `content-url.ts`, and
  custody of the 128-file `syllabus/` corpus (with exactly one recorded content exception, the R3
  AI-engineer from-scratch correction). Shipped as three delivery-boundary PRs — Phases 1-2 (PR #91,
  `e5a7d588`), Phases 3-4 (PR #92, `44258b407`), and Phases 6-7 knowledge-capture + archival — each
  PR-Review-cycled and CI-gated; Phase 5's final-integration evidence landed as a direct `main` commit
  per its own no-PR rule. Knowledge Capture resolved one pre-existing non-gap (`ayokoding-www`'s
  `test:integration`/`test:e2e` echo stubs, per the dedicated-`*-e2e`-runner convention) and filed one
  new backlog plan, `harden-ayokoding-www-fe-e2e-bulk-link-concurrency`, for a pre-existing
  load-sensitive e2e flake unrelated to this plan's own diff. Hands off the pure core and syllabus
  corpus to `ayokoding-learning-path-03-navigation-ui`, `-04-course-authoring`, and (transitively)
  `-05-manifests`. Delivery Mode: `worktree-to-pr`. Completed 2026-07-24.
- [2026-07-23: worktree-to-pr-hardening](./2026-07-23__worktree-to-pr-hardening/README.md) —
  Hardened the `worktree-to-pr` delivery workflow by decomposing the monolithic `pr-review-maker` into
  eight specialist reviewer agents plus a mandatory `pr-review-synthesis-maker` coordinator (specialists
  are read-only finding producers; the coordinator is the sole poster of record). Added a
  reviewer-discipline convention, revised the `pr-review-quality-gate` workflow to fan-out→synthesize→fixer
  and retired the monolith at cutover, added quality-gate enhancements and a post-cutover monitoring +
  rollback trigger, and recorded a future-work workstream. Delivered as a **three-repo parity** change:
  `ose-public` (PR #88, dogfooded by its own new pipeline — the mandated third review cycle caught a real
  HIGH where specialists had over-inherited the monolith's direct-post behavior), then propagated to
  `ose-primer` (PR #17) and `ose-infra` (PR #19), each via its own `worktree-to-pr` cycle. Decisions
  D1–D15 resolved; archival deferred to this final step per D15.
- [2026-07-23: ayokoding-learning-path-01-url-restructure](./2026-07-23__ayokoding-learning-path-01-url-restructure/README.md) —
  **Wave 1** of the ayokoding learning-path programme. Removed the `/c/` namespace and resolved
  everything under `/en/learn` into a three-bucket IA (`paths/`, `courses/`, `legacy/`): relocated the
  six legacy top-level domains (1148 content `.md`) under `legacy/`, re-homed 37 course bundles into a
  flat `courses/` namespace with `courses/_index.md`, and seeded the five DD-49 structural `paths/**`
  indexes. Shipped the per-domain and per-course redirect tables in
  `apps/ayokoding-www/src/redirects/` with DD-42/DD-48 invariants (exact-bare rule before wildcard, no
  double-hop). Ran the near-end rule-15 live-site tester triad (EWT/UWT/DWT): fixed the two in-scope
  defects TDD — EWT-001 (per-domain legacy redirect double-308-hop, `.map`→`.flatMap` emitting an
  exact bare rule before the wildcard) and DWT-001 (breadcrumb mobile overflow, `sm:hidden` ellipsis
  collapse + `overflow-x-auto whitespace-nowrap` single-row contract) — with regression tests and
  Gherkin realignment across unit/e2e; filed every pre-existing out-of-scope finding to idea briefs
  (`ayokoding-i18n-nav-hardening`, `ayokoding-www-e2e-parallel-load-flake`) and folded the
  self-contradictory-acceptance-step learnings into `acceptance-clause-vacuity`. `id` locale untouched
  per DD-45 (53 `.md`, no `id/belajar/legacy`). Delivered via PR #87 (Phase 5) then a final archival
  PR, each PR-Review-cycled and CI-gated; deployed to `prod-ayokoding-www` (bare-path legacy redirects
  confirmed single-hop live). Delivery Mode: `worktree-to-pr`. This plan owns 6 of DD-47's 42-render
  design matrix (Screen 4 × 2 options × 3 viewports); the remaining 36 belong to
  `ayokoding-learning-path-03-navigation-ui`. Completed 2026-07-23.
- [2026-07-22: learning-plan-syllabus-folder-convention](./2026-07-22__learning-plan-syllabus-folder-convention/README.md) —
  Authored the Learning-Plan Syllabus Convention
  (`repo-governance/conventions/structure/learning-plan-syllabus.md`) — a learning-bearing trigger, a
  required `syllabus/` folder layout, a REQUIRED/RECOMMENDED/OPTIONAL section tiering derived from a
  frozen 174-course census (plan 02 = 120, plan 06 = 24, plan 07 = 30), a copy-paste course template,
  a corpus-disposition rule, and a custody rule for a shared corpus — then wired its enforcement into
  `plan-maker` / `plan-checker` (Step 5n) / `plan-fixer`, the `plan-creating-project-plans` skill, and
  the `plan-quality-gate` workflow. Added `## Corpus Disposition` + `**Custodian**` declarations to the
  three ayokoding learning-path corpora (plans 02/06/07) and `custodied-by:` consumer echoes to plans
  04/05, and filed the deferred deterministic `rhino-cli md syllabus validate` check as
  [`plans/ideas/syllabus-conformance-validator.md`](../ideas/q2-not-urgent-important/syllabus-conformance-validator.md) — a
  check follows a settled format, it does not precede it. Propagated the convention + enforcement
  across ose-public/ose-primer/ose-infra, adapted to each repo's own step numbering; the convention
  doc is **byte-identical** in all three (one `shasum`, `fa4882c36…`). Delivered via PR #82
  (ose-public), #16 (ose-primer), #18 (ose-infra); three PR-review cycles on the home PR caught two
  census off-by-ones (a "53 of 53" that should read 54) and a custody-vs-disposition framing error
  fanned across four enforcement surfaces. Knowledge Capture routed both learnings inline to the
  shipped convention. Delivery Mode: `worktree-to-pr`. Completed 2026-07-22.
- [2026-07-22: bare-repo-governance-hardening](./2026-07-22__bare-repo-governance-hardening/README.md) —
  Authored the previously-undocumented base-worktree landing method as
  `repo-governance/development/workflow/bare-repo-landing-method.md`, fixed the
  local-`main`-lags-`origin` drift it causes, and closed four bare-repo/delivery-mode governance-doc
  gaps — including the `git rev-parse --is-bare-repository` trap, now forbidden **unconditionally**
  because it answers "is _this checkout_ bare", not "is this repository bare". Carve-outs are
  **property-bound** (`core.bare=true`, "no primary checkout"), never keyed on repo names, since all
  three repos are templates. Delivered byte-identically across ose-public/ose-primer/ose-infra —
  merged via PR #79/#14/#16, then a `<C1>` correction round via PR #81/#15/#17; the landing method is
  sha1 `618e74ff8…` in all three, verified by `diff` against each sibling's `origin/main` blob
  **after fetching**. Nine PR-review cycles across five PRs each found real defects, including a
  reversal edit that silently dropped a conjunct from the one copy `pr-merge-protocol.md` designates
  normative while six derivatives kept it, and `AGENTS.md` having zero bareness carve-out despite
  being the file every harness auto-loads. Knowledge Capture routed 19 learnings; the recurring
  theme — acceptance clauses that cannot fail — became
  [`plans/ideas/acceptance-clause-vacuity.md`](../ideas/q1-urgent-important/acceptance-clause-vacuity.md), seeded by the
  terminal reconcile's own command reporting a false clean when run before `git fetch`. Delivery
  Mode: `worktree-to-pr`. Completed 2026-07-22.
- [2026-07-21: shared-course-library-and-learning-paths](./2026-07-21__shared-course-library-and-learning-paths/README.md) —
  **Closed superseded-by-split — no phase of this plan was executed.** Re-architected the
  fundamentally-strong curriculum into a shared, path-neutral course library
  (`/en/c/learn/courses/<course-id>`) consumed by converging path manifests at
  `/en/c/learn/paths/<path-id>`. The plan reached full execution-grade depth (43 bound scenarios, 45
  design decisions, a 128-file `syllabus/` corpus) but was **too wide to deliver as one PR**: its
  work splits cleanly along an ownership boundary into five independently mergeable plans, so it was
  split rather than started. Its entire scope was **transferred, not abandoned**, to the
  `ayokoding-learning-path-01..05-*` plans in [`../backlog/`](../backlog/README.md), whose `NN-`
  prefix is the execution sequence. This folder is retained as the provenance record those five
  plans cite; it is not schedulable. Superseded 2026-07-21.
- [2026-07-20: parallel-orchestration-shared-machine-governance](./2026-07-20__parallel-orchestration-shared-machine-governance/README.md) —
  Inverted the PR merge default to `[AI]`-merges-by-default (`[HUMAN]` becomes an explicit per-plan
  opt-in, preconditions identical either way), adopted the N+1 orchestration model
  (`1 main thread + N background agents`, default N=3), made the same-machine concurrent-actors
  assumption explicit, added the no-destructive-git-operations and worktree-and-artifact-cleanup
  conventions, moved `main-ci.yml` to a 4x/day schedule with no push trigger, and added
  surface-conditional tester gates with a new `repo-governance/workflows/api/` category. Merged via
  PR #78 (squash, `60d53119b`); propagated to ose-primer PR #13 and ose-infra PR #15 with
  `apps/rhino-cli` byte-identity verified across all three (643 tracked files, zero drift).
  Convergence cost 14 checker rounds plus 3 PR-review cycles and 3 verification passes, each
  surfacing a **new** blind-spot class — 15 classes catalogued, and the guard-placement lesson
  (enumeration fails open; a guard belongs at the point of entry) routed to
  `development/agents/anti-patterns.md`. Delivery Mode: `worktree-to-pr`. Completed 2026-07-20.
- [2026-07-19: rust-cargo-target-dir-sharing](./2026-07-19__rust-cargo-target-dir-sharing/README.md) —
  Rust `target/` directories were duplicated per git worktree (~32 GB observed); shares build output
  across worktrees by folding a per-crate `target/` symlink + worktree-aware cache GC into
  `rhino-cli doctor` (local-dev-only, CI-guarded). Delivered byte-identically across
  ose-public/ose-primer/ose-infra — merged via PR #77/#12/#14 (squash, 2026-07-19); post-merge
  byte-identity verified (`apps/rhino-cli` tree `178e8139…` identical ×3). No generalizable learning
  surfaced (terminal KC "none"). Delivery Mode: `worktree-to-pr`. Completed 2026-07-19.
- [2026-07-19: e2e-coverage-rule-feature-skip-fixme-gap](./2026-07-19__e2e-coverage-rule-feature-skip-fixme-gap/README.md) —
  Lifted the `rhino-cli specs e2e-coverage` gap detector's `@skip`/`@fixme` special-tag detection from
  `Scenario Outline` level to also cover `Rule:`- and `Feature:`-level tags one AST level up, closing a
  silent-undetected-scenario gap deferred from PR #66's cycle-7 review. Delivered byte-identically
  across ose-public/ose-primer/ose-infra; merged via PR #76 (`e21f7a212`). No generalizable learning
  surfaced (terminal KC "none"). Delivery Mode: `worktree-to-pr`. Completed 2026-07-19.
- [2026-07-19: fundamentally-strong-software-engineer](./2026-07-19__fundamentally-strong-software-engineer/README.md) — **Closed delivered-as-descoped.** Shipped the breadth-first relearn-and-drill section on ayokoding-www through **Passes 0–2 (Phases 0–37, topics 1–33 + capstones)** — authored, live, and deployed to production (`prod-ayokoding-www` @ `e21f7a212`, 2026-07-19). The remaining **Passes 3–5 (topics 34–94)** were **transferred, not abandoned**, to the successor plan [`shared-course-library-and-learning-paths`](./2026-07-21__shared-course-library-and-learning-paths/README.md), which re-architects the curriculum into a shared course library (`/en/c/learn/courses/<course-id>`) consumed by three converging path manifests — `interview-ready/software-engineer` (interview-first), `immediately-effective/software-engineer` (build-fast-first), and `fundamentally-strong/software-engineer` (theory-first) at `/en/c/learn/paths/<path-id>`. Delivery Mode: Phases 0–3 `main-to-origin-main`, Phases 4–37 `worktree-to-pr` (per-phase PRs, 3-cycle-reviewed, AI-auto-merged). Completed 2026-07-19.
- [2026-07-19: rhino-cli-git-root-test-fixture-race](./2026-07-19__rhino-cli-git-root-test-fixture-race/README.md) — Fix a rhino-cli git-root test fixture that escaped its tempdir under parallel/concurrent execution and corrupted the real repository's git state (stray commits, linked worktrees, overwritten local `user.*`). Root cause was a CWD race, not the originally-hypothesized unchecked-init upward discovery; the fix is defense-in-depth isolation (explicit `GIT_DIR` + `GIT_CEILING_DIRECTORIES` + nulled global/system config + pre-write escape guard), plus a new [Git Fixture Isolation Convention](../../repo-governance/development/quality/git-fixture-isolation.md). Delivered byte-identically across ose-public/ose-primer/ose-infra (Completed: 2026-07-19)
- [2026-07-18: e2e-scenario-coverage-gap-detector](./2026-07-18__e2e-scenario-coverage-gap-detector/README.md) —
  Added `rhino-cli specs e2e-coverage validate`, a mechanical, baseline-aware gate that diffs each
  playwright-bdd project's declared `@e2e` Gherkin scenarios against `test.fixme(...)` markers in
  generated output, catching new silently-unbound scenarios (`missingSteps: "skip-scenario"`'s gap)
  automatically. Wired to all 11 playwright-bdd e2e projects via a per-project
  `e2e-coverage-baseline.json` manifest + `specs:e2e:coverage` Nx target (folded into `test:specs`).
  PR #66's review ran 7 cycles (not the default 3) — cycles 3 through 6 each found and fixed a genuine
  new CRITICAL in the same failure family (a Gherkin/playwright-bdd parsing edge case producing a
  false PASS: Scenario Outline + apostrophe titles, zero-Examples Outlines prompting a full
  generalized-absence-detection redesign, tag-filter-exclusion + dialect aliases + skip/fixme/only
  tags, and comment-line tag-association breakage). The user explicitly flagged the cycle-count
  overrun and capped further cycling at 7 via `AskUserQuestion`; cycle 7 found 2 non-blocking MEDIUM
  findings, deferred to two new backlog plans
  (`2026-07-18__rhino-cli-git-root-test-fixture-race`,
  `2026-07-18__e2e-coverage-rule-feature-skip-fixme-gap`) rather than a cycle-8 fixer pass. Also
  routed a cycle-overrun check-in guidance addition to the PR-review-quality-gate workflow doc.
  Propagated byte-identically to `ose-primer`/`ose-infra`. Three peer PRs, each independently
  reviewed and gated. Delivery Mode: `worktree-to-pr` (per repo). Completed 2026-07-18.
- [2026-07-18: rhino-speccoverage-multiline-scenario-scan](./2026-07-18__rhino-speccoverage-multiline-scenario-scan/README.md) —
  Fixed `rhino-cli`'s `specs coverage` TS/JS scenario-title extractor (`extract_ts_scenario_titles`)
  to scan whole file content instead of per-line, so a `Scenario("title", ...)` call whose title
  wraps onto the next physical line (as Prettier does with long titles) is still recognized as
  covered instead of reporting a spurious gap. Full RED/GREEN/REFACTOR TDD (behavior-level cucumber-rs
  AC-4 scenario + 3 unit fixtures), then removed 3 `// prettier-ignore` hacks from `libs/web-ui`'s
  `code-block`/`copy-button` step binders that existed specifically to work around this bug — the
  removal itself is the regression proof. Propagated byte-identically to `ose-primer`/`ose-infra` per
  the `apps/rhino-cli` byte-identity boundary. Knowledge Capture routed an absolute-path
  worktree-vs-primary-checkout gotcha (in a plan's own delivery-checklist commands) to the
  worktree-setup practice doc, and a byte-identity-boundary sibling-PR sequencing insight (source PR
  should converge before starting a sibling's next review cycle) to the PR-review-quality-gate
  workflow doc. Three peer PRs (`ose-public` #62, `ose-primer` #6, `ose-infra` #9), each
  independently 3-cycle PR-Review Maker→Fixer reviewed and gated. Delivery Mode: `worktree-to-pr`
  (per repo). Completed 2026-07-18.
- [2026-07-17: rhino-cli-source-drift-reconciliation](./2026-07-17__rhino-cli-source-drift-reconciliation/README.md) —
  Reconciled pre-existing `apps/rhino-cli` `src/` drift across `ose-public`/`ose-primer`/`ose-infra`
  back to a single canonical union, restoring the tri-repo byte-identity boundary. 4 drifted `src/`
  files + `tests/doctor.rs` (found via manual tri-repo `diff` during unrelated research) reconciled
  file-by-file via RED/GREEN/REFACTOR TDD cycles — 3 union-surface gaps
  (`naming.rs`/`doctor/checker.rs`+`doctor/tools.rs`) and 1 pure stylistic swap
  (`instruction_size.rs`), all adopting `ose-public`'s existing superset content and propagated
  byte-for-byte to the two siblings; zero values needed a `repo-config.yml` move. Post-reconciliation
  tri-repo `diff` verified zero output across `src/`, all manifest files, and the Gherkin behavior
  tree. Knowledge Capture routed a `cargo test` filter gotcha (crates with `harness = false` test
  binaries) to the Rust testing standards doc, and two worktree-provisioning gaps (sibling-repo
  relative-path nesting; Elixir/F# per-project dependency restoration) to the worktree-setup
  practice doc; filed a standing tri-repo src-diff gate idea and a `tests/` boundary question in
  `plans/ideas.md`. **Predecessor** unblocking `e2e-scenario-coverage-gap-detector`. Three peer PRs
  (`ose-public`, `ose-primer` #5, `ose-infra` #8), each independently 3-cycle PR-Review
  Maker→Fixer reviewed and gated. Delivery Mode: `worktree-to-pr` (per repo). Completed 2026-07-17.
- [2026-07-16: web-ui-code-block-copy-button](./2026-07-16__web-ui-code-block-copy-button/README.md) —
  Added a reusable `libs/web-ui` copy-to-clipboard primitive (`CopyButton` + `CodeBlock` +
  `useCopyToClipboard` hook) and wired it into the fenced-code-block rendering of `ayokoding-www`
  (bilingual en/id, live e2e) and `ose-www` (latent, unit-only), copying the **verbatim** annotated
  source (byte-equal, mermaid diagrams excluded). Full RED/GREEN/REFACTOR TDD across the hook, button,
  and block; native `<button>` semantics (Enter + Space), axe-clean, ≥24px target, success/idle/error
  states with a polite live-region announcement and localized labels (`Copy`/`Salin`,
  `Copied`/`Tersalin`, `Copy failed`/`Gagal menyalin`). Storybook stories + platform-agnostic visual
  baselines (light/dark). Phase-4 Rule-15 three-tester retest (exploratory/usability/design) filed
  **0 EWT defects**, 4 UWT + 3 DWT findings and 4 spec-gaps; per the maintainer's "fix absolutely
  everything" directive all 12 were fixed inside the PR (incl. two pre-existing/site-wide items: the
  skip-link now moves focus to `#main-content`, and the light-theme shiki code background was pinned to
  `#f6f8fa` in both apps after `keepBackground`'s inline `--shiki-light-bg:#fff` was found shadowing the
  CSS fallback). Also root-caused a `tailwind-merge` transition-group collapse (stacked `transition-*`
  utilities → last wins) that had silently dropped the button's colour animation, and an idle
  discoverability affordance (`opacity-60` at rest → full on hover/focus/touch) plus `scroll-mt-16` so
  the button clears the sticky header. 3-cycle PR-Review Maker→Fixer loop on PR #56. Knowledge Capture
  surfaced one durable learning — rhino's `speccoverage` scenario-title extractor scans per physical
  line, so a prettier-wrapped `Scenario(...)` call reports a spurious coverage gap — routed to a new
  backlog plan (`rhino-speccoverage-multiline-scenario-scan`); other candidates discarded with reasons.
  Delivery Mode: `worktree-to-pr` (maintainer-directed AI-automerge variant); both apps deployed to
  production. Completed 2026-07-16.
- [2026-07-16: ayokoding-resizable-docs-sidebar](./2026-07-16__ayokoding-resizable-docs-sidebar/README.md) —
  Made the ayokoding-www docs sidebar user-resizable via a new reusable `libs/web-ui`
  `resizable-panel` primitive (drag + keyboard, `localStorage` persistence, 15%–35% relative width
  band, horizontal content scroll); mobile drawer gained preset widths. Two hi-fi Stitch-generated
  AyoKoding-branded mockups (Option A minimal handle, Option B + footer preset row); RED/GREEN/REFACTOR
  TDD across `width-model`, `use-resizable-width`, `ResizablePanel`. Phase 7 Rule-15 three-tester
  retest (exploratory/usability/design) found and fixed 9 findings (EWT-001/002, UWT-001–004,
  DWT-001–003), including regenerating the mockups after discovering the committed PNGs were an
  unrelated stock screenshot. 3-cycle PR-Review Maker→Fixer loop on draft PR #49 resolved 7/7
  GitHub review threads: cycle 1 (governance-carve-out delivery.md correction + root-caused 3 real
  E2E failures instead of deferring them), cycle 2 (split drag-visual-update from
  localStorage-persist-on-release to fix a perf/timing bug), cycle 3 (added missing regression test
  for the UWT-002 overflow-fade affordance; wired up 7 previously-silently-skipped e2e step defs).
  Knowledge Capture surfaced 2 learnings: a systemic playwright-bdd silent-coverage-gap pattern
  routed to a new backlog plan (`e2e-scenario-coverage-gap-detector`), and a narrow jsdom
  `cssstyle` quirk discarded as non-generalizable. Delivery Mode: `worktree-to-pr`; CI green at
  final head `4f01636e6`; draft PR #49 handed off for `[HUMAN]` merge. Completed 2026-07-16.
- [2026-07-06: worktree-to-pr-default-delivery-mode](./2026-07-06__worktree-to-pr-default-delivery-mode/README.md) — Made `worktree-to-pr` (worktree → draft PR → `[HUMAN]` merge) the repo-wide default Delivery Mode, replacing direct-to-main as the assumed path, across all 3 repos (`ose-public`, `ose-primer`, `ose-infra`). Defined the full 4-mode vocabulary (`worktree-to-pr`, `worktree-to-origin-main`, `main-to-origin-main`, `main-to-pr`) in `plans.md` and wired it through `plan-maker`/`plan-checker`/`plan-fixer`/`plan-execution-checker` and both plan-execution workflows. Authored the PR-Review Maker→Fixer Cycle (`pr-review-maker`/`pr-review-fixer`, GitHub-Reviews-API-driven, default 3 sequential CI-gated cycles) as new agents and wired it as the terminal step before `[HUMAN]` merge, distinguishing "done" (green, reviewed PR) from "merged" (on the human's own schedule). Reconciled several stale PR-opt-in claims found mid-plan across `ai-agents.md`, `worktree-setup.md`, and two Skill files, plus `trunk-based-development.md`/`git-push-default.md`/`git-push-safety.md`/`pr-merge-protocol.md` semantics, and a workflow-naming violation on the new pr-review file. Ran a full worktree→PR→3-cycle-review→merge round-trip on both `ose-primer` PR #3 and `ose-infra` PR #6 during Phases 4-5, each surfacing and fixing one real Cycle-3 finding. During Phase 7's 20-file Surface Inventory parity re-check, root-caused and fixed a pre-existing, unrelated drift in `ose-primer`'s `plan-multi-repo-parity-planning.md`: stale prose still described the now-retired mandatory-PR "ose-primer sync convention" as active, contradicting the current, correct policy (`ose-public`'s copy: direct push and draft PR both allowed for ose-primer, neither the default) — confirmed via git-log archaeology and cross-reference with `plan-domain-parity-decisions.md`'s retirement note, then fixed directly. All 3 repos' CI green. Completed 2026-07-06.
- [2026-07-05: plan-execution-knowledge-capture](./2026-07-05__plan-execution-knowledge-capture/README.md) — Established a repo-wide Knowledge Capture convention (`repo-governance/development/quality/knowledge-capture.md`): a transient `learnings.md` running log per plan, triaged through a litmus test, secret/sensitivity gate, and repo-relevance gate, then routed to a durable home (docs/rules/agents/skills/code) or discarded with a stated reason — never left to rot as an untriaged pile. Wired the phase into all 5 plan workflows (`plan-execution.md`, `plan-planning.md`, `plan-quality-gate.md`, both multi-repo-parity workflows) and the plan maker/checker/fixer/execution-checker agent chain plus the `plan-creating-project-plans` skill, so every future plan authors, validates, and archives its own Knowledge Capture phase automatically. Propagated identically across all 3 repos (`ose-public`, `ose-primer`, `ose-infra`). Dogfooded the convention on itself: reconstructed 4 learnings from its own Phases 0-5, of which 1 survived both gates and was filed as a new `ose-infra` backlog plan (`ci-runner-health-monitoring`, monitoring/alerting for the single-online-runner CI capacity constraint discovered during this very execution) — the other 3 were correctly discarded as self-referential or already-codified. All 3 repos' CI green. Completed 2026-07-05.
- [2026-07-05: upgrade-opencode-go-models](./2026-07-05__upgrade-opencode-go-models/README.md) — Bumped the OpenCode secondary binding off two stale/retired `opencode-go` model IDs onto a 3-tier mapping (thinking + execution → `opencode-go/glm-5.2`, fast → `opencode-go/minimax-m3`) across all 3 repos' `rhino-cli` config-conversion engine (RED→GREEN→REFACTOR TDD), `.opencode/opencode.json`, and every synced agent binding; also pinned Pi (`pi.dev`) to the same 2 tiers via a new `ose-public`-only `.pi/settings.json`, with `platform-bindings.md`'s Pi row left `Reserved` (not `Active`). Resolved a pre-existing `ose-infra` `opencode.json` provider divergence found during Phase 0. Refreshed `docs/reference/ai-model-benchmarks.md` in all 3 repos, including correcting a misconception that "Claude Opus 5" exists (it doesn't — the tier above Opus is Claude Fable 5/Mythos 5, noted for completeness only). Root-caused and fixed 3 regressions self-introduced during the docs refresh, caught during post-push verification rather than dismissed: broken `#claude-opus-47`/`#claude-sonnet-46` anchor links (8/4 hits) from collapsing per-model headings into a shared table — fixed by restoring minimal anchor-bearing headings, slug-verified via the local `github-slugger` oracle; a governance vendor-audit violation (bare "Opus"/"Sonnet" in `model-selection.md`'s OpenCode-comparison prose, outside any exempted section) — fixed by renaming each repo's section heading to the scanner's exact exemption substring "Platform Binding Examples" (also fixing a pre-existing cross-repo heading-name inconsistency); and missing pricing/frontier-reference tables in `ose-primer`/`ose-infra`'s benchmarks doc versus `ose-public`'s fuller Phase 3 version — fixed by copying the tables verbatim. Also separately discovered and fixed a silent tooling gap: the `ose-public` worktree's `core.hooksPath` pointed at an empty `.husky/_` (never populated by `npm install`), meaning its first push went out with pre-push hooks never actually firing — fixed via `npx husky` regeneration before the final push. All 3 repos' final `main-ci` runs green (`ose-public` `d18b829bb`, `ose-primer` `42444f7ba`, `ose-infra` `d4cfe6573`), the last after riding out a transient self-hosted-runner network flake plus known shared-runner contention from `ose-primer`'s concurrent Nightly Dependency Audit. Completed 2026-07-05.
- [2026-07-04: enforce-repo-wide-scenario-implementation](./2026-07-04__enforce-repo-wide-scenario-implementation/README.md) — Rolled out `@covers` markers + level tags (`@unit`/`@integration`/`@e2e`) + per-tier fail-on-skip guards across all 59 eligible apps/libs in `ose-public`, `ose-primer`, and `ose-infra`, and upgraded `behavior-coverage` to a genuine runtime cross-check (RED→GREEN→REFACTOR TDD) so every Gherkin scenario is verifiably implemented, not merely marker-decorated. Root-caused and fixed a structural checker gap discovered mid-plan: 13 libs used plain unit-test runners with no BDD step-registration framework, so scenario-title/step-text matching could never pass regardless of correct markers — migrated all 13 to a real BDD framework (cucumber-rs, `@amiceli/vitest-cucumber`, TickSpec, godog, Kaocha-cucumber, Cabbage, and a hand-rolled macro-based registry for `elixir-gherkin` to sidestep a genuine circular dependency on Cabbage), rather than exempting or patching the checker around them. Solved a hard Elixir tooling problem (macro-vs-function-call formatting stability under `mix format`) and a hard cross-project npm dependency-hoisting regression (adding `@vitest/coverage-v8` to a second workspace package silently broke 4 unrelated projects' typechecks via transitive dedup) through direct empirical root-causing rather than workarounds. A Plan Archival no-defer audit sweep caught this 13th gap (`web-ui-token` in `ose-public`, still `@wip`-tagged with a stale Phase-0 stub) that the original census had missed, and fixed it at the root in the same gate. Planted-skip proof matrix (16 rows) and cross-repo rhino-cli byte-identity re-verified; all three repos' CI green. Completed 2026-07-04.
- [2026-07-04: enforce-identical-rhino-cli-gherkin](./2026-07-04__enforce-identical-rhino-cli-gherkin/README.md) — De-hollowed rhino-cli's entire cucumber-rs test suite (previously 121/228 scenarios silently skipped while the gate stayed green) and made its Gherkin behaviour tree byte-identical **and** fully enforcing (`fail_on_skipped`, 0 skipped, `@covers` completeness) across `ose-public`/`ose-primer`/`ose-infra`. Added a functional-core/imperative-shell `Fs` port/adapter seam, wired 5 previously-unbound cucumber binaries (`ddd`, `git_hooks`, `specs_tree`, `test_coverage`, `convention`), froze a 629-entry md5 manifest as the canonical propagation source, extended the SDLC byte-identity boundary to cover the Gherkin tree, and re-placed the `repo-config.yml` schema-parity gate from pre-push onto pre-commit(staged-gated)+PR+main (Decision 8). Root-caused and fixed several genuine pre-existing bugs surfaced by the de-hollowing: a missing `instruction-size` audit category, a swallowed error message in `test_coverage_validate`, 4 distinct speccoverage extractor bugs, 2 unparseable hand-line-wrapped Gherkin files, and — during propagation — stale governance-doc drift in both sibling repos (primer's/infra's `repo-rules-checker.md`/`repo-rules-quality-gate.md` on a stale 3-category preflight model, infra's stale `convention instruction-size validate` CLI command name post-rename, a stale README link to a public-only migration-plan doc). Cross-repo byte-identity matrix and enforcement matrix (306 scenarios/1308 steps, 0 skipped) confirmed green in all three repos; all three repos' CI green post-push. Completed 2026-07-04.
- [2026-07-03: Unify rhino-cli, SDLC & Repo Structure Across the Three OSE Repos (Second Pass)](./2026-07-03__unify-rhino-cli-sdlc-parity/README.md) — Second pass of the standardize-rhino-cli-sdlc-parity effort: synthesized the canonical `apps/rhino-cli` in `ose-public` as the union of all three repos' command surfaces (pulled primer's cucumber-rs harness migrated to `0.23.0` + testcoverage module, and infra's real IaC validators, into public), made the source 100% byte-identical across all three repos (infra relicensed to MIT, `LICENSE` file added), fixed a latent `.opencode/agent/`(singular)→`agents/` bug that silently disabled the agent-naming validator, added the missing `gherkin-cardinality` PR-gate step, and rolled out full `namedInputs.specs` coverage + a new `repo-config validate` schema-parity gate across all Nx-registered projects in all three repos (incl. the 4 `*-contracts` projects). Root-caused and fixed two real bugs discovered mid-plan via CI: a Java/Kotlin doubled-backslash regex/Cucumber-expression escaping bug in rhino-cli's spec-coverage extractor (backported byte-identical to all 3 repos), and public's `ayokoding-www` CI-only unit-test timeout (a file-level `vi.setConfig` silently undercutting the project's `--testTimeout` CLI flag). Also root-caused and fixed, in `ose-infra` only, a `coralpolyp-be:compat:min-version` missing `dependsOn` and a `compat-min-version` CI job missing `setup-jvm`, both surfaced by the plan's own cache-invalidation work turning on real enforcement for the first time. Deliberately deferred (documented, not silently dropped): primer's `crud-be-kotlin-ktor` 59 pre-existing missing step implementations, and two out-of-scope CI flakes logged to `plans/ideas.md` for follow-up (a scheduled-deploy E2E port conflict, a missing GitHub Environment variable on infra's staging E2E workflow). Phase 5 parity table all-green across all three repos (zero real ❌/⚠️); all three repos' latest push CI green. Completed 2026-07-03.
- [2026-07-01: standardize-rhino-cli-sdlc-parity](./2026-07-01__standardize-rhino-cli-sdlc-parity/README.md) — Converged SDLC gate mechanics to `"identical"` across `ose-public`/`ose-primer`/`ose-infra`: triaged every rhino-cli subcommand (wired/not-wired/preflight), derived a best-of-three target standard, and standardized Nx target names (`test:unit`/`test:integration`/`test:e2e`/`test:quick`/`test:coverage`/`lint`/`typecheck`/`specs:behavior:coverage`/`specs:domain:coverage`, no per-project `format`/`format:check`), rhino-cli's verb-last CLI naming, a merged `repo-config.yml` (instruction-size + env-contract + env-injection), and canonical CI workflow names (`pr-quality-gate.yml`/`validate-env.yml`/`main-ci.yml`) in all three repos. Removed Codecov everywhere in favor of native `test:coverage` (≥ 90% line); replaced the `git-identity-check.sh` pre-commit block with a behavioral Git Identity Guardrail; gave every app/lib project (public 28, primer 26, infra 7) the mandatory-six targets + identical C4 specs structure (created missing trees for 4 public libs, 7 primer libs, 2 infra libs) + `test:quick` = typecheck→lint→test:unit→test:coverage→test:specs composition; verified worktree-agnostic guardrails from a linked worktree in all three (the hard case: `ose-infra` is bare-and-worktree-only). Fixed numerous preexisting bugs surfaced along the way: an MSBuild concurrent-build race (`crane-cli`/`fsharp-crane-core`), a vitest CI worker-starvation timeout, `ose-infra`'s pre-commit running `test:quick` via a redundant legacy monolith while pre-push ran it nowhere locally, a 7-project `format:check` regression, missing `deps:audit`/`compat:min-version` coverage on 2 `coralpolyp` projects (surfacing a missing license field, a stale MSRV, and a self-hosted runner missing `cargo-hack`/`cargo-deny`), and residual Codecov brand references. Explicitly deferred as tracked, non-blocking follow-ups: primer's 9 echo-stubbed `specs:behavior:coverage` projects (Phase 0 placeholders), the domain-scoping engine (routes through the same engine as behavior-coverage), infra's CLI-verb rename + env-guard mechanism (bash script vs Rust command, functionally equivalent), and the Nx affected-graph `specs/` wiring across ~80+ projects (mechanism researched and recorded; `main-ci`'s `run-many --all` already validates every project regardless). All three repos' CI green. Completed 2026-07-01.

## Instructions

**Idea Capture**: For ideas not ready for formal planning, write a two-pager in
[`../ideas/`](../ideas/README.md) — not here.

When archiving a plan:

1. Rename the plan folder: `git mv plans/in-progress/[identifier]/ plans/done/YYYY-MM-DD__[identifier]/` using today's date as the **completion date** (not the original creation date)
2. Update the plan's README.md status to "Done"
3. Add the plan to this list
4. Update `plans/in-progress/README.md` to remove the entry
