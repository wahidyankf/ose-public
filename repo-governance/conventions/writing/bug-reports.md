---
description: >-
  Fixes what a reporter checks before filing a bug and what the report contains: the recorded duplicate search,
  reproduction steps, expected and actual behaviour, environment with version and commit, and pasted error text.
when_to_use: >-
  Use when filing a bug against a repository, when writing a bug-fix plan's report, or when writing the issue template
  or contributing guide that asks for one.
---

# Bug Reports

A bug report exists so that someone who was not there can make the failure happen again. Everything it contains is
chosen for that, and anything that does not help reproduce or judge the failure is noise the reader has to discard.

## Before Filing

1. **Search the existing reports** — open issues, open pull requests, in-flight plans, and idea briefs in the owning
   repository. The same failure may already be filed or in repair, and its discussion is usually further along than a
   fresh report would be. Add what is new to that report rather than opening a second one, and record each query and its
   result so a reader can trust the search rather than repeat it.
2. **Retry on the latest mainline.** The fix may already have landed, and a report against an old revision costs a
   maintainer the time to discover that. Record the version and commit the failure reproduces on.
3. **Check the documentation.** When behaviour differed from what a page said to expect, name the page. The report is
   then actionable either way: either the code is wrong or the page is.

## What a Report Contains

| Field              | Contains                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- |
| description        | what broke, in one or two sentences                                                       |
| steps to reproduce | the exact commands or actions, numbered, starting from a clean checkout                   |
| expected behaviour | what the documentation or the tool's own output led the reporter to expect                |
| actual behaviour   | what happened instead, quoted rather than paraphrased                                     |
| environment        | operating system, runtime and tool versions with commit, and any browser involved         |
| error output       | the error text itself, pasted as text, with a screenshot only where the problem is visual |

## Why Each Field Is Shaped This Way

Steps start from a clean checkout because local state is what a reporter most often forgets to mention, and a
reproduction that depends on it fails for everyone else.

Expected behaviour names its source because "not what I expected" cannot be judged. An expectation traced to a page or
an output line can.

Actual behaviour and error output are quoted because a paraphrase keeps the reporter's interpretation and drops the
detail that distinguishes one cause from another. Pasted text can be searched, copied, and matched against the source; a
picture of text can do none of those.

## What a Report Must Not Contain

A suspected security vulnerability does not go in a public report. It goes through the repository's private security
channel, because a public report publishes the weakness before a fix exists.

Pasted logs and environment details are outbound material, and
[Public Outbound Safety](../security/public-outbound-safety.md) governs what they may contain.

## From Report to Fix

A report says what fails; a fix also needs why and how. When the reporter will fix the defect at its owner, the report
becomes the first section of a [bug-fix plan](../structure/plans/bug-fix-plan.md), which adds the root cause and a
referenced solution. A defect not fixed now is filed as a [two-pager](../structure/plans/two-pager-template.md) carrying
the report. A defect in a consumed tool follows
[Upstream Tool Defects](../../development/workflow/upstream-tool-defects.md).

## Enforcement

A repository that accepts reports can carry this shape in its own issue template, with an input for each field above.
This repository carries it for outside readers in [CONTRIBUTING.md](../../../CONTRIBUTING.md#reporting-bugs), which
links here rather than restating the rationale.
