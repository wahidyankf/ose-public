# shellcheck shell=bash
# A Git hook hands its repository's location to every child process: a hook in
# a linked worktree exports GIT_DIR, and pre-commit adds GIT_INDEX_FILE. Cases
# build fixture repositories, so a suite started from such a hook must still
# reach each fixture and leave the repository whose hook started it untouched.
run() {
	local host linked gitdir suite before out rc
	host="$CASE_TMP/host"
	linked="$CASE_TMP/linked"
	suite="$CASE_TMP/suite/scripts/public-safety/tests"
	{
		git init -q "$host" &&
			git -C "$host" -c user.name=fixture -c user.email=fixture@example.invalid \
				commit -q --allow-empty -m fixture &&
			git -C "$host" worktree add -q "$linked" &&
			gitdir=$(git -C "$linked" rev-parse --absolute-git-dir) &&
			before=$(cksum <"$gitdir/index")
	} 2>/dev/null || {
		echo "    cannot build the host repository and its linked worktree" >&2
		return 1
	}
	mkdir -p "$suite/cases" || return 1
	cp "$PUBLIC_SAFETY_ROOT/scripts/public-safety/tests/run.sh" "$suite/run.sh" || return 1

	# A probe shaped like every case that builds a fixture repository.
	cat >"$suite/cases/010-fixture-repository.sh" <<-'PROBE'
		run() {
			mkdir -p "$CASE_TMP/fixture" &&
				printf 'ordinary text\n' >"$CASE_TMP/fixture/file.md" &&
				(cd "$CASE_TMP/fixture" && git init -q && git add -A)
		}
	PROBE

	# The variables a pre-commit hook in the linked worktree receives.
	out=$(GIT_DIR="$gitdir" GIT_INDEX_FILE="$gitdir/index" bash "$suite/run.sh" 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for a suite run under a hook's Git variables" || return 1
	assert_contains "1 passed, 0 failed" "$out" "summary" || return 1

	if [[ "$(git config --file "$host/.git/config" --get core.bare)" != false ]]; then
		echo "    the suite reconfigured the repository whose hook started it" >&2
		return 1
	fi
	if [[ "$(cksum <"$gitdir/index")" != "$before" ]]; then
		echo "    the suite staged a fixture into the repository whose hook started it" >&2
		return 1
	fi
}
