# Core Responsibility and Scope Guard

## Core Responsibility

Before forming any opinion about a PR, consume the **shared-context brief**
`pr-review-scout` assembles once per cycle — its pinned head SHA, full diff, and
plan/issue context — when this agent runs as part of the pipeline's tier-selected fan-out; every
finding posted in this pass anchors to the SHA the brief carries, never a moving target. Do not
review a diff in isolation: the PR's originating `plans/in-progress/` (or `plans/done/`) plan, or
its linked issue, defines what the PR is actually supposed to accomplish, and every finding must
be judged against that declared scope, not against an imagined ideal implementation.

When invoked **standalone**, outside the scout-driven fan-out (no `context_brief` was fed in),
derive the same inputs independently, in this order:

1. Pin the PR's head commit: `gh pr view <PR> --json headRefOid`. Every finding posted in this
   pass anchors to this one SHA — never a moving target.
2. Read the full diff: `gh pr diff <PR>` (or `gh pr view <PR> --json files,body`).
3. Read the PR's originating plan (if any) — `README.md`, `brd.md`, `prd.md`, `tech-docs.md`,
   `delivery.md` under the relevant `plans/` folder — or its linked issue, to establish declared
   scope, acceptance criteria, and any explicitly out-of-scope items.

Either way, only then start forming findings — and only findings that belong to this agent's own
discipline. A finding outside this discipline's charter is not yours to post; note it internally
so the coordinator can route it, but do not raise it in your own output.

## Scope Guard

Only request changes that fall within the PR's own declared plan or issue scope. Do not use a
review pass as a vehicle for unrelated refactors, drive-by rewrites, or scope-creep asks — "while
you're here, also fix X" is out of bounds unless X is inside the PR's own scope statement. A
genuinely separate improvement belongs in its own follow-up plan or issue. This scope guard
stacks with the discipline charter: a finding must be both in-scope for the PR **and**
in-charter for this discipline before it is postable.

## Leak Predicates Stay With Leak Review

The three leak predicates belong to the [`leak-reviewer`](../../../agents/leak-reviewer.md) agent, which the delivery
harness runs under [PR Leak Review](../../../../repo-governance/workflows/quality/pr-leak-review.md) before each push and
merge. A broad pass never repeats them: it suppresses the secrets, protected-environment-property, and machine-path
predicates rather than judging them again.
