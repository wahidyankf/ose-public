# => Example 67: quoted expansions, portable tests, $() substitution.
set -euo pipefail # => strict header first, as in every example
# => WHY these three: ShellCheck flags them in nearly every new script.
target="report.txt"                          # => quoted on every use below, no exceptions
if [ -n "${target}" ]; then                  # => -n tests nonempty, operands quoted
	echo "target: ${target}"                    # => quoted expansion: no splitting (SC2086)
fi                                           # => closes the guarded use
count=$(printf "a\nb\n" | wc -l | tr -d " ") # => $() nests; tr trims padding
echo "lines: ${count}"                       # => substitution result, quoted on use
