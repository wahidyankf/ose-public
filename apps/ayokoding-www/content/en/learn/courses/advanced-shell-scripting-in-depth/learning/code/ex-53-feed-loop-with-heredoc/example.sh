# shellcheck disable=SC2034 # rationale: loop counts heredoc lines; each line is intentionally never expanded
# => Example 53: done <<EOF feeds the loop in the current shell.
set -euo pipefail # => strict header first, as in every example
# => WHY redirection: a pipe would run the loop in a subshell.
# => The three body lines below are data, not code: no markers inside.
# => A pipe would fork the loop; redirection keeps every assignment.
count=0                     # => accumulator lives past the loop: no pipe involved
while IFS= read -r task; do # => read each heredoc line exactly
	count=$((count + 1))       # => count the task just read
done <<EOF
build
test
ship
EOF
# => The lone EOF above ends the heredoc; loop and data stay in this shell.
echo "tasks: ${count}" # => 3: the accumulator survived the loop
