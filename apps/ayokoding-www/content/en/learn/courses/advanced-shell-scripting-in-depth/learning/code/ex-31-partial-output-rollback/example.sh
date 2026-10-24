# => Example 31: stage privately, publish only whole results.
set -euo pipefail # => strict header first, as in every example
# => WHY stage-then-publish: a crash must never leave half an output.
stage="$(mktemp -d)"                          # => private staging dir under /tmp
cleanup() {                                   # => remove staged partials on every exit path
	rm -rf "${stage}"                            # => the staging dir vanishes with the script
}                                             # => closes the staging cleaner
trap cleanup EXIT                             # => partials vanish on every exit path
echo "step one" >"${stage}/part1.txt"         # => stage part one privately
echo "step two" >"${stage}/part2.txt"         # => stage part two privately
cat "${stage}/part1.txt" "${stage}/part2.txt" # => publish: only whole results print
echo "published complete result only"         # => fixed marker after the publish
( # => subshell takes the crash path below
	part="$(mktemp -d)"                        # => the failed build stages privately too
	cleanup_part() {                           # => remove the failed build partials
		rm -rf "${part}"                          # => the failed staging dir vanishes too
	}                                          # => closes the failed-build cleaner
	trap cleanup_part EXIT                     # => its partials vanish with it
	echo "half" >"${part}/part.txt"            # => half a result, staged privately
	false                                      # => crash before publish: nothing escapes the subshell
) || echo "build failed: nothing published" # => fixed crash report
