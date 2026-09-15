# Take the oxlint upgrade deliberately, and stop CI-gating tools resolving at run time

One-line summary: 22 lint call sites fetched `npx oxlint@latest` at gate time, so oxlint 1.79.0's
publish turned a two-hour-old green PR red on a file its diff never touched — the pin to 1.78.0 that
unblocked that PR froze a real `set-state-in-effect` defect in place and left the wider class
(everything else the toolchain resolves at run time) unenumerated.

> Provenance: demoted from the full `backlog/` plan `oxlint-upgrade-and-lint-reproducibility/` to a
> two-pager on 2026-08-21. Filed 2026-08-18 by
> [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md)'s Knowledge Capture phase.

## Problem / context

On 2026-08-18, `ose-public` PR #227 passed its TypeScript quality gate at 13:48 against head
`bd55b19c7`. oxlint 1.79.0 published at 15:10:39Z, adding `react(set-state-in-effect)`. At 15:47 the
same gate failed against head `a652996e6` — and `git diff --name-only bd55b19c7..a652996e6 -- apps/ose-www/src`
was empty. The diff was innocent; the toolchain moved under it.

The failure is real, not spurious. `apps/ose-www/src/features/search/shell/search-dialog.tsx:36`
calls `setResults([])` synchronously inside an effect's guard branch, scheduling a second render
immediately after the first on every sub-threshold keystroke. The line was last touched by the
unrelated commit `5f7f8fdbe`, so a stricter linter surfaced a pre-existing defect rather than
damaging anything.

The differential was checked rather than assumed: against identical source, oxlint 1.78.0 exits 0 and
1.79.0 exits 1 on that file. `repo-rules-sweep` then pinned **1.78.0** across all 22 call sites (21 in
`ose-public`, 1 in the private sibling) under the
[Code-Routing Downstream Rule](../../../repo-governance/development/quality/knowledge-capture/the-code-routing-downstream-rule.md)'s
blocker carve-out. That pin defers the finding three ways: the render defect is still shipped, every
subsequent oxlint improvement is now invisible, and nobody has asked what **else** among
`project.json`, `package.json`, `.github/workflows/`, and `.husky/` resolves a version at run time.

## Why now

The exposure is live and unbounded in timing: any upstream release, on any day, can redden every open
PR in both repos at once, pointing at code nobody touched — the most expensive failure shape to
diagnose, because every instinct says read the diff. Establishing the cause here required correlating
an npm publish timestamp against two CI run timestamps and proving an empty diff for the named tree;
nothing prevents paying that cost again. Meanwhile a pin nobody revisits is how a toolchain quietly
becomes abandoned, and 1.78.0 has now been frozen since 2026-08-18.

## Prior art / precedents

- [`repo-rules-sweep`](../../done/2026-08-18__repo-rules-sweep/README.md) — where this surfaced and
  where the 1.78.0 pin was applied; the first thing to re-read on promotion.
- [Dependency Bump Stability & Safety Policy](../../../repo-governance/development/workflow/dependency-bump-policy.md)
  — oxlint carries no LTS line, so **Path B** (60-day soak + CVE-clean) governs any new pin; "current"
  means current-within-path, never the newest tag.
- [post-cutoff-dependency-migrations](../q2-not-urgent-important/post-cutoff-dependency-migrations.md)
  — the sibling idea on version drift the repo has not yet absorbed.
- [Feature Change Completeness](../../../repo-governance/development/quality/feature-change-completeness.md)
  — the fix changes observable app behaviour, so it carries companion `specs/` Gherkin.
- **Renovate / Dependabot** — the industry answer to "pinning must not mean stagnating"; a candidate
  outcome, deliberately not a premise.

## Proposed direction (sketch)

- **Fix the defect first, alone.** Derive during render — `const visibleResults = !query || query.length < 2 ? [] : results;`
  — and drop the synchronous guard `setResults([])`, leaving the effect with only its debounce. This
  beats disabling the rule: it removes a render per sub-threshold keystroke and states the empty-state
  rule in one readable line instead of implying it through effect ordering.
- **Then take the upgrade as its own unit.** Run the candidate oxlint across all 22 sites _before_
  moving the pin, record the complete finding list as the specification, and give every finding a
  written disposition — fixed, or disabled in `oxlint.json` with a stated reason. Both repos move
  together or they diverge.
- **Then enumerate the class.** Sweep for `npx <pkg>@latest`, bare `npx` on undeclared packages,
  `curl | sh` installers, and unpinned `uses:` action refs; produce a per-item verdict (pinned /
  deliberately floating with reason / must pin) before choosing any durable mechanism.

## Rough scope & non-goals

In scope: `apps/ose-www/src/features/search/shell/search-dialog.tsx` plus its companion Gherkin and
unit tests; the oxlint pin in both repos' root `package.json`; `oxlint.json` rule dispositions; the
run-time-resolution enumeration across both repos.

Out of scope (for now):

- Replacing oxlint, or removing the eslint pairing alongside it.
- Committing to a specific dependency-update bot — that is a candidate WS-O3 outcome, not a premise.
- The twenty orphaned `rhino-cli` test binaries (separate follow-up).

## Risks & open questions

- **Which version does Path B actually select at execution time?** The authoring-time candidate was
  `1.71.0` (published 2026-06-22), which is _older_ than the current 1.78.0 pin — so the honest
  reading may be that the pin is already ahead of policy and the upgrade is a downgrade-plus-waiver.
  That contradiction is unresolved and blocks promotion. (open)
- **How large is the upgrade's finding set?** 1.79.0 alone fired on this repo; a multi-version jump
  could surface enough findings to be its own plan. Unknown until the pre-pin run happens. (open)
- **Which durable mechanism?** A governance convention plus a `rhino-cli` validator carries the
  four-repo parity-manifest obligation and its own TDD cycle; update automation carries a vendor
  choice. Neither has been costed. (open)
- Confounding: if the upgrade and the `search-dialog` fix land together, a failure cannot be
  attributed to either. Sequencing is load-bearing, not stylistic.
- Vacuous verification: the enumeration's detection rule must be proven non-zero against a
  deliberately reintroduced unpinned invocation before any zero from it is trusted.

## What success looks like + promotion signal

Success: `react(set-state-in-effect)` no longer fires on `search-dialog.tsx` under the _new_ oxlint,
with a regression test demonstrated to fail before the fix and pass after; both repos declare a
byte-identical, deliberately-chosen oxlint version with a recorded CVE clearance status; every
upgrade finding carries a written disposition; and the count of unverdicted run-time-resolving
invocations is zero in both repos.

Promotion signal: the Path B contradiction above is resolved — one `npm view oxlint time --json` run
at promotion time settles whether the eligible version is ahead of or behind 1.78.0, which decides
whether this is an upgrade plan or a waiver-and-hold plan. That single command is all that stands
between this brief and a promotable plan; it is deliberately deferred so the answer is fresh rather
than stale.
