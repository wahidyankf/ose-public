# => Kata 4 solution: five flags parsed with validation and defaults.
set -euo pipefail # => strict header first, as in every script
# => WHY fixed demo argv: five parsed flags must show constant output.
set -- --verbose --output report.txt --count 3 --dry-run --mode fast               # => demo argv
verbose="no"                                                                       # => default one: quiet unless asked
output="stdout"                                                                    # => default two: stdout unless redirected
count="1"                                                                          # => default three: one repetition unless asked
dry_run="no"                                                                       # => default four: real run unless asked
mode="safe"                                                                        # => default five: safe unless asked
usage() {                                                                          # => one function owns the whole usage contract
	echo "usage: tool [--verbose] [--output FILE] [--count N] [--dry-run] [--mode M]" # => synopsis
}                                                                                  # => closes the usage contract
while [ "$#" -gt 0 ]; do                                                           # => loop while words remain
	case "$1" in                                                                      # => match the head word against the five flags
	--verbose)
		verbose="yes"
		shift # => bare flag flips its default on
		;;    # => ends the verbose branch
	--output)
		output="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the output branch
	--count)
		count="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the count branch
	--dry-run)
		dry_run="yes"
		shift # => bare flag flips its default on
		;;    # => ends the dry-run branch
	--mode)
		mode="$2"
		shift 2 # => value flag consumes its word
		;;      # => ends the mode branch
	--help)
		usage
		exit 0 # => help prints the contract and succeeds
		;;     # => ends the help branch
	*)
		usage >&2
		exit 2                   # => unknown words are usage errors
		;;                       # => ends the misuse branch
	esac                      # => closes the per-word branch
done                       # => all five flags parsed; defaults stand where flags were absent
echo "verbose: ${verbose}" # => shows the flipped bare flag
echo "output: ${output}"   # => shows the consumed value word
echo "count: ${count}"     # => shows the consumed value word
echo "dry-run: ${dry_run}" # => shows the flipped bare flag
echo "mode: ${mode}"       # => shows the consumed value word
