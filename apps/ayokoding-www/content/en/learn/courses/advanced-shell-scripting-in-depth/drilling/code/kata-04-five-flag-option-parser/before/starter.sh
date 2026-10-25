# => Kata 4 starter: fixed values buried in the body, no flags at all.
# => Every behaviour change means editing the script itself.
set -euo pipefail          # => strict header first, as in every script
verbose="no"               # => buried default: callers cannot change it
output="stdout"            # => buried default: callers cannot change it
echo "verbose: ${verbose}" # => always no, whatever the caller wants
echo "output: ${output}"   # => always stdout, whatever the caller wants
