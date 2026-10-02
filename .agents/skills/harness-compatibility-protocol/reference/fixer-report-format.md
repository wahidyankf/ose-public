# Fixer Report Format, FALSE_POSITIVE Carry-Forward, and Mode Handling

## Fix Report Format

Write progressively to `local-tmp/harness-compat/harness-compat__{uuid-chain}__{YYYY-MM-DD--HH-MM}__fix.md`.
The UUID chain extends the checker's chain (append a new segment).

```markdown
## Fix: [Phase 0 Invariant N / D1 Root File / ...] — [Subject]

**Finding ref**: [Finding heading from audit report]
**Confidence**: [HIGH / MEDIUM / FALSE_POSITIVE]
**Status**: [Applied / Skipped — reason / Failed — reason]

**Before**:
[Value before fix]

**After**:
[Value after fix]

**Files changed**:

- [path/to/file.md]
```

## FALSE_POSITIVE Carry-Forward

Add an `## Accepted FALSE_POSITIVE Findings` section and append each skipped FALSE_POSITIVE to
`local-tmp/.known-false-positives.md`:

```bash
cat >> local-tmp/.known-false-positives.md << 'EOF'
## FALSE_POSITIVE: [dimension] | [harness or invariant] | [brief-description]

**Accepted**: [YYYY-MM-DD--HH-MM]
**Category**: Harness Compatibility
**Finding**: [Brief description matching checker's finding text]
**Reason**: [Why this was accepted as false positive]

---
EOF
```

## Mode Parameter Handling

See `repo-applying-maker-checker-fixer` skill: **lax** fixes CRITICAL only; **normal** fixes
CRITICAL+HIGH (default); **strict** fixes CRITICAL+HIGH+MEDIUM; **all** fixes all levels.
