# Guard against test files that no Vitest project's glob matches

One-line summary: a test file can be well-written, logically correct, and completely useless if its
path matches no configured Vitest project's `include` glob — it reports as covered, runs zero times,
and nothing in the toolchain says a word.

> Demoted 2026-08-05 from a full `backlog/` plan to this two-pager, carrying its origin forward: an
> `ayokoding-www` regression test silently executed zero times because it landed outside every
> configured Vitest project's `include` glob, surfaced during the
> [`ayokoding-www-tools-ai-benchmark`](../../done/2026-07-30__ayokoding-www-tools-ai-benchmark/README.md)
> PR #122 cycle-3 review (`pr-review-integrity-checker`, HIGH finding F2).

## Problem / context

`apps/ayokoding-www/vitest.config.ts` splits its tests into two named `projects`. The `unit` project
runs under a Node environment and includes `test/unit/be-steps/**/*.steps.ts` plus
`**/*.unit.{test,spec}.{ts,tsx}`. The `unit-fe` project runs under jsdom and, at the time, included
`test/unit/fe-steps/**/*.steps.{ts,tsx}` plus `src/features/**/*.test.{ts,tsx}`. The EWT-003
regression test landed at `src/app/[locale]/tools/ai-benchmark/benchmark-content.test.tsx` — a path
neither glob matched.

`pr-review-integrity-checker` proved the consequence empirically rather than by inspection: it reverted
the actual EWT-003 code fix and re-ran the full suite, which still passed **144/144 test files** with
the bug fully reintroduced. The regression test meant to catch it never executed. No error, no
warning, no skip count — with `passWithNoTests: true` set at the top level, zero files matched reads
identically to zero files failed.

This is the **silent-false-pass** class: a check that cannot fail certifies nothing, yet it occupies
the same slot in every status report as a check that can. It is strictly worse than a missing test,
because a missing test at least leaves a visible hole.
[Trustworthy Measurement — Rule 5](../../../repo-governance/development/practice/trustworthy-measurement/rule-5-probes-and-scans-must-assert-their-reach.md)
covers the same failure class from the acceptance-evidence angle, and
[`mermaid-validator-does-not-check-syntax`](../q1-urgent-important/mermaid-validator-does-not-check-syntax.md) covers it
from the validator angle. This brief covers the test-discovery angle.

The specific glob was widened inline in that PR — `unit-fe` now also includes
`src/app/**/*.test.{ts,tsx}`, with `**/*.unit.test.{ts,tsx}` excluded so already-covered files do not
double-run under jsdom. That fix is done and merged. The **class** is not fixed anywhere.

### The mirror-image failure: a glob too wide (2026-08-18)

The same config fails the other way, and the second direction is louder but no better understood.
The `unit` project's `include` is `**/*.unit.{test,spec}.{ts,tsx}` with `exclude: ["node_modules"]`.
Vitest's default excludes cover `**/dist/**` but not `.next/`, so after
`nx build ayokoding-www` populates `apps/ayokoding-www/.next/standalone/` with flattened copies of
`src/`, every `*.unit.test.ts` in that build output is discovered as a real test — and fails, because
the flattening breaks its relative imports (`Cannot find module '../../core/manifest-integrity'`).

Surfaced during `repo-clean-up`: an `nx affected -t build,test:quick,lint` run passed, then the very
next `git push` failed its pre-push `test:quick` on five phantom failures — because the _earlier
build_ had created the files the _later test run_ discovered. Deleting `.next/standalone` and
re-running passed. Ordering-dependent, fully reproducible, and it makes a green build the cause of a
red test.

Both directions have the same root shape: nothing asserts that the set of files a glob matches is
the set anyone intended. A guard for the narrow case (a `*.test.ts` no project matches) and the wide
case (a matched file outside `src/` and `test/`) is the same guard.

## Why now

The only thing that caught this was a specialist reviewer manually reverting a fix and re-running the
suite — an expensive, discretionary act that happens on a small fraction of PRs. Nothing automated
looks for it. Every new route segment, feature slice, or `apps/*`/`libs/*` project is a fresh chance
to add a test file under a directory shape no existing glob covers, and each one lands green. The
population of already-silent test files in this repo is unmeasured and, by construction, invisible to
every check currently running. Meanwhile the repo's own
[Regression Test Mandate](../../../repo-governance/development/quality/regression-test-mandate.md)
requires a reproducing test with every bug fix — a rule this defect defeats silently while appearing
to satisfy it.

## Prior art / precedents

- **Trustworthy Measurement — Rule 5** — the same silent-false-pass class, framed as a
  falsifiability probe that must move the byte a check actually guards; its negative-case proof is
  exactly the technique that caught this one.
  [rule](../../../repo-governance/development/practice/trustworthy-measurement/rule-5-probes-and-scans-must-assert-their-reach.md)
- **`mermaid-validator-does-not-check-syntax`** — a validator cited as the correctness gate that
  never parses syntax; same shape, different surface.
  [brief](../q1-urgent-important/mermaid-validator-does-not-check-syntax.md)
- **Regression Test Mandate** — the governance rule this defect defeats while appearing to satisfy
  it; a guard here restores the mandate's teeth.
  [regression-test-mandate](../../../repo-governance/development/quality/regression-test-mandate.md)
- **Specs & feature-change-completeness gate** — the existing anti-hollow-spec machinery, and the
  closest precedent for "a spec/test that exists but proves nothing"; a glob-coverage guard is the
  test-discovery analogue.
  [feature-change-completeness](../../../repo-governance/development/quality/feature-change-completeness.md)
- **Nx targets convention** — the canonical target model any new guard must thread through if it
  lands as a wired target rather than a checker-agent enhancement.
  [nx-targets](../../../repo-governance/development/infra/nx-targets.md)

## Proposed direction (sketch)

Build a coverage-of-globs check that inverts the usual question. Instead of asking "did the
configured tests pass?", ask "is there a test file on disk that no configured project would ever
run?" For each project with a test-runner config exposing named `include` globs, enumerate every
`*.test.{ts,tsx}`, `*.steps.{ts,tsx}`, and `*.unit.test.{ts,tsx}` file under its source tree, and
fail on any file matching zero configured project globs — reporting the offending path and the reason
(glob mismatch), not just a count.

Two design decisions stay open and shape everything else: where the guard lives (a lightweight script
wired into an existing Nx target versus an enhancement to `ci-checker` or `swe-code-checker`), and
whether it blocks CI or files a checker report. Whichever home wins, the guard must be validated in
both directions — it reports zero uncovered files against the current repo, **and** it reports exactly
the offending file when the pre-fix `unit-fe` glob is synthetically reintroduced. A guard proven only
in the passing direction is the same defect one level up.

## Rough scope & non-goals

In scope:

- A durable, automated guard that fails when a test file exists outside every configured
  test-project's glob.
- An investigation step to settle the guard's home, failure mode, and breadth before any code lands.
- Both-direction validation of the guard itself against a synthetic reintroduction of the original
  gap.

Out of scope:

- Re-litigating the specific `unit-fe` glob fix already merged in `ayokoding-www-tools-ai-benchmark`'s
  PR #122 — that content is settled and must not be reopened under cover of this work.
- Any change to test **content** or assertions; this detects path-to-glob coverage gaps only.
- Test-runner configs beyond those exposing named `include` globs, unless the investigation shows the
  same mechanism generalizes cheaply.

## Risks & open questions

- **Where does the guard live?** A new script plus an Nx target, or an enhancement to `ci-checker` or
  `swe-code-checker`? The two homes imply different failure modes and different maintenance owners.
  (open — this is the decision that unblocks everything else)
- **CI-blocking or checker-report?** Blocking is the only mode that actually prevents recurrence, but
  a false positive then breaks every push. (open)
- **How broad at first?** Every `apps/*`/`libs/*` project with a Vitest config, or start narrowly with
  `ayokoding-www` — the project where the gap was found — and expand once proven? (open)
- **Does this generalize past Vitest?** Other runners in the monorepo express discovery differently;
  a Vitest-only guard leaves the same hole open elsewhere, while a runner-agnostic one is a much
  larger build. (open)
- **Undecided ownership could stall the fix indefinitely.** The risk here is scheduling drift rather
  than a wrong technical choice — the investigation is cheap, but nobody currently owns starting it.
- **Naming conventions are a trap, not a fix.** Renaming an offending file to `*.unit.test.tsx` routes
  it to the Node-environment project with no `setupFiles`, where `@testing-library/react`'s `render()`
  hard-fails. Any guard that suggests remediation must not suggest that one.

## What success looks like + promotion signal

Success: zero silently-uncovered test files across all Vitest-configured projects, established by an
automated check rather than by manual glob review or a reviewer's discretionary revert-and-rerun. The
guard passes against the current repo state and demonstrably fails against a reintroduced glob gap —
both directions verified, not just the green one.

**Promotion signal**: promote to a full plan once the guard's home is decided (script-plus-Nx-target
versus checker-agent enhancement) and its failure mode is chosen (CI-blocking versus report). Those
two answers determine the plan's entire shape, and neither needs a plan to answer — a short
investigation settles both. A second independent instance of the same silent-zero-execution defect in
any project would also force promotion regardless of whether those questions are settled.
