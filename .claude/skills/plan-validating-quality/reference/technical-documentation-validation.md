# Technical Documentation Validation (Scope 3)

The selected technical form is a primary junior-readable surface. A junior engineer fresh from
bootcamp with no professional work experience and no repository or stack context must be able to
understand the current state, relevant concepts, alternatives, contracts, architecture,
migration/rollback, and verification design without chat or author assistance. Missing prerequisite
explanation or rationale is **HIGH** even when paths and diagrams exist.

Architecture documented; design decisions justified; implementation approach clear; dependencies
listed; testing strategy defined.

**Minimal-sufficiency rationale (HIGH)**: when the plan adds code, a dependency, abstraction,
validator, automation, infrastructure, or another lasting mechanism, its selected technical form
must name the
concrete requirement, correctness or safety obligation, or demonstrated recurring risk it addresses
and explain why existing mechanisms are insufficient. Flag a missing rationale, a speculative future need, or a new
mechanism when the documented existing mechanism already satisfies the stated need.

**Schema/migration contract (HIGH when applicable)**: require a relational ERD or storage-
appropriate model, exact old/new contract, field purpose/lifecycle guide, compatibility boundaries,
expand-migrate-verify-contract sequence, rollback triggers, and no-loss proof.

**API contract delta (HIGH when applicable)**: a plan that changes HTTP, BFF, RPC, event, or standard
protocol operations uses the `tech-docs/` directory form and maps exactly one separately numbered API
contract delta document. Require action, exact operation, caller, auth/context, request/response/error
semantics, applicable safety properties, machine-readable contract/codegen impact, compatibility and
recovery, and Unit/Integration/E2E proof. An API-adjacent no-change claim requires an evidenced no-delta
document. Missing document or material field: **HIGH**. See the
[API Contract Delta convention](../../../../repo-governance/conventions/structure/plans/api-contract-delta.md).
The operation table is only an index. Report HIGH when an operation lacks its detailed headers,
parameters, schemas and serialized examples, status/problem-code behaviour, validation, lifecycle and
privacy rules, compatibility/rollback, or full Gherkin-style contract scenarios. Scenarios may be
inline or reached through an exact anchor to that operation's one-to-one detailed set in the same API
document or the plan's dedicated numbered BDD/spec-delta companion in the same `tech-docs/` folder.
The packet names exact scenario IDs/titles, canonical `specs/**` destination, and
Unit/Integration/E2E disposition; the set covers success, validation, authorization/context, errors,
replay/concurrency, and privacy. A generic BDD-map link, prose pointer, or other external pointer is
HIGH.
Report HIGH when a structured serialized request, response, event, message, manifest, descriptor, or
problem example is inline instead of in its own language-labelled fenced block.

**File-impact tree (HARD RULE)**: the single `tech-docs.md` or one companion mapped by
`tech-docs/README.md` has a `## File-Impact Analysis` whose primary view is a root-relative fenced
`text` tree; each planned path or bounded pattern carries `[E]`, `[N]`,
`[D]`, or `[G]` — the tree, not prose bullets, is the scan-first scope. Flag a missing tree, missing
action markers, an unbounded/vague target, or prose as the primary view as **HIGH**. An optional
`### More Detail` section must immediately follow the tree and only explain mechanics/ordering/
discovery/archival follow-up — it cannot replace the tree or contain delivery checkboxes. See
[Plans Organization Convention §File-Impact Analysis Format](../../../../repo-governance/conventions/structure/plans/file-impact-analysis-format.md#file-impact-analysis-format-hard-rule).

### Diagram Format Check

Audit all plan files (`README.md`, `brd.md`, `prd.md`, `delivery.md`, `learnings.md`, and every file
in the selected technical form):

- **MEDIUM**: ASCII art depicting component interactions, data flows, sequences, state machines, or
  decision branches — a Mermaid diagram would fit better. Simple directory-tree listings are exempt.
- **MEDIUM (under-diagrammed plan)**: a non-trivial plan covers a diagram-warranting concern
  (component interactions, agent/system sequence, state transitions, decision branches,
  upstream/downstream dependency position, phase/delivery flow) with no diagram for it. Trivial
  plans (config bumps, renames, doc fixes, no-behaviour-change dependency bumps) are
  exempt. Each undiagrammed concern is a separate finding.
- Reference: [Plans Organization Convention §Diagrams in Plans](../../../../repo-governance/conventions/structure/plans.md) and
  [Diagrams Convention](../../../../repo-governance/conventions/formatting/diagrams.md).
