---
description: "The two mandatory pre-routing safety gates."
when_to_use: "Use before routing any learning."
---

# The Two Safety Gates (HARD — run before routing)

Both gates are mandatory triage steps for every surviving entry, applied **before** any routing
decision is finalized. They are the repository's belt-and-suspenders: prose gates for the executor
performing the triage, and explicit verification checks for the completion checker that gates
archival.

## 1. Secret/Sensitivity Gate

`learnings.md` is committed to git and, in the public repos, world-readable. A learning MUST NEVER
contain a secret, credential, token, API key, private IP/hostname, or insecure implementation detail.

- Sanitize by replacing the sensitive value with a `<placeholder>` token and stating where the real
  value lives — this inherits the [No Secrets in Git](../../../conventions/security/no-secrets-in-committed-files.md)
  hard iron rule and the post-mortem placeholder pattern (`<api-token>`, `<db-connection-url>`, and
  so on).
- **If a learning cannot be sanitized without losing its meaning, discard it.** A learning whose only
  content is a secret is not generalizable knowledge; it is a liability.
- This gate runs on every surviving entry regardless of destination — even a learning destined for a
  private repo must not carry a raw secret into a committed file.

## 2. Repo-Relevance Gate

A learning routes **only** to the repo(s) it actually pertains to:

- **Infra-private content** (Terraform, cluster or hypervisor internals, deployment-controller
  internals, on-prem infrastructure, real hostnames or inventories) MUST stay private and MUST NEVER
  be routed into this public repo.
- **Public-governance content** stays in `ose-public`. No other repository is a propagation target:
  the private sibling adopts a change only by an explicit, one-off request through its own route, and
  an upstream or product repository receives nothing (see
  [Related Repositories §Independent repositories](../../../conventions/structure/related-repositories.md#independent-repositories)).
- An **infra-specific** learning never appears in any file destined for a public repo, even in
  sanitized form — the gate is about which repo the knowledge belongs in, not just whether it is
  safe to publish.

Both gates run before a home is chosen and before any timing decision is made. A learning that fails
either gate is discarded (secret gate) or scoped down to a single private repo (repo-relevance gate) —
it never proceeds to routing in a form that violates either constraint.
