# => Example 62: single brackets run everywhere, double add patterns.
set -euo pipefail # => strict header first, as in every example
# => WHY both forms: choose portable by default, bash-only on purpose.
name="report.txt"                     # => fixture-like value for the comparisons
if [ "${name}" = "report.txt" ]; then # => POSIX test: works in dash too
	echo "posix match"                   # => portable comparison succeeded
fi                                    # => closes the portable comparison
if [[ "${name}" == *.txt ]]; then     # => bash test: adds pattern matching
	echo "bash match"                    # => pattern comparison succeeded
fi                                    # => closes the bash-only comparison
