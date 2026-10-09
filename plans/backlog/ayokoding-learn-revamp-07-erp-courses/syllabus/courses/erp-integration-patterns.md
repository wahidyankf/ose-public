# ERP Integration Patterns (By Example)

**Course ID**: `erp-integration-patterns` · **Format**: By Example.

**Scope note**: Designs API and event contracts between an ERP and other systems: idempotency, outbox, retries, dead letters, webhooks, batch feeds, schema change, and reconciliation. It excludes distributed-systems theory (event-driven-architecture); examples run in process with no network.

**Short summary**: Integrate through versioned contracts with idempotent, observable delivery.

## Why this exists · the big idea

- **The problem before the solution**: Integrations fail when consumers treat the ERP's tables as their own and when retries create duplicates.
- **Keep-this-if-you-forget-everything**: Integrate through versioned contracts with idempotent, observable delivery.

## Learning objectives

After this course you can:

1. publish versioned events and commands with explicit contracts.
2. make consumers idempotent and handle duplicate and out-of-order delivery.
3. publish reliably with an outbox and a relay.
4. retry with bounded policy, dead-letter failures, and verify webhook signatures.
5. translate foreign data in an anti-corruption layer and reconcile feeds.

## Prerequisites

- **Prior courses**: `erp-extension-and-customization`, `event-driven-architecture`, `networking-essentials`, `backend-essentials`, `api-design`, `just-enough-python`, `sql-essentials`.
- **Assumed knowledge**: Requests, events, and retries from the backend, API, and event-driven courses.
- **Language medium (prerequisite rubric rule L1)**: every example is written in Python 3.14 and 9 examples drive PostgreSQL 18 with SQL, so `just-enough-python` and `sql-essentials` are listed as prerequisites. Rubric rules T1 to T4 and L1 are re-run over this course's final text at slice S6, and the frontmatter `prerequisites` follow the result.
- **Outside this plan (must already be filled)**: `event-driven-architecture`, `networking-essentials`, `backend-essentials`, `api-design`, `just-enough-python`, `sql-essentials`. These are the accounting and engineering courses this path assumes; the path manifest lists them under `assumes`.

## Accuracy notes

Provenance to cite in the course `## References` section. The maker re-verifies each item and the Content Quality Gate checks it; no inline confidence label is used.

- Hohpe and Woolf, Enterprise Integration Patterns (Addison-Wesley, 2003).
- Kleppmann, Designing Data-Intensive Applications (O'Reilly, 2017).
- RFC 2104, HMAC: Keyed-Hashing for Message Authentication.
- Python hmac and hashlib documentation.

## Concepts

- **co-01 · integration-contract** — a versioned promise of exchanged meaning.
- **co-02 · command-api** — a request for an accountable source to act.
- **co-03 · domain-event** — a published statement that something happened.
- **co-04 · idempotent-consumer** — a handler that is safe under repeated delivery.
- **co-05 · outbox** — a reliable bridge from committed state to publication.
- **co-06 · correlation** — identifiers connecting one distributed flow.
- **co-07 · retry-policy** — a governed response to transient failure.
- **co-08 · observability** — signals sufficient to diagnose delivery.
- **co-09 · anti-corruption-layer** — translation between a foreign model and the ERP model.
- **co-10 · canonical-vs-point-to-point** — one shared message model versus pairwise mappings.
- **co-11 · batch-file-exchange** — scheduled file feeds with control totals.
- **co-12 · webhook-signature** — proving a callback came from the expected sender.
- **co-13 · dead-letter-queue** — a holding place for messages that keep failing.
- **co-14 · schema-versioning** — changing a contract without breaking consumers.
- **co-15 · reconciliation-feed** — a feed that proves both sides agree.
- **co-16 · backpressure** — slowing producers when consumers fall behind.

## Mode, targets, and runtime

- **Mode**: By Example (`format: by-example`).
- **Why this mode**: Each pattern is a small scenario with a deterministic outcome (publish, duplicate, fail, retry, verify), which By Example teaches best. Faults are injected with a seeded simulation and a virtual clock.

| Target             | Value                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Examples           | 78 (25 / 28 / 25 by level; floor 75, cap 85)                                                                                                                                     |
| Runnable examples  | 78 of 78, each in `learning/code/ex-NN-<slug>/` with a `run.yaml`                                                                                                                |
| Pages              | `learning/overview.md`, `beginner.md`, `intermediate.md`, `advanced.md`; `### Example N: Title` headings                                                                         |
| Diagrams           | at least 30 (the adapter band is 30 to 50)                                                                                                                                       |
| Annotation density | 1.0 to 2.25 comment lines per code line, measured per example                                                                                                                    |
| Course words       | at least 28,000 over every Markdown page of the course, code blocks included (a plan estimate aligned with plan 06, not a gate rule)                                             |
| Capstone           | `learning/capstone/overview.md` of at least 800 words plus `learning/capstone/code/` with a `run.yaml`                                                                           |
| Metadata           | `format`, `estimatedHours` from the drift test message, `description` (plan 03's sentence unless the objectives no longer fit it), `category: erp-systems`, no `status: outline` |

Anchor runtimes: PostgreSQL 18 service container, driven by a `psql` SQL unit or from Python 3.14 through the hash-locked pure-Python pg8000 driver in 1 of 9 anchors; Python 3.14, standard library only (no lockfile) in 7 of 9 anchors; Python 3.14 seeded simulation with a virtual clock (`simulation: true`) in 1 of 9 anchors.
Static mode (`cloud`, `cluster`, `ios`, `android`, `windows`): none expected.

## Worked examples

Slice S0 expands the cluster plan below to every `ex-NN` (title, level, runtime, task, check, and concept refs). Rules: counts per level as below; every concept is exercised by at least two examples; every example names at least one concept; each cluster starts with its anchor.

### Beginner (25 examples)

- **Cluster: Versioned contracts** (ex-01 to ex-08, 8 examples). Anchor **ex-01 · versioned-event** (Python 3.14) — publish an order-confirmed event with an explicit version, then verify the consumer rejects an unknown major version.
- **Cluster: Commands and events** (ex-09 to ex-17, 9 examples). Anchor **ex-09 · command-vs-event** (Python 3.14) — model a request to ship as a command and a shipment as an event, then verify only the owner executes the command.
- **Cluster: Idempotent consumers** (ex-18 to ex-25, 8 examples). Anchor **ex-18 · duplicate-delivery** (Python 3.14) — deliver the same event twice, then verify one business effect.

### Intermediate (28 examples)

- **Cluster: Outbox** (ex-26 to ex-34, 9 examples). Anchor **ex-26 · outbox-relay** (PostgreSQL 18) — write the outbox row in the source transaction and relay it, then verify a relay crash and restart publishes each row once.
- **Cluster: Retries and dead letters** (ex-35 to ex-44, 10 examples). Anchor **ex-35 · bounded-retry-dlq** (Python 3.14 simulation) — retry a failing delivery with backoff on a virtual clock, then verify the message lands in the dead-letter queue after the cap.
- **Cluster: Webhook signatures** (ex-45 to ex-53, 9 examples). Anchor **ex-45 · hmac-verify** (Python 3.14) — sign a payload with a test key and verify it, then verify a tampered payload and a replayed timestamp are refused.

### Advanced (25 examples)

- **Cluster: Anti-corruption layer** (ex-54 to ex-61, 8 examples). Anchor **ex-54 · translate-foreign-order** (Python 3.14) — translate a foreign order shape into the ERP model, then verify unmapped fields are reported rather than dropped.
- **Cluster: Batch and reconciliation feeds** (ex-62 to ex-70, 9 examples). Anchor **ex-62 · batch-file-recon** (Python 3.14) — exchange a batch file with a control total, then verify a missing row is detected by the reconciliation feed.
- **Cluster: Schema evolution** (ex-71 to ex-78, 8 examples). Anchor **ex-71 · compatible-change-check** (Python 3.14) — classify contract changes as compatible or breaking, then verify an added optional field passes and a removed field fails.

## Capstone spec

Build the order integration between a simulated shop and the ERP with versioned events, an outbox, an idempotent consumer, retries and a dead-letter queue, a reconciliation feed, and seeded fault injection over a fixed seed set. It lives in `learning/capstone/` with its own `run.yaml`, a golden expected output, and an overview of at least 800 words that names the concepts it combines.

## Drilling spec

`drilling/overview.md` holds five sections in this order (the counts are the floors plan 06 uses for the accounting courses, so the two tracks feel alike; drilling words at least 5,000):

1. **`## Recall Q&A`**: 24 questions, at least one for each of co-01 to co-16, answers in `<details>` blocks.
2. **`## Applied problems`**: at least 8. Themes: choose command or event for a described interaction; design retry and dead-letter policy; diagnose a duplicate posting.
3. **`## Code katas`**: at least 8 under `drilling/code/kata-NN-<slug>/` with `before/`, `after/`, and a `run.yaml`. Named katas: make a consumer idempotent; verify a webhook signature; classify a contract change.
4. **`## Self-check checklist`**: 24 "I can ..." items, at least one per concept.
5. **`## Elaborative interrogation & self-explanation`**: at least 6 why and why-not prompts, each naming a design choice and a rejected alternative, with a model answer.

## Course-specific checks

- No network: the shop and the ERP are in-process simulations.
- Fault injection follows the plan 05 simulation convention: `simulation: true`, a fixed seed set of at least 32 seeds, one `failing seed: <n> (<invariant>)` line per failure, one final `seeds: <passed> passed, <failed> failed (of <total>)` line, and a one-seed replay with `AYOKODING_SEED=<n>`.
- Signing keys in examples are labelled synthetic test values.

## Lineage

- The archived syllabus file [erp-integration-patterns](../../../../done/2026-08-16__ayokoding-learning-path-17-skills-erp-foundations/syllabus/courses/erp-integration-patterns.md) is history only and is not edited. It held 8 concepts and 3 worked examples. This file expands it to 16 concepts and 78 worked examples and adds the capstone, drilling, runtime, and target specs.

## In which paths

- `skills/conventional-erp` — Phase 5 of 5 (Extending and operating the ERP) · position 23 of 27.
- `skills/sharia-erp` — Phase 5 of 6 (Extending and operating the ERP) · position 23 of 30.
