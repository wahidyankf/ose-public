# => Example 73: a filter variable selects one case or runs them all.
set -euo pipefail # => strict header first, as in every example
# => WHY a filter: rerunning one red case beats rerunning the suite.
only="${ONLY-}"                                         # => empty means run everything; ONLY=two runs case two
run_case() {                                            # => one function per case, named for the filter
	echo "case: $1"                                        # => $1 names the case that just ran green
}                                                       # => closes the case runner
for case in one two three; do                           # => the full suite: three named cases
	if [ -z "${only}" ] || [ "${only}" = "${case}" ]; then # => all, or the selected one
		run_case "${case}"                                    # => execute the selected case
	fi                                                     # => closes the selection branch
done                                                    # => every selected case ran exactly once
echo "suite done"                                       # => fixed marker after the selected cases
