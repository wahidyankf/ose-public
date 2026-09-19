---
description: Coordinates local compute through the checksum-pinned HIPPO consumer while preserving logical parallelism and correctness edges.
when_to_use: Use before running or wiring local builds, tests, generators, services, repository gates, or other compute-bearing work.
---

# Resource-Aware Development

OSE consumes [HIPPO](https://github.com/wahidyankf/hippo) as an independent upstream tool; the
root `./hippo` downloads a checksum-pinned release. Implementation, specifications, conformance,
and release automation stay upstream; never vendor, copy, or fork them into OSE.

## Principles Implemented/Respected

- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) —
  admission, mappings, retry behavior, and surviving serialization edges are declared.
- [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) — safe
  capacity and FIFO decisions come from one tested scheduler, not ad hoc coordination.
- [Root Cause Orientation](../../principles/general/root-cause-orientation.md) — pressure and
  configuration failures are resolved at their stated cause, never by bypassing the guard.

## Conventions Implemented/Respected

- **[Parallel-by-Default Practice](./parallel-by-default.md)**: the structural sibling — that
  decides what may run at once, this decides what capacity it may take while doing so.
- **[Secrets and Env Standards](../../conventions/security/secrets-and-env-standards.md)**: the
  evidence boundary here is that convention applied to coordination records.
- **[CI Blocker Resolution](../quality/ci-blocker-resolution.md)**: a deferral or shed run is
  resolved at its stated cause, never by bypassing the guard.
- **[File Naming Convention](../../conventions/structure/file-naming.md)** and
  **[Content Quality Principles](../../conventions/writing/quality.md)**: this document follows both.

## Contents

- [Guarded Admission and Parallelism](./resource-aware-development/guarded-admission-and-parallelism.md) — One outer HIPPO boundary per compute-bearing DAG node, which reservations each class makes, and the only two worker variables OSE maps. Use when wiring a build, test, generator, or gate command, or when deciding whether two nodes must be serialized.
- [Workload Classes and Supervision](./resource-aware-development/workload-classes-and-supervision.md) — Which workload class a command takes, and what HIPPO sheds first when the host is under critical pressure. Use when choosing between the ephemeral, service, and transactional classes, or when a run was shed.
- [Recovery and Safe Retry](./resource-aware-development/recovery-and-safe-retry.md) — What HIPPO exits 1, 73, 75, 76, and 78 require before a retry, and the corrections that are never allowed. Use when a guarded command exits non-zero and you are deciding whether and how to retry it.
- [Consumer Integrity, State, and Evidence](./resource-aware-development/consumer-integrity-state-and-evidence.md) — How the pinned release is verified, what the shared root and owner ceiling mean across checkouts, the container reaping-init requirement, and what evidence may contain. Use when changing the pin, the local policy example, HIPPO_ROOT, or a test that touches HIPPO state.
- [Enforcement and Judgment Boundaries](./resource-aware-development/enforcement-and-judgment-boundaries.md) — Which gates check this practice, and which parts are unenforced by decision with their reasons. Use when asking how a resource-aware obligation is enforced, or why one deliberately is not.
