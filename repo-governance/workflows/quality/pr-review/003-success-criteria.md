---
description: "Defines clean, findings, and stale scenarios."
when_to_use: "Use when validating the workflow's observable behaviour."
---

# Success Criteria

```gherkin
Scenario: Explicit clean pass
  Given a user invokes pr-review for an open pull request
  When the routed reviewers retain no findings on the pinned head
  Then exactly one COMMENT review is posted
  And authenticated ose-pr-review-pass:v1 evidence reports clean

Scenario: Explicit pass finds issues
  Given a user invokes pr-review
  When synthesis retains findings
  Then final-status is findings
  And no fixer, CI wait, or retry runs

Scenario: Head changes before posting
  Given review work used a pinned head
  When the live head differs before the review POST
  Then no review is posted
  And final-status is stale
```
