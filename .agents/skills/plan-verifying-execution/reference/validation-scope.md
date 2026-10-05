# Validation Scope

## Core Responsibility

Validate that completed plan implementation:

1. Meets the business intent captured in `brd.md` and the product requirements captured in `prd.md`
2. Follows the technical approach from the plan's chosen technical form
3. Completes all delivery checklist items with implementation notes
4. Satisfies all Gherkin acceptance criteria authored in `prd.md`
5. Maintains code quality standards
6. Verifies the plan's transient `learnings.md` was fully triaged — every entry routed inline,
   filed with literal authorization, reported without plan authorization with handoff evidence, or
   discarded — and both safety gates satisfied, BLOCKING archival otherwise
   (Knowledge Capture Convention)

## Validation Scope

### 1. Requirements Coverage (BRD + PRD)

- All user stories from `prd.md` implemented
- All Gherkin acceptance criteria from `prd.md` verifiable against the delivered work; quote the
  specific scenario when reporting coverage gaps
- Business goals and success metrics from `brd.md` addressed by the delivered work (or explicitly
  deferred with rationale in the delivery notes)
- Business-scope Non-Goals respected (no scope creep into deferred items)
- All product-level out-of-scope items still out of scope

### 2. Technical Documentation Alignment

- Implementation follows documented architecture
- Design decisions are reflected in code
- Every delivered code path, dependency, abstraction, validator, automation, infrastructure path,
  or other lasting mechanism maps to the plan's approved concrete requirement, correctness/safety
  obligation, or demonstrated recurring risk and its explanation of why existing mechanisms were
  insufficient. Flag an undeclared mechanism, a mechanism whose rationale was never approved, or
  one for which the approved existing mechanism would have satisfied the need; do not accept a
  retrospective delivery-note rationale as plan approval.
- Dependencies are properly integrated
- Testing strategy is executed
- Delivered paths reconcile to the chosen technical form's annotated File-Impact Analysis tree and their
  `[E]`/`[N]`/`[D]`/`[G]` actions. `### More Detail` provides context only; it cannot authorize an
  undeclared path. A scope change requires a plan amendment recorded before execution, not a
  retrospective justification.

### 3. Delivery Checklist Completion

- All implementation steps checked and documented
- All per-phase validation completed
- All phase acceptance criteria verified
- Each `### Phase N Gate` passed before the next phase's work began; `[HUMAN]` steps show genuine
  human-confirmation evidence (see `reference/09-phase-gate-and-execution-marker.md`)
- Progress tracking is comprehensive
- For every repository whose delivered scope changed rules or enforcement, the repository-local
  rules-propagation outcome is complete: subject inventory, conflict/precedence and supersession,
  placement/eviction, canonical/config/enforcement/index changes, enforcement disposition,
  generated bindings, `rules-quality-gate`, and manifest/final status all have
  evidence. Another repository's evidence cannot satisfy this check.
- **Vercel MCP probe recorded (conditional)** — if the plan touches a Vercel-deployed surface, Phase
  0 records the availability probe outcome, and any step the probe forced to downgrade says so
  explicitly. A deployment-verification step that was silently skipped because the capability was
  absent is a finding, not a pass: the evidence and the checklist must agree on what actually ran.
  See [Vercel MCP Capability Convention](../../../../repo-governance/development/infra/vercel-mcp.md).

### 4. Code Quality

- Code follows project conventions
- Tests are written and passing
- Documentation is updated
- No obvious issues or shortcuts

### 5. Integration Validation

- Components integrate correctly
- End-to-end workflows function
- Edge cases are handled
- Performance is acceptable
