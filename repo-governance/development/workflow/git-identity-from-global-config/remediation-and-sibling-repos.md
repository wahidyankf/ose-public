---
description: The commands to remove an existing per-repo [user] override, and how to verify that no local clone carries one.
when_to_use: Use when an existing `[user]` override must be removed, or when verifying that no local clone carries one.
---

# Remediation and Sibling Repos

## Remediation

If manual verification (or the AI agent Git Identity Guardrail's own read-before-commit check)
finds an existing override:

```bash
# Remove name override (if present)
git config --local --unset user.name

# Remove email override (if present)
git config --local --unset user.email

# Remove the section entirely if it is now empty
git config --local --remove-section user 2>/dev/null || true
```

Verify the section is gone:

```bash
git config --local --list | grep "^user\."
# Should produce no output
```

Then retry the commit. The global `~/.gitconfig` takes effect immediately.

## Sibling Repos

The automated `scripts/git-identity-check.sh` guard was removed in `ose-public`, so no script-based
mechanism remains. The behavioural Git Identity Guardrail
([Standard 3](./standards.md#standard-3-enforcement-is-a-behavioural-guardrail-not-a-pre-commit-script))
is an `AGENTS.md` guardrail of this repository; any other repository owns its own. Human developers
should periodically verify that no `[user]` section exists in the `.git/config` of any local clone:

```bash
git -C /path/to/<repo> config --local --list | grep "^user\." || echo "clean"
```
