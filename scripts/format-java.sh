#!/usr/bin/env bash
# Wrapper for Spotless in monorepo context.
# scripts/format-staged passes repository-relative file paths; Gradle must run from the project
# root that owns them.
# `--check` keeps verification non-mutating by using Spotless's failing check task.
set -euo pipefail

check=false
if [ "${1:-}" = "--check" ]; then
	check=true
	shift
fi

# Spotless is a whole-project task rather than a per-file one, so the owning Gradle root is
# resolved for every passed file and each distinct root is then formatted exactly once.
roots=()

for file in "$@"; do
	case "$file" in
	/*) absolute_file="$file" ;;
	*) absolute_file="$(pwd)/$file" ;;
	esac
	dir="$(dirname "$absolute_file")"
	while [ "$dir" != "/" ] && [ ! -f "$dir/build.gradle.kts" ] && [ ! -f "$dir/build.gradle" ]; do
		dir="$(dirname "$dir")"
	done
	if [ ! -f "$dir/build.gradle.kts" ] && [ ! -f "$dir/build.gradle" ]; then
		printf '%s\n' "Warning: No Gradle build file found for $file, skipping" >&2
		continue
	fi
	seen=false
	if [ ${#roots[@]} -gt 0 ]; then
		for existing in "${roots[@]}"; do
			if [ "$existing" = "$dir" ]; then
				seen=true
				break
			fi
		done
	fi
	if [ "$seen" = false ]; then
		roots+=("$dir")
	fi
done

if [ "$check" = true ]; then
	task=spotlessCheck
else
	task=spotlessApply
fi

# Every root is attempted even after one fails, so a single unformatted project does not hide
# the state of the others; the first non-zero status is still what the wrapper exits with.
status=0
if [ ${#roots[@]} -gt 0 ]; then
	for root in "${roots[@]}"; do
		if [ -x "$root/gradlew" ]; then
			gradle_command="$root/gradlew"
		else
			gradle_command="gradle"
		fi
		if ! (cd "$root" && "$gradle_command" --quiet "$task"); then
			status=1
		fi
	done
fi

exit "$status"
