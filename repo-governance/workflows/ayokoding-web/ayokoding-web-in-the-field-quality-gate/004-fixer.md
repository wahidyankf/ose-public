---
description: Documents the apps-ayokoding-www-in-the-field-fixer agent invocation, its mode-scoped fix strategy, and which fixes are HIGH/MEDIUM confidence versus false-positive risks.
when_to_use: Use when running or interpreting the fixer step of the in-the-field quality gate.
---

# 4. Fixer - Apply Validated Fixes (Sequential, Conditional)

**Objective**: Automatically apply safe, validated improvements

**Agent**: `apps-ayokoding-www-in-the-field-fixer`

**Execution**:

```bash
# Invoke via Task tool with audit report and mode parameter
subagent_type: apps-ayokoding-www-in-the-field-fixer
prompt: "Apply fixes from local-tmp/ayokoding-web-in-the-field/ayokoding-in-the-field__a1b2c3__2026-02-06--14-30__audit.md with mode={input.mode}; delegated-gate-ids: {step0.outputs.delegated-gate-ids}; lifecycle-evidence: {step0.outputs.lifecycle-evidence}"
```

**Fix application strategy**:

**Fixer respects mode level** (`{input.mode}` from workflow):

- **lax**: Fix CRITICAL only (skip HIGH/MEDIUM/LOW)
- **normal**: Fix CRITICAL + HIGH (skip MEDIUM/LOW)
- **strict**: Fix CRITICAL + HIGH + MEDIUM (skip LOW)
- **ocd**: Fix all levels (CRITICAL, HIGH, MEDIUM, LOW)

**HIGH confidence fixes** (auto-apply within mode scope):

- Fix guide ordering (standard library before framework)
- Add missing sections (limitations, trade-offs)
- Add error handling blocks
- Fix frontmatter

**MEDIUM confidence fixes** (re-validate first, only if mode includes MEDIUM):

- Enhance framework justifications
- Add logging statements
- Add configuration examples

**FALSE POSITIVE risks** (report to user):

- Guide count adjustments (requires content creation)
- Production pattern selection (architectural decision)

**Outputs**:

- Modified guide files with fixes applied
- Fix report: `local-tmp/ayokoding-web-in-the-field/ayokoding-in-the-field__{uuid-chain}__{timestamp}__fix.md` (uses same UUID chain as source audit)
- List of deferred issues requiring user decision
- Updated lifecycle evidence after scope-intersection invalidation; carry Step 0 evidence forward
  unchanged when no files change

**Depends on**: Step 3 approval

**Success criteria**: Fixer successfully applies fixes without errors.

**Next step**: Proceed to step 5
