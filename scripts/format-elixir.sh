#!/usr/bin/env bash
# Wrapper for mix format in monorepo context.
# scripts/format-staged passes repository-relative file paths; mix format needs to run from the
# Elixir project root.
# `--check` keeps verification non-mutating by using mix's failing check mode.
set -euo pipefail

check=false
if [ "${1:-}" = "--check" ]; then
	check=true
	shift
fi

for file in "$@"; do
	# Find the nearest mix.exs ancestor
	case "$file" in
	/*) absolute_file="$file" ;;
	*) absolute_file="$(pwd)/$file" ;;
	esac
	dir="$(dirname "$absolute_file")"
	while [ "$dir" != "/" ] && [ ! -f "$dir/mix.exs" ]; do
		dir="$(dirname "$dir")"
	done
	if [ -f "$dir/mix.exs" ]; then
		if [ "$check" = true ]; then
			(cd "$dir" && mix format --check-formatted "$absolute_file")
		else
			(cd "$dir" && mix format "$absolute_file")
		fi
	else
		printf '%s\n' "Warning: No mix.exs found for $file, skipping" >&2
	fi
done
