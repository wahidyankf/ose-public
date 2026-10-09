# Capstone · Real-World Delivery (Capstone, Annotated-Concept)

**Course ID**: `capstone-real-world-delivery` · **Format**: Capstone (`format: capstone`); teaching
mode: Annotated-Concept, standard sub-mode.

**Scope note**: Takes a small habit-tracking service (the shape built in `capstone-solid-core`) and
ships it as a documented, event-driven, deployed-as-code, and secure service: architecture records
and capacity arithmetic, one domain rule and an outbox-to-projection event flow, a deterministic
self-healing simulation, container and cluster manifests, infrastructure as code with a local
provider, a CI/CD workflow, and a threat register with matching detections. It integrates the
architecture, delivery, and security courses and adds no new theory. It excludes any real cloud
account, any real cluster, and any target you do not own.

**Short summary**: You document the service before you change it, make an event flow that loses
nothing and repeats nothing, show with a seeded simulation that a controller restores crashed
replicas, validate the manifests and infrastructure code with offline tools, and close with a threat
register where every threat has a fix and a detection that fires.

## Why this exists · the big idea

- **The problem before the solution**: shipping is where separate skills collide. A design that is
  not written down cannot be reviewed; an event flow without a crash test loses or doubles events; a
  manifest that has never been validated fails at deploy time; a threat without a detection is only a
  hope.
- **Keep-this-if-you-forget-everything**: write down your assumptions and tie each one to a constraint
  in the code; test the failure points on purpose; validate everything you can offline; and give
  every threat a mitigation and a detection that you have seen fire.

## Safety boundary (non-negotiable)

- Everything runs on your own machine against self-owned fixtures. The harness validates manifests and
  infrastructure code **offline** (`kubeconform` with local schemas, `tofu validate` with a local
  provider) and never contacts a cluster or a cloud account. The Python code runs with networking off.
- No production credentials, tokens, or accounts appear anywhere; secrets are references to names.
  The only secret-like value is a planted fake used to prove it stays out of source, logs, and
  manifests.
- Security work stays defensive and lab-local: threat modelling, hardening checks, and detections on
  synthetic logs. Optional steps that create a local cluster (for example with `kind`) are
  extensions the reader runs on their own machine, are never run by the harness, and never target
  anything but that local cluster.
- A reviewer checks every page and code file against this section before the course passes the
  Content Quality Gate ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#safety-checks-for-security-courses)).

## Learning objectives

- Write C4 views, an assumptions register, capacity arithmetic, and a persistence decision with
  rejected alternatives, and test that the documents agree with the code and manifests.
- Implement one domain invariant and a transactional-outbox flow with an idempotent consumer, and
  prove no loss and no double processing by injecting a crash at every step.
- Model a reconcile loop, probes, retries, and a circuit breaker, and show by seeded simulation that
  crashed replicas are restored.
- Package a service and write hardened Kubernetes manifests, infrastructure code with a local
  provider, and a CI/CD workflow, and validate each offline.
- Keep a threat register where each threat has a mitigation, a failed attack, and a detection that
  fires on labelled logs, and finish with a single ship check.

## Prerequisites

- **Prior courses (`prerequisites` after the rubric re-run)**: `just-enough-python`,
  `capstone-solid-core`, `backend-at-scale`, `software-architecture`, `domain-driven-design`,
  `event-driven-architecture`, `containers-and-orchestration`, `cloud-and-iac`,
  `cicd-and-release-engineering`, `it-and-application-security`, `offensive-security`,
  `defensive-security`.
- **Edge changes against plan 02's graph**: add `just-enough-python` (rule L1: Python is the main code
  medium) and `event-driven-architecture` (rule T1: theme B teaches the outbox, the idempotent
  consumer, and a projection, which that course owns). Every other edge is kept because the written
  course uses it, including `capstone-solid-core` (rule C1: the service shape comes from that
  capstone). No edge is removed.
- **Assumed knowledge**: the layered shape of the `capstone-solid-core` habit tracker (ports and a
  repository adapter); reading YAML and HCL; what a pod, a probe, and a pipeline are.
- **Not required**: your own `capstone-solid-core` code. The course ships its own copy of the service
  shape so that it does not break if that course changes; you may use your own app in the extension.
- **Later-rewrite note**: `defensive-security` is a templated filler course today, and plan 09 rewrites
  it after this plan merges; `capstone-solid-core` may change in the audit plans 11–13. This course
  follows the course-level coupling rule: it links to those courses by course URL only, restates the
  concepts it uses, and ships its own copy of the service shape
  ([tech-docs/003](../../tech-docs/003-prerequisites-readiness-and-ordering.md#course-level-coupling)).

## Mode and targets

- **Mode**: Annotated-Concept, standard sub-mode. **Reason**: the course joins many separate
  practices, and each join has one claim that can be checked (an ADR links to a constraint, a crash
  at step 3 loses nothing, a manifest runs as non-root). Small annotated examples fit that; By
  Example would re-teach each tool; In the Field has no course-level layout.
- **Worked examples**: floor 45, band 45–60, five themes of nine. Forty-two carry Python (two
  of them check illustrations, the container recipe and the CI workflow), and three are static
  manifest or infrastructure checks (ex-29, ex-30, ex-32).
- **Words**: at least 23,000. **Diagrams**: at least one per theme (C4 views, the outbox flow, the
  reconcile loop, the delivery pipeline, and the threat-to-detection map among them).
- **Layout**: standard; theme pages `learning/theme-a-architecture-and-capacity.md` to
  `learning/theme-e-security-and-detection.md`.
- **Metadata**: `category: architecture-and-distributed-systems`; `format: capstone`; `description`
  kept from plan 03 ("Ship a prior capstone app as a documented, event-driven, secure, deployed
  service."); `estimatedHours` from the drift test (expected 7–11); no `status`.

## Project brief

**You are the engineer taking Habit Hub to production**, locally. Habit Hub lets a user define habits
and record one check-in per habit per day. You will:

1. Document it: C4 context, container, and component views; an assumptions register; capacity
   arithmetic; and an architecture decision for persistence with rejected alternatives.
2. Add one domain rule (a check-in needs an owned habit, and only one per habit per day) and an event
   flow: `checkin.recorded` goes to an outbox, to an idempotent consumer, to a streak projection.
3. Make it reliable: probes, graceful shutdown, bounded retries, a circuit breaker, backup and
   restore, and a simulated controller that restores crashed replicas.
4. Package and deploy as code: a container recipe, hardened manifests, local-provider infrastructure
   code, and a CI/CD workflow.
5. Secure it: a threat register, mitigations, hardening checks, and detections tested on labelled logs.
6. Prove readiness with one ship check that prints every gate.

```text
checkin.recorded → outbox → idempotent consumer → streak projection
```

## Milestones

| #   | Milestone                                    | Theme | Checkpoint (capstone run)            |
| --- | -------------------------------------------- | ----- | ------------------------------------ |
| M1  | Documented and costed                        | A     | `stage-1-architecture`               |
| M2  | An event flow that loses and repeats nothing | B     | `stage-2-events`                     |
| M3  | A service that heals                         | C     | `stage-3-self-healing` (simulation)  |
| M4  | Deployable as code                           | D     | `stage-4-delivery`                   |
| M5  | Secured, detected, and ship-checked          | E     | `stage-5-security-and-ship`, `tests` |

## Acceptance criteria

| ID    | Criterion                                                                                                                                               | Proof run                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| AC-1  | Every container in the C4 view appears in the manifests, every assumption maps to a code constraint, and the capacity table matches the computed values | `stage-1-architecture`      |
| AC-2  | An architecture test shows the domain package imports nothing from adapters                                                                             | `stage-1-architecture`      |
| AC-3  | A second check-in for the same habit and day, and a check-in for a habit the user does not own, are both refused                                        | `stage-2-events`            |
| AC-4  | With a crash injected at every step of the outbox flow, every recorded event is processed exactly once after recovery                                   | `stage-2-events`            |
| AC-5  | Replaying one message three times changes the projection once; a poison message goes to the dead-letter table after three attempts                      | `stage-2-events`            |
| AC-6  | Across 32 seeds with random replica kills, the desired replica count is restored within the stated virtual time and no invariant breaks                 | `stage-3-self-healing`      |
| AC-7  | A backup restored to a fresh database gives the same state hash                                                                                         | `stage-3-self-healing`      |
| AC-8  | The manifests validate offline and satisfy the hardening checks (non-root, read-only root, probes, resource limits, no privilege)                       | `stage-4-delivery`          |
| AC-9  | The infrastructure code validates offline and contains no secret                                                                                        | `stage-4-delivery`          |
| AC-10 | The CI/CD workflow pins every action, grants least privilege, and deploys only after tests pass, behind an environment gate                             | `stage-4-delivery`          |
| AC-11 | Every threat has a mitigation, a failed attack test, and a detection that fires on its labelled logs and none of the benign ones                        | `stage-5-security-and-ship` |
| AC-12 | The ship check prints every gate as passed, and two runs give the same digest                                                                           | `stage-5-security-and-ship` |
| AC-13 | The unit tests pass                                                                                                                                     | `tests`                     |

## Rubric

Levels: 0 not yet, 1 partial, 2 meets, 3 strong. A pass needs every criterion at 2 or higher and all
thirteen acceptance criteria green.

| Criterion            | 2 — meets                                                        | 3 — strong                                                           |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| Architecture records | Views, assumptions, capacity, and one decision with alternatives | A fitness test fails when the record and the code drift apart        |
| Event correctness    | Crash-at-every-step test; idempotent consumer; dead letter       | The ordering guarantee per key is stated and tested                  |
| Reliability          | Probes, bounded retries, restore; seeded simulation passes       | A weaker controller is shown failing on a named seed                 |
| Delivery as code     | Manifests, infrastructure code, and workflow validate offline    | A rollback path is written and tested in the simulation              |
| Security             | Threat register with mitigations and tested failed attacks       | Residual risks carry an owner and a revisit trigger                  |
| Detection            | Each threat has a rule tested on labelled logs                   | Rule noise is measured and a tuning decision is recorded             |
| Shipping judgement   | The ship check prints all gates                                  | A written "do not ship if" list names the gates that block a release |

**Evidence to keep**: the architecture record, the crash-injection table, the simulation summary and
failing seeds (if any), the validator outputs, the threat register, the rule evaluation table, and
the ship-check output with its digest. Keep no real secrets.

**Extensions** (not graded, not run): apply the manifests to a local cluster you create yourself;
run the CI workflow in a repository you own; replace SQLite with a server database and re-run the
event tests.

## Concepts

- **co-01 · c4-views** — context, container, and component diagrams at three zoom levels.
- **co-02 · assumption-to-constraint** — each capacity assumption becomes a limit or test in the code.
- **co-03 · architecture-decision-record** — context, decision, consequences, and rejected alternatives.
- **co-04 · fitness-function** — a test that keeps the design rule true over time.
- **co-05 · aggregate-invariant** — a rule the domain object enforces in one place.
- **co-06 · transactional-outbox** — the event is stored in the same transaction as the state change.
- **co-07 · idempotent-consumer** — handling a message twice has the effect of handling it once.
- **co-08 · fault-injection** — deliberately crash at each step and check the invariants.
- **co-09 · reconcile-loop** — a controller moves actual state toward desired state.
- **co-10 · probes-and-graceful-shutdown** — liveness, readiness, and drain budgets match the platform.
- **co-11 · deploy-as-code** — manifests, infrastructure code, and pipelines are versioned and validated.
- **co-12 · hardening-baseline** — non-root, read-only root file system, dropped capabilities, limits.
- **co-13 · threat-register** — threat, mitigation, failed attack, detection, residual risk.

## Worked examples

Python examples use the standard library and one hash-locked YAML reader. The simulation follows the
harness rules (virtual clock, seeded generator, 32 seeds or more, invariants checked, failing seeds
printed). Static examples are validated offline.

### Theme A — Architecture and capacity (`learning/theme-a-architecture-and-capacity.md`)

- **ex-01 · c4-context-view** — a Mermaid context diagram plus a table of actors and systems — verify
  every actor in the table appears in the diagram source. (co-01)
- **ex-02 · c4-container-view** — the service, database, and consumer as containers — verify each
  container name appears in the manifest list. (co-01)
- **ex-03 · c4-component-view** — domain, services, ports, and adapters — verify against the real
  package list. (co-01)
- **ex-04 · assumptions-register** — each assumption has an owner, a unit, and a source — verify the
  register parses and has no blank field. (co-02)
- **ex-05 · capacity-arithmetic** — users, check-ins per day, peak per second, and storage per year —
  verify the printed table against hand-calculated values. (co-02)
- **ex-06 · littles-law-sizing** — concurrency equals arrival rate times time in system — verify the
  worker count for three loads. (co-02)
- **ex-07 · assumption-to-constraint** — turn "at most 50 requests per second" into a limit and a
  test — verify the test fails when the limit is removed. (co-02)
- **ex-08 · persistence-decision-record** — an ADR choosing SQLite or a server database with rejected
  alternatives — verify the required headings and at least two alternatives. (co-03)
- **ex-09 · architecture-fitness-test** — the domain package imports no adapter — verify pass, and a
  planted violation fails. (co-04)

### Theme B — Domain and events (`learning/theme-b-domain-and-events.md`)

- **ex-10 · aggregate-invariant** — one check-in per habit per day — verify the second is refused.
  (co-05)
- **ex-11 · ownership-rule** — a check-in needs an owned habit — verify a foreign habit is refused.
  (co-05)
- **ex-12 · domain-event** — `checkin.recorded` as an immutable record with a stable ID — verify the
  JSON. (co-05, co-06)
- **ex-13 · outbox-in-one-transaction** — state change and event row commit together — verify a forced
  failure leaves neither. (co-06)
- **ex-14 · outbox-relay** — read pending rows in order and mark them sent — verify order and marking
  with a virtual clock. (co-06)
- **ex-15 · idempotent-consumer** — a processed-messages table keyed by event ID — verify a replay
  changes nothing. (co-07)
- **ex-16 · streak-projection** — build a per-user streak from events — verify against hand-computed
  streaks. (co-07)
- **ex-17 · crash-at-every-step** — inject a failure at each numbered step of the flow, recover, and
  compare totals — verify no loss and no duplicate for all steps. (co-08)
- **ex-18 · poison-message-and-dead-letter** — a message that always fails — verify three attempts and
  a dead-letter row with the reason. (co-07, co-08)

### Theme C — Reliability and self-healing (`learning/theme-c-reliability-and-self-healing.md`)

- **ex-19 · liveness-and-readiness** — what each probe means — verify readiness turns false while
  draining. (co-10)
- **ex-20 · graceful-shutdown-budget** — stop intake, drain, then exit within a budget — verify the
  phases on a virtual clock. (co-10)
- **ex-21 · retry-with-seeded-jitter** — bounded retries with backoff and jitter from a seeded
  generator — verify the delay sequence. (co-10)
- **ex-22 · circuit-breaker** — closed, open, half-open on a fake clock — verify the transitions.
  (co-10)
- **ex-23 · reconcile-loop** — desired versus actual replicas — verify one step brings actual toward
  desired. (co-09)
- **ex-24 · crash-and-restore-replicas** — kill a replica — verify the loop restores it in the stated
  virtual time. (co-09)
- **ex-25 · rolling-update-simulation** — `maxUnavailable` and `maxSurge` — verify availability never
  drops below the stated floor. (co-09)
- **ex-26 · backup-and-restore** — SQLite online backup and restore — verify the state hash matches.
  (co-10)
- **ex-27 · seeded-self-healing-simulation** — random kills over 32 seeds — verify the summary line and
  a deliberately weak controller failing on named seeds. (co-09)

### Theme D — Packaging and deploy as code (`learning/theme-d-packaging-and-deploy-as-code.md`)

- **ex-28 · container-recipe** — a multi-stage recipe for the service (an illustration, not run) —
  verify the checklist the code prints (non-root user, no build tools in the final stage, pinned
  base by digest). (co-11, co-12)
- **ex-29 · deployment-manifest** — a Deployment with probes, resources, and security context —
  validated offline (static). (co-11)
- **ex-30 · service-and-config** — a Service, a ConfigMap, and a Secret reference with no value —
  validated offline (static). (co-11)
- **ex-31 · hardening-checks** — read the manifests and assert non-root, read-only root file system,
  dropped capabilities, and limits — verify pass and a planted failure. (co-12)
- **ex-32 · local-provider-iac** — OpenTofu with the `local` provider rendering a config file —
  validated offline (static). (co-11)
- **ex-33 · no-secrets-in-iac** — scan manifests and infrastructure code for the planted fake secret —
  verify none and one planted detection. (co-11, co-12)
- **ex-34 · ci-workflow-structure** — build, test, deploy jobs with `needs` (an illustration) —
  verify with a structural test. (co-11)
- **ex-35 · pinned-and-least-privilege** — every action pinned to a commit and permissions set to
  read — verify and show a failing loose version. (co-11, co-12)
- **ex-36 · deploy-gate-and-rollback** — deploy only from the main branch behind an environment
  approval, with a rollback step — verify the rule on sample events. (co-11)

### Theme E — Security and detection (`learning/theme-e-security-and-detection.md`)

- **ex-37 · threat-model-the-service** — STRIDE-style table of threats by element — verify every
  threat has an ID and a boundary. (co-13)
- **ex-38 · abuse-cases-mapped** — OWASP Top 10:2025 categories and ATT&CK techniques per threat —
  verify every ID is in the pinned lists. (co-13)
- **ex-39 · mitigation-with-failed-attack** — a test that tries the abuse and fails — verify one per
  threat. (co-13)
- **ex-40 · authz-on-the-api** — object-level check on habits and check-ins — verify a foreign habit
  returns the same response as a missing one. (co-12)
- **ex-41 · security-events** — structured events for denied access, repeated failures, and outbox
  anomalies — verify the JSON lines. (co-13)
- **ex-42 · detection-rules** — three rules (repeated denials, outbox backlog, dead-letter growth) —
  verify firing on labelled malicious logs. (co-13)
- **ex-43 · rule-precision** — no firing on benign logs — verify the table. (co-13)
- **ex-44 · threat-register-complete** — each threat has a mitigation, a test, and a detection — verify
  an incomplete row fails the check. (co-13)
- **ex-45 · ship-check** — run every gate and print one summary — verify all pass and two runs give the
  same digest. (co-13)

## Drilling

All drill sections are in `drilling/overview.md`; floors come from
[tech-docs/002](../../tech-docs/002-capstone-course-contract-and-modes.md#drilling-targets).

- **Katas** (each has `before/` and `after/`; the `before` run expects a non-zero exit):
  `kata-01-outbox-lost-commit`, `kata-02-non-idempotent-consumer`,
  `kata-03-retry-storm-without-backoff`, `kata-04-unpinned-tool-in-ci`,
  `kata-05-threat-without-detection`.
- Recall, applied problems, checklist, and why-prompts follow the counts in tech-docs/002.

## Code and harness

- **Toolchain**: `python` for the capstone unit and 42 examples, with `requirements.lock` (hash-locked)
  for the YAML reader used by the manifest checks. Three examples (ex-29, ex-30, ex-32) use the
  validator toolchains `kubeconform` (reason `cluster`) and `opentofu` (reason `cloud`) in static
  mode, with the providers baked from the course's `.terraform.lock.hcl`. The container recipe
  (ex-28) and the CI workflow (ex-34) are illustrations with structural tests in Python.
- **Units**: 45 example units, 5 kata units, 1 capstone unit holding the reference Habit Hub, the
  simulation, the manifests, the infrastructure code, the workflow, the threat register, and the
  ship check. The capstone unit is single-toolchain (Python); the validator examples hold identical
  copies of the manifests and infrastructure code, and a `diff` confirmation at execution proves the
  copies equal the capstone's own
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#two-language-capstones)).
- **Capstone runs**: `stage-1-architecture`, `stage-2-events`, `stage-3-self-healing`
  (`simulation: true`, 32 seeds), `stage-4-delivery`, `stage-5-security-and-ship`, and `tests`
  (`python3 -m unittest`, output ignored).
- **Determinism**: injected clock; seeded generator; ordered output; temporary directories not
  printed; crash points are named steps, not random.
- **Illustrations**: the container recipe, the CI workflow, and the optional local-cluster commands
  carry `<!-- harness: illustration -->` with a sentence saying why they are not run.
- **Run-time budget**: the validators dominate; the executor measures them
  ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism-design.md#run-time-budget)).

## Accuracy notes

- C4 model views (context, container, component): Simon Brown, `https://c4model.com/`, read at
  authoring time.
- The transactional outbox pattern: Chris Richardson, "Transactional outbox",
  `https://microservices.io/patterns/data/transactional-outbox.html`, read at authoring time.
- Kubernetes probe, security-context, `maxUnavailable`, and `maxSurge` behaviour: Kubernetes
  documentation for the version the `kubeconform` schemas target, pinned in Phase 0.
- OpenTofu `local` provider behaviour and the offline `tofu validate` flow follow plan 05's toolchain
  record (providers baked from a lock file, `-backend=false`).
- OWASP Top 10:2025 category names and ATT&CK technique IDs are taken from the pinned lists named in
  `capstone-secure-service`; the ATT&CK notice text appears on this course's page too.
- Capacity numbers are invented for the exercise and labelled as assumptions.

## Read more

- **Software Architecture in Practice** — Bass, Clements, and Kazman (Addison-Wesley). Quality
  attributes and decisions.
- **Release It!** — Michael Nygard (Pragmatic Bookshelf). Stability patterns such as circuit
  breakers.
- **Kubernetes documentation: Pod security standards** — the Kubernetes project. The hardening baseline.

## Lineage

This course replaces a 2-file outline whose sketch was `order.accepted → outbox → idempotent consumer
→ projection`. The flow is kept, with `checkin.recorded` as the event so that it builds on the habit
service from `capstone-solid-core`. The outline's five steps became the five milestones.

## In which paths

- `careers/interview-ready/software-engineer` — extension, "Integrative capstones".
- `careers/immediately-effective/software-engineer` — extension, "Integrative capstones".
- `careers/fundamentally-strong/software-engineer` — extension, "Integrative capstones".
