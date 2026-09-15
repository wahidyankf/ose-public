# Plan Structure — Fixed Core and Reader-Led Technical Shape

## Mature Formal-Plan Structure

**For any plan with substantive business intent, product scope, and technical design:**

```
plans/in-progress/complex-feature/
├── README.md                 # Context, Scope, Approach Summary, navigation
├── brd.md                    # Business Requirements Document
├── prd.md                    # Product Requirements Document
├── tech-docs.md              # Architecture, design decisions, file impact
├── delivery.md               # Phased outcomes with granular action checklists
└── learnings.md              # Transient Knowledge Capture log
```

**Content-placement split** (authoritative — see [Content-Placement Rules](../../../../repo-governance/conventions/structure/plans/content-placement-rules.md#content-placement-rules-brdmd-vs-prdmd)):

- **`brd.md`** — WHY: business goal, impact, affected roles, business-level success metrics, business-scope Non-Goals, business risks. Solo-maintainer repo — no sign-off / sponsor / stakeholder ceremony language.
- **`prd.md`** — WHAT: product overview, personas, user stories, Gherkin acceptance criteria, product scope (in + out), product risks.
- **`tech-docs.md`** — HOW: architecture, design decisions with rationale, an annotated file-impact tree,
  dependencies, rollback. Every new lasting mechanism names its concrete need and explains why
  existing mechanisms are insufficient. Its `## File-Impact Analysis` is a root-relative fenced `text` tree with
  `[E]`/`[N]`/`[D]`/`[G]` markers as the primary scope view. Add `### More Detail` directly below it
  only for non-obvious mechanics, ordering, discovery criteria, or archival follow-up; it never
  replaces the tree or contains delivery checkboxes. See [Plans Organization Convention §File-Impact
  Analysis Format](../../../../repo-governance/conventions/structure/plans/file-impact-analysis-format.md#file-impact-analysis-format-hard-rule).
- **`delivery.md`** — DO: phased outcome sections with Input/Outcome/Proof and granular
  `[AI]`/`[HUMAN]` action checkboxes. Code outcomes use separate detailed RED/GREEN/REFACTOR
  checkboxes. Opens with the executor legend; each phase ends with a
  `### Phase N Gate` followed by Pause Safety. Preserve natural cohesive delivery seams, keep all
  artifacts needed for internal consistency together, and make every resulting `main` state safe
  to deploy to production immediately. Incomplete behaviour uses a temporary production-disabled
  flag with enabled/disabled tests and recorded rollout, rollback, and removal.

**Benefits**: clear reader ownership, sharper agent validation (plan-checker asserts placement per
file), and industry-norm alignment (BRD + PRD are recognized doc types). Technical document
separation does not itself create PR boundaries; natural delivery seams do.

Use exactly one technical shape: the `tech-docs.md` shown above, or `tech-docs/README.md` with mapped
companions. Reader jobs, cohesion, navigation, and ownership decide the shape; line counts do not.
New formal plans never collapse to a single README. Simple work uses the harness task list; early
ideas use an explicitly requested brief. Archived plans and the existing Rhino plan retain their
recorded contract.

An API-affecting mature plan must choose the directory form and map exactly one separately numbered
`NNN-api-contract-delta.md`. The document covers HTTP, BFF, RPC, event, and standard protocol
operations with the navigation index and complete per-operation request, response, error, security,
compatibility, and example packets required by the
[API Contract Delta convention](../../../../repo-governance/conventions/structure/plans/api-contract-delta.md).
Each operation includes full Gherkin scenarios or an exact anchor to its one-to-one detailed set in
the same API document or the plan's dedicated numbered BDD/spec-delta companion in the same
`tech-docs/` folder. The packet names exact scenario IDs/titles, canonical `specs/**` destination, and
Unit/Integration/E2E disposition; the set covers success, validation, authorization/context, errors,
replay/concurrency, and privacy. Summary tables, generic BDD-map links, prose pointers, and other
external pointers are incomplete. Every structured serialized example uses its own
language-labelled fenced block; never compress a request, response, event, message, manifest,
descriptor, or problem payload into inline code.
An API-adjacent plan that changes no contract records an evidenced no-delta disposition there.
