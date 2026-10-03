---
description: "Termination criteria (PASS, Partial, FAIL), Gherkin success criteria, and known pitfalls of the AI benchmark refresh."
when_to_use: "Use when deciding whether a refresh run is finished, or when a step misbehaves."
---

# Termination and Pitfalls

## Termination Criteria

- PASS: **Success**: clean-up passes and `final-status` is `deployed`, `no-change`, or
  `merged-not-deployed` after `deploy=false` or a declined deploy
- **Partial**: `final-status` is `deploy-unverified`, or clean-up ended in RETAIN or failed; the report
  names what is missing. `deployed` needs both the READY and the browser proofs of Step 6.
- FAIL: **Failure**: `final-status` is `failed` because a gate cannot be made green at the root cause, or
  the deploy reaches ERROR. Roll back by redeploying the previous `prod-ayokoding-www` commit through
  `swe-releaser` (Deploy mode, `ayokoding-www` target), after the same per-instance force-push approval as Step 6.

`halted` from Step 2 is a valid stop awaiting the user, not a failure.

## Success Criteria

```gherkin
Scenario: Refresh lands and deploys
  Given research changed the dataset and no methodology trigger fired
  When the PR merges and the user approves the force-push of the merged SHA
  Then the Vercel deployment for that SHA is READY
  And the en and id pages show the new last-updated date
  And clean-up leaves the primary checkout's main level with origin/main

Scenario: Research finds a methodology change
  Given a pinned benchmark version is superseded
  When the user chooses to change the methodology at Step 2
  Then final-status is halted
  And no methodology file is edited

Scenario: Nothing changed
  Given research matches the current dataset
  When Step 3 produces no edit
  Then final-status is no-change
  And the run goes straight to clean-up

Scenario: Prices-only refresh
  Given scope is prices
  When Step 1 runs
  Then no results research runs
  And benchmark figures stay unchanged

Scenario: Verification fails
  Given a Step 4 check cannot pass at the root cause
  When the run evaluates Step 4
  Then final-status is failed
  And no PR merges

Scenario: Deploy declined
  Given deploy is false or the user declines the force-push
  When the PR has merged
  Then final-status is merged-not-deployed
  And clean-up still runs

Scenario: Deploy cannot be verified
  Given the force-push of the approved SHA ran
  When READY or the live-page check cannot be confirmed
  Then final-status is deploy-unverified
  And the outcome is Partial

Scenario: Production build fails
  Given the Vercel deployment for the merged SHA reaches ERROR
  When Step 6 reads the terminal state
  Then final-status is failed
  And the previous prod-ayokoding-www commit is redeployed after approval

Scenario: Clean-up retains an artifact
  Given clean-up ends in RETAIN
  When the run reports
  Then the outcome is Partial
  And the report names the retained artifact
```

## Known Pitfalls

- **Wrong working directory.** Cucumber step files resolve feature paths from `process.cwd()`. Fix: run the
  `apps/ayokoding-www` vitest suites from `apps/ayokoding-www`.
- **`curl` proves no content.** The page bails out to client-side rendering. Fix: verify content in a
  browser.
- **The apex redirect drops the query string.** `ayokoding.com` redirects to `www` without it. Fix: verify
  shared URLs on `www.ayokoding.com`.
- **HIPPO sheds the `heavy` e2e run under host memory pressure.** Shedding is supervision, not a defect.
  Fix: recover per
  [Recovery and Safe Retry](../../../development/practice/resource-aware-development/recovery-and-safe-retry.md)
  and rerun the same target; never swap the system under test. When it still cannot run, the run ends as
  `failed`.
- **The pre-commit `convention-emoji` gate scans the gitignored, regenerable
  `apps/ayokoding-www/generated/`.** Fix: delete it before committing.
