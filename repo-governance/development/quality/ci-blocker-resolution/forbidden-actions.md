---
description: "Actions forbidden when resolving a CI blocker."
when_to_use: "Use before skipping, disabling, or bypassing a CI check."
---

# Forbidden Actions

The following actions are **explicitly forbidden** as responses to preexisting CI blockers. The [worktree-to-PR pre-authorization](../../workflow/git-push-safety/rule.md#worktree-to-pr-pre-authorization) moves hook execution into the pull-request gate; it never waives a failing gate, so none of these become permitted:

| Forbidden Action                                              | Why It Is Wrong                                                |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| `git push --no-verify`                                        | Bypasses all quality gates, ships broken code to remote        |
| `git commit --no-verify`                                      | Bypasses pre-commit validation, hides formatting/config issues |
| Adding `skip()` or `.skip` to failing tests                   | Hides the failure instead of fixing it                         |
| Adding `@ts-ignore` or `// eslint-disable` to suppress errors | Silences the symptom, root cause remains                       |
| Commenting out failing test assertions                        | Destroys test coverage, hides regressions                      |
| Removing failing tests entirely (without replacing them)      | Reduces quality coverage                                       |
| Adding `cache: false` to work around stale cache issues       | Masks a cache configuration problem                            |
| Saying "it was broken before my changes" and moving on        | Abdicates responsibility for repository health                 |
| Creating a "fix later" ticket without fixing now              | Defers the problem indefinitely                                |
