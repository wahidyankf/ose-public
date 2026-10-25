# => Example 46: <<< feeds one line on stdin, no fixture or pipe needed.
set -euo pipefail # => strict header first, as in every example
# => WHY a herestring: single-line input with zero fixture files.
read -r user role <<<"deploy admin" # => one line splits into two variables
echo "user: ${user}"                # => first word landed in user
echo "role: ${role}"                # => second word landed in role
