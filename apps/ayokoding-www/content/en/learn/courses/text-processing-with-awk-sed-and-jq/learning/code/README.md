## Example code for text-processing-with-awk-sed-and-jq

One folder per worked example: `ex-NN-<slug>/` holds `example.sh`, its `run.yaml`
(`toolchain: shell`: GNU awk, GNU sed, and jq on the pinned Debian image, no
network), the committed input fixture file(s) the lesson shows, and the recorded
output under `expected/`.

Every unit is deterministic: fixed fixtures, `LC_ALL=C` wherever a byte order
matters, no clock reads, no random seeds, no network, no writes. Each script is
self-contained and heavily annotated in the `# =>` notation; the lesson pages
embed every script byte-identically. All `awk` programs use portable constructs
that behave the same under every awk; all `sed` scripts use `-E` extended
expressions rather than GNU-only BRE extensions; all `jq` filters stay within
long-stable built-ins.
