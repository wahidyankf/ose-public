#!/usr/bin/env bash
# Wrapper for Clojure formatting in monorepo context.
# Uses clj-kondo or zprint if cljfmt is not available.
set -euo pipefail

if command -v cljfmt &>/dev/null; then
  cljfmt fix "$@"
elif command -v zprint &>/dev/null; then
  for file in "$@"; do
    zprint '{:style :community}' < "$file" > "$file.tmp"
    if [ -s "$file.tmp" ]; then
      mv "$file.tmp" "$file"
    else
      rm -f "$file.tmp"
    fi
  done
else
  echo "Warning: No Clojure formatter (cljfmt/zprint) found, skipping" >&2
fi
