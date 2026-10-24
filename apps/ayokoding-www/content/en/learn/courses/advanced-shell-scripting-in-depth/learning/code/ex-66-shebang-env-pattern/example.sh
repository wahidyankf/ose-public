#!/usr/bin/env bash
# => Example 66: env searches PATH; fixed paths vary by system, env does not.
# => Portable shebang: env finds bash on every PATH (kept bare: trailing text would become a shebang argument).
set -euo pipefail     # => strict flags work the same under env-launched bash
echo "env found bash" # => fixed marker: the shebang resolved
