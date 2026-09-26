---
description: "Fixes for a slow or failing pre-push hook."
when_to_use: "Use when pre-push is slow or a check fails."
---

# Troubleshooting: Pre-push Hook

## Pre-push Hook Times Out or Runs Slowly

**Symptom**: Pre-push hook takes too long or times out on large changesets

**Solution** — warm the Nx cache before pushing, using the same registry-declared gate set
`.husky/pre-push` invokes:

```bash
# Run the full pre-push gate set first (this warms the cache)
./rhino gate run --surface pre-push

# Now push — the hook replays from cache (near-instant)
git push
```

**Why this works**: `test:quick` (the affected-projects-scoped gate in the pre-push set) is a
cacheable Nx target (`cache: true` in `nx.json`). Running it manually stores results in the local
Nx cache. When the pre-push hook runs the same target, Nx replays from cache instead of
re-executing — making the hook near-instant regardless of how many projects are affected. The
`.claude/hooks/warm-cache-before-push.sh` coding-agent hook automates this same warm-up on every
`git push` invocation, deriving its target list from `gate list`
rather than a hardcoded list.

## Tests Fail on Pre-push

**Symptom**: Pre-push hook blocks push due to test failures

**Solutions**:

1. Check which tests failed in the error output
2. Run tests locally: `nx affected -t test:quick`
3. Fix failing tests
4. Commit fixes and push again
5. If tests pass locally but fail in hook, ensure all changes are committed

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

4. Bypass hook temporarily (emergency only):

   ```bash
   git push --no-verify
   ```

   Note: Fix validation errors before merging to main.
