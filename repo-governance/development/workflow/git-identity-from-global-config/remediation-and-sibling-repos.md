---
description: The commands to remove an existing per-repo [user] override, and how the behavioural guardrail applies across the sibling repositories.
when_to_use: Use when an existing `[user]` override must be removed, or when verifying the guardrail's coverage across ose-public and the private sibling.
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

The automated `scripts/git-identity-check.sh` guard was removed in `ose-public`, not merely
never propagated to siblings — so there is no script-based mechanism left to propagate. The
behavioural Git Identity Guardrail
([Standard 3](./standards.md#standard-3-enforcement-is-a-behavioural-guardrail-not-a-pre-commit-script))
is a shared `AGENTS.md` guardrail and
applies identically wherever each sibling's own `AGENTS.md` copy is loaded. Human developers in
either repo should periodically verify that no `[user]` section exists in that repo's
`.git/config`:

```bash
git -C /path/to/<private-sibling> config --local --list | grep "^user\." || echo "clean"
```
