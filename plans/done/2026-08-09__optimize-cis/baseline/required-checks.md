# Baseline — Required Status Check Contexts (2026-08-09)

Captured via `gh api repos/wahidyankf/<repo>/branches/main/protection --jq '.required_status_checks.contexts'`
(classic branch-protection API). Where that 404'd, the newer rulesets API
(`gh api repos/wahidyankf/<repo>/rules/branches/main`) was checked as a fallback and is recorded too.

## ose-public

Classic branch protection, `required_status_checks.contexts`:

```json
["Quality gate"]
```

`strict: true`, `enforce_admins.enabled: true`, `required_pull_request_reviews.required_approving_review_count: 0`.
Matches the plan's stated expectation exactly — `Quality gate` is the sole required context.

## ose-primer

Classic branch-protection endpoint: `404 Branch not protected`. `branches/main.protected` is `true`,
so protection is enforced via a **repository ruleset**, not classic branch protection. The ruleset
(`rules/branches/main`) enforces `deletion` (blocked), `non_fast_forward` (blocked),
`required_linear_history`, and a `pull_request` rule (`required_approving_review_count: 0`,
`required_review_thread_resolution: true`) — **no `required_status_checks` rule type is present**, so
no GitHub-required status-check context currently gates merges into `ose-primer`'s `main` via this
mechanism.

## The private sibling

Both the classic branch-protection endpoint and the rulesets endpoint return
`403 Upgrade to GitHub Pro or make this repository public to enable this feature` — **no protection
payload readable** for this private repo under the current plan/token. Recorded as an explicit gap
per the Phase 0 acceptance criterion; not a diverging repo-setting finding, just an API access limit.
