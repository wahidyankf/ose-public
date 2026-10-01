#!/usr/bin/env bash
# ==============================================================================
# record-status.sh — the leak review's merge precondition, made mechanical
# ==============================================================================
# Usage: scripts/leak-review/record-status.sh
#
#   LEAK_REVIEW_REPOSITORY    <owner>/<repository>
#   LEAK_REVIEW_PULL_REQUEST  the pull request's number
#   LEAK_REVIEW_MARKER        the record's marker name, without `:v1`
#   LEAK_REVIEW_REVIEWER      the login whose records count
#   LEAK_REVIEW_CONTEXT       the commit-status context (default: leak-review)
#
# Resolves the pull request's live head, finds the designated reviewer's latest
# undismissed review on exactly that head, and accepts it only when its record
# names this repository, this pull request, that head, and `pass` with every
# count zero. The verdict is published as a commit status on the head rather
# than as this job's own result: a status is bound to one commit by the API,
# so a review submitted after the last push turns the required status green
# without a new commit, and a moved head is never covered by an older verdict.
#
# Exit codes: 0 status published (either verdict), 2 the check could not run.
# ==============================================================================

set -euo pipefail

fail() {
	printf '[leak-review] %s\n' "$1" >&2
	exit 2
}

for name in LEAK_REVIEW_REPOSITORY LEAK_REVIEW_PULL_REQUEST LEAK_REVIEW_MARKER LEAK_REVIEW_REVIEWER; do
	[[ -n "${!name:-}" ]] || fail "$name is required"
done
repository=$LEAK_REVIEW_REPOSITORY
pull_request=$LEAK_REVIEW_PULL_REQUEST
context=${LEAK_REVIEW_CONTEXT:-leak-review}
[[ "$pull_request" =~ ^[0-9]+$ ]] || fail "LEAK_REVIEW_PULL_REQUEST is not a number"

head=$(gh api "repos/$repository/pulls/$pull_request" --jq .head.sha) || fail "cannot resolve the live head"
[[ "$head" =~ ^[0-9a-f]{40,64}$ ]] || fail "the live head is not a commit ID"

# The latest undismissed review the designated reviewer posted on this head.
body=$(gh api --paginate "repos/$repository/pulls/$pull_request/reviews" |
	jq -s -r --arg reviewer "$LEAK_REVIEW_REVIEWER" --arg head "$head" '
		[add // [] | .[]
			| select(.user.login == $reviewer and .commit_id == $head and .state != "DISMISSED")]
		| last | .body // ""
	') || fail "cannot read the pull request's reviews"

# The record is the JSON between `<!-- <marker>:v1` and the next `-->`.
record=$(printf '%s\n' "$body" | awk -v open="<!-- $LEAK_REVIEW_MARKER:v1" '
	index($0, open) == 1 { inside = 1; next }
	inside && /^-->/ { exit }
	inside { print }
')

verdict=failure
description="no pass record from the designated reviewer for this head"
if [[ -n "$record" ]] &&
	printf '%s' "$record" | jq -e --arg repository "$repository" --arg pull_request "$pull_request" \
		--arg head "$head" '
			.repository == $repository
			and (.pull_request | tostring) == $pull_request
			and .head_sha == $head
			and .result == "pass"
			and (.counts | type == "object" and length > 0 and all(.[]; . == 0))
		' >/dev/null 2>&1; then
	verdict=success
	description="pass record for this head"
fi

gh api --method POST "repos/$repository/statuses/$head" \
	-f state="$verdict" -f context="$context" -f description="$description" >/dev/null ||
	fail "cannot publish the status"
printf '[leak-review] %s: %s\n' "$verdict" "$description"
