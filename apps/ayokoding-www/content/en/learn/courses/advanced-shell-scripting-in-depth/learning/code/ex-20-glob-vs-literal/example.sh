# => Example 20: quoting decides whether * expands to filenames.
set -euo pipefail # => strict header first, as in every example
pattern="*.log"   # => a glob pattern stored as data, like real configs
# => Unquoted: the shell expands the pattern to matching files first.
echo expanded: ${pattern} # => DELIBERATELY unquoted: watch it expand
# => Quoted: the pattern survives as literal text.
echo "literal: [${pattern}]" # => brackets prove no expansion happened
