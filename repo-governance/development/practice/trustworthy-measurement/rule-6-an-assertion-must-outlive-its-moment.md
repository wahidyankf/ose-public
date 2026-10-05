---
description: A test that can only pass before the change is committed is a transcript of a moment rather than a regression test
when_to_use: Use when writing a test that reads the repository around it, or that states a before-and-after claim.
---

# Rule 6: An Assertion Must Outlive Its Moment

## A baseline read from `HEAD` expires when the change lands

A step that proves a before-state by reading `git show HEAD:<path>` is honest on the day it is
written and false the moment the work is committed — `HEAD` then contains the change. Four such
steps in one suite could only ever pass in the uncommitted working tree of the phase that wrote
them, and went red as soon as that phase was committed.

The before-and-after framing belongs in the delivery checklist, where it is evidence, and in the
feature narrative, where it is prose. The executable assertion is the invariant that holds
afterwards, forever.

**Do**: assert the post-change invariant. Where a transition genuinely is the subject, build both
states in a temp fixture the test controls.
