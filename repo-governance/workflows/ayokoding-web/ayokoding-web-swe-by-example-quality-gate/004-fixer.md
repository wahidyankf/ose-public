---
description: Documents the apps-ayokoding-www-by-example-fixer agent invocation, its mode-scoped fix strategy, and which fixes are HIGH/MEDIUM confidence versus false-positive risks.
when_to_use: Use when running or interpreting the fixer step of the by-example quality gate.
---

# 4. Fixer - Apply Validated Fixes (Sequential, Conditional)

**Objective**: Automatically apply safe, validated improvements

**Agent**: `apps-ayokoding-www-by-example-fixer`

**Execution**:

```bash
# Invoke via Task tool with audit report and mode parameter
subagent_type: apps-ayokoding-www-by-example-fixer
prompt: "Apply fixes from local-tmp/ayokoding-web-by-example/ayokoding-web-by-example__a1b2c3__2025-12-25--14-30__audit.md with mode={input.mode}; delegated-gate-ids: {step0.outputs.delegated-gate-ids}; lifecycle-evidence: {step0.outputs.lifecycle-evidence}"
```

**Fix application strategy**:

**Fixer respects mode level** (`{input.mode}` from workflow):

- **lax**: Fix CRITICAL only (skip HIGH/MEDIUM/LOW)
- **normal**: Fix CRITICAL + HIGH (skip MEDIUM/LOW)
- **strict**: Fix CRITICAL + HIGH + MEDIUM (skip LOW)
- **ocd**: Fix all levels (CRITICAL, HIGH, MEDIUM, LOW)

**HIGH confidence fixes** (auto-apply within mode scope):

- Add missing imports
- Fix color palette violations
- Add frontmatter fields
- Fix incorrect weights
- Add example numbering

**MEDIUM confidence fixes** (re-validate first, only if mode includes MEDIUM):

- Add `// =>` annotations
- Add missing key takeaways
- Condense verbose explanations
- Add diagrams (verify necessity)

**FALSE POSITIVE risks** (report to user):

- Example count adjustments (requires content creation)
- Diagram frequency changes (requires visual design)
- Self-containment violations (may be intentional pedagogy)

**Outputs**:

- Modified tutorial files with fixes applied
- Fix report: `local-tmp/ayokoding-web-by-example/ayokoding-web-by-example__{uuid-chain}__{timestamp}__fix.md` (uses same UUID chain as source audit)
- List of deferred issues requiring user decision
- Updated lifecycle evidence after scope-intersection invalidation; carry Step 0 evidence forward
  unchanged when no files change

**Depends on**: Step 3 approval

**Success criteria**: Fixer successfully applies fixes without errors.

**On failure**: Log errors, proceed to re-validation anyway.

**Next step**: Proceed to step 5
