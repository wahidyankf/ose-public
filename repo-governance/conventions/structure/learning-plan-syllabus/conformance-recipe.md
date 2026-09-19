---
description: The runnable grep-based bash loop that reports every course file missing a REQUIRED section, until a deterministic Rhino validator exists.
when_to_use: Read this when you need to check an existing corpus for missing REQUIRED sections without a dedicated CLI validator.
---

# Conformance Recipe

Part of the [Learning-Plan `syllabus/` Folder Convention](../learning-plan-syllabus.md).

Until a deterministic `Rhino` validator exists (deferred, and filed as a two-pager idea brief
under `plans/ideas/`), an author or checker can detect a course file missing a REQUIRED section today
with the loop below. It
iterates the `*.md` files under a corpus's `syllabus/courses/`, skips `README.md` and `surgery.md`
(the scope-contract register, not a course), and tests each file with `grep -q '<pattern>' "$file"`.

The recipe deliberately avoids two `grep` traps specific to this repo's **ugrep**-backed `grep`:
it never uses `grep -L` (files-**without**-match, which exits 0 when it finds one non-matching file
and so cannot drive a pass/fail loop), and never uses space-separated `--glob VALUE` (which ugrep does
not parse). It uses an explicit per-file loop instead.

```bash
# Report every course file missing any REQUIRED section, for one corpus.
check_corpus () {
  local dir="$1"                       # e.g. plans/backlog/<plan>/syllabus/courses
  local any_miss=0
  for file in "$dir"/*.md; do
    base=$(basename "$file")
    [ "$base" = "README.md" ] && continue
    [ "$base" = "surgery.md" ] && continue
    miss=""
    grep -q '\*\*Course ID\*\*'   "$file" || miss="$miss Course-ID"
    grep -q '^## Why this exists' "$file" || miss="$miss Why-this-exists"
    grep -q '^## Prerequisites'   "$file" || miss="$miss Prerequisites"
    grep -q '^## In which paths'  "$file" || miss="$miss In-which-paths"
    grep -q '^## Accuracy notes'  "$file" || miss="$miss Accuracy-notes"
    grep -q '\*\*Scope note\*\*'  "$file" || miss="$miss Scope-note"
    grep -q '^## Concepts'        "$file" || miss="$miss Concepts"
    if [ -n "$miss" ]; then
      echo "MISS $base:$miss"
      any_miss=1
    fi
  done
  [ "$any_miss" -eq 0 ] && echo "(no misses)"
}
# Run against all three existing corpora, printing a header per corpus.
for plan in ayokoding-learning-path-02-schema-and-prerequisite-dag \
            ayokoding-learning-path-06-skills-accounting \
            ayokoding-learning-path-07-skills-erp; do
  echo "=== $plan ==="
  check_corpus "plans/backlog/$plan/syllabus/courses"
done
```

Run against the three existing corpora, the recipe reports exactly one file — a capstone, a
legitimate structural variant covered by the capstone carve-out — and no other miss:

```text
=== ayokoding-learning-path-02-schema-and-prerequisite-dag ===
MISS capstone-forge-ready.md: Scope-note Concepts
=== ayokoding-learning-path-06-skills-accounting ===
(no misses)
=== ayokoding-learning-path-07-skills-erp ===
(no misses)
```

Any other result means either the recipe or the census tiering drifted, and both must be re-derived
before the convention is trusted.
