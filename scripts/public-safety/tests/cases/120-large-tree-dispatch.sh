# shellcheck shell=bash
# The gate screens a tracked tree of any size. Handing the leaf one argument
# per tracked path overflows the host's argument limit long before a large
# repository runs out of files, and a gate that cannot start screens nothing.
run() {
	local repo limit count i name out rc
	repo="$CASE_TMP/repo"
	mkdir -p "$repo/scripts/public-safety" "$repo/tree"
	cp "$PUBLIC_SAFETY_ROOT/scripts/public-safety/check.sh" \
		"$PUBLIC_SAFETY_ROOT/scripts/public-safety/outbound-preflight.sh" \
		"$PUBLIC_SAFETY_ROOT/scripts/public-safety/shape-terms.txt" \
		"$repo/scripts/public-safety/" || return 1
	chmod +x "$repo/scripts/public-safety/check.sh" "$repo/scripts/public-safety/outbound-preflight.sh"

	# Enough long names that one `--file p --text p` pair per path is twice the
	# host's own limit, whatever that limit is here. Each pair costs about 380
	# bytes; the count is capped so an unusually generous host stays quick.
	limit=$(getconf ARG_MAX 2>/dev/null || echo 2097152)
	count=$(((2 * limit) / 380 + 1))
	[[ $count -gt 40000 ]] && count=40000
	name=$(printf 'n%.0s' {1..170})
	for ((i = 0; i < count; i++)); do
		printf 'ordinary text %s\n' "$i" >"$repo/tree/$i-$name.md"
	done

	(
		cd "$repo" &&
			git init -q &&
			git add -A
	) || {
		echo "    cannot stage the synthetic tree" >&2
		return 1
	}

	out=$(cd "$repo" && RHINO_GATE_SURFACE=pre-commit bash scripts/public-safety/check.sh 2>&1)
	rc=$?
	assert_exit 0 "$rc" "exit code for a clean tree of $count files" || return 1
	assert_contains "pre-commit: clean" "$out" "summary" || return 1
}
