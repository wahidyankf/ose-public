#!/usr/bin/env bash
# Wrapper for dotnet format in monorepo context.
# dotnet format whitespace needs a project/solution file; we format individual files.
set -euo pipefail

for file in "$@"; do
  dotnet format whitespace --include "$file" --folder "$(dirname "$file")" 2>/dev/null || true
done
