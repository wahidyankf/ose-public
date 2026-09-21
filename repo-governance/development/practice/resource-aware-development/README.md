---
description: "Coordinates local compute through the checksum-pinned HIPPO consumer while preserving logical parallelism and correctness edges"
when_to_use: "Read this index to find the right Resource-Aware Development child document."
---

# Resource-Aware Development

- [Guarded Admission and Parallelism](./guarded-admission-and-parallelism.md) — One outer HIPPO boundary per compute-bearing DAG node, which reservations each class makes, and the only two worker variables OSE maps. Use when wiring a build, test, generator, or gate command, or when deciding whether two nodes must be serialized.
- [Workload Classes and Supervision](./workload-classes-and-supervision.md) — Which workload class a command takes, and what HIPPO sheds first when the host is under critical pressure. Use when choosing between the ephemeral, service, and transactional classes, or when a run was shed.
- [Recovery and Safe Retry](./recovery-and-safe-retry.md) — What HIPPO exits 73, 75, and 78 require before a retry, and the corrections that are never allowed. Use when a guarded command exits non-zero and you are deciding whether and how to retry it.
- [Consumer Integrity, State, and Evidence](./consumer-integrity-state-and-evidence.md) — How the pinned release is verified, what the shared root and owner ceiling mean across checkouts, the container reaping-init requirement, and what evidence may contain. Use when changing the pin, the local policy example, HIPPO_ROOT, or a test that touches HIPPO state.
- [Enforcement and Judgment Boundaries](./enforcement-and-judgment-boundaries.md) — Which gates check this practice, and which parts are unenforced by decision with their reasons. Use when asking how a resource-aware obligation is enforced, or why one deliberately is not.
