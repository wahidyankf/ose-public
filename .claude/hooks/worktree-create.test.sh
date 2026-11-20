#!/usr/bin/env bash
# Tests for worktree-create.sh. Each case runs the hook as Claude Code does (a WorktreeCreate payload on
# stdin) inside a disposable git repository, then asserts the exit status, the last stdout line, and what
# changed in git: worktrees and branches. Both directions are checked. A suite that only saw creation
# would pass a hook that never defers, and one that only saw deferral would pass a hook that defers to
# everything.
#
# Fixtures follow repo-governance/development/quality/git-fixture-isolation.md: discovery is capped at the
# fixture root, global and system config are blanked, every write is preceded by an escape guard, and the
# fixture identity reaches git through the environment, so no config file is written.
set -uo pipefail

HOOK="$(cd "$(dirname "$0")" && pwd -P)/worktree-create.sh"
BASE=$(mktemp -d)
BASE=$(cd "$BASE" && pwd -P)
trap 'rm -rf "$BASE"' EXIT
FIXTURE_HOME="$BASE/home"
EMPTY_TEMPLATE="$BASE/empty-template"
ERR="$BASE/stderr"
mkdir -p "$FIXTURE_HOME" "$EMPTY_TEMPLATE"
pass=0
fail=0
REPO=""
CODE=0
OUT=""
LAST=""
WT_BEFORE=""
WT_AFTER=""
BR_BEFORE=""
BR_AFTER=""

ok() {
	pass=$((pass + 1))
	echo "PASS: $1"
}

bad() {
	fail=$((fail + 1))
	echo "FAIL: $1"
}

# git_in ARGS... — git under the fixture environment: no ambient config, discovery capped at $BASE, and a
# throwaway identity supplied through the environment, which writes nothing to any config file.
git_in() {
	env -i PATH="$PATH" HOME="$FIXTURE_HOME" GIT_CEILING_DIRECTORIES="$BASE" \
		GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 \
		GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.invalid \
		GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.invalid \
		git "$@"
}

# assert_fixture_root DIR — escape guard: stop before any write unless git resolves DIR as its own top level.
assert_fixture_root() {
	local want got
	want=$(cd "$1" && pwd -P)
	got=$(git_in -C "$1" rev-parse --show-toplevel 2>/dev/null) || got=""
	if [ "$got" != "$want" ]; then
		echo "ABORT: escape guard: '$1' resolves to '$got', not '$want'" >&2
		exit 99
	fi
}

# has_line TEXT LINE — succeeds when LINE is a whole line of TEXT.
has_line() {
	case $'\n'"$1"$'\n' in
	*$'\n'"$2"$'\n'*) return 0 ;;
	*) return 1 ;;
	esac
}

# make_repo NAME — a fresh repository on main with one commit, at $BASE/NAME/repo. Sets REPO.
make_repo() {
	REPO="$BASE/$1/repo"
	mkdir -p "$REPO"
	git_in -C "$REPO" init -q -b main --template="$EMPTY_TEMPLATE"
	assert_fixture_root "$REPO"
	git_in -C "$REPO" commit -q --allow-empty -m "fixture root"
}

# write_settings JSON — writes the repository's project settings file, the one the hook reads.
write_settings() {
	mkdir -p "$REPO/.claude"
	printf '%s\n' "$1" >"$REPO/.claude/settings.json"
}

# register_worktree_hooks COMMAND... — project settings with one WorktreeCreate group per COMMAND, in the
# shape Claude Code uses.
register_worktree_hooks() {
	write_settings "$(jq -cn '{hooks: {WorktreeCreate: [$ARGS.positional[] | {hooks: [{type: "command", command: .}]}]}}' --args "$@")"
}

# run_hook CWD [NAME] — sends a WorktreeCreate payload to the hook from CWD. Sets CODE, OUT, and LAST (the
# last stdout line), and records the worktree and branch listings before and after, so each case asserts
# what changed on disk.
run_hook() {
	local cwd=$1 name=${2-} payload
	if [ -n "$name" ]; then
		payload=$(jq -cn --arg cwd "$cwd" --arg name "$name" '{hook_event_name: "WorktreeCreate", cwd: $cwd, name: $name}')
	else
		payload=$(jq -cn --arg cwd "$cwd" '{hook_event_name: "WorktreeCreate", cwd: $cwd}')
	fi
	WT_BEFORE=$(git_in -C "$REPO" worktree list --porcelain)
	BR_BEFORE=$(git_in -C "$REPO" for-each-ref --format='%(refname)' refs/heads)
	rm -f "$ERR"
	OUT=$(printf '%s' "$payload" | env -i PATH="$PATH" HOME="$FIXTURE_HOME" GIT_CEILING_DIRECTORIES="$BASE" \
		GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 \
		CLAUDE_PROJECT_DIR="$REPO" bash "$HOOK" 2>"$ERR")
	CODE=$?
	LAST=$(printf '%s\n' "$OUT" | tail -n 1)
	WT_AFTER=$(git_in -C "$REPO" worktree list --porcelain)
	BR_AFTER=$(git_in -C "$REPO" for-each-ref --format='%(refname)' refs/heads)
}

# expect_created LABEL NAME — exit 0, the path printed last, a worktree on branch worktree/NAME, and the
# worktree registered with git.
expect_created() {
	local label=$1 name=$2 path head=""
	path="$REPO/worktrees/$name"
	if [ "$CODE" -ne 0 ]; then
		bad "$label: exit $CODE, want 0"
		return
	fi
	if [ "$LAST" != "$path" ]; then
		bad "$label: last stdout line '$LAST', want '$path'"
		return
	fi
	if [ -d "$path" ]; then
		head=$(git_in -C "$path" symbolic-ref --short HEAD 2>/dev/null) || head=""
	fi
	if [ "$head" != "worktree/$name" ]; then
		bad "$label: '$path' is on branch '$head', want worktree/$name"
		return
	fi
	if ! has_line "$WT_AFTER" "worktree $path"; then
		bad "$label: $path is not in git worktree list"
		return
	fi
	ok "$label"
}

# expect_deferred LABEL NAME — exit 0, the path printed last, one stderr note line, and nothing created:
# no worktree directory, no worktree/NAME branch, and the worktree and branch listings unchanged.
expect_deferred() {
	local label=$1 name=$2 path lines
	path="$REPO/worktrees/$name"
	if [ "$CODE" -ne 0 ]; then
		bad "$label: exit $CODE, want 0"
		return
	fi
	if [ "$LAST" != "$path" ]; then
		bad "$label: last stdout line '$LAST', want '$path'"
		return
	fi
	lines=$(grep -c . "$ERR" || true)
	if [ "$lines" -ne 1 ]; then
		bad "$label: stderr has $lines non-empty lines, want one note"
		return
	fi
	if [ -e "$path" ]; then
		bad "$label: $path was created"
		return
	fi
	if git_in -C "$REPO" show-ref --verify --quiet "refs/heads/worktree/$name"; then
		bad "$label: branch worktree/$name was created"
		return
	fi
	if [ "$WT_AFTER" != "$WT_BEFORE" ] || [ "$BR_AFTER" != "$BR_BEFORE" ]; then
		bad "$label: git worktree or branch listing changed"
		return
	fi
	ok "$label"
}

# auto_name_shape NAME — succeeds when NAME has the auto-YYYYMMDD-HHMMSS shape the hook generates.
auto_name_shape() {
	case $1 in
	auto-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9][0-9][0-9]) return 0 ;;
	*) return 1 ;;
	esac
}

# Case 1: no project settings file, so the hook creates the worktree as it always has.
make_repo no-settings
run_hook "$REPO" feature-plain
expect_created "1 no settings file creates worktrees/<name> on worktree/<name>" feature-plain

# Case 2: a project WorktreeCreate hook running another command defers, and nothing is created.
make_repo foreign-hook
register_worktree_hooks "hansip worktree create"
run_hook "$REPO" feature-foreign
expect_deferred "2 project WorktreeCreate hook running another command defers" feature-foreign
if [ -e "$REPO/worktrees" ]; then
	bad "2 worktrees/ directory was created by a deferred run"
else
	ok "2 no worktrees/ directory after a deferred run"
fi
if [ "$(printf '%s\n' "$WT_AFTER" | grep -c '^worktree ')" -eq 1 ]; then
	ok "2 git worktree list still holds only the main checkout"
else
	bad "2 git worktree list gained an entry during a deferred run"
fi

# Case 3: a registration of this script itself, in each spelling, does not defer.
make_repo self-absolute
register_worktree_hooks "$REPO/.claude/hooks/worktree-create.sh"
run_hook "$REPO" feature-self-absolute
expect_created "3a absolute self-registration is not deferred" feature-self-absolute

make_repo self-project-dir
register_worktree_hooks "\"\$CLAUDE_PROJECT_DIR\"/.claude/hooks/worktree-create.sh"
run_hook "$REPO" feature-self-project-dir
expect_created "3b \"\$CLAUDE_PROJECT_DIR\" self-registration is not deferred" feature-self-project-dir

make_repo self-relative
register_worktree_hooks "bash .claude/hooks/worktree-create.sh"
run_hook "$REPO" feature-self-relative
expect_created "3c relative self-registration is not deferred" feature-self-relative

# Case 4: a mix of self and foreign entries defers, whatever the order, in the nested or the flat shape.
make_repo mixed-self-first
register_worktree_hooks "bash .claude/hooks/worktree-create.sh" "hansip worktree create"
run_hook "$REPO" feature-mixed-self-first
expect_deferred "4a one self entry plus one foreign entry defers" feature-mixed-self-first

make_repo mixed-foreign-first
register_worktree_hooks "hansip worktree create" "\"\$CLAUDE_PROJECT_DIR\"/.claude/hooks/worktree-create.sh"
run_hook "$REPO" feature-mixed-foreign-first
expect_deferred "4b foreign entry before a self entry still defers" feature-mixed-foreign-first

make_repo flat-foreign
write_settings '{"hooks":{"WorktreeCreate":[{"command":"hansip worktree create"}]}}'
run_hook "$REPO" feature-flat-foreign
expect_deferred "4c flat entry with a top-level foreign command defers" feature-flat-foreign

make_repo flat-self
write_settings '{"hooks":{"WorktreeCreate":[{"command":".claude/hooks/worktree-create.sh"}]}}'
run_hook "$REPO" feature-flat-self
expect_created "4d flat entry running only this script is not deferred" feature-flat-self

# Case 5: declarations that hold no foreign command, or no readable settings, keep the default behaviour.
make_repo empty-array
write_settings '{"hooks":{"WorktreeCreate":[]}}'
run_hook "$REPO" feature-empty-array
expect_created "5a empty WorktreeCreate array creates the worktree" feature-empty-array

make_repo no-worktree-key
write_settings '{"hooks":{"PreToolUse":[{"hooks":[{"type":"command","command":"echo hello"}]}]}}'
run_hook "$REPO" feature-no-key
expect_created "5b hooks without a WorktreeCreate key create the worktree" feature-no-key

make_repo malformed-json
write_settings '{"hooks":'
run_hook "$REPO" feature-malformed
expect_created "5c malformed settings JSON creates the worktree" feature-malformed

# Case 6: a cwd inside a linked worktree resolves the main repository, and the main repository's settings decide.
make_repo linked-cwd-foreign-main
register_worktree_hooks "hansip worktree create"
assert_fixture_root "$REPO"
git_in -C "$REPO" worktree add -q -b worktree/existing "$REPO/worktrees/existing"
run_hook "$REPO/worktrees/existing" feature-from-linked
expect_deferred "6a cwd in a linked worktree defers by the main repository's settings" feature-from-linked

make_repo linked-cwd-foreign-linked
assert_fixture_root "$REPO"
git_in -C "$REPO" worktree add -q -b worktree/existing "$REPO/worktrees/existing"
mkdir -p "$REPO/worktrees/existing/.claude"
printf '%s\n' '{"hooks":{"WorktreeCreate":[{"hooks":[{"type":"command","command":"hansip worktree create"}]}]}}' \
	>"$REPO/worktrees/existing/.claude/settings.json"
run_hook "$REPO/worktrees/existing" feature-from-linked-plain
expect_created "6b a linked worktree's own foreign hook does not defer; creation lands under the main root" feature-from-linked-plain

# Case 7: a payload without a name gets an auto-generated name, in both directions.
make_repo auto-name-created
run_hook "$REPO"
auto_name_shape "${LAST##*/}" || bad "7a auto name has the wrong shape: '$LAST'"
expect_created "7a payload without a name creates an auto-named worktree" "${LAST##*/}"

make_repo auto-name-deferred
register_worktree_hooks "hansip worktree create"
run_hook "$REPO"
auto_name_shape "${LAST##*/}" || bad "7b auto name has the wrong shape: '$LAST'"
expect_deferred "7b payload without a name defers with an auto-generated name" "${LAST##*/}"

# Case 8: rerunning the hook is idempotent in both directions.
make_repo rerun-created
run_hook "$REPO" feature-rerun
expect_created "8a first run creates the worktree" feature-rerun
run_hook "$REPO" feature-rerun
expect_created "8b second run reuses the worktree" feature-rerun
if [ "$WT_AFTER" = "$WT_BEFORE" ] && [ "$BR_AFTER" = "$BR_BEFORE" ]; then
	ok "8b second run adds no duplicate worktree or branch"
else
	bad "8b second run changed the worktree or branch listing"
fi

make_repo rerun-deferred
register_worktree_hooks "hansip worktree create"
run_hook "$REPO" feature-rerun-deferred
expect_deferred "8c first deferred run creates nothing" feature-rerun-deferred
run_hook "$REPO" feature-rerun-deferred
expect_deferred "8d second deferred run still creates nothing" feature-rerun-deferred

# Case 9: unchanged guard. A cwd outside any repository still fails, with no stdout.
make_repo not-git-guard
mkdir -p "$BASE/not-a-repo"
run_hook "$BASE/not-a-repo" feature-outside
if [ "$CODE" -eq 1 ] && [ -z "$OUT" ] && [ "$WT_AFTER" = "$WT_BEFORE" ]; then
	ok "9 cwd outside any repository exits 1 with no stdout and no change"
else
	bad "9 cwd outside any repository: exit $CODE, stdout '$OUT'"
fi

echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
