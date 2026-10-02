---
description: "The bot-identity and REQUEST_CHANGES gap, not yet resolved."
when_to_use: "Use when investigating the bot-identity review gap."
---

# Future Work: Bot Identity and the REQUEST_CHANGES Gap

## Future Work

The discipline split, the cost- and noise-control mechanics, and the post-cutover monitoring plan
above describe the pipeline as it stands today. Three items remain deliberately outside this
convention's own scope — each depends on a decision, an infrastructure fact, or ongoing measurement
that belongs in its own document rather than being folded into this convention's normative rules.

### Bot Identity and the `REQUEST_CHANGES` Gap

Only `pr-review-checker` posts to the PR — through the GitHub Reviews API, as the sole poster
of record; the nine specialists never post, they hand their raw findings to the coordinator. The
coordinator authenticates as the PR author's own identity, and GitHub rejects a `REQUEST_CHANGES`
review submitted against one's own pull request. Every blocking review — including one carrying a
CRITICAL finding — therefore lands with review STATE `COMMENT` instead of `REQUEST_CHANGES`, so a
consumer that gates on STATE alone reads a blocked PR as unblocked while a CRITICAL finding sits open
on it. This convention does not own closing that gap. No bot or GitHub App identity is added by this
plan. A future change must demonstrate the need, then provision and verify an independently posting
identity before review STATE can become authoritative; until then, the AI-attribution footer and the
finding text remain the authority.
