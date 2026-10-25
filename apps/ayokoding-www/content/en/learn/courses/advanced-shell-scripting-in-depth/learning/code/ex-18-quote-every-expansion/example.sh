# shellcheck disable=SC2034 # rationale: loop counts split words; the variable is intentionally never expanded
# => Example 18: quote every expansion; unquoted values split on spaces.
set -euo pipefail    # => strict header first, as in every example
name="my report.txt" # => one value containing a space, like real filenames
# => Quoted: the value survives as exactly one word.
echo "quoted: [${name}]" # => brackets prove no splitting happened
# => Unquoted $name would split into TWO words: my and report.txt.
count=0                         # => word counter for the unquoted demonstration
for word in ${name}; do         # => DELIBERATELY unquoted: watch it split
	count=$((count + 1))           # => count each word the split produced
done                            # => the loop saw two words, proving the split
echo "unquoted words: ${count}" # => 2, not 1: the bug, measured
