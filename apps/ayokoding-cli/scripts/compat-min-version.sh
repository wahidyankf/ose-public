#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
directive=$(sed -n 's/^go //p' "$root/go.mod")
test "$directive" = "1.26.1"
