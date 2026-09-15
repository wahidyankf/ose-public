---
description: Three worked examples — default worktree-to-pr, direct push with backlog stage, and a single-repo subset.
when_to_use: Use when constructing an invocation of this workflow or explaining its behaviour with a concrete example.
---

# Example Usage

## Default: Both Parity Repos, worktree-to-pr, in-progress

```
User: "Run plan-multi-repo-parity-planning for objective: standardize markdown gates across
       ose-public and <private-sibling>"
```

The orchestrator surveys each repo, builds the deviation matrix, grills the invoker (Step 3),
optionally delegates research to `web-researcher` (Step 4), grills again post-research
(Step 5), authors one plan per repo in `plans/in-progress/standardize-markdown-gates/`,
gates each plan, and opens a draft PR per repo rather than pushing directly to `origin main` —
the repo-wide `worktree-to-pr` default.

## Direct push with backlog stage

```
User: "Run plan-multi-repo-parity-planning for objective: align agent catalogs
       mode: worktree-to-origin-main stage: backlog"
```

Creates one backlog plan per repo at `plans/backlog/align-agent-catalogs/`, gates
each, and pushes each plan directly to its repo's `origin main` via worktrees instead of opening
a PR. Useful when the invoker wants to skip the formal review step for low-risk plan documents.

## Subset of One Repo

```
User: "Run plan-multi-repo-parity-planning for objective: add test:coverage:behaviour gate
       repos: ose-public"
```

Surveys only `ose-public`, builds a single-column deviation matrix, grills the
invoker, authors one plan, and delivers it. The private sibling is excluded from this run.
