# => Example 50: < <(...) loops in THIS shell, so variables survive.
set -euo pipefail # => strict header first, as in every example
# => WHY redirection: a pipe would run the loop in a subshell.
total=0                      # => accumulator must survive the loop: no pipe allowed
while IFS= read -r n; do     # => read each generated number exactly
	total=$((total + n))        # => add the line number to the accumulator
done < <(printf "1\n2\n3\n") # => substitution feeds the loop by redirection
echo "total: ${total}"       # => 6: the accumulator survived because no subshell ran
