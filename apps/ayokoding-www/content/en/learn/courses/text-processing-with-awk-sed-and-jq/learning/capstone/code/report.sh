#!/bin/bash
# => Capstone: parse a fixed-width log, redact secrets, reshape JSON metadata.
# => co-01: substr reads fixed columns out of each log record.
# => co-06: sed redacts every token value before parsing.
# => co-09: jq reads the region and owner out of the metadata object.
# => co-16: one shell script chains sed, awk, and jq into a single report.
set -euo pipefail                                                                                                                                                                                                                                                       # => strict mode: fail fast on errors and unset names
echo "region: $(jq -r '.region' meta.json)"                                                                                                                                                                                                                             # => header line one comes from JSON
echo "owner: $(jq -r '.owner' meta.json)"                                                                                                                                                                                                                               # => header line two comes from JSON
redacted=$(sed -E 's/token=[^ ]*/token=REDACTED/' app.log)                                                                                                                                                                                                              # => redact every secret first
printf '%s\n' "$redacted" | awk '{ status = substr($0, 19, 4); gsub(/ /, "", status); ms = substr($0, 24, 3) + 0; n++; sum += ms; if (status == "OK") ok++; else fail++ } END { print "requests: " n; print "ok: " ok; print "fail: " fail; print "avg_ms: " sum / n }' # => aggregate the fixed columns
printf '%s\n' "$redacted" | sed -n '1p' | sed 's/^/redacted_sample: /'                                                                                                                                                                                                  # => prove redaction on line one
# => no file is rewritten anywhere: the report is stdout, the proof is a prefix.
