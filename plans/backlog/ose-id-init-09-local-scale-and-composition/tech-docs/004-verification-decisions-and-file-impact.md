# Verification, Decisions, and File Impact

## Verification Matrix

| Concern                   | Required proof                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Shared session/key state  | Web A creates/protects; web B reads; backend A issues; backend B publishes/validates same key generation |
| Authorization correlation | Start A, stop A, callback B, exactly one code/session/grant                                              |
| Email and invitation      | Capability created/sent via one instance and consumed via another                                        |
| Google federation         | State/nonce created via A and validated via B; replay denied everywhere                                  |
| Passkey/MFA               | Challenge/continuation crosses instances; invalid/replay stays denied                                    |
| Company admin             | Recent-auth/idempotent mutation crosses instances and preserves RLS/company boundary                     |
| Revocation/rate policy    | Action on A is enforced immediately by B according to contract                                           |
| Lifecycle                 | success/failure/crash/interrupt/repeat cleanup and concurrent-stack isolation                            |
| Composition               | Versioned synthetic consumer uses public descriptor and nested cleanup                                   |
| Fail-closed               | Production/non-loopback/fake/unknown-contract/debug-fallback configuration never becomes ready           |

## Decision Record

| ID    | Decision                                         | Rejected alternatives                       | Revisit trigger                               |
| ----- | ------------------------------------------------ | ------------------------------------------- | --------------------------------------------- |
| LC-01 | Two web/two backend no-affinity proof            | Single instance; sticky session             | Never relax; extend scale in deployment plan  |
| LC-02 | Reuse approved shared persistence/key mechanisms | Add Redis; local caches as authority        | Measured production need with separate plan   |
| LC-03 | One OSE-owned inner runner                       | Consumer script copies                      | Contract cannot express a proven app need     |
| LC-04 | Ownership manifest and reverse cleanup           | Prefix/glob cleanup; manual teardown        | Never relax; implementation may improve proof |
| LC-05 | Public and private descriptors separated         | Secrets in env/stdout; one broad descriptor | Approved secret channel changes               |
| LC-06 | Local proof only                                 | Kubernetes delivery; production HA claim    | Private cluster and platform gates complete   |

## Security and Destructive-Action Controls

- Validate exact repository-relative/temp targets before write or delete.
- Never recursively delete home, repository root, `/`, unresolved variables, globs, or user-owned paths.
- Match PID with expected executable/start identity; match Compose resources with exact project/labels.
- Bind local dependencies to loopback and reject non-local runtime configuration.
- Keep secrets outside Git/stdout/argv/evidence and remove them even after failure.
- Make test-only instance markers/control channels unreachable in ordinary/production builds.
- Treat cleanup failure as a failure, but preserve/report the earlier primary status.

## Licensing and Deployment

OSE-authored runner, tests, source, and docs inherit root MIT. Third-party images/tools retain their own
licenses; pin exact version/digest where repository policy requires and record notices.

This plan creates no deployable infrastructure. The production plan remains blocked at minimum on
private `plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster`, then-current platform
handoff gates, and explicit production decisions for keys, database HA/backup, email, Google credentials,
TLS/DNS, observability, incident response, and capacity.

## File-Impact Analysis

```text
.
├── apps/
│   ├── ose-id-be/project.json [E] — expose final local composition targets
│   ├── ose-id-be-e2e/
│   │   ├── project.json [E] — register stack and no-affinity E2E targets
│   │   ├── compose.local-stack.yml [N] — owned local multi-instance topology
│   │   └── src/
│   │       ├── local-stack/ [N] — runner lifecycle adapter
│   │       └── no-affinity/ [N] — alternating-instance proof
│   ├── ose-id-web/project.json [E] — expose final local web target
│   └── ose-id-web-e2e/
│       ├── project.json [E] — register browser stack and no-affinity targets
│       └── src/
│           ├── local-stack/ [N] — browser composition adapter
│           └── no-affinity/ [N] — browser instance-switch proof
├── specs/apps/ose/
│   ├── id-be/behaviours/local-runtime/local-scale-and-composition.feature [N] — backend stack behaviour
│   ├── id-be/behaviours/persistence/complete-audit-contract.feature [N] — full-catalog audit/no-delete behaviour
│   └── id-web/
│       ├── behaviours/local-runtime/local-scale-and-composition.feature [N] — browser stack behaviour
│       └── contracts/local-stack/
│           ├── input-manifest.schema.json [N] — runner input contract
│           ├── public-descriptor.schema.json [N] — safe descriptor contract
│           ├── control-message.schema.json [N] — control-channel contract
│           └── diagnostic.schema.json [N] — failure result contract
├── docs/reference/web-sites.md [E] — final local ports and composition command
└── plans/in-progress/ose-id-init-09-local-scale-and-composition/ [E] — executing delivery record and evidence
```

### More Detail

Phase 0 resolves the archived plan 06/07/08 paths, actual runner/Compose/source/target locations, ports,
and registry ownership delivered by earlier slices. Each `[N]` directory is a bounded named adapter
family whose exact members are frozen in the file ledger before editing. Update the tree before code if concrete paths differ.
`[E]` excludes LMS implementation, Redis, Kubernetes, deployment, production config/secrets, and changes
to identity behavior except those required to remove process-local correctness state.
Any shared-state defect outside the listed exact files requires a documented file-impact amendment
before edit; no whole-app wildcard is authorized.

## Evidence Confidence

- **[Repo-grounded]** Delivered Plans 06–08, their archived audits, and actual project targets are the
  authority resolved during Phase 0.
- **[Web-cited, official, accessed 2026-09-15]** Microsoft
  [ASP.NET Core Data Protection configuration](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview?view=aspnetcore-10.0)
  documents explicit shared key persistence/protection configuration, supporting cross-instance proof.
- **[Judgment call]** Fixed family ports and manifest-owned cleanup make local evidence deterministic;
  Phase 0 stops for conflicts rather than silently remapping them.

## Rollback and Recovery

The runner is additive local tooling. Roll back its public Nx target/contract and preserve all OSE ID
data/schema. If statelessness fixes changed shared state, forward-fix unless migration evidence proves a
safe no-data down path. A runner crash must leave a manifest sufficient for exact safe cleanup; recovery
never broadens deletion scope.
