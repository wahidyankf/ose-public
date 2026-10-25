# => Example 42: configuration as a lookup table, not a branch chain.
set -euo pipefail # => strict header first, as in every example
# => WHY a table: adding an environment adds a pair, not a branch.
declare -A config=(["env"]="staging" ["retries"]="3") # => table init in place
echo "env: ${config[env]}"                            # => known key reads directly
echo "retries: ${config[retries]}"                    # => second known key reads directly
echo "timeout: ${config[timeout]:-30}"                # => unknown key takes its default
