---
description: "Fixes for a slow or failing pre-push hook."
when_to_use: "Use when pre-push is slow or a check fails."
---

# Troubleshooting: Pre-push Hook

## Pre-push Hook Times Out or Runs Slowly

**Symptom**: Pre-push hook takes too long or times out on a large push

**Solution** — the hook runs only the registry-declared `pre-push` gates (today the public-safety tree
and range screens, the leak-review tests, and environment validation) and no Nx target, so no test
cache is involved. The range screen reads every outgoing commit, so a push of many commits costs
more. Run the same gate set directly to see which gate is slow:

```bash
./rhino gate run --surface pre-push
```

Push fewer commits at once if the range screen is the slow gate.

## A Gate Fails on Pre-push

**Symptom**: Pre-push hook blocks the push with a failing gate

**Solutions**:

1. Check which gate failed — Rhino prints each gate id in its output
2. Re-run the set locally: `./rhino gate run --surface pre-push`
3. Fix the reported finding, commit the fix, and push again
4. A test failure does not surface here: no hook runs `test:quick`. Reproduce it with the affected
   `test:quick` run, as the PR quality gate would run it

## Config Validation Fails on Pre-commit

**Symptom**: Pre-commit hook fails with config validation errors

**Solutions**:

1. Identify which gate failed — Rhino prints each gate id. The configuration gate is
   `repo-config`, which checks `repo-config.yml`. The `harness-adapters` gate checks every generated
   harness binding.

2. Run validation manually to debug:

   ```bash
   ./rhino repo-config validate        # Check repo-config.yml
   ./rhino harness adapters validate   # Check every generated harness binding
   ./rhino harness adapters generate   # Regenerate the bindings from their canonical sources
   ```

3. Common validation errors:
   - Invalid tool name: Must be Read, Write, Edit, Glob, Grep, Bash, TodoWrite, WebFetch, WebSearch
   - Missing description: All agents/skills need description field
   - Invalid model: Must be empty, or a recognized model identifier (`sonnet`, `opus`, `haiku`)
   - Skill not found: Ensure skill exists in the platform binding skill directory (`.agents/skills/`)

4. Do not skip the hook to get past a failure. `--no-verify` needs explicit authorization naming
   that one bypass, with no emergency exception; see the
   [Bypass policy](../../workflow/git-hook-lifecycle.md#bypass-policy).
