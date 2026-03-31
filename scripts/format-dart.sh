#!/usr/bin/env bash
# Wrapper for dart format in monorepo context.
# dart format works with absolute paths, but we handle errors gracefully.
set -euo pipefail

if command -v dart &>/dev/null; then
  dart format "$@"
elif command -v flutter &>/dev/null; then
  flutter format "$@"
else
  echo "Warning: Neither dart nor flutter found, skipping" >&2
fi
