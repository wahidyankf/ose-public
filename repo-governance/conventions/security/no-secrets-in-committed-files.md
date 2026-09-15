---
description: Hard iron rule — no system secret may enter any git-tracked file. Full standards in secrets-and-env-standards.md.
when_to_use: Use when checking whether a value is safe to commit to this repository.
---

# No Secrets in Committed Files

> **Stub.** The full rule, rationale, remediation guidance, and cross-repo canonicalization note live
> in [`secrets-and-env-standards.md` § 1](./secrets-and-env-standards/hard-iron-rule-no-secrets-in-committed-files.md).

**Summary**: No system secret may enter any git-tracked file. Real values go in gitignored `.env*`
files (except `.env.example`), `.secrets/`, or `secrets.json`. Git history is permanent — rotation
is the only reliable remediation after a leak.

**Cross-repo canonical identifier**: `no-secrets-in-committed-files` (previously `no-secrets-in-git`
in this repository; renamed by the `standardize-secrets-and-env` plan for alignment with the private sibling).

See: [`secrets-and-env-standards.md`](./secrets-and-env-standards.md)

## Principles Implemented/Respected

- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) —
  committed secret material is prohibited without relying on contributor inference.
- [Reproducibility](../../principles/software-engineering/reproducibility.md) — tracked files remain
  safe to clone and use without machine-specific credentials.
