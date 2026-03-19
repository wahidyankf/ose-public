#!/usr/bin/env bash
set -euo pipefail

dir="${1:?Usage: $0 <generated-contracts-dir>}"

find "$dir" -name '*.java' | while IFS= read -r f; do
  awk '
    NR==FNR && /^package / {
      pkg = $0; sub(/^package /, "", pkg); sub(/;$/, "", pkg)
    }
    NR==FNR && !/^import / { body = body "\n" $0; next }
    NR!=FNR && /^import / {
      line = $0; sub(/;$/, "", line)
      # extract fully qualified class minus the simple name = package
      sub(/^import (static )?/, "", line)
      n = split(line, a, "\\.")
      cls = a[n]
      imp_pkg = ""
      for (i = 1; i < n; i++) imp_pkg = imp_pkg (i > 1 ? "." : "") a[i]
      # skip same-package imports
      if (imp_pkg == pkg) next
      # skip if class name not used in body or duplicate
      if (body ~ cls && !seen[$0]++) print
      next
    }
    NR!=FNR { print }
  ' "$f" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
