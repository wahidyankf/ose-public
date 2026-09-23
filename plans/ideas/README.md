# Idea Briefs (Two-Pagers)

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

This folder holds **two-pagers**: shortened, promotable idea briefs that are richer than a one-line
todo but deliberately **not** full six-document plans. Each idea is one `<slug>.md` file. `ideas/`
is the first stage of the plan lifecycle:

```text
ideas/ (two-pagers) → backlog/ (full 6-doc plans) → in-progress/ → done/
```

## Two-Pagers

Grouped into Eisenhower quadrants by [`plan-ideas-grooming`](../../repo-governance/workflows/plan/plan-ideas-grooming.md).

### Q1 — Urgent & Important

Blocks an active plan or documents a live defect, and carries a cross-repo, security, data-integrity, CI-gate, or checker-enforced stake. Do these first.

- [agents-md-progressive-disclosure](./q1-urgent-important/agents-md-progressive-disclosure.md) — `AGENTS.md` sits under 20 B beneath its 30,000 B ceiling; restore headroom via progressive disclosure.
- [file-naming-convention-rework](./q1-urgent-important/file-naming-convention-rework.md) — `file-naming.md` documents 2 of the 11 exemptions the gate applies, its scope clause ("and similar locations") cannot be evaluated, and the ordinal convention contradicts its own worked example.
- [harness-mirror-and-test-isolation-defects](./q1-urgent-important/harness-mirror-and-test-isolation-defects.md) — OpenCode loads `.opencode/agents/README.md` as an agent named `README`, `rhino-cli` smoke tests share one process CWD so a new test flakes a sibling, and 47 dangling anchors hid behind a prefix-keyed link exemption.
- [markdownlint-ci-gate-lints-zero-files](./q1-urgent-important/markdownlint-ci-gate-lints-zero-files.md) — the `markdownlint` gate declares `all-file-type` with no glob, so CI runs it with empty argv, lints `0 file(s)`, and has always passed vacuously.
- [mermaid-validator-does-not-check-syntax](./q1-urgent-important/mermaid-validator-does-not-check-syntax.md) — `md mermaid validate` is cited as the Mermaid-correctness gate but never parses syntax; broken diagrams pass clean.
- [next-image-builds-cannot-resolve-ts-env-loader](./q1-urgent-important/next-image-builds-cannot-resolve-ts-env-loader.md) — all six Next.js images fail to build; four scheduled workflows have reported it twice daily for days, and the `prod-*` deploy path for four sites is dead.
- [oxlint-upgrade-and-lint-reproducibility](./q1-urgent-important/oxlint-upgrade-and-lint-reproducibility.md) — 22 lint sites fetched `npx oxlint@latest`, so a publish turned a green PR red on an untouched file; the 1.78.0 pin froze a real `set-state-in-effect` defect and left the wider class unenumerated.
- [reconcile-rhino-parity-audit-exception](./q1-urgent-important/reconcile-rhino-parity-audit-exception.md) — the private sibling's nightly `Rhino CLI Parity Audit` workflow now fails permanently, not transiently, because `rewrite-rhino-cli-to-fsharp` Phase 11a deliberately left one test file (`GlossaryDddCoverageUnitTests.fs`) private-sibling-only to close a real coverage gap.
- [remove-stale-compat-min-version-stubs](./q1-urgent-important/remove-stale-compat-min-version-stubs.md) — every surviving `compat:min-version` target in `ose-public` is a bare echo that checks nothing — 24 of 24, zero real checks left — while the Nx target convention states outright that echo and no-op targets are forbidden.
- [rhino-governance-tooling-defects](./q1-urgent-important/rhino-governance-tooling-defects.md) — four governance tools that exit 0 while doing less than the caller believes: a mis-paired wrapped code span, a hard-coded `.claude/agents`, basename-keyed rename matching, and an `AUDIT FAILED` line above a green gate.

### Q2 — Important, Not Urgent

No active plan waits on these and no live defect is running, but each carries a real stake. This is the plan-from-here quadrant.

- [actions-cache-eviction-policy](./q2-not-urgent-important/actions-cache-eviction-policy.md) — the Actions cache sits at 99.29 % of its 10 GiB ceiling because nothing ever deletes an entry; only GitHub's LRU relieves pressure.
- [ayokoding-content-checker-coverage](./q2-not-urgent-important/ayokoding-content-checker-coverage.md) — enforce the canonical topic-tree shape in the content checkers; add a by-concept checker.
- [ayokoding-course-root-overview-parity](./q2-not-urgent-important/ayokoding-course-root-overview-parity.md) — 23 of 181 AyoKoding courses lack a root `overview.md`; two layouts coexist and cross-course links already guessed wrong once.
- [ayokoding-database-internals-ruff-config](./q2-not-urgent-important/ayokoding-database-internals-ruff-config.md) — 22 sibling courses carry a scoped `ruff.toml` and this one does not, though `ruff format --check` currently passes clean.
- [ayokoding-mermaid-diagram-remediation](./q2-not-urgent-important/ayokoding-mermaid-diagram-remediation.md) — 636 mermaid violations exposed by the `detect_kind` fix; remediate and drop the temporary CI exclude.
- [ayokoding-www-app-shell-tap-targets](./q2-not-urgent-important/ayokoding-www-app-shell-tap-targets.md) — shared header/footer tap targets render 17-20 CSS px tall against WCAG 2.5.8's 24x24 floor, site-wide and unguarded by CI.
- [bare-repo-landing-method-step-count-drift](./q2-not-urgent-important/bare-repo-landing-method-step-count-drift.md) — the landing method numbers eight steps but is summarized as "seven-step" in nine sites across three repos.
- [behaviour-coverage-timing-per-adapter](./q2-not-urgent-important/behaviour-coverage-timing-per-adapter.md) — a new `.feature` file unregistered in its test project ran zero E2E scenarios while `dotnet test` reported green; the BDD contract places the static coverage check at a point in time, not at the event that needs it.
- [ci-setup-rust-toolchain-retry](./q2-not-urgent-important/ci-setup-rust-toolchain-retry.md) — `setup-rust` flaked 7× in one phase on the toolchain download; add a retry in both parity repos.
- [coverage-artifact-relative-paths](./q2-not-urgent-important/coverage-artifact-relative-paths.md) — generated coverage files bake in the last runner's absolute path; most instances are gitignored, but a 2026-08-18 re-check found one finding overstated.
- [declare-vite-peer-dependency](./q2-not-urgent-important/declare-vite-peer-dependency.md) — ten packages test through a `vite*.config.*` that imports a `vite` none of them declares; it resolves only via npm hoisting, and no gate would notice an eleventh.
- [deploy-targets-registry](./q2-not-urgent-important/deploy-targets-registry.md) — declare `prod-*`/`stag-*` deploy branches in `repo-config.yml` instead of deriving their existence from `git branch -r`.
- [doc-command-existence-validation](./q2-not-urgent-important/doc-command-existence-validation.md) — a rhino-cli validator catching doc-cited commands that don't exist.
- [doctor-fix-polyglot-restore](./q2-not-urgent-important/doctor-fix-polyglot-restore.md) — toolchain validation and `./rhino toolchain provision --apply` cover toolchain presence but not per-project restore state (NuGet, npm-workspace hoisting), leaving idle checkouts pre-push-red until manually diagnosed.
- [governance-command-name-reconciliation](./q2-not-urgent-important/governance-command-name-reconciliation.md) — governance tables, agent files, and npm scripts all name commands that do not exist, including a removed `rhino-cli` subcommand three `sync:*` scripts still invoke.
- [harness-binding-catalog-drift](./q2-not-urgent-important/harness-binding-catalog-drift.md) — narrowed to one surviving lesson: the 2026-07-20 audit's summary contradicted its own report body, so read the body.
- [harness-converter-preserve-agent-mode](./q2-not-urgent-important/harness-converter-preserve-agent-mode.md) — the agent converter emits a fixed field set, so OpenCode-only frontmatter like `mode: subagent` is dropped once an agent gains a `.claude/` source.
- [hippo-boundary-nx-fan-out-symptom](./q2-not-urgent-important/hippo-boundary-nx-fan-out-symptom.md) — one `run-many` over four projects exhausted host memory because each target is itself a nested `nx run` chain; the rule states the principle but names neither the shape nor the `MaxListenersExceededWarning` signature.
- [mermaid-state-label-render-clipping-warn](./q2-not-urgent-important/mermaid-state-label-render-clipping-warn.md) — a WARN rule for `stateDiagram-v2` edge labels that clip in GitHub's renderer.
- [opencode-v2-migration](./q2-not-urgent-important/opencode-v2-migration.md) — OpenCode v2 renames eleven configuration keys the generator emits today, including `permission.bash` → `permission.shell`; plan the migration before the beta is promoted.
- [private-sibling-opencode-ci-monitor-orphan](./q2-not-urgent-important/private-sibling-opencode-ci-monitor-orphan.md) — an unsourced `.opencode/agents/ci-monitor-subagent.md` mirror survives only via a hardcoded filename skip both parity repos inherit; ose-public solved the sibling case by declaring it vendored.
- [port-registry-lacks-a-validator](./q2-not-urgent-important/port-registry-lacks-a-validator.md) — the cross-repo port registry now exists but is prose no tool reads, so a stale or colliding row still surfaces only when a service fails to bind.
- [post-cutoff-dependency-migrations](./q2-not-urgent-important/post-cutoff-dependency-migrations.md) — track and promote the deferred dependency bumps as their soak windows clear.
- [postgresql-test-runner-correctness-pattern](./q2-not-urgent-important/postgresql-test-runner-correctness-pattern.md) — the same PostgreSQL two-phase-startup race was root-caused three times across two independently written files in one plan; no shared document holds the pattern.
- [refresh-agent-illustrative-example-paths](./q2-not-urgent-important/refresh-agent-illustrative-example-paths.md) — 4 generic agent definitions still illustrate usage with example paths naming apps this repo deleted.
- [remove-dead-shadow-diff-script](./q2-not-urgent-important/remove-dead-shadow-diff-script.md) — `shadow-diff.sh` diffs a Rust binary against an F# one, but the Rust crate was deleted outright, so its resolution path can never resolve again.
- [rhino-bin-resolver-shim-coverage](./q2-not-urgent-important/rhino-bin-resolver-shim-coverage.md) — the resolver shim every hook, Nx target, and CI job reaches `rhino-cli` through has three tiers and zero scenario coverage since its Rust-era feature file was retired.
- [rhino-env-backup-scripts](./q2-not-urgent-important/rhino-env-backup-scripts.md) — scripted backup/restore of the gitignored rhino-cli `.env*` files.
- [rhino-git-env-scrub-widening](./q2-not-urgent-important/rhino-git-env-scrub-widening.md) — `find_root_from` scrubs only `GIT_DIR`/`GIT_WORK_TREE` before invoking `git rev-parse`, leaving `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`, and `GIT_COMMON_DIR` unscrubbed.
- [rhino-md-links-json-output-scenario-gap](./q2-not-urgent-important/rhino-md-links-json-output-scenario-gap.md) — the retired CLI link checkers' `Scenario: JSON output produces structured results` has no equivalent in `rhino-cli`'s successor feature, though the behaviour is live and unit-tested.
- [rhino-tools-superset-carveout](./q2-not-urgent-important/rhino-tools-superset-carveout.md) — `doctor/tools.rs`'s "zero carve-outs" byte-identity target collides with the private sibling's real, needed IaC tool-provisioning extensions.
- [rust-crate-structural-checklist-promotion](./q2-not-urgent-important/rust-crate-structural-checklist-promotion.md) — promote the Rust crate structural checklist to governance once a 2nd crate exists.
- [sdlc-gate-standard-property-bound-lag](./q2-not-urgent-important/sdlc-gate-standard-property-bound-lag.md) — `ose-public`'s SDLC gate standard trails both siblings on two name-bound bareness claims; adopt their wording.
- [shared-cargo-target-lock-contention](./q2-not-urgent-important/shared-cargo-target-lock-contention.md) — the retired in-tree Doctor's shared cargo target directory reclaimed disk but serialized concurrent worktree builds (a 65 s lock-wait stall was measured); moot unless upstream Rhino reintroduces sharing.
- [sibling-main-ci-never-runs-on-merge](./q2-not-urgent-important/sibling-main-ci-never-runs-on-merge.md) — `main-ci` is schedule-triggered in the private sibling, so a merge to its `main` gets no post-merge CI signal.
- [source-code-credential-scanning](./q2-not-urgent-important/source-code-credential-scanning.md) — evaluate Betterleaks (gitleaks successor) for pre-commit + CI credential detection in source.
- [standardize-cis](./q2-not-urgent-important/standardize-cis.md) — audit for any CI-standardization residual left by the toolchain-parity work.
- [syllabus-conformance-validator](./q2-not-urgent-important/syllabus-conformance-validator.md) — a deterministic `./rhino md syllabus validate` for course-file section conformance, deferred until the format settles.
- [vendor-audit-kiro-term](./q2-not-urgent-important/vendor-audit-kiro-term.md) — add `Kiro` to the vendor-audit denylist before it leaks into governance prose.
- [vendor-neutral-canonical-source](./q2-not-urgent-important/vendor-neutral-canonical-source.md) — move the canonical agent and skill source out of `.claude/` so no harness is privileged and every harness, Claude Code included, becomes a generated mirror.
- [vitest-glob-coverage-guard](./q2-not-urgent-important/vitest-glob-coverage-guard.md) — a regression test that matched no Vitest project's include glob ran zero times and passed green; guard the class.
- [web-ui-alert-destructive-dark-contrast](./q2-not-urgent-important/web-ui-alert-destructive-dark-contrast.md) — shared `Alert variant="destructive"` renders at 1.99:1 in dark mode; the obvious token fix is unsafe.

### Q3 — Urgent, Not Important

Something active references these, but they carry none of the importance signals. Delegate or timebox.

- [audit-e2e-reuse-existing-server-config](./q3-urgent-not-important/audit-e2e-reuse-existing-server-config.md) — a stale dev server on the target port silently absorbs e2e runs via unconditional `reuseExistingServer: true`, and can run a suite green against a build that is not the code under test.
- [ayokoding-www-e2e-coverage-gaps](./q3-urgent-not-important/ayokoding-www-e2e-coverage-gaps.md) — implement the ~104 + 83 missing Playwright step defs so e2e can revert to `fail-on-gen`.
- [ayokoding-www-e2e-flake-under-concurrent-load](./q3-urgent-not-important/ayokoding-www-e2e-flake-under-concurrent-load.md) — two step files check every page link via unbounded `Promise.all`, flaking a required gate 4 runs in 7, and a third scenario flakes under the same shared-machine load without that mechanism.
- [setup-playwright-apt-fetch-has-no-retry](./q3-urgent-not-important/setup-playwright-apt-fetch-has-no-retry.md) — the shared Playwright setup action's `apt-get update` has no retry and no step-level timeout, so one stalled mirror burns the whole job budget and surfaces as a bare cancellation.

### Q4 — Neither Urgent nor Important

Parked deliberately. Kept because the need may become real, not because it is real now.

- [ayokoding-i18n-nav-hardening](./q4-not-urgent-not-important/ayokoding-i18n-nav-hardening.md) — pre-existing id-locale, language-switcher-404, and sidebar-clip defects surfaced by the url-restructure Phase-5 retest.
- [ayokoding-www-cost-reduction](./q4-not-urgent-not-important/ayokoding-www-cost-reduction.md) — retire the 3 MB search index, ~700 KB client mermaid, 97 MB image copy, and the not-XSS-safe HTML parser in one coordinated pass.
- [dependency-library-updates](./q4-not-urgent-not-important/dependency-library-updates.md) — a standing, policy-compliant sweep to advance pinned library dependencies as their soak windows clear.
- [fsl-standards](./q4-not-urgent-not-important/fsl-standards.md) — clarify the intent behind "FSL standards" and, if warranted, codify a licensing standard around the Functional Source License.
- [next-standalone-output-parity](./q4-not-urgent-not-important/next-standalone-output-parity.md) — two of six Next.js apps omit `output: "standalone"`, so their images run a second resident Node process and ship a full `node_modules`.
- [vercel-cost-steady-state-verification](./q4-not-urgent-not-important/vercel-cost-steady-state-verification.md) — grade the shipped cost fix against the $30 invoice ceiling once the first clean billing cycle closes on 2026-09-26.

## What a Two-Pager Is

A two-pager sits between a throwaway one-liner and a full backlog plan: short enough to write in one
sitting and triage at a glance, yet structured enough to decide whether to promote it. Target ≤ ~2
printed pages, ~8 short sections:

1. **Title + one-line summary** (plus a provenance note when it came from a plan)
2. **Problem / context** — a specific example of why the status quo doesn't work, with concrete data points (counts/sizes/measurements; never fabricated)
3. **Why now** — the urgency, dependency, or opportunity window
4. **Prior art / precedents** — 2-5 named precedents (tool/pattern/standard/prior plan) with links; lightweight at capture, deep `web-researcher` study deferred to promotion
5. **Proposed direction (sketch)** — core elements only; **not** wireframes, file paths, or Gherkin
6. **Rough scope & non-goals** — in-scope bullets + an explicit out-of-scope list
7. **Risks & open questions** — rabbit holes + the unknowns that block promotion
8. **What success looks like + promotion signal**

Keep it a brief, not a plan: one paragraph per section, no fabricated metrics, no secrets, and no
BRD/PRD/tech-docs/delivery split (that is the backlog plan's job).

## Before You Add — Integrate, Don't Duplicate

Before creating a new two-pager, scan the index above for an existing brief on the same problem or
area and **fold the new thought into it** rather than adding a near-duplicate. Two two-pagers about
the same underlying problem should be one. This applies equally to learnings routed here by the
Knowledge Capture phase — check for an existing home first.

## Promoting a Two-Pager to a Plan

Promotion is a **completeness gate, not a perfection gate**: an idea is ripe when every section holds
a real answer — including honest open questions — and the remaining questions genuinely need a full
plan's deeper work to answer. When a two-pager is ripe, create `backlog/<slug>/` as a full plan, carry
the problem/scope/questions forward, then **delete** the two-pager and drop its line above. "Not
promoted yet" is a legitimate state, distinct from "rejected".

## See Also

- [Plans Organization Convention → Ideas Folder (Two-Pagers)](../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers)
  — the authoritative convention, template, and discipline.
- [Knowledge Capture Convention](../../repo-governance/development/quality/knowledge-capture.md) —
  routes future-work learnings from plan execution here as two-pagers.

## Grooming Log

### 2026-08-06 — plan-ideas-grooming (multi-repo run)

Swept 120 two-pagers across the coordinated repo set; 79 survive. Every surviving idea carries a residency verdict (R1 secrets-bearing, R2 single-repo-only, R3 generalizable) and an Eisenhower quadrant.

- **Classified**: 60 idea(s) resident here, filed into quadrant folders.
- **Relocated in** (9):
  - `coverage-artifact-relative-paths.md` from `beaver-nest` — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `cross-repo-port-registry.md` from `beaver-nest` — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `ose-public-nx-affected-rhino-cli-gap.md` from the private sibling — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `refresh-agent-illustrative-example-paths.md` from `beaver-nest` — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `rhino-cli-exclude-dir-shared-steps-gap.md` — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `rhino-cli-sync-validator-wrong-model-drift.md` from the private sibling — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `specs-checker-phantom-nx-targets.md` from `beaver-nest` — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `dependency-library-updates.md` from the private sibling — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
  - `fsl-standards.md` from the private sibling — rule R3: generalizable cross-cutting concern; no secret required, present in 2+ repos
- **Deduplicated out** (1):
  - `demo-apps-standards-recheck.md` — the surviving copy is no longer tracked in the coordinated
    repo set.
- **Unresolved follow-ups**: none. No relocation was interrupted and no filename collision was
  deferred. One inbound link sat in `plans/backlog/beaver-nest-repo-consolidation/`, an untracked
  plan folder that was another actor's in-flight work at grooming time; its single reference to
  `post-cutoff-dependency-migrations.md` was repointed at the new quadrant path in the working tree
  and left for that folder's own author to commit, since this run does not stage their files.

> Last groomed: 2026-08-06

### 2026-08-19 — plan-ideas-grooming (`ose-public` + the private sibling)

Swept the 75 two-pagers resident here plus 14 in the private sibling; **80 survive here and 8 there**. The
run's repo set is the two repositories under active coordination — `beaver-nest` carries no sync
obligation and was not swept.

- **Pre-grooming additions** (3), filed directly per the
  [Ideas Folder convention](../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers)
  and then swept by this run: `next-image-builds-cannot-resolve-ts-env-loader.md` (Q1),
  `fsharp-env-loader-covers-markers-are-inert.md` (Q2), `next-standalone-output-parity.md` (Q4). All
  three surfaced during the runtime-port-override delivery (PR #230) and were deliberately excluded
  from its scope. Recorded here for the audit trail, **not** as a grooming action — this workflow's
  Purpose explicitly excludes filing brand-new ideas, and these were authored under the convention
  before the sweep began.
- **Merged** (1): `specs-checker-phantom-nx-targets.md` → `governance-command-name-reconciliation.md`
  — same underlying defect (a documented command that does not exist), and the absorbed brief's open
  "isolated or systemic?" question is answered by the survivor. The survivor's scope widens to
  `.claude/agents/**`; its index hook was updated to match.
- **Renamed** (1): `cross-repo-port-registry.md` → `port-registry-lacks-a-validator.md`. The registry
  shipped on 2026-08-19, answering the "where does it live" half; the brief was rewritten down to the
  validator question that remains, and its "four sibling repos" framing corrected to the two-repo
  parity set.
- **Relocated in** (3), all rule R3 — generalizable, no secret required, present in both repos:
  `extend-byte-identity-to-claude-hooks.md`, `harness-level-env-file-enforcement-gap.md`, and one
  since deleted.
- **Deduplicated in** (3) — cross-repo pairs resolved here under R3. Each private-sibling copy is
  deleted in its own commit after this one lands. Compared line by line; only one carried anything
  this repo lacked:
  - `markdownlint-ci-gate-lints-zero-files.md` — **content folded in**: the private sibling's own
    `0 file(s)` behaviour is inferred from a byte-identical `rhino-cli`, not observed, because its
    logs were unreadable during the 2026-08-17 GitHub incident.
  - `governance-command-name-reconciliation.md` — nothing to fold; already the superset. (Also
    appears under **Merged**, for the unrelated `specs-checker` absorption.)
  - `harness-converter-preserve-agent-mode.md` — nothing to fold, therefore **unchanged in this
    commit**.
- **Reclassified** (1): `audit-e2e-reuse-existing-server-config.md` Q2 → **Q3**. Urgent (its _Why
  now_ records an already-observed defect), but **not** important: the Step 8 importance rubric
  admits exactly five signals, and a gate that silently _passes_ against the wrong build is not "a
  currently-blocking CI gate". It was first moved to Q1 in this run on that misreading, corrected in
  review.
- **Reshaped** (3): provenance blockquotes added to `plan-checker-forward-reference-detection.md`,
  `actions-cache-eviction-policy.md`, and `shared-cargo-target-lock-contention.md`, which carried
  none. Two dates are quoted from the file's own body ("Measured on 2026-08-09", "Measured
  2026-08-06"). The third file's body carries **no date at all**, so its line uses `2026-08-09` —
  the date of the `plans/done/2026-08-09__optimize-cis/` folder it names. All 80 files now pass the
  eight-section and provenance checks.
- **Residency**: rule numbers are recorded above for the **7 ideas whose residency was contested**
  this run (3 relocated in, 3 deduplicated, 1 ambiguous). Step 4 asks for a logged verdict on every
  surviving idea including the no-move cases; the remaining 73 were not individually re-adjudicated,
  and this log does not claim they were. Closing that gap needs a per-idea R# record the corpus does
  not yet carry — recorded as a follow-up below.
  The one ambiguous case was `private-sibling-opencode-ci-monitor-orphan.md`: the orphan file it names
  exists only in the private sibling (R2), but the `rhino-cli` hardcoded skip keeping it alive is
  byte-identical across both repos and is where a fix would land. Resolved R3, resident here.

**Unresolved follow-ups**:

- **Three** stale references to paths this run changed sit outside the `plans/ideas/**` write scope
  and were left untouched, per the scope boundary's log-don't-write rule. All three are in
  `plans/done/2026-08-21__repository-onboarding-readme-refresh/artifacts/reader-doc-disposition-ose-public.md`
  as bare table-cell paths (not links, so not gate-visible): `audit-e2e-reuse-existing-server-config.md`
  (moved quadrant), `cross-repo-port-registry.md` (renamed — old path gone), and
  `specs-checker-phantom-nx-targets.md` (merged away — old path gone). A fourth, a real relative link
  in `plans/done/2026-07-30__ayokoding-www-tools-ai-benchmark/learnings.md`, is harmless to CI because
  the `md-links` gate excludes `plans/done`.
- **`md links validate` appears to have a blind spot.** The merge above left a genuinely broken link
  in `rhino-cli-test-binaries-run-by-no-gate.md` pointing at the deleted
  `specs-checker-phantom-nx-targets.md`. It was caught in review, not by the gate — and a reviewer
  reproduced the miss from scratch, finding the validator flags other missing filenames in a
  byte-identical file but not that one. The link is fixed here; the validator behaviour is not, and
  is worth its own investigation.
- **Step 9's cross-repo link rule was deliberately not applied literally.** It says convert _every_
  `./`-relative link in a relocated file to an absolute URL. Two links were left relative —
  `../../../CLAUDE.md` and `../../../docs/reference/related-repositories.md` — because both resolve
  correctly here and now point at _this_ repo's own copies, which is the right target for a reader of
  this repo; converting them would have produced links into a private repo that 404 for most readers.
  Note the two repos' `related-repositories.md` differ in wording, so the citation's meaning did shift
  slightly with the move; the claim it supports (a repo outside the parity set carries no sync
  obligation) holds in both.
- **The Step 8 rubrics resisted mechanisation.** A scripted classifier disagreed with the filed
  quadrant on 28 of 80 files, contradicted itself across repos on identical text, and moved every one
  of the then-seven Q1 briefs elsewhere. The heuristic is wrong, not the corpus: "names or blocks an
  active plan" is not pattern-matchable. Classification was adjudicated by hand for this run's touched
  files plus every flagged under-classification. A rubric-faithful classifier remains unbuilt, and
  building one is outside this workflow's write scope.

> Last groomed: 2026-08-19

### 2026-08-21 — plan-ideas-grooming (`ose-public`)

Swept the 85 two-pagers resident here; **83 survive**. The run's repo set is `ose-public` alone —
the private sibling was groomed in the 2026-08-19 run and no cross-repo relocation was in scope, so Step 3
(cross-repo dedup) and Step 5 (relocation) were both no-ops with nothing to resolve. Trigger: the
flat idea count exceeded the 60-file threshold.

- **Pre-grooming demotions** (5), performed on maintainer instruction immediately before the sweep
  and then swept by it. Recorded here for the audit trail, **not** as a grooming action — this
  workflow never writes under `plans/backlog/`, so the demotion is a separate act that happened to
  precede the run. Each full backlog plan collapsed into one two-pager carrying a
  `> Provenance: demoted from the full backlog/ plan ...` line:
  `oxlint-upgrade-and-lint-reproducibility` (Q1), `rhino-governance-tooling-defects` (Q1),
  `file-naming-convention-rework` (Q1), `harness-mirror-and-test-isolation-defects` (Q1), and
  `declare-vite-peer-dependency` (Q2). `plans/backlog/` is now empty and its README says so.
  One stale reference outside `plans/ideas/**` was repointed as part of that demotion, not by this
  workflow: `docs/reference/rhino-cli-command-triage.md`'s pointer to the retired backlog folder.
- **Merged** (2):
  - `ayokoding-www-e2e-parallel-load-flake.md` → `harden-ayokoding-www-fe-e2e-bulk-link-concurrency.md`.
    The absorbed brief observes three scenarios flaking under full-suite parallel load; two of the
    three are exactly the step files the survivor diagnoses as carrying an unbounded `Promise.all`.
    One brief was the observation and the other the mechanism. The third scenario
    (`tools/cost-of-living-calculator.feature`) has **no** identified mechanism, and the merged brief
    now says so explicitly rather than letting the diagnosis imply coverage it does not have.
  - `rhino-cli-sync-validator-wrong-model-drift.md` → `rhino-cli-parity-propagation-optimize-cis.md`.
    Two independently-measured violations of the same zero-carve-out `apps/rhino-cli` byte-identity
    rule against the same sibling repo, both escaping the same way (the fix landed after the
    sibling's PR merged). The remedy is one act — reproduce the manifest diff, classify each file,
    propagate — so two briefs meant two passes over the same manifest with the second inheriting the
    first's leftovers.
- **Renamed** (2), both because the merge left a filename that no longer described the file:
  - `harden-ayokoding-www-fe-e2e-bulk-link-concurrency.md` →
    `ayokoding-www-e2e-flake-under-concurrent-load.md`. Bounded link concurrency is now the dominant
    mechanism in the brief, not the whole of it.
  - `rhino-cli-parity-propagation-optimize-cis.md` → `rhino-cli-byte-identity-drift-reconciliation.md`.
    The old name pins the brief to one era's drift; it now carries two.
- **Reclassified** (2), both Step 8 adjudications, both moving **into** Q3:
  - `ayokoding-www-e2e-flake-under-concurrent-load.md` Q4 → **Q3**. Urgent — its _Why now_ records
    already-observed defects (4 failures in 7 runs; 3 scenarios flaking in one phase). Not important:
    one repo, no security, secrets, or data-integrity stake, no checker-enforced rule — and although
    it reddens a required gate, the brief's own open question is whether the pattern still
    reproduces, so "a **currently**-blocking CI gate" cannot be asserted.
  - `setup-playwright-apt-fetch-has-no-retry.md` Q2 → **Q3**, on the same reading. Two consecutive
    runs cancelled at their 35-minute budget is an already-observed live defect (urgent); "two
    occurrences on one branch is the only recorded evidence" is the brief's own words on whether it
    currently blocks (not important).
- **Reshaped** (1): `setup-playwright-apt-fetch-has-no-retry.md` carried 4 of the 8 template
  sections — filed 2026-08-21, after the last sweep, so it had never been groomed. _Why now_,
  _Prior art / precedents_, _Proposed direction (sketch)_, and _What success looks like + promotion
  signal_ were added; its `## See also` block was folded into _Prior art_. No content was discarded.
  All 83 surviving files now pass the eight-section, single-H1, and provenance-blockquote checks.
- **Residency**: this is a **single-repo run**, so every surviving idea resolves to rule R3
  (generalizable default) by construction and no residency was contested. Recording a per-idea R#
  verdict for all 83 would restate that constant 83 times without adding information; the 2026-08-19
  run's follow-up about the corpus not carrying per-idea R# records therefore remains open, and this
  run does not claim to have closed it.
- **Classification scope**: the 8 files this run created, merged, or reshaped were adjudicated
  against both Step 8 rubrics from scratch. The other **75 were carried forward unchanged** from the
  2026-08-19 hand adjudication, two days earlier, with no re-adjudication — their content did not
  change, and substituting a fresh reading for a fresh hand adjudication would be churn, not
  convergence. This log does not claim all 83 were re-rubric'd.

**Merge candidates flagged and declined** (Step 2 asks for every candidate and its rationale, so the
declines are recorded, not just the merges):

- `setup-playwright-apt-fetch-has-no-retry` ↔ `ci-setup-rust-toolchain-retry` — genuinely one class
  (a shared `.github/actions/setup-*` composite action whose network fetch has no retry) and the
  closest call of the run. Declined because each carries a **different promotion gate** — "does the
  cache-miss branch share the defect?" versus "where does the existing rustup retry wrapper actually
  live?" — and a merged brief with two independent promotion gates cannot be promoted cleanly. They
  now cross-reference each other, and whichever lands first sets the retry shape the other reuses.
- `mermaid-validator-does-not-check-syntax` ↔ `mermaid-state-label-render-clipping-warn` — same
  command, opposite problems: one is that the validator parses no syntax at all, the other adds a
  render-clipping heuristic the second brief argues **no** text validator can observe. Declined.
- `plan-quality-gate-convergence` ↔ `rules-quality-gate-convergence` — same shape (a
  maker-checker-fixer loop over-running its stated iteration budget) and a shared research base, but
  different workflows with different proposed mechanisms. Merging would produce one plan touching two
  unrelated gates. Declined.
- `deploy-targets-registry` ↔ `stale-checkout-ref-advance-drift`, and
  `harness-converter-preserve-agent-mode` ↔ `vendor-neutral-canonical-source` — each pair's shared
  terms are a source-plan name or generic git/agent vocabulary, not a shared subject. Declined.
- The `rhino-cli-*` (9 files) and `ayokoding-www-*` (5 files) filename families — a shared **topic
  namespace**, not the shared _stem_ Step 2's criterion means. Merging on prefix alone would collapse
  the corpus. Declined as a family, with the two substantive pairs inside them adjudicated
  individually above.

**Split candidates considered and declined** (1 pair): `rhino-governance-tooling-defects` names
four defects and `harness-mirror-and-test-isolation-defects` names three. Neither is a split
candidate under Step 2's "two or more genuinely unrelated concerns" test — each brief argues one
shape (a tool whose report and behaviour disagree; a tree treated as uniform when it is not), and
both were authored as single plans on that basis. Both already carry the one-unit-or-several question
as a stated open item, which is the right place for it.

**Unresolved follow-ups**:

- **Two Rust doc comments cite the retired backlog folder** and were deliberately left untouched:
  `apps/rhino-cli/src/commands/governance_rewrite_readme_index_paths.rs` (line 30) and
  `apps/rhino-cli/src/application/governance/readme_index.rs` (line 2103) both name
  `plans/backlog/rhino-governance-tooling-defects/`. Beyond this workflow's write scope, and
  editing either would open the four-repo `apps/rhino-cli` parity-manifest obligation for a comment
  change. Fold into whichever plan next touches those files.
- **Stale references in `plans/done/**`** to the two renamed and two merged-away idea files, plus the
five retired backlog folders. All sit in archived plan records, which the `md-links` gate excludes
(`repo-config.yml` `md-links`→`exclude: [plans/done]`) and which the Plans convention says not to
  casually rewrite. Left as history.
- The 2026-08-19 run's open follow-ups carry forward unchanged: the per-idea R# residency gap, the
  apparent `md links validate` blind spot, the deliberately non-literal Step 9 cross-repo link rule,
  and the unbuilt rubric-faithful classifier.

### 2026-09-16 — two ideas resolved directly, not promoted

An unguarded Nx fan-out exhausted host memory and forced a machine restart. Arming the
resource-aware boundary rule with `require-hippo-boundary.sh` resolved both of these outright, so
they were deleted rather than carried:

- **`harness-level-env-file-enforcement-gap`** — the idea's own open question was whether any other
  harness offers a hook mechanism at all. It does. Codex reads a project-level `.codex/hooks.json`
  using the same `PreToolUse` schema, the same `tool_name`/`tool_input.command` stdin fields, and the
  same deny payload as Claude Code; OpenCode resolves a `permission.bash` pattern map
  last-match-wins. Both are now wired, for `block-env-file-access.sh` as well as the new guard. The
  residual is narrower and upstream: Codex fires `PreToolUse` for shell calls but not for file-tool
  calls, so its env-file coverage is the Bash arm only. Recorded in
  `resource-aware-development/enforcement-and-judgment-boundaries.md` rather than parked here.
- **`extend-byte-identity-to-claude-hooks`** — resolved by construction plus a written standard. The
  guard is authored as a union superset of every consuming ecosystem's verbs with the inapplicable
  arms inert, so it needs no per-repo variant, and its consumer check lets one file serve both the
  repository and machine-wide layers. `.codex/hooks.json` references the canonical script instead of
  copying it. The obligation is now stated in `nx-targets/cache-cross-repo-byte-identity.md`
  alongside the `apps/rhino-cli` rules.

> Last groomed: 2026-09-16
