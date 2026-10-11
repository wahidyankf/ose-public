---
title: "Artifact: Review Comments, Labeled by Severity"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 92
---

> ex-52 &middot; exercises co-05 &middot; blocking vs. nit vs. praise, so the author knows what must
> be resolved.

**Review of PR #151 (feat(loyalty): add points redemption)**:

```text
blocking: missing a test for redeeming more points than the balance holds -- this needs a
regression test before merge, since an over-redemption bug here directly affects account balances.

nit: `pts` could be spelled out as `points` for readability -- not blocking, your call.

praise: the early-return guard on a zero-amount redemption is a nice touch -- avoids a wasted
database write for a no-op call.
```

**Verify**: each comment is explicitly prefixed with its severity (`blocking`/`nit`/`praise`), and
only the `blocking` comment states a concrete required action ("needs a regression test before
merge") -- an author reading this list can immediately tell which one item is mandatory and which
two are optional, satisfying co-05's rule.

**Key takeaway**: three sentences of feedback, three different obligations -- and the label is what
makes that difference legible at a glance instead of requiring the author to infer tone.

**Why It Matters**: unlabeled feedback forces every comment to be treated as equally urgent (or
equally optional), which either stalls a PR on a nit or lets a real blocking issue slip through
because it read, in isolation, like a suggestion; per Example 21 (Google's own eng-practices
guidance), this labeling convention is one of the most
widely adopted lightweight fixes for exactly that ambiguity.
