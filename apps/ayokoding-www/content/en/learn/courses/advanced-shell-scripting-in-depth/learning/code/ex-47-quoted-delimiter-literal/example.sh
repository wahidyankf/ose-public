# => Example 47: a quoted delimiter disables every expansion inside.
set -euo pipefail # => strict header first, as in every example
# => WHY quoted: templates for other tools must pass through untouched.
# => Unquoted delimiters would expand the dollars below right here.
cat <<'EOF' # => quoted delimiter: NOTHING inside expands
cost: $5
home: $HOME
EOF
# => The lone EOF above ends the heredoc; template lines print intact.
echo "template kept" # => fixed marker after the literal heredoc
