# => Example 38: associative arrays tally occurrences by key.
set -euo pipefail # => strict header first, as in every example
# => WHY sorted keys: assoc iteration order is unspecified, goldens need order.
declare -A counts=()                                  # => severity word maps to its occurrences
while IFS= read -r line; do                           # => read each fixture line exactly
	level="${line%% *}"                                  # => strip from the first space: the severity
	counts["${level}"]=$((${counts["${level}"]:-0} + 1)) # => increment, default zero guards -u
done <events.log                                      # => redirection feeds the loop, never a pipe
# => Sorted keys make the table deterministic on every machine.
for level in $( # => DELIBERATELY unquoted: split into sorted keys
	printf "%s\n" "${!counts[@]}" | LC_ALL=C sort
); do
	echo "${level}: ${counts[${level}]}" # => one table row per severity
done                                  # => ERROR, INFO, WARN in byte order
