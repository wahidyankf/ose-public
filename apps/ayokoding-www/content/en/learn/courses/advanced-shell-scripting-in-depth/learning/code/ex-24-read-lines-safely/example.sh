# => Example 24: IFS= read -r preserves spaces and backslashes exactly.
set -euo pipefail # => strict header first, as in every example
# => WHY the fixture: leading spaces plus backslash-n must survive intact.
while IFS= read -r line; do # => IFS= keeps spaces; -r keeps backslashes
	echo "line: [${line}]"     # => brackets make preserved whitespace visible
done <input.txt             # => input redirection feeds the loop, never a pipe
# => The loop runs in THIS shell (no pipe), so variables set inside survive.
