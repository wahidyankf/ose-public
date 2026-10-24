# => Example 13: --output FILE consumes and validates its value word.
set -euo pipefail # => strict header first, as in every example
# => WHY fixed demo argv: value consumption must show constant output.
set -- --output report.txt # => demo: one value option, no operands
output="stdout"            # => default stands in when --output is absent
# => Value options consume TWO words and validate the second one.
while [ "$#" -gt 0 ]; do                             # => loop while words remain
	case "$1" in                                        # => match the head word
	--output)                                           # => this flag must be followed by a value word
		if [ -z "${2-}" ] || [ "${2-}" != "${2#-}" ]; then # => missing or flag-like?
			echo "error: --output needs a value" >&2          # => usage goes to stderr
			exit 2                                            # => usage errors exit 2, per the course contract
		fi                                                 # => closes the missing-value guard
		output="$2"                                        # => safe: $2 exists and is not another flag
		shift 2                                            # => consume BOTH the flag and its value word
		;;                                                 # => ends the --output branch
	*)
		break                  # => operands start at the first non-flag word
		;;                     # => ends the operand branch
	esac                    # => closes the per-word branch
done                     # => value consumed; nothing remains in this demo
echo "output: ${output}" # => shows the consumed value word
