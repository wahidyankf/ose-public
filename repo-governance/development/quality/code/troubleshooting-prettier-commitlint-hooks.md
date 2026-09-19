---
description: "Fixes for Prettier, commitlint, and non-running hooks."
when_to_use: "Use when Prettier, commitlint, or a hook misbehaves."
---

# Troubleshooting: Prettier, Commitlint, and Hooks Not Running

## Prettier Fails to Format

**Symptom**: Pre-commit hook fails with Prettier errors

**Solutions**:

1. Check if the file has syntax errors (Prettier can't format invalid code)
2. Run Prettier manually to see detailed error:
   `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec prettier -- --write [file]`
3. Fix syntax errors, then commit again

## Commitlint Rejects Valid Message

**Symptom**: Commit-msg hook fails but message looks correct

**Solutions**:

1. Verify message follows exact format: `<type>(<scope>): <description>`
2. Check type is lowercase and from valid list
3. Ensure description is in imperative mood
4. See [Commit Message Convention](../../workflow/commit-messages.md) for complete rules

## Hooks Not Running

**Symptom**: Git hooks don't execute when committing or pushing

**Solutions**:

1. Run `./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` to ensure Husky is set up
2. Check `.husky/` directory exists with hook files
3. Verify hook files are executable: `ls -la .husky/`
4. If needed, make executable: `chmod +x .husky/pre-commit .husky/commit-msg .husky/pre-push`
