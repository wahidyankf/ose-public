# => Example 39: nullglob plus an array makes filename collection safe.
set -euo pipefail # => strict header first, as in every example
# => WHY nullglob: no-match must mean no words, not a literal pattern.
shopt -s nullglob           # => unmatched globs expand to nothing from here on
logs=(backup-*.log)         # => collect the matching fixtures into an array
echo "matched: ${#logs[@]}" # => the honest count: 0 when nothing matches
for log in "${logs[@]}"; do # => quoted: spaced names stay whole
	echo "log: ${log}"         # => handle each match exactly once
done                        # => zero turns on no match, never one turn on a literal pattern
shopt -u nullglob           # => restore default glob behaviour after the section
