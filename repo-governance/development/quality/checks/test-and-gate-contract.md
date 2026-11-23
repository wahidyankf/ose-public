---
description: >-
  Sets the tool-neutral contract every repository's tests and gates meet, rules C1 to C24: one gate declaration, one
  kind of work per surface, a parallel pull-request gate, standard test levels and targets, a bound behaviour corpus, a
  99% unit floor, and a per-project conformance record.
when_to_use: >-
  Use when adopting or auditing a repository's tests and gates, deciding what a hook or the pull-request gate may hold,
  naming test targets, or finding which module holds a contract rule and how that rule is enforced.
---

# Test and Gate Contract

Every repository that adopts this contract meets the same rules for what runs, where, and what it proves. The contract
is tool-neutral: a rule names a surface, a target, or a property, and each repository maps it to its own runner. RHINO's
registry and validators are the recommended adapter; a repository with its own runner conforms through that runner.

Rule identifiers C1 to C24 are stable, so plans, audits, and acceptance criteria can cite them. This entrypoint indexes
the rules; each module holds the full statement and its reasons.

This standard implements [Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)
and `Fail Closed`. What a surface is belongs to `Surfaces and Mutation`; which kind of check runs on each surface
belongs to `Automated Quality Gates`.

## Surfaces at a Glance

| Surface            | Holds                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| `pre-commit`       | staged-file formatting only                                                        |
| `commit-msg`       | the commit-message format lint                                                     |
| `pre-push`         | the deterministic leak scan over the pushed range, plus the leak review for agents |
| `pull-request`     | one aggregate `quality-gate` check over parallel per-project and per-level jobs    |
| `main`/`scheduled` | `test:e2e`                                                                         |

A repository without a pull-request gate keeps the same hooks and runs the `pull-request` surface locally as its landing
gate.

## Rules and Enforcement

| Rule       | States                               | Disposition: check or reason                          |
| ---------- | ------------------------------------ | ----------------------------------------------------- |
| [C1][c1]   | one gate declaration, dispatched     | gated: wiring rules W01–W06                           |
| [C2][c2]   | no dead entries or unwired artefacts | gated: wiring rules W01–W06                           |
| [C3][c3]   | the bootstrap installs hooks         | gated: the bootstrap health check                     |
| [C4][c4]   | every gate tool pinned               | gated: wiring rule W06, or a runner pin check         |
| [C5][c5]   | offline and deterministic            | unenforced: judgement; network-denied run as evidence |
| [C6][c6]   | one kind of work per surface         | gated: wiring rules W01–W05 and W07                   |
| [C7][c7]   | scope by dependence                  | unenforced: a per-check judgement                     |
| [C8][c8]   | superset, parallel, one aggregate    | gated: wiring rules W01–W05, composition              |
| [C9][c9]   | local landing gate                   | unenforced: review reads the landing evidence         |
| [C10][c10] | commit-message lint twice            | gated: the message-lint entries                       |
| [C11][c11] | leak scan and leak review            | gated: the leak-scanner entries                       |
| [C12][c12] | levels by strongest boundary         | gated: through C21                                    |
| [C13][c13] | bound behaviour corpus               | gated: behaviour-coverage rules B01–B09               |
| [C14][c14] | standard targets                     | gated: behaviour-coverage rules B01–B09               |
| [C15][c15] | 99% unit floor                       | gated: the coverage gate, failing at 98.9%            |
| [C16][c16] | a real linter per stack              | gated: the lint entries, no advisory tier             |
| [C17][c17] | every layer runs automatically       | gated: wiring rule W01                                |
| [C18][c18] | no placeholders                      | gated: the skip and focus bans                        |
| [C19][c19] | gate inventory                       | unenforced: review against the registry               |
| [C20][c20] | remote-backed delivery               | unenforced: review reads the merge record             |
| [C21][c21] | hermetic units, mechanically         | gated: the stack mechanism                            |
| [C22][c22] | required `quality-gate` check        | gated: a recorded hosting-service read                |
| [C23][c23] | diagram rule and validation          | gated: the Mermaid validator                          |
| [C24][c24] | per project, product scope           | covered: per-project checks of C13, C15, C21          |

## Modules

1. [Registry and Dispatch](test-and-gate-contract/001-registry-and-dispatch.md)
2. [Surface Placement](test-and-gate-contract/002-surface-placement.md)
3. [Pull-Request Scope](test-and-gate-contract/003-pull-request-scope.md)
4. [Test Levels and Targets](test-and-gate-contract/004-test-levels-and-targets.md)
5. [Behaviour Corpus](test-and-gate-contract/005-behaviour-corpus.md)
6. [Coverage Floor](test-and-gate-contract/006-coverage-floor.md)
7. [Conformance Record](test-and-gate-contract/007-conformance-record.md)

An adopter records adopted, adapted, or not applicable for each module, per
[Conformance Record](test-and-gate-contract/007-conformance-record.md).

[c1]: test-and-gate-contract/001-registry-and-dispatch.md
[c2]: test-and-gate-contract/001-registry-and-dispatch.md
[c3]: test-and-gate-contract/001-registry-and-dispatch.md
[c4]: test-and-gate-contract/001-registry-and-dispatch.md
[c5]: test-and-gate-contract/001-registry-and-dispatch.md
[c6]: test-and-gate-contract/002-surface-placement.md
[c7]: test-and-gate-contract/003-pull-request-scope.md
[c8]: test-and-gate-contract/002-surface-placement.md
[c9]: test-and-gate-contract/002-surface-placement.md
[c10]: test-and-gate-contract/002-surface-placement.md
[c11]: test-and-gate-contract/002-surface-placement.md
[c12]: test-and-gate-contract/004-test-levels-and-targets.md
[c13]: test-and-gate-contract/005-behaviour-corpus.md
[c14]: test-and-gate-contract/004-test-levels-and-targets.md
[c15]: test-and-gate-contract/006-coverage-floor.md
[c16]: test-and-gate-contract/007-conformance-record.md
[c17]: test-and-gate-contract/004-test-levels-and-targets.md
[c18]: test-and-gate-contract/004-test-levels-and-targets.md
[c19]: test-and-gate-contract/007-conformance-record.md
[c20]: test-and-gate-contract/007-conformance-record.md
[c21]: test-and-gate-contract/004-test-levels-and-targets.md
[c22]: test-and-gate-contract/007-conformance-record.md
[c23]: test-and-gate-contract/007-conformance-record.md
[c24]: test-and-gate-contract/007-conformance-record.md
