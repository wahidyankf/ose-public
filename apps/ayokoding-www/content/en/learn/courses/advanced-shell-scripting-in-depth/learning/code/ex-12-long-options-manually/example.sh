# => Example 12: long options need an explicit shift loop with a case.
set -euo pipefail # => strict header first, as in every example
# => WHY fixed demo argv: long-option parsing must show constant output.
set -- --verbose -- input.txt # => demo: one flag, --, one operand
verbose="no"                  # => defaults first: every flag starts in a known state
# => Each branch consumes its flag with shift; value flags shift twice.
while [ "$#" -gt 0 ]; do # => loop while words remain
	case "$1" in            # => match the head word against option patterns
	--verbose)
		verbose="yes" # => long flag flips its default on
		shift         # => consume the flag just handled
		;;            # => ends the --verbose branch
	--)
		shift # => -- ends option parsing; consume it too
		break # => everything left is an operand, even --weird names
		;;    # => ends the -- branch
	--*)
		echo "unknown: $1" # => any other --word is a usage error
		exit 2             # => usage errors exit 2, per the course contract
		;;                 # => ends the unknown-long-option branch
	*)
		break                    # => first non-flag word: operands start here
		;;                       # => ends the operand branch
	esac                      # => closes the per-word branch
done                       # => flags consumed; $1 is the first operand
echo "verbose: ${verbose}" # => shows the flipped long flag
echo "operand: $1"         # => shows the operand after the -- separator
