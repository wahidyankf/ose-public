# => Example 11: getopts parses short flags portably, no external tool.
set -euo pipefail # => strict header first, as in every example
# => WHY fixed demo argv: getopts reads options, harness needs constants.
set -- -v -o report.txt target # => demo: flag, option, one operand
verbose="no"                   # => defaults first: every flag starts in a known state
output="stdout"                # => -o overrides this default when the caller passes it
# => The optstring declares the contract: v is bare, o: takes a value.
while getopts "vo:" opt; do # => one round per flag in argv
	case "${opt}" in           # => branch on the flag letter getopts found
	v)
		verbose="yes" # => bare flag flips its default on
		;;            # => ends the v branch
	o)
		output="${OPTARG}" # => OPTARG holds the word after -o
		;;                 # => ends the o branch
	?)
		echo "unknown flag"      # => getopts reports misuse via ?
		;;                       # => ends the misuse branch
	esac                      # => closes the per-flag branch
done                       # => getopts returns false when the flags run out
shift $((OPTIND - 1))      # => drop parsed flags; $1 is the first operand
echo "verbose: ${verbose}" # => shows the flipped bare flag
echo "output: ${output}"   # => shows the -o value the demo passed
echo "operand: $1"         # => shows the operand left after the flags
