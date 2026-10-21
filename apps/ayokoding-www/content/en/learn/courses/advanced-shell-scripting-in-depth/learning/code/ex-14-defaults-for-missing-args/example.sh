# => Example 14: :- and - apply defaults without touching the variable.
set -euo pipefail # => strict header first, as in every example
# => WHY one demo line: all three default rules show in constant output.
mode=""                              # => explicitly empty: set, but holding nothing
echo "mode: [${mode:-standard}]"     # => :- falls back on empty OR unset
echo "mode-kept: [${mode-standard}]" # => - falls back only when unset
echo "missing: [${region:-us-east}]" # => unset var takes its default
# => The variable itself never changes: only the expansion substitutes.
