---
description: "The rule mandating preexisting CI blockers be root-caused, never bypassed."
when_to_use: "Use for the exact wording of the CI-blocker-resolution rule."
---

# The Rule

**When CI is blocked by a preexisting issue, you MUST:**

1. **Investigate the root cause deeply.** Read the error output. Trace it to the source. Understand why it fails, not just that it fails.
2. **Fix it properly.** Apply a correct, minimal fix that addresses the root cause. No monkey-patches, no `@ts-ignore`, no `skip()` on tests, no `--no-verify`.
3. **Commit the fix separately.** Preexisting fixes go in their own commit with an appropriate conventional commit message (typically `fix(scope):` or `chore(scope):`), separate from your feature work.
4. **Verify the fix.** Re-run the affected quality gates and confirm they pass before proceeding with your original work.

**Carve-out — missing build artifacts.** A failure caused by absent gitignored build output or caches (`target/`, `dist/`, `.next/`, `.nx/cache`, the shared cargo `target/`) is not a preexisting issue under this rule. The ambient sweeper described in the [Build-Artifact Sweeper Convention](../../infra/build-artifact-sweeper.md) is the identified root cause, and regenerating (`nx build`, `npm install`, or `./rhino toolchain provision --apply` after `npm run doctor` reports drift) is the proper fix, not a bypass. Only a failure that **reproduces after a clean regeneration** is a blocker governed by the four steps above.
