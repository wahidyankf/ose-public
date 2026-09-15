---
description: The absolute rule that no system secret may enter any git-tracked file, why, where real secret values belong instead, and the cross-repo canonical doc name.
when_to_use: Use when deciding whether a value is safe to commit, or when explaining why a secret must never be committed even temporarily.
---

# Hard Iron Rule — No Secrets in Committed Files

**No system secret may enter any git-tracked file in this repository.**

System secrets include: SSH/private keys, passwords, API tokens, privileged usernames, certificates,
connection strings, and any value that grants access to a system or service.

Git history is permanent and distributed. A secret committed once lives in every clone, fork, mirror,
and backup, and removing it requires a destructive history rewrite that never fully guarantees the
secret was not already harvested. The only safe posture is prevention.

Real secret values go in:

- Uncommitted `.env*` files (e.g. `.env.local`, `.env`) — gitignored globally
- Files under `.secrets/` — gitignored globally
- `secrets.json` at repo root — gitignored globally

See also: [`no-secrets-in-committed-files.md`](../no-secrets-in-committed-files.md)

## Cross-repo doc canonicalization

The cross-repo canonical name for this rule is `no-secrets-in-committed-files.md` (aligned with the
private sibling). This repository previously used `no-secrets-in-git.md`; the file was renamed by
the `standardize-secrets-and-env` plan to match the canonical name.
