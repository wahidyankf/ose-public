---
title: "Learnings — SDLC Gate Registry Enforcement"
description: Knowledge capture during execution, triaged to a permanent home or discarded at Phase 6
category: explanation
subcategory: plans
tags:
  - learnings
  - ci-cd
created: 2026-08-02
---

# Learnings — SDLC Gate Registry Enforcement

Populated during execution. Each entry is triaged in Phase 6 to a home in `docs/` or
`repo-governance/`, or discarded with a stated reason.

## Format

```markdown
### <short title>

**Observed**: what happened
**Why it matters**: the general rule behind the instance
**Home**: `docs/...` / `repo-governance/...` / discarded — reason
```

## Entries

### Revalidate executable plan artifacts immediately before readiness review

**Observed**: The 2026-08-02 plan passed its checker, but by 2026-08-04 `beaver-nest` had changed its
repository allowlist, runtime configuration, F# source footprint, test-target isolation, environment
scanner, tests, and Gherkin coverage. During this readiness refresh it advanced again to
`cd2ec0e4d`, changing its complete package baseline, removing the Vite frontend's environment
contract, and increasing its Shell/F# inventory. Its root is also a bare repository, so
primary-checkout commands in the original Phase 0 and Phase 5 procedures were not executable there.

**Why it matters**: A clean planning audit is a point-in-time result. Plans that carry copy-ready
artifacts or cross-repository assumptions need an explicit live-state reconciliation before execution;
otherwise a mechanically correct copy step can revert newer work or fail before establishing its
baseline.

**Home**: routed inline — added a "Survey freshness" paragraph to
[`plan-multi-repo-parity-planning.md` § Step 1](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md#step-1--parity-set-survey-per-repo-parallelizable),
directing execution to re-run the survey live immediately before executing a phase with copy-ready
artifacts, rather than trusting a stale prior inventory.

### Pre-seeded from the 2026-08-02 audit

**Observed**: The Gate Composition Rule was ratified as prose plus markdown tables and drifted in
both directions in all four repos within roughly a month, without any single deliberate decision to
diverge.

**Why it matters**: A normative rule expressed only in prose degrades silently. The repo already knew
this — it is why harness bindings are generated and validated rather than hand-synced. The lesson is
that the generate-and-validate pattern should be the default for any invariant spanning more than one
file, not a special case reserved for bindings.

**Home**: routed inline — new practice
[`mechanize-cross-file-invariants.md`](../../../repo-governance/development/practice/mechanize-cross-file-invariants.md),
registered in `repo-governance/development/practice/README.md`, generalizing the existing
generate-and-validate prior art (harness bindings, `repo-config.yml` schema parity, git hooks,
`lint-staged` emission) into one named practice.

### GitHub Actions `&&`/`||` conditional expressions never resolve to a falsy right-hand value

**Observed**: PR #20 Cycle 2's fixer applied a legitimate finding (M1: `fetch-depth:0` forced on all 33
matrix legs, only 10 need full history) as `fetch-depth: ${{ matrix.gate.scope ==
'affected-file-type' && 0 || 1 }}`. This introduced a fresh regression: `format-verify-ruff` failed
with `"Error: git diff from GATE_CHANGED_BASE to HEAD failed"` even though its scope was correctly
`affected-file-type`. Root cause — GHA expressions use JS-like short-circuit `&&`/`||`, and `0` is
falsy, so `true && 0` evaluates to `0` but the outer `... || 1` then treats that `0` as falsy and
falls through to `1` (shallow clone) regardless of the left-hand condition. Fixed by reversing the
condition and operand order so the falsy value never sits behind `&&`: `${{ matrix.gate.scope !=
'affected-file-type' && 1 || 0 }}`.

**Why it matters**: This is a well-known community-documented GHA antipattern
(`cond && 0 || fallback` never yields `0`), general to any workflow expression choosing between a
falsy value (`0`, `''`, `false`) and a truthy fallback via `&&`/`||` chaining. It bit a fixer's own
review-driven change mid-cycle, not the original registry work — a reminder that even a narrowly
scoped, well-reasoned CI fix needs its resulting expression manually truth-tabled when a falsy
operand is involved, not just spot-checked against the one case that motivated it.

**Home**: routed inline — added an "Expression Safety" subsection to
[`ci-conventions.md` § GitHub Actions Conventions](../../../repo-governance/development/infra/ci-conventions.md#expression-safety),
which also documents the `env:`-indirection expression-injection pattern `gate validate`'s
`validate_ci_matrix_contract` enforces (previously enforced in code with no governance-doc backing).

### PR #20 (ose-primer) merged during a live GitHub Actions platform outage — deliberate exception

**Observed**: GitHub Actions entered a `major_outage` (githubstatus.com, incident "Investigating",
first observed ~2026-08-06T17:40Z, still `investigating` past 20:00Z) partway through PR #20's Cycle 3
CI gate. The run (`31117544484`) was cancelled mid-flight, then a manual `gh run rerun --failed`
stayed `queued` with 0 jobs for 30+ minutes — GitHub's own incapacity, not a code defect (confirmed:
zero contention in our own repos' queued/in-progress job lists across ose-public/ose-primer/
beaver-nest). The user explicitly authorized proceeding without a green CI gate: local pre-commit +
pre-push hooks already run largely the same gate set as `pr-quality-gate.yml` (same registry-driven
`gate run` invocations via `rhino-cli`), and the fixer's own local verification pass before the final
push already covered cargo test (1352 tests), clippy, fmt, `gate validate`, specs coverage, and
`nx affected` across 26 projects. `ose-primer`'s `main` branch also carries **no branch protection**
(confirmed via `gh api repos/.../branches/main/protection` → 404), so the merge itself required no
admin override — `gh pr merge --squash` proceeded as a normal merge once marked ready. Landed as merge
commit `e6c0c33eed7ea9691a679669e4e1ddd62a3a76ba`; the 3-cycle PR-review Maker→Fixer discipline itself
was still run in full — only the final CI-gate confirmation was skipped.

**Why it matters**: This is a deliberate, user-authorized, explicitly-recorded exception to "CI
blockers: investigate root cause, fix properly, never bypass" — not a silent shortcut. The
distinguishing facts that made it defensible here: (1) the blocker was proven external (a GitHub-wide
outage, not a repo defect) via githubstatus.com, (2) local hooks provide substantially equivalent
coverage to the CI gate they mirror, (3) the review-cycle discipline (the higher-value gate) was not
skipped, and (4) the branch had no protection rule actually enforcing the check — so this collapses to
"merge without waiting on a redundant, temporarily-unavailable confirmation," not "merge without
verification." This should NOT be read as precedent for skipping CI when a repo's branch protection
does enforce required checks, or when the blocker's root cause is unconfirmed/internal.

**Home**: routed inline — generalized (repo/PR-number stripped) into
[`ci-blocker-resolution.md` § Operational CI-Availability Exceptions](../../../repo-governance/development/quality/ci-blocker-resolution.md#operational-ci-availability-exceptions),
merged with the four related PR #22 instances below into one exception class with a shared
verification checklist.

### `BOUNDARY_PATHS` declares the whole `apps/rhino-cli/src` byte-identical, but per-repo tool extensions already violate it

**Observed**: While propagating the canonical dotnet-channel fix (task #224) into the private sibling's
`doctor/tools.rs`, a full `diff` against canonical showed far more divergence than the propagated
delta alone — the private sibling carries its own extra tool definitions and tests (`install_clang_format`,
OpenTofu-specific tooling) that canonical does not have, because the private sibling needs IaC tooling the
other repos don't. `application/parity.rs`'s `BOUNDARY_PATHS` constant declares the entirety of
`apps/rhino-cli/src` (plus `tests/`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`, and the
Gherkin tree) as byte-identical across all four repos — no carve-out for repo-specific tool
provisioning. This means `doctor/tools.rs` byte-identity was already structurally unattainable before
this session's propagation work, independent of anything fixed here.

**Why it matters**: The plan's own Phase 4 tasks (#65-69: "author the private sibling gates: section",
"fold pre-existing local surplus checks into registry") already assume the private sibling legitimately
extends the tool registry beyond canonical — so the boundary model and the per-repo extension model
are in tension for this one file. Either `doctor/tools.rs` needs an explicit boundary carve-out (e.g.
tracking only a canonical _subset_ of tool definitions, with each repo layering its own extensions on
top), or the byte-identity gate check needs to accept known, intentional per-repo supersets rather than
requiring a literal `diff -r` match. Left unresolved, every Phase Gate's "byte-identical to canonical"
check (tasks #59, #102, #146) will report drift on this file indefinitely, masking genuinely
unpropagated fixes among expected structural differences.

**Home**: routed — doc-only portion landed inline as a "Known exception (tracked, not yet
reconciled)" note in
[`sdlc-gate-standard.md` § rhino-cli Byte-Identity Boundary](../../../docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary)
(no new disclosure — reuses the "infra-only IaC" framing that document already states publicly for
the private sibling). The code-level fix (narrow `BOUNDARY_PATHS` or an accepted-superset comparison mode)
is `apps/rhino-cli` work, so per the code-routing rule it is filed as a follow-up idea brief instead
of landed inline:
[`rhino-cli-tools-superset-carveout`](../../../plans/ideas/q2-not-urgent-important/rhino-cli-tools-superset-carveout.md)
(filed as an idea brief rather than a full backlog plan, since it needs a design decision between
two directions before a five-document plan is warranted — the correct promotion path per
`plans/ideas/README.md`).

### PR #22 (the private sibling) Cycle 1 CI gate skipped a second time — same outage, worse symptom (webhook throttling, not job cancellation)

**Observed**: After pushing the dotnet-channel propagation fix (`6ff8b1775`, then a retry empty commit
`099b2a100`) to the private sibling's PR #22, no `pull_request` workflow run was created at all — not queued,
not cancelled, simply absent (`gh api .../commits/<sha>/status` reported `total_count: 0`). Root cause:
`githubstatus.com`'s unresolved-incidents feed explicitly stated _"Webhook triggers are currently
throttled... we are processing approximately 15% of webhooks, so many events such as pushes and pull
requests are not triggering workflow runs"_ — a worse symptom of the same ongoing Actions outage that
cancelled ose-primer PR #20's Cycle 3 run earlier. Unlike PR #20's case, this repo's self-hosted
runners were confirmed online and idle (`gh api .../actions/runners` — 4/5 online, 0 busy); the failure
was entirely upstream of runner availability. One retry (an empty commit) also failed to trigger a run,
consistent with an ~85% webhook drop rate.

**Why it matters**: The session's standing `/goal` (user-set) had already generalized the PR #20
exception into a explicit standing policy for this session — _"if github runner down and blocking the
PR quality gate, just continue, don't make it a blocker... but keep the pr review cycle"_ — so this
instance did not require a fresh AskUserQuestion round; it was pre-authorized. The private sibling's branch
protection API also 403s with _"Upgrade to GitHub Pro... to enable this feature"_, confirming (as with
`ose-primer`) that no required-status-check is actually enforced on a free-tier private repo, so no
admin-override merge is needed later either. The review-cycle discipline itself (scout → specialists →
synthesis → fixer, 3 full cycles) still runs in full per the standing goal — only the CI-gate
confirmation step is treated as non-blocking during the outage.

**Home**: routed inline — repo-relevance gate applies (this instance is private-sibling-sourced), so
only the generalized, repo-agnostic failure signature (webhook-trigger absence, distinct from job
cancellation) was folded into
[`ci-blocker-resolution.md` § Operational CI-Availability Exceptions](../../../repo-governance/development/quality/ci-blocker-resolution.md#operational-ci-availability-exceptions)
— no private-sibling-specific detail (repo name, PR number, runner-pool identity, branch-protection
tier) was carried into this `ose-public` document.

### PR #22 (the private sibling) Cycle 2 CI gate skipped a third time — same outage, still active hours later

**Observed**: After Cycle 2's fixer pushed `00f153b99` (12 of 13 threads resolved, full local
verification green — 1353 cargo tests, clippy clean, fmt clean, `gate validate` exit 0, `nx affected`
green, `validate:sync` passed), `gh api .../commits/00f153b99.../status` again reported
`total_count: 0` — no `pull_request` run created. Re-checked `githubstatus.com` directly (not just
recalled from memory): overall status is still `Partial System Outage`, with an explicit open
incident "Incident with Actions" at status `investigating` and the Actions component still showing
`major_outage`. This is the same outage as the PR #20 and PR #22-Cycle-1 instances, now confirmed
still ongoing multiple hours later, not a new or resolved-then-recurring incident.

**Why it matters**: Same standing `/goal` pre-authorization applies — no fresh confirmation needed.
Reinforces that this outage is long-duration, not a brief blip, so every subsequent cycle gate in this
plan (Cycle 3 here, and all of Phase 5/6's cycles) should expect the same bypass to potentially be
needed again; each instance still gets its own live githubstatus.com check before bypassing, per the
established protocol, rather than assuming the outage is still active from a stale prior check.

**Home**: routed inline — same repo-relevance handling as the entry above; folded into the same
generalized `ci-blocker-resolution.md` section without carrying any private-sibling-specific detail
into `ose-public`.

### GitHub Actions outage resolved between cycles — always re-verify live, never assume still-down

**Observed**: PR #22's Cycle 3 CI gate check (head `417040c8a`) found `githubstatus.com` reporting
"All Systems Operational" and both `pull_request` runs genuinely `queued` (not `total_count: 0`) —
the multi-hour outage documented in the three entries above had resolved. Caught only because the
live check ran again rather than reusing the prior "still down" conclusion.

**Why it matters**: Confirms the established protocol (fresh live check before every bypass decision,
never assume from a stale prior check) is load-bearing, not belt-and-suspenders — an outage that
lasted hours can still resolve mid-plan, and skipping the fresh check would have caused an
unnecessary bypass on a cycle that didn't need one.

**Home**: routed inline — the "always re-verify live" rule is the load-bearing point of
`ci-blocker-resolution.md`'s new § Operational CI-Availability Exceptions (rule 2), carried in
generalized form alongside the entries above.

### A same-cycle PR rebase surfaced a real, narrow merge conflict, plus a generator/hand-edit trap

**Observed**: Between Cycle 3's fixer finishing and CI-gate time, `origin/main` advanced by one
unrelated commit (`169bbbc35`, a docs-only maintainer-onboarding refresh). `gh pr view` reported
`mergeable: CONFLICTING`; `git merge-tree` showed the only real conflict was 4 lines in
`package.json`'s `lint-staged` block — this PR's Cycle-2 fixer had added `--quiet` to four
`md ... validate` invocations, while the unrelated origin/main commit had independently added
`--exempt SECURITY.md` to the `md naming validate` line. Both were correct, additive, and
non-conflicting in intent. Resolving the conflict by hand (combining both) satisfied `git` but then
failed `gate validate` — `package.json`'s `lint-staged` block turned out to be marker-owned/generated
from `repo-config.yml`'s `command:` field via `gate emit --surface=pre-commit`, and the hand-resolved
`package.json` had drifted from what the registry would generate (the registry's `md-naming` entry
never had the `--exempt` flag baked into its `command:` string). Fixed by adding the flag to
`repo-config.yml` instead of `package.json`, then re-running `gate emit` to regenerate — which then
produced a byte-identical `package.json` to the hand-resolved one, confirming `gate validate`'s
purpose is exactly to catch this class of drift.

**Why it matters**: Two lessons. (1) A `CONFLICTING` PR state after a same-cycle CI check doesn't
mean the PR's own work is wrong — it can be pure divergence from unrelated concurrent activity on
`main`, resolvable by a normal rebase. (2) For any generated file (marker-owned block, lockfile,
manifest), a git merge conflict must be resolved at the _source_ the generator reads from, then
regenerated — never hand-resolved directly in the generated artifact, even when the hand-resolution
looks correct, because `gate validate` (or the equivalent drift check) is specifically designed to
catch exactly that kind of silent divergence.

**Home**: routed inline — repo-relevance gate applies (this instance is private-sibling-sourced, PR
#22), so only the generalized mechanism (not the repo name, PR number, or specific `package.json`
diff) was folded into
[`pr-merge-protocol.md` § Resolving Merge Conflicts in Generated Files](../../../repo-governance/development/workflow/pr-merge-protocol.md#resolving-merge-conflicts-in-generated-files),
cross-linked from the new `mechanize-cross-file-invariants.md` practice.

### PR #22's final CI gate hit a distinct infra failure class: self-hosted-runner filesystem permission, not a GitHub outage

**Observed**: After the rebase, PR #22's Cycle 3 CI gate (head `417040c8a`, then `417040c8a`
re-verified) showed GitHub Actions fully operational (`githubstatus.com`: "All Systems Operational")
and jobs genuinely queued/running — not the earlier webhook-throttling class. 12 of ~30 matrix jobs
then failed, all with the identical root cause `mkdir: cannot create directory '/usr/share/dotnet':
Permission denied` inside the shared `.github/actions/setup-dotnet` composite action (used as a
preamble step by every job in that job group, regardless of whether the job itself needs .NET).
Confirmed via full-log grep across every failed job ID that all 12 shared the exact same failure line.
Confirmed this predates nothing in PR #22's diff (the composite action file wasn't touched this cycle)
and that the identical workflow passed cleanly on this same PR ~12 hours earlier — so something
changed on the self-hosted runner host's filesystem/permissions between then and now, unrelated to
any code change here.

**Why it matters**: This is a _third_ distinct blocker class this plan has hit on the "CI gate
confirmation" step (webhook-throttling outage ×3, PR/origin-main divergence ×1, now self-hosted-runner
filesystem permission ×1) — each requires its own diagnostic signature to distinguish from an actual
code regression, and each was root-caused (not assumed) before being treated as non-blocking: read the
actual failure line, confirmed it's identical and generic across every failing job (not scoped to
specific gate logic), confirmed the composite action wasn't touched by this PR, confirmed the same
workflow passed before. The standing user-authorized exception text ("if github runner down... just
continue, don't make it a blocker") was written with the webhook-outage case in mind but reasonably
extends to this case too — a runner-host infra failure blocking the gate is the same shape of problem,
just a different mechanism. A human with access to the runner host still needs to fix the actual
`/usr/share/dotnet` ownership/permission (or reconfigure `DOTNET_ROOT`/`DOTNET_INSTALL_DIR` to a
user-writable path in the composite action) to prevent recurrence — flagged as a new `[HUMAN]`
follow-up, not fixed here since it requires host-level access this session doesn't have.

**Home**: routed inline — repo-relevance gate applies (private-sibling-sourced); the generalized
failure signature ("a generic, identical failure across many otherwise-unrelated matrix legs, traced
to a shared setup step") was folded into
[`ci-blocker-resolution.md` § Operational CI-Availability Exceptions](../../../repo-governance/development/quality/ci-blocker-resolution.md#operational-ci-availability-exceptions)
signature list, alongside the webhook-drop and job-cancellation signatures. No private-sibling-specific
detail (repo name, PR number, the `/usr/share/dotnet` path, the runner label) was carried into
`ose-public`.

## Scope Amendment: byte-identity boundary narrowed from four repos to two (2026-08-07)

**What changed**: mid-execution, after Phase 4 landed and with Phase 5 (`beaver-nest`) partially
executed but never pushed, the user directed a permanent scope narrowing: the enforced byte-identity
boundary drops from `ose-public` + `ose-primer` + the private sibling + `beaver-nest` to just `ose-public` +
the private sibling. Two independent decisions, given together:

1. **`beaver-nest` (Phase 5) is cancelled, not deferred.** `beaver-nest` is slated for future
   deprecation and eventual merge into `ose-public`. Real local commits existed in its attached
   worktree (`ce9aeb58a`, then `ed4543aa` after an Amazon-Q-agent-name fix) but were never pushed —
   the entire Phase 5 effort (registry authoring, hook/workflow rewiring, F# local-tool fix, OpenAPI
   codegen fix, Amazon Q agent-name fix — all individually real, verified work) is discarded rather
   than landed, because the repo it targets won't exist as a standalone byte-identity member much
   longer.
2. **`ose-primer` (Phase 3) keeps its already-merged landing (PR #3) but exits continuous
   enforcement.** Going forward it's synced periodically/manually, for cost reasons, not on every
   canonical change. This is a genuine scope reduction of an already-shipped capability, not a revert
   — the shipped propagation stays; only the _ongoing_ commitment to keep it live-synced is dropped.

**Why it matters**: this plan's central artifact was a formally specified four-repo transaction
protocol (open/resume/close/revert semantics, `delivery.md §Bounded Byte-Identity Propagation
Transaction`) with checklist items, PR-gate-blocking language, and task-numbered cross-references
baked into Phase 3/4/6 execution notes. A scope change of this shape — cutting the enforced set in
half mid-transaction — is not a small edit: it touches the transaction's closure condition, every
"all four repos" verification loop in Phase 6 (§6.1's composition/parity/audit-dispatch/
branch-protection checks), the Delivery Boundaries table, and the requirements docs (prd.md/brd.md/
tech-docs.md) whose Gherkin scenarios assert `beaver-nest` boundary membership as a requirement.
Treating cancellation as silent deletion would have destroyed the audit trail of real completed work
(Phase 5's checklist through P5-AMAZONQ-REBASE) and left dangling references (task numbers #228-231
cited by exact number in Phase 3/4 Gate execution notes; delivery.md's own task-tool mirror). The fix
applied throughout: mark cancelled/superseded inline with an explicit rationale and pointer to this
entry, never delete a completed-work record, and rescope every forward-looking script/loop/task
rather than leaving "four repos" language that would silently mislead the next execution pass.

**How to apply**: when a plan's scope narrows mid-execution (repo dropped from a boundary, phase
cancelled), audit for the same three surfaces every time — (1) the execution checklist's own
cross-phase language and any script that loops/enumerates the dropped members, (2) the ephemeral
task-tracker mirror (safe to delete stale never-executed entries there, since delivery.md carries the
durable record), (3) requirements/rationale docs whose acceptance criteria assert the old scope as a
live requirement (a banner pointing to the amendment is proportionate there — full Gherkin rewrite
across hundreds of scenario lines is not, since those docs are historical-design record, not the
execution source of truth). Verify empty-PR-state before claiming "nothing to close" —
`gh pr list --repo <repo> --state open` for both affected repos, confirmed `[]` on 2026-08-07.

**Home**: no durable-surface home — this is plan-specific execution history, fully captured in
`delivery.md`'s Scope Amendment section and this entry. No generalizable learnings beyond the
"how to apply" note above, which is narrow enough to stay here rather than route to a convention.
