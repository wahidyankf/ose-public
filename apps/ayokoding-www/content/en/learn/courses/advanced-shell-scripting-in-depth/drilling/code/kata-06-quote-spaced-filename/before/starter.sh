# shellcheck disable=SC2034 # rationale: loop counts split words; the variable is intentionally never expanded
# => Kata 6 starter: an unquoted loop that splits the spaced name.
# => Two words where one file stands: the classic space bug.
set -euo pipefail       # => strict header first, as in every script
name="my file.txt"      # => the spaced value the loop below mangles
count=0                 # => word counter exposes the split below
for word in ${name}; do # => DELIBERATELY unquoted: watch it split
	count=$((count + 1))   # => count each word the split produced
done                    # => two turns prove the bug: one file became two words
echo "words: ${count}"  # => 2, not 1: the space split the name
