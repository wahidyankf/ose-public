---
name: social-linkedin-posting
description: Mechanics for social-linkedin-post-maker — the LinkedIn character-limit measurement rule, the no-vanity-metrics rule, the post file format, and the establish-window/gather/draft/measure/write workflow.
when_to_use: When implementing or maintaining social-linkedin-post-maker, or any agent that authors a LinkedIn post file in social-media-posts/linkedin/.
---

# LinkedIn Post Format and Workflow

## Overview

Every LinkedIn post is a file in `social-media-posts/linkedin/YYYY/` summarizing completed
`origin/main` work across the ose-public and private-sibling repos, under a hard 3,000
character body limit measured mechanically, never estimated.

## Reference Modules

- [hard-constraints-and-measurement.md](reference/hard-constraints-and-measurement.md) —
  the character-limit rule and measurement command, the no-vanity-metrics rule
- [file-format-and-workflow.md](reference/file-format-and-workflow.md) — the file path/name
  convention, the post template, and the 5-step establish-window→write workflow

## Core Principles

- **Always measure, never estimate.** The character count command is mechanical and exact — run
  it before finishing every post, trim and re-measure until under 3,000, never finish over.
- **Body vs. bookkeeping header are separate.** Only the `OPEN SHARIA ENTERPRISE` line downward is
  posted/counted; the `Posted:`/`Platform:`/`Window:` header above `---` never reaches LinkedIn and
  may carry internal vanity numbers the body itself must never state.
- **Completed work only.** Gather from `origin/main`, never local-only, staged, open-PR, or
  paused-plan work.
- **Baseline → result, not a changelog.** Compare the previous post's window end against the new
  window's completed state; compress routine synchronized changes into single clauses.

## Related Agents

`docs-maker` (creates documentation that may inspire posts), `readme-maker` (creates README
content).
