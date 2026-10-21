# => Example 22: glob unquoted to match, quote "$f" to use each file.
set -euo pipefail # => strict header first, as in every example
# => WHY fixtures: real space-named files, committed beside the script.
count=0                # => file counter proves both fixtures were visited
for f in *.txt; do     # => glob UNQUOTED to match; use quoted inside
	count=$((count + 1))  # => count each matched file
	echo "file: ${f}"     # => quoted use: space-named file stays one word
done                   # => both fixtures visited, spaces intact
echo "total: ${count}" # => 2: the space never split a name
