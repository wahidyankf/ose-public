---
description: "The steps to fix an already-committed machine-specific value, including credential rotation for sensitive leaks."
when_to_use: "Use when machine-specific information has already been committed and needs remediation."
---

# Remediation

If the commit has not been pushed, fix the history, not the tree: amend the commit or rebuild the
unpushed range so no commit carries the value. A later deleting commit does not pass the
[push leak review](../../../workflows/quality/pr-leak-review/002-push-review.md), because the commit that
added the value would still be published.

If machine-specific information has already been pushed:

1. Remove the value from the current working tree and replace it with an environment variable reference or relative path.
2. Commit the corrected version.
3. If the value was sensitive (a credential or API key), rotate the credential immediately — git
   history is permanent and the value is considered exposed even after removal from HEAD. See the
   [No Secrets in Git Convention](../../../conventions/security/no-secrets-in-committed-files.md) for the complete
   remediation procedure and the full definition of what counts as a system secret.

For a pushed non-sensitive path leak (e.g., a developer's home directory appeared in a test), a corrective commit plus a
report to the repository owner is sufficient unless the owner approves a history rewrite.
