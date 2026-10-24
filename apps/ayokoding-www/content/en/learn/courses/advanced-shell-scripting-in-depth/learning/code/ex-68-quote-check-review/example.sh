# => Example 68: grep finds unquoted echo expansions mechanically.
set -euo pipefail # => strict header first, as in every example
# => WHY mechanical: eyeballs miss bare $ in long scripts, grep never does.
grep -n 'echo \$' sample.sh || true # => list every unquoted echo expansion
echo "review done"                  # => fixed marker after the findings list
