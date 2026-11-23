---
description: >-
  Holds rules C16, C19, C20, C22, C23, and C24 of the test and gate contract: lint, the gate inventory, delivery, the
  required check, diagrams, and per-project product scope, plus adopter statuses and every rule's enforcement.
when_to_use: >-
  Use when recording a repository's gates or conformance, protecting a default branch, declaring practice code out of
  scope, adopting this contract, or checking how a contract rule is enforced.
---

# Conformance Record

## C16 Lint

Every stack has a real linter that fails at warning severity and above, per
[Lint Strictness](../../cross-language-lint-strictness.md), running in the pull-request gate. A formatter check is not a
linter.

## C19 Gate Inventory

Each repository keeps one table in its contributor documentation: every check, its surface, its scope (project, changed
files, or global), its command, and the level placement of its tests. It also records its exempt layers and any
infeasible network denial, each with its reason.

## C20 Remote-Backed Delivery

A remote-backed repository delivers through a worktree, a pull request, the green aggregate check, merge, and cleanup,
per [Pull Request Merge](../../../workflow/pr-merge-protocol.md). The leak review of the head runs before the push; for
the pull request, the delivery harness acts on it as [PR Leak Review](../../../../workflows/quality/pr-leak-review.md)
defines.

## C22 Required Check

Each remote-backed repository has a protection rule on its default branch at the hosting service that requires the
`quality-gate` check to pass before merge and refuses force-push. A route that pushes straight to the default branch
names the administrator role as its only bypass actor; every other rule has none. Each rule is an outward-facing
setting, applied only after the owner confirms it, for one repository or as a standing confirmation.

## C23 Diagrams

The repository declares one authoring rule per [Diagrams](../../../../conventions/formatting/diagrams.md). Under
`rendered`, every live conceptual diagram is Mermaid, and every Mermaid block is validated in the pull-request gate, or
the landing gate without one; RHINO's `md mermaid validate` is the recommended validator. Literal structure, wireframes,
and manuals read inside a terminal editor's help system stay plain text.

## C24 Per Project, Product Scope

The contract applies to product projects: apps, libraries, and tools that ship or run. Every rule applies to each such
project, not to a repository as a whole, and a repository conforms only when each of its projects does. A dedicated
end-to-end project is the end-to-end home of its paired app.

A repository may declare practice or exercise code that ships nothing as out of scope, in its repository adapter, naming
paths and the reason. This is a scope rule, not a coverage exception. Code is practice code only if no product project,
build, package, deployment, or pipeline imports, builds, runs, or publishes it (its own tests excepted), nothing it
produces reaches a user, and it has no production runtime. Code that fails any clause is product code. An undeclared
path is in scope, and each adoption re-checks every declaration.

The record is a conformance matrix: one row per project, one column per rule, and each declared exclusion listed as an
excluded row with its reason.

## Adopter Statuses

Each adopter records, for every module of this contract, adopted, adapted with its reason, or not applicable with its
reason. A repository with no runtime code is not applicable for Test Levels and Targets, Behaviour Corpus, and Coverage
Floor, and still adopts the other modules, running document checks and the leak scan in its pull-request gate. A
repository that copies no catalog text records its conformance in its own contributor documentation.

## Enforcement Dispositions

Every rule leaves with one disposition, gated, covered, or unenforced by decision, per
[Enforcement and Verification](../../../../workflows/quality/rules-propagation/003-enforcement-and-verification.md). The
index in [Test and Gate Contract](../test-and-gate-contract.md#rules-and-enforcement) lists every rule's disposition
with its check or reason; a gated rule's check is shown failing on a violating input. Five rules are unenforced by
decision, because each is a judgement no mechanical check settles. Spotting an ASCII conceptual diagram, and a Mermaid
block inside an excluded manual path, are unenforced for the same reason, and practice-code declarations are reviewed at
each adoption.
