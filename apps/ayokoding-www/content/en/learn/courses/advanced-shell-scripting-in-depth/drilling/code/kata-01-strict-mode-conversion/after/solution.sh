# => Kata 1 solution: strict flags turn the typo into a loud failure.
set -euo pipefail # => strict header first, as in every script
# => WHY strict first: -u rejects the misspelled variable immediately.
name="report.txt"         # => the variable the script means to use
if [ -n "${name}" ]; then # => guard proves the value exists before use
	echo "building: ${name}" # => quoted: the correct variable, intact
fi                        # => closes the presence guard
echo "done"               # => prints only after real work succeeded
