# => Example 45: <<EOF feeds literal lines on stdin until EOF.
set -euo pipefail # => strict header first, as in every example
# => WHY a heredoc: multiline input without temp files or echo chains.
# => The delimiter needs no quotes here: expansion inside is wanted.
cat <<EOF # => heredoc starts: stdin reads until the lone EOF
host=db-1
port=5432
EOF
# => The lone EOF above ends the heredoc; nothing may trail it.
echo "config written" # => fixed marker after the heredoc
