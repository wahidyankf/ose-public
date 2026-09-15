# Dependency / library updates

One-line summary: a standing sweep to move the repo's pinned library dependencies forward as their
soak windows clear, rather than letting them drift stale.

> Idea, added (original capture undated; development-experience item — source line: "libraries update").
> Relocated from private-sibling/plans/ideas/dependency-library-updates.md on 2026-08-06 by plan-ideas-grooming.

## Problem / context

The repo pins its dependencies exactly (per the dependency-bump policy), which is safe but means
versions only advance when someone deliberately bumps them. There is no periodic sweep to promote
pinned libraries to newer patches/minors once they satisfy the policy's soak and CVE-clean gates, so
dependencies can quietly fall behind. No baseline measured — the current staleness gap across the
lockfiles has not been quantified.

### Measured baseline as of 2026-07-31 (was previously unquantified)

The "no baseline measured" note above is now partly answered. The `deps-audit` CI job on `main` has
been failing since before 2026-07-31 (run `30607494072`, 05:41Z), with three independent causes:

1. **npm** — `34 vulnerabilities (2 low, 16 moderate, 13 high, 3 critical)`, concentrated in Next.js
   (multiple App Router / Server Actions SSRF, cache-confusion, and DoS advisories), plus `@babel/core`
   (GHSA-4x5r-pxfx-6jf8, high), `esbuild` (GHSA-g7r4-m6w7-qqqr, high), and `brace-expansion` DoS.
2. **cargo** — `failed to get 'coralpolyp-contracts' as a dependency of package 'coralpolyp-be'`
   (`No such file or directory`), alongside `Blocking waiting for file lock on package cache`. This
   reads as a runner-workspace/path-resolution problem rather than a real dependency break, and is
   **separable from the version sweep — probably a quick standalone fix**.
3. **cargo-deny** — advisories check currently **skipped by design** (upstream RUSTSEC-2026-0124
   advisory-db corruption); bans/licenses/sources still enforced.

Surfaced during `expand-on-premise-fleet-using-node-c` (its `learnings.md` L-9) and deliberately not
fixed there: a 34-advisory bump spanning Next.js, Babel, and esbuild is a framework-upgrade effort with
its own regression surface, and folding it into an on-premise fleet plan would have mixed unrelated
risk into an infra change.

**This raises the urgency below from "not acutely urgent".** Three critical advisories sitting on
`main` with a red `deps-audit` is a different posture from ordinary staleness drift — and a permanently
red job also trains everyone to ignore it, which is its own failure mode.

## Why now

Not acutely urgent, but staleness compounds: the longer a bump is deferred, the larger and riskier the
eventual jump, and deferred bumps can accumulate un-cleared CVEs. A standing, incremental sweep keeps
each step small.

## Prior art / precedents

- **Dependency-bump policy** — the internal three-path soak/CVE-clean policy this sweep advances
  within. dependency-bump-policy.md (private, not linked)
- **adopt-dependency-bump-policy / dependency-bump plans** — prior in-repo work that codified and ran
  this exact bump discipline. adopt plan (private, not linked),
  bump plan (private, not linked)
- **GitHub Dependabot version updates** — established pattern of automated PRs advancing dependencies
  with a stabilization cooldown. [dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates)
- **Renovate** — multi-language automated dependency-update tool with scheduling, the direct external
  analogue of this sweep. [renovate](https://docs.renovatebot.com/)

## Proposed direction (sketch)

- Periodically enumerate pinned dependencies whose newer versions have cleared the dependency-bump
  policy gates (LTS/soak window elapsed, CVE-clean across the required sources).
- Bump the eligible ones in small, reviewable batches with exact pins.
- Escalate anything on the CISA-KEV fast-track or high-EPSS path per the policy.

## Rough scope & non-goals

In scope: incremental, policy-compliant advancement of already-pinned library dependencies.

Out of scope (for now): major-version migrations that need their own design work; changing the
dependency-bump policy itself; toolchain (language/runtime) version pins.

## Risks & open questions

- What cadence makes sense — per-release, monthly, or event-driven when a CVE lands? (open)
- Can eligibility (soak elapsed + CVE-clean) be checked mechanically, or does each bump need manual
  review? (open)
- Which bumps are large enough to need their own backlog plan rather than an inline batch? (open)

## What success looks like + promotion signal

Success: pinned dependencies advance steadily within policy, with no library sitting stale past its
eligibility window and no un-cleared CVE lingering on a deferred bump. Ready to promote to a `backlog/`
plan once the cadence and the eligibility-check mechanism are decided — the bumps themselves are routine.
