---
description: "Why every review this workflow posts lands as COMMENT, and why blocking status is read from the finding's severity label rather than GitHub's review STATE field."
when_to_use: "Use when writing or auditing any gate, script, or agent step that decides whether a PR is blocked."
---

# Review STATE Is Never the Gate

**HARD — `REQUEST_CHANGES` is structurally unavailable to `pr-review-synthesis-maker`.** The
mechanics are stated once, in the coordinator's own required module
[github-reviews-api-mechanics.md](../../../../.agents/skills/pr-review-synthesis-coordination/reference/github-reviews-api-mechanics.md),
and are not restated here — that is the copy the posting agent reads, and a second copy drifts from
it unnoticed. What this layer adds is the consequence for the workflow: `gh`
authenticates as the PR author under this repo's current identity posture, and GitHub rejects
`REQUEST_CHANGES` on one's own pull request. Every review this workflow posts therefore lands with
STATE `COMMENT`, including reviews carrying CRITICAL blocking findings.

**Any gate reading GitHub's review state instead of the finding text will read a blocked PR as
unblocked.** That is the whole reason this page exists: the failure is silent and it fails open.

Blocking status is carried by the finding's severity label in the comment body (`CRITICAL` /
`HIGH`), never by the review's STATE field. Consumers MUST parse severity from comment text.

No dedicated bot or GitHub App identity is added by this plan. Consumers MUST continue to use finding
severity rather than review STATE until a separately evidence-backed change provisions and verifies an
independently posting identity.

## Enforcement

None automated. A violation is visible as a consumer branching on a review's STATE field instead
of parsing severity from the comment text.
