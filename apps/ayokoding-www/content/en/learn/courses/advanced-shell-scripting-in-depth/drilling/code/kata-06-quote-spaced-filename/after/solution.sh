# => Kata 6 solution: quoted iteration keeps the spaced name whole.
set -euo pipefail # => strict header first, as in every script
# => WHY quoted: the fixture name holds a space, like real filenames.
count=0                # => file counter proves the fixture was visited whole
for f in *.txt; do     # => glob UNQUOTED to match; use quoted inside
	count=$((count + 1))  # => count each matched file
	echo "file: [${f}]"   # => quoted use: the spaced name stays one word
done                   # => both fixtures visited, spaces intact
echo "total: ${count}" # => 2: the space never split a name
