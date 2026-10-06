# Decision Grilling for Unresolved Material Choices

Before writing plan content, the calling root resolves only material design decisions that remain
open after reading relevant repository evidence. After all plan artifacts are written, the root
runs a separate post-write validation/stress-test grill against the completed plan. That grill
checks ambiguity, contradictions, unsupported assumptions, rejected alternatives, operational and
recovery gaps, and whether the intended bootcamp-graduate reader can execute the delivery. It does
not invent editorial-history decision records or repeat questions already settled by evidence.

**HARD RULE — 2-4 options required**: Every grilling question MUST present **2-4 concrete,
mutually exclusive options**. Each option MUST state its trade-off in one sentence. Exactly one
option MUST be marked `(Recommended)` with a one-sentence rationale. Open-ended questions without
options are FORBIDDEN. Resolve one decision per question; tightly coupled decisions may be batched
in a single multi-question prompt.

**Interaction ownership**: the root owns native UI interaction and, when it is noninteractive or
lacks a native tool, emits markdown choices to its caller. A plan specialist never questions the
user directly. It returns `## User Decisions Required` using the
[canonical envelope schema](../../../../repo-governance/development/workflow/grilling-with-options/user-decisions-required-envelope.md),
with stable decision ID, question, recommended option and rationale, and exhaustive option objects
with trade-offs, then stops. The root resolves the envelope and resumes or reinvokes the specialist
with the canonical [Resolved User Decisions Envelope](../../../../repo-governance/development/workflow/grilling-with-options/resolved-user-decisions-envelope.md),
constructed from the original IDs after rendering and passed verbatim. The specialist validates it
before dependent work. A direct custom-agent or noninteractive specialist caller receives the same
envelope.

**Explore before composing**: read the relevant repo artifacts before creating an envelope or root
question. Never surface a decision a file read can answer — the repo is the ground truth; the user
is the tiebreaker for genuinely ambiguous decisions.

For every material decision, research repository/history evidence and applicable external prior
art before grilling. Present the selected candidate and at least two viable alternatives, including
status quo when viable, with their trade-offs. If fewer exist, record the search and disqualifying
constraints instead of inventing choices. The plan preserves the final selection, evidence,
rejection reasons, consequences, and revisit triggers. A material decision changes the delivered
product, architecture, implementation contract, delivery, rollout, testing, operation, or recovery
behaviour. Do not grill or preserve wording changes, section moves, checker/fixer iterations, or
other editorial plan history unless they change that delivered contract.

**Pre-write grill covers** (each as a structured multiple-choice question):

- What problem is this solving? What specific pain point?
- What are the acceptance criteria? How will we know it is done?
- What is the scope? What is explicitly out of scope?
- What are the constraints (performance, harness-neutrality, backwards compatibility)?
- Are there design decision forks where the user has a preference?
- **For UI-bearing plans only**: the UI-design-funnel questions — which low-fi alternatives, what
  prior art, which selection + why (see
  [ui-design-funnel-grilling-and-learning-plans.md](ui-design-funnel-grilling-and-learning-plans.md#design-funnel-grilling-questions-ui-bearing-plans)).

**Do NOT proceed to writing while a material pre-write branch remains unresolved.** A specialist with any open
branch returns `## User Decisions Required` and stops; it never infers an answer. Unresolved design
decisions force expensive rewrites.

**Do NOT signal completion before the post-write grill passes.** Resolve any new material branch
through the same envelope protocol, update the plan, and rerun the stress test. Preserve the final
solution decision and rationale, not the drafting conversation.

See [Grilling-With-Options Convention](../../../../repo-governance/development/workflow/grilling-with-options.md)
for the authoritative rule, validation checklist, and examples. Invoke via the `grill-me` skill.
