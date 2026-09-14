---
description: >-
  Requires every behaviour-changing delivery item to route to a named verification layer, leaving no unspecified review
  bucket.
when_to_use: >-
  Use when deciding how a delivery item will be verified, or when a plan proposes a review step with no named method.
---

# Verification Routing

Every delivery item that changes behaviour routes to at least one named verification layer. The routing is closed: there
is no general "review" bucket.

| Layer           | Establishes                                                     | Cannot establish                    |
| --------------- | --------------------------------------------------------------- | ----------------------------------- |
| automated       | that a stated property holds, repeatably                        | that the property was the right one |
| exploratory     | that nothing unexpected happens in normal use                   | coverage                            |
| usability       | that a correct result is also usable                            | correctness                         |
| device-specific | that it holds on real targets, where rendering and input differ | anything about targets not tested   |

An item may route to several. It may not route to none, and it may not route to something unnamed.

## Why the Bucket Is Banned

"Reviewed" is the most common verification claim and the least falsifiable one. It names no method, so nothing can be
re-run, and it names no criterion, so nothing can disagree with it.

Naming the layer forces the useful question early: what would actually show this is wrong? An item for which no layer
fits is usually an item whose acceptance criterion is not testable — and that is worth discovering while the plan is
being written rather than at the end.

## Green Automation Is Not Sufficient by Itself

Where a change has a user-facing surface, automation is necessary and not sufficient, and substantive completion stays
false while a required layer is unresolved.

What each layer proves, what an assertion must state before it runs, and how interface alternatives are chosen belong to
the [Manual Behavioural Verification](../../quality/manual-behavioural-verification.md) convention. This module owns only the routing rule: every
behaviour-changing item names its layer.

## Evidence Is Recorded, Not Asserted

Each routed item produces evidence: the command, the commit, when it ran, the result, and any findings, sanitized.

Evidence is itself accessible. A screenshot with no description records nothing to anyone who cannot see it, including
every automated check and every future reader working from a terminal.
