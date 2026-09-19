# Fixer Fix Patterns and Process Summary

## Fix Patterns

**Catalog row update**: use Edit with a narrow `old_string`/`new_string` targeting only the
affected row cell.

**Frontmatter field removal (D6)**: read the agent file first, Edit to remove the deprecated
field line, verify with Grep that it no longer appears.

**Post-edit sync (D4 Claude Code agent changes)**: after any edit to `.claude/agents/` files,
run `npm run generate:bindings` — this keeps `.opencode/agents/` aligned. Failure here is a
blocker; do not mark the fix complete until sync succeeds.

**Post-fix verification**: after every Edit, `grep -q "new-value" path/to/file.md || echo "WARNING: edit did not match — fix NOT applied to path/to/file.md"`.
If verification fails, log the fix as **FAILED (not applied)** and continue to the next finding.

**Rhino product updates (upstream repository)**: when a harness convention change alters Rhino
behaviour that specs document (Gherkin features, container descriptions, README claims), Edit the
affected spec files to stay consistent — update the changed scenario(s), keep Given-When-Then
structure intact, record each touched file in the fix summary.

## Process Summary

1. Initialize fix report (`repo-generating-validation-reports` skill).
2. Read the checker's audit report. In a quality-gate invocation, also read
   `delegated-gate-ids`; do not process findings for those exact predicates. Missing/stale
   lifecycle evidence remains pending and is not repair work for this fixer.
3. For each finding, in criticality × confidence priority order (P0 first): re-read the target
   file to verify drift still exists, check the source confidence tag, apply (HIGH confidence
   only) or skip with reason, verify the fix was applied, write the result progressively.
4. Standalone only: after Invariant 3 fixes, confirm `rtk npm run generate:bindings` is idempotent.
5. After `.claude/agents/` edits, run `rtk npm run generate:bindings` as the required mutation.
6. Standalone only: re-run binding and vendor validation. In quality-gate context, never rerun
   these delegated predicates.
7. Capture changed files with `rtk git diff --name-only HEAD`. In quality-gate context, intersect
   them with delegated scopes, invalidate only affected evidence, and return the updated ledger.
8. Write FALSE_POSITIVE carry-forward entries.
9. Recommend re-running `harness-compatibility-checker` to verify domain findings.

**Focus on safety**: better to skip an uncertain fix than silently corrupt a binding file
multiple harnesses depend on.
