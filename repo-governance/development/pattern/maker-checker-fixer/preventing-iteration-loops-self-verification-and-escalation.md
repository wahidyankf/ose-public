---
description: "The remaining two safeguards."
when_to_use: "Use when a bash/sed fix may have failed."
---

# Preventing Iteration Loops — Self-Verification and Escalation

## 3. Self-Verification After Bash Edits

**Problem**: Fixer logs "fixed" after a `sed -i` command even when the pattern didn't match (`sed` exits 0 regardless). This causes garbled file content and infinite loops (checker re-flags, fixer "fixes" again with no effect).

**Solution**: After every bash or sed edit, immediately verify with grep:

```bash
sed -i 's/old-pattern/new-pattern/' file.md
grep -q "new-pattern" file.md || echo "WARNING: sed pattern did not match — fix NOT applied"
```

If verification fails, log the fix as FAILED (not applied). Do NOT log as "fixed".

**For multi-line reformatting**: Use Python, not sed. `sed` is line-oriented and silently fails on multi-line patterns. Python's string replacement is explicit and predictable.

## 4. Escalation After 2+ Iteration Disagreements

**Problem**: Checker and fixer disagree on the same finding for 2 or more iterations (checker flags, fixer marks FALSE_POSITIVE, checker re-flags after accepting the FALSE_POSITIVE was wrong).

**Solution**: If the `.known-false-positives.md` skip list is loaded but checker still flags the same item (meaning the skip key didn't match), this indicates the skip key format is inconsistent. Escalate to maker for governance decision:

1. Fixer marks the finding as `ESCALATED` in the fix report (not FALSE_POSITIVE, not applied)
2. Fixer notifies user: "This finding has been re-flagged after a FALSE_POSITIVE acceptance. Manual review required."
3. Maker updates the relevant convention or agent to resolve the root ambiguity

**Ceiling**: A quality gate runs at most three cycles, per the [Quality Gate Contract](../../workflow/quality-gate-contract.md). If blocking rows remain after the last one, it returns `FAIL` and the maker owns them.
