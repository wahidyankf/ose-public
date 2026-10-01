#!/usr/bin/env bash
# ==============================================================================
# run.sh — tests for record-status.sh against a stand-in forge
# ==============================================================================
# Usage: bash scripts/leak-review/tests/run.sh
#
# A fake `gh` on PATH serves a fixed head and a fixture list of reviews, and
# records the status the script publishes, so every case runs offline.
# ==============================================================================

set -uo pipefail

here=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
script="$here/../record-status.sh"
work=$(mktemp -d "${TMPDIR:-/tmp}/leak-review-test.XXXXXX")
trap 'rm -rf "$work"' EXIT

head_sha=$(printf 'a%.0s' {1..40})
old_sha=$(printf 'b%.0s' {1..40})

mkdir -p "$work/bin"
cat >"$work/bin/gh" <<'FAKE'
#!/usr/bin/env bash
# Stand-in forge: answers the three calls record-status.sh makes.
case "$*" in
*"--jq .head.sha"*) printf '%s\n' "$FAKE_HEAD" ;;
*"/reviews"*) cat "$FAKE_REVIEWS" ;;
*"/statuses/"*) printf '%s\n' "$*" >"$FAKE_STATUS" ;;
*) exit 9 ;;
esac
FAKE
chmod +x "$work/bin/gh"

review() {
	# review <login> <commit> <state> <result> <secret-count>
	local record
	record=$(printf '{"repository":"owner/repo","pull_request":"7","head_sha":"%s","result":"%s","counts":{"secret_or_private_value":%s,"protected_environment_property":0,"machine_specific_absolute_path":0}}' "$2" "$4" "$5")
	jq -n --arg login "$1" --arg commit "$2" --arg state "$3" --arg body "Leak review.
<!-- test-marker:v1
$record
-->" '{user: {login: $login}, commit_id: $commit, state: $state, body: $body}'
}

pass=0
fail=0
check() {
	# check <name> <want-state> <review json...>
	local name=$1 want=$2 got
	shift 2
	printf '%s\n' "$@" | jq -s '.' >"$work/reviews.json"
	rm -f "$work/status"
	PATH="$work/bin:$PATH" FAKE_HEAD="$head_sha" FAKE_REVIEWS="$work/reviews.json" FAKE_STATUS="$work/status" \
		LEAK_REVIEW_REPOSITORY=owner/repo LEAK_REVIEW_PULL_REQUEST=7 LEAK_REVIEW_MARKER=test-marker \
		LEAK_REVIEW_REVIEWER=owner bash "$script" >/dev/null 2>&1
	got=$(grep -o 'state=[a-z]*' "$work/status" 2>/dev/null)
	if [[ "$got" == "state=$want" && "$(cat "$work/status")" == *"statuses/$head_sha"* ]]; then
		pass=$((pass + 1))
		echo "  ok   $name"
	else
		fail=$((fail + 1))
		echo "  FAIL $name (expected state=$want, got ${got:-nothing})" >&2
	fi
}

check "pass record on the live head" success "$(review owner "$head_sha" COMMENTED pass 0)"
check "no review at all" failure
check "pass record on an earlier head" failure "$(review owner "$old_sha" COMMENTED pass 0)"
check "findings record on the live head" failure "$(review owner "$head_sha" COMMENTED findings 1)"
check "pass claiming a nonzero count" failure "$(review owner "$head_sha" COMMENTED pass 1)"
check "dismissed pass record" failure "$(review owner "$head_sha" DISMISSED pass 0)"
check "pass record from another login" failure "$(review someone "$head_sha" COMMENTED pass 0)"
check "latest review supersedes an earlier pass" failure \
	"$(review owner "$head_sha" COMMENTED pass 0)" "$(review owner "$head_sha" COMMENTED findings 1)"

echo
echo "leak-review tests: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
