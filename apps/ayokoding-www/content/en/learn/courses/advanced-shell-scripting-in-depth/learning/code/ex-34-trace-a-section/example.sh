# => Example 34: set -x watches one section; PS4 keeps traces stable.
set -euo pipefail # => strict header first, as in every example
# => WHY a fixed PS4: the default prefix embeds depth that shifts output.
export PS4="+ trace: " # => fixed trace prefix, deterministic for goldens
set -x                 # => tracing on: every following command echoes to stderr first
value="traced"         # => this assignment is traced on stderr
echo "value: ${value}" # => this echo is traced, then prints on stdout
set +x                 # => tracing off: output below stays clean
echo "trace done"      # => fixed closing marker on stdout
