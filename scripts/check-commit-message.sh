#!/usr/bin/env bash
# Commit-message format lint, run at the commit-msg hook and at the pull-request surface.
# The registry binds the message text into RHINO_GATE_MESSAGE, so this script never trusts a file path.
# At pull-request that text is every message in the range joined into one blob, and an empty range leaves it empty.
# Each commit is linted on its own by scripts/check-commit-range.sh.
# Commitlint reads the message on standard input and checks it against commitlint.config.js.
set -euo pipefail

if [ -z "${RHINO_GATE_MESSAGE:-}" ]; then
	# A pull-request range with no commits has nothing to lint. Any other empty message fails, because a commit-msg
	# run that passed one would let `git commit --allow-empty-message` record a commit with no message.
	if [ "${RHINO_GATE_SURFACE:-}" = "pull-request" ]; then
		echo "no commit messages in the range; nothing to lint"
		exit 0
	fi
	echo "RHINO_GATE_MESSAGE is required" >&2
	exit 1
fi
printf '%s\n' "$RHINO_GATE_MESSAGE" | npm exec -- commitlint
