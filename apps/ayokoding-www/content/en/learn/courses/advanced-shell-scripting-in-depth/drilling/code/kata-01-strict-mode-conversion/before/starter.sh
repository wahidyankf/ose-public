# => Kata 1 starter: a typo hides inside lax mode and the script stays green.
# => The misspelled variable expands to nothing; nobody notices.
# shellcheck disable=SC2034,SC2154 # rationale: starter ships the typo the kata must fix
name="report.txt"         # => the variable the script means to use
echo "building: ${outpt}" # => TYPO: expands empty under lax mode
echo "done"               # => prints although the line above produced garbage
