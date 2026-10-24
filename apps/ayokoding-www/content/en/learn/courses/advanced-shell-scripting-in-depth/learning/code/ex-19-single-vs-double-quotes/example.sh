# => Example 19: single quotes freeze text, double quotes expand it.
set -euo pipefail            # => strict header first, as in every example
user="deploy"                # => the value the expansions will (or will not) show
echo "double: hello ${user}" # => double quotes expand the variable
echo 'single: hello ${user}' # => single quotes keep it literal
# => Command substitution also obeys the quote kind around it.
echo "subst: $(echo hi)" # => runs inside double quotes
