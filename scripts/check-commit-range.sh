#!/usr/bin/env bash
# Commit-message format lint over each commit of a pull request's range, one commit at a time.
# The registry binds the base and head commit ids into COMMIT_RANGE_BASE and COMMIT_RANGE_HEAD. Each message is linted
# alone, because the pull-request message input joins the whole range into one blob with no commit boundaries.
# Merge commits are skipped, as that message input skips them. An empty range has nothing to lint and passes.
set -euo pipefail

: "${COMMIT_RANGE_BASE:?COMMIT_RANGE_BASE is required}"
: "${COMMIT_RANGE_HEAD:?COMMIT_RANGE_HEAD is required}"

# Command substitution, not a process substitution, so an unknown base or head stops the script instead of passing an
# empty range.
commits=$(git rev-list --no-merges "$COMMIT_RANGE_BASE..$COMMIT_RANGE_HEAD")
status=0
while IFS= read -r commit; do
	[ -n "$commit" ] || continue
	if ! git log -1 --format=%B "$commit" | npm exec -- commitlint; then
		echo "commit $commit has a message that fails Commitlint" >&2
		status=1
	fi
done <<<"$commits"
exit "$status"
