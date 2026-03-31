#!/usr/bin/env bash
# Wrapper for mix format in monorepo context.
# lint-staged passes absolute file paths; mix format needs to run from the Elixir project root.
set -euo pipefail

for file in "$@"; do
  # Find the nearest mix.exs ancestor
  dir="$(dirname "$file")"
  while [ "$dir" != "/" ] && [ ! -f "$dir/mix.exs" ]; do
    dir="$(dirname "$dir")"
  done
  if [ -f "$dir/mix.exs" ]; then
    (cd "$dir" && mix format "$file")
  else
    echo "Warning: No mix.exs found for $file, skipping" >&2
  fi
done
