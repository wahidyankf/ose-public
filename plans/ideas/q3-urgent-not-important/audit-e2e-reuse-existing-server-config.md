# A stale dev server can silently absorb an e2e run via `reuseExistingServer`

One-line summary: Playwright's `reuseExistingServer: true` is hardcoded unconditionally across most
of this repo's `*-e2e` configs, so any long-lived process already bound to the target port silently
replaces the suite's own configured `webServer.command` — and its env vars — making the run exercise
the wrong build with no warning.

> Demoted 2026-08-05 from a full `backlog/` plan (`README.md`, `brd.md`, `prd.md`, `tech-docs.md`, a
> two-phase gated `delivery.md`, and an empty `learnings.md`) to this two-pager. The full plan had a
> `worktree-to-pr` delivery mode, Gherkin acceptance criteria covering the ephemeral-vs-persistent
> runner branch, and a Phase 1 investigation gate — none of which was ever started. It was itself
> filed from a Knowledge Capture learning surfaced during
> [`ayokoding-www-tools-ai-benchmark`](../../done/2026-07-30__ayokoding-www-tools-ai-benchmark/README.md)'s
> Phase 10 Rule-15 retest.

## Problem / context

While running a scoped `ayokoding-www-fe-e2e` subset, a `next dev` process started hours earlier —
before that session's code changes — was already listening on the app's port. Playwright's
`reuseExistingServer: true` found it and skipped running the configured `webServer.command`
entirely, so the e2e run exercised stale dev-mode code instead of the production build the config
actually specifies (`NODE_ENV: "production"`, a standalone server, and e2e-specific env vars such as
`AYOKODING_WEB_MANIFESTS_DIR`). A later full e2e run against that same stale server produced a wall
of unrelated-looking failures, every one of them traceable to the reused server never having had the
e2e fixture manifests directory wired in.

A repo-wide grep on 2026-07-30 recorded the setting hardcoded `true` unconditionally — not gated on
`!process.env.CI` — in six configs: `apps/ayokoding-www-fe-e2e`, `apps/ayokoding-www-be-e2e`,
`apps/organiclever-www-fe-e2e`, `apps/wahidyankf-www-fe-e2e`, `apps/ose-www-fe-e2e`, and
`apps/ose-www-be-e2e`. A re-check on 2026-08-05 finds **five** still hardcoded —
`apps/ayokoding-www-be-e2e/playwright.config.ts:29`,
`apps/ayokoding-www-fe-e2e/playwright.config.ts:74`,
`apps/organiclever-www-fe-e2e/playwright.config.ts:28`,
`apps/ose-www-be-e2e/playwright.config.ts:29`, and
`apps/ose-www-fe-e2e/playwright.config.ts:35` — because
`apps/wahidyankf-www-fe-e2e/playwright.config.ts`
now carries no `webServer` block at all, so the setting is simply absent there. Exactly one config
gates it correctly:
[`apps/organiclever-app-web-e2e/playwright.config.ts:53`](../../../apps/organiclever-app-web-e2e/playwright.config.ts)
uses `reuseExistingServer: !process.env.CI`. The setting is a Playwright-documented local-dev
convenience: it reuses **any** process already bound to the target port, including one from an
unrelated earlier session, and emits no warning that the configured command and env were skipped.

## Why now

The failure mode is silent and costs debugging time wildly disproportionate to its cause — a single
config flag produced a wall of failures that read as application defects. Worse, the same mechanism
can mask a real regression by running the suite green against a build that is not the code under
test, which undermines every e2e gate that depends on it. The drift in the config population between
2026-07-30 and 2026-08-05 (six down to five, via an unrelated config losing its `webServer` block)
also shows this surface changes without anyone tracking it, so the audit gets harder the longer it
waits.

## Prior art / precedents

- [`apps/organiclever-app-web-e2e/playwright.config.ts`](../../../apps/organiclever-app-web-e2e/playwright.config.ts)
  — the in-repo correct pattern (`reuseExistingServer: !process.env.CI`); the remedy for the other
  configs is most likely to copy it verbatim.
- [Playwright e2e development skill](../../../.claude/skills/swe-developing-e2e-test-with-playwright/SKILL.md)
  — the authoritative in-repo home for Playwright standards, and the natural place for a documented
  caveat if the remedy turns out to be documentation rather than config.
- [`ci-checker` agent](../../../.agents/agents/ci-checker.md) — already validates projects against CI
  conventions including E2E pairing and env-variable compliance; the plausible host for an automated
  guard flagging any new `*-e2e` config that hardcodes `true`.
- [`ayokoding-www-e2e-flake-under-concurrent-load`](./ayokoding-www-e2e-flake-under-concurrent-load.md) — a sibling
  brief in the same class: an e2e suite whose result depends on ambient environment state rather
  than the code under test.
- [`fundamentally-strong-software-engineer` learnings](../../done/2026-07-19__fundamentally-strong-software-engineer/learnings.md#openapi-generator-cli-jar-download-race-is-a-second-concurrency-flake-class)
  — records a shared-tool-cache concurrency race on a co-triggered self-hosted runner and
  generalizes it; direct evidence that this repo's runners are not unconditionally ephemeral, which
  is the fact the investigation below hinges on.

## Proposed direction (sketch)

First determine whether the affected configs' CI runners are ephemeral per job or shared/persistent,
by reading the workflow YAML runner labels against this repo's self-hosted versus GitHub-hosted
runner usage, and record a per-config verdict with its evidence. If runners are ephemeral, the risk
is local-development-only and the remedy is a documented caveat for developers and agents running
e2e locally. If runners are shared or persistent, each hardcoded config should adopt
`organiclever-app-web-e2e`'s `!process.env.CI` gate. Independently of that branch, decide whether a
lightweight automated guard — a `ci-checker` rule, or a comment convention — should flag any future
`*-e2e` config that sets `reuseExistingServer: true` unconditionally.

## Rough scope & non-goals

In scope: the `playwright.config.ts` files that hardcode `reuseExistingServer: true` (five as of
2026-08-05, six as originally recorded); the CI-runner persistence verdict per config; and the
decision on whether the remedy is a CI-conditional gate, a doc caveat, both, or an automated check.

Explicitly out of scope:

- Any change to the e2e test scenarios or assertions those configs drive.
- Re-litigating the already-fixed `ayokoding-www-tools-ai-benchmark` incident this was filed from.
- Broader Playwright config standardization beyond the `reuseExistingServer` setting itself.

## Risks & open questions

- **Are the CI runners ephemeral per job or shared/persistent?** This is the pivot the whole remedy
  choice hangs on, and it is unresolved. The self-hosted-runner concurrency race recorded in the
  `fundamentally-strong-software-engineer` learnings is evidence against a blanket "ephemeral"
  assumption, but it does not settle the question per config. (open)
- **Does the config population still match the original audit?** It already does not — the
  2026-07-30 list of six is down to five, and `wahidyankf-www-fe-e2e` lost its `webServer` block
  entirely rather than gaining a gate. Whether that removal was deliberate, and whether that suite
  now relies on an externally started server, is unknown. (open) **Update 2026-09-01:**
  `wahidyankf-www-fe-e2e` was removed from this repository along with `wahidyankf-www`, so this
  question is closed by deletion rather than answered. The audit's remaining scope is the five
  configs listed above, all of which are still here.
- **Is an automated guard worth its maintenance cost?** A `ci-checker` rule catches future
  regressions but adds a rule to maintain; a comment convention is cheaper but unenforced. (open)
- **Scope creep into the configs' test scenarios** — the remedy is limited to the
  `reuseExistingServer` setting, and touching six-ish config files invites unrelated cleanup. This
  is a known rabbit hole rather than an unknown.

## What success looks like + promotion signal

Success: no `*-e2e` Playwright config hardcodes `reuseExistingServer: true` without a documented,
evidenced reason, and an e2e run can no longer pass or fail on the strength of an unrelated process
that happens to hold the port. Promote to a full plan once the CI-runner persistence question is
answered with evidence for each affected config — that single answer collapses the remedy from three
branches to one, at which point the work is a mechanical config edit plus an optional guard rather
than an investigation. A second, independent promotion trigger: a repeat incident where a stale
server absorbs an e2e run, which would move this from latent risk to recurring cost.
