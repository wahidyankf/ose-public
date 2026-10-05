# Thread Enumeration and API Gotchas

## Enumerating Unresolved Threads (GitHub Reviews API Only)

Before triage or any branch mutation, read the posted cycle's `ose-pr-review:v1` `head_sha` and
query the live PR `headRefOid`. Require exact equality. On mismatch, make no code change: reply to
each stale thread with a disposition-v3 cited rejection carrying `effect: stale-cycle-only`,
resolve it, and return for a fresh scout. The orchestrator separately posts the durable cycle
non-credit event, including when the review has zero threads. This disposes of obsolete evidence,
not the claim; never replace an existing finding's recorded SHA.

Read PR review state exclusively through the GitHub **Reviews API** — never through top-level
`gh pr comment` output, which cannot anchor to a line and cannot be resolved. Top-level PR
comments are not review state and are never used to decide what remains open.

**List unresolved threads** with a `gh api graphql` query filtering `reviewThreads` on
`isResolved: false`:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 10) {
              nodes { databaseId body path line }
            }
          }
        }
      }
    }
  }' -f owner="$OWNER" -f repo="$REPO" -F pr="$PR_NUMBER"
```

Filter the returned nodes to `isResolved: false` client-side if the schema does not expose a
direct argument. Each thread's leading comment carries a `databaseId` — this is the exact value
the REST API calls `comment_id`, used when replying via
`gh api repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies` (or the GraphQL
equivalent).

## Three Confirmed Live-API Gotchas

**The `{pull_number}` segment is required** — the reply path without it returns 404, confirmed
live against a PR on 2026-07-20. It is easy to omit because the sibling _read_
endpoint for a single review comment genuinely is `repos/{owner}/{repo}/pulls/comments/{comment_id}`,
with no pull number; only the reply sub-resource is nested under the pull.

**Posting a reply body from a file — use `-F`, not `-f`**: when a reply is drafted to a temp file
and posted with `gh api ... -f body=@/path/to/file`, `gh` treats `@/path/to/file` as the
**literal string value**, not a file reference — only the capitalized `-F body=@/path/to/file`
triggers `gh`'s `@file`-read behaviour. The lowercase form silently posts the literal
`@/path/to/file` text as the comment body.

**Multi-reply loops in this environment's shell (zsh) are 1-indexed**: a bash-style
`${threads[$i-1]}` off-by-one compensation in a loop that posts one reply per thread targets the
wrong array element here, silently misposting each reply to the wrong thread. Verify by
re-reading posted comment bodies via GraphQL after any multi-item posting loop, not just by
checking exit codes.

**[Unverified] spot-check reminder**: the precise GraphQL field casing for `reviewThreads`
filtering and for the `resolveReviewThread` mutation should be spot-checked against live GitHub
API docs at execution time — delegate to `web-researcher` if more than a single doc fetch is
needed — rather than assumed from this file. GitHub's GraphQL schema moves faster than any
document describing it.
