---
title: "Overview"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 1
---

This course is a **leadership no-code sub-mode** Annotated-concept topic: zero code, zero runnable
files. Every worked scenario produces a **decision artifact** -- a failure catalogue, an interface
walkthrough, a confidence-representation comparison, a friction table, a fallback ladder, a
ship/rollback criteria sheet -- the kind of document a real product team could take to a launch
review. This is the product-design companion to the AI-engineering evals courses: they teach you to
measure whether a probabilistic feature's output is good; this course teaches you what to build
around that measurement so the feature is usable and recoverable when the measurement says "not
always."

## Prerequisites

- **Prior topics**: `creating-ai-powered-apps` (what the model can and cannot be asked for --
  `[Unverified]` not yet present in the AyoKoding course library on disk, so no link is given here);
  [Evaluating AI Output -- Essentials](../evaluating-ai-output-essentials/overview.md) (you cannot
  set a ship criterion without a measurement -- this course's Theme D leans directly on that
  course's pass-rate framing, then extends it with the confidence interval Theme D teaches
  directly (co-21));
  [Software Product Engineering](../software-product-engineering/learning/overview.md) (product
  framing, scoping, and release practice this course applies to a non-deterministic component);
  [Frontend Essentials](../frontend-essentials/learning/overview.md) (interface vocabulary and
  the accessibility baseline every uncertainty signal in this course must clear).
- **Tools & environment**: no runtime and no code. A diagramming surface for the Mermaid flows, a
  document or whiteboard for the interface walkthroughs, and access to one real probabilistic
  feature -- your own or a public one -- to critique across this course's worked scenarios. Written
  artefacts are the deliverable throughout.
- **Assumed knowledge**: what an LLM-backed feature does and roughly how it fails; the ability to
  read an eval report and interpret a pass rate; basic interface and accessibility vocabulary (a
  WCAG contrast ratio, a screen-reader label).

## Why this exists -- the big idea

**The problem before the solution**: every pattern in a product designer's vocabulary assumes the
system either succeeds or fails, and says so. A probabilistic feature breaks that assumption -- it
succeeds partially, fails silently, fails confidently, and fails differently for the same input
twice. Teams ship these features inside interfaces designed for deterministic software, and users
learn either to distrust everything the feature produces or, far worse, to trust all of it
uniformly. Both outcomes are design failures, not model failures. **The one idea worth keeping if
you forget everything else**: design for the wrong answer, because it is coming -- make it visible,
make it cheap to catch, and make it cheap to undo.

**Cross-cutting big ideas**: `determinism-vs-emergence` -- the interface is where a stochastic
component meets a human who expects determinism, and every pattern in this course exists at that
seam. `correctness-vs-pragmatism` -- the product goal is a recoverable workflow, not a correct one;
a feature that fails often but cheaply beats one that fails rarely but catastrophically.
`abstraction-and-its-cost` -- every confidence indicator is a lossy summary of a distribution, and
users read it as a promise, which is exactly the gap co-08 names.

> **Scope guard -- product patterns vs. the human-in-the-loop guardrail.**
> `agent-permissions-and-sandboxing` -- `[Unverified]` not yet present in the AyoKoding course
> library on disk, so no link is given here -- owns human-in-the-loop as a **safety control**:
> deny/ask/allow enforced by the harness so an agent cannot take a dangerous action. This course
> owns human-in-the-loop as a **product design**: what the reviewer sees, how much cognitive load
> the review imposes, whether the interface earns calibrated trust, and what happens when the
> reviewer disengages. The safety course answers "can this action proceed"; this course answers "is
> a human meaningfully in a position to judge." Both are needed and neither substitutes for the
> other.

## How this course is organized

- **[Learning](./learning/overview.md)** -- 44 worked scenarios, each producing a written decision
  artifact, grouped by theme rather than by fixed Beginner/Intermediate/Advanced bands (this
  course's concepts are concept-centric, not skill-tiered):
  - **Theme A -- [The Wrong Answer Is Coming](./learning/theme-a-the-wrong-answer-is-coming.md)**
    (scenarios 1-11) -- why a success-or-error interface has no state for a confidently wrong
    answer, the six user-visible failure modes, expectation-setting, trust calibration, automation
    bias, and the decision to narrow or not ship at all.
  - **Theme B -- [Uncertainty, Confidence, and Provenance](./learning/theme-b-uncertainty-confidence-and-provenance.md)**
    (scenarios 12-22) -- where an uncertainty signal belongs, the trade-offs between numeric scores
    and qualitative bands, why confidence is not correctness, citations as a better signal than a
    score, designing for cheap verification, and accessible uncertainty without relying on colour.
  - **Theme C -- [Humans in the Loop, Friction, and Recovery](./learning/theme-c-humans-in-the-loop-friction-and-recovery.md)**
    (scenarios 23-33) -- review as the product rather than a fallback, the vigilance decrement,
    consequence-scaled friction, preview-and-diff, undo that beats a marginal accuracy gain, and the
    correction affordance that feeds error analysis.
  - **Theme D -- [Degradation, Latency, and the Launch Decision](./learning/theme-d-degradation-latency-and-the-launch-decision.md)**
    (scenarios 34-44) -- the model-unavailable state, a fallback hierarchy, failing visibly instead
    of silently, latency as a design material, and ship, staged-rollout, and rollback criteria
    written against a measured distribution.
  - **[Capstone](./learning/capstone/overview.md)** -- the complete design dossier for one real
    probabilistic feature: a failure catalogue, an interface design, a review-and-recovery plan, a
    degradation plan, and launch criteria a team could take into a real launch review.
- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: recall Q&A across all
  twenty-four concepts, applied judgment scenarios, decision-artifact repair drills, a self-check
  checklist, and elaborative-interrogation prompts.

## The 24 concepts this course covers

- **co-01 -- The deterministic-interface assumption** -- standard product patterns encode a
  success-or-error model a probabilistic feature violates. Scenario 1.
- **co-02 -- Failure modes users experience** -- confidently wrong, subtly wrong, refused,
  truncated, slow, and inconsistent-across-identical-requests are distinct user experiences.
  Scenarios 2-3.
- **co-03 -- Setting expectations before first use** -- how a feature is framed on first contact
  determines how its errors are read for the rest of the relationship. Scenarios 4-5.
- **co-04 -- Trust calibration** -- the goal is trust proportional to actual reliability; both
  over-trust and blanket distrust are interface failures. Scenarios 5-6, 9.
- **co-05 -- Automation bias and complacency** -- users under-scrutinize output from a usually-right
  system, and the effect worsens as the system improves. Scenarios 7-8.
- **co-06 -- Surfacing uncertainty** -- communicating that an output may be wrong, at the moment and
  place the user could act on it. Scenarios 9, 12, 16-17, 22.
- **co-07 -- Confidence-representation trade-offs** -- numeric scores, qualitative bands, hedged
  language, and visual treatments each trade precision against being read correctly. Scenarios
  13, 15, 17, 22.
- **co-08 -- Confidence is not correctness** -- an expressed or computed confidence is not a
  probability of being right. Scenarios 14-15.
- **co-09 -- Provenance and citation** -- showing where an answer came from lets a user verify it
  themselves. Scenarios 18-19, 21.
- **co-10 -- Verifiability by design** -- structuring output so checking it is cheaper than
  producing it. Scenarios 19-21.
- **co-11 -- Human-in-the-loop as product** -- review as the intended workflow, fast enough to
  survive volume. Scenarios 23-24, 26.
- **co-12 -- Review cost and the vigilance decrement** -- a reviewer's accuracy decays with volume
  and with the system's own reliability. Scenarios 7, 24-26.
- **co-13 -- Consequence-scaled friction** -- confirmation, preview, and delay should scale with an
  action's reversibility and blast radius. Scenarios 27-28.
- **co-14 -- Preview and diff before apply** -- showing exactly what will change converts an
  irreversible action into a reviewable one. Scenario 29.
- **co-15 -- Undo and recovery** -- cheap, obvious, complete reversal beats a marginal accuracy
  improvement. Scenarios 11, 30-32.
- **co-16 -- Graceful degradation** -- defining what the product does when the model is unavailable,
  slow, or unusable. Scenarios 34-37.
- **co-17 -- Latency as a design material** -- streaming, progressive disclosure, and honest waiting
  change what a slow response feels like. Scenarios 38-39.
- **co-18 -- Fallback hierarchies** -- a designed ladder from best-effort output to an honest
  unavailable state. Scenarios 35-36.
- **co-19 -- Silent failure is the worst failure** -- a wrong answer presented identically to a
  right one is more damaging than a visible error. Scenarios 3, 37, 39.
- **co-20 -- Scoping to what the model can do** -- narrowing the feature is usually the
  highest-leverage move, not improving the model. Scenarios 10-11.
- **co-21 -- Ship criteria for a distribution** -- a launch decision is a threshold on a measured
  distribution plus a named acceptable worst case. Scenarios 40-41.
- **co-22 -- Staged rollout and guardrail metrics** -- exposure is ramped while pre-agreed guardrail
  metrics are watched. Scenario 42.
- **co-23 -- Rollback criteria agreed in advance** -- the conditions for turning a feature off are
  written down before launch. Scenario 43.
- **co-24 -- Feedback capture as a product surface** -- the correction affordance is both a recovery
  path and the pipeline feeding the next error-analysis pass. Scenarios 32-33.

## Tensions & trade-offs -- when NOT to reach for this

- **Surfacing uncertainty vs. usability**: caveats on every output train users to ignore caveats.
  Uncertainty signals must be selective enough to carry information (co-06, Scenario 16).
- **Human review vs. the value proposition**: a feature whose output must be fully checked has saved
  the user nothing except typing. If review costs as much as doing the work, narrow the feature
  (co-20) or do not ship it -- do not quietly weaken the review step (Scenario 24).
- **Friction vs. flow**: consequence-scaled friction is correct in principle and painful in
  practice -- reserve real friction for genuinely irreversible actions and pay for the rest with
  undo (Scenario 28).
- **Confidence display vs. misreading**: a confidence number invites users to treat it as a
  probability of correctness, which it is not (co-08). Showing nothing invites uniform trust.
  There is no free option, only a deliberate, validated choice.
- **When NOT to reach for this course**: if a deterministic check fully verifies the feature's
  output before any human sees it -- a generated query that is validated and executed, a
  classification confirmed against a schema -- the user is never exposed to the distribution and
  these patterns add ceremony. This material is for output that reaches a human unverified.
- **When NOT to ship the feature at all**: if no scoping narrows the failure rate to something the
  workflow can absorb, and no undo makes the failures cheap, the correct product decision is not to
  ship (Scenario 11). Recognising that case is part of this course, not an admission that it failed.

## Accuracy notes

> Every volatile, version-pinned, or product-name-dependent fact below is dated or flagged here
> rather than stated unqualified in the stable spine above.

- 2026-07-26 -- **durable spine**: designing for partial correctness, calibrating user trust to
  actual reliability, provenance as an interface element, degradation paths, undo sized to blast
  radius, and release criteria expressed as distributions rather than booleans are design
  principles independent of model, vendor, and framework. They predate LLMs in aviation automation,
  spam filtering, and autocomplete -- see this course's Lineage note below.
- 2026-07-26 -- `[Unverified]` **volatile, accuracy-note only**: every named product used as an
  illustration in this course's worked scenarios is a composite, non-attributed stand-in (a
  fictional "Nimbus"-style feature) -- exactly which real assistant surfaces confidence how, or
  which tool shows a diff-before-apply, changes fast enough that this course deliberately never
  names a real product in its stable spine.
- 2026-07-26 -- `[Unverified]` **at authoring**: the automation-trust literature this course draws
  on (automation bias, complacency, trust calibration, the vigilance decrement) is established
  human-factors research; this course teaches the phenomena, which are robust, and cites no specific
  study without independently verifying it against a primary source first.
- 2026-07-26 -- **contested, taught as contested**: whether to display a numeric confidence score to
  end users is genuinely disputed in the field (Scenario 15). Numeric scores are precise and
  routinely misread as probabilities of correctness; qualitative bands are read more accurately but
  discard information. This course presents the trade-off and does not resolve it.
- 2026-07-26 -- no model IDs, prices, or SDK shapes appear in this course's spine by design; every
  pattern taught here is model-, vendor-, and framework-independent.

### Lineage -- why these patterns beat the alternative

The pattern that lost was treating a probabilistic feature as an ordinary one -- a text box that
returns an answer, a button that performs an action, an error state for the rare failure. It lost
because the failure it designed for is not the failure that occurs: the dominant failure of a
probabilistic system is a plausible wrong answer rendered identically to a right one (co-19), and no
amount of model improvement removes it. Aviation automation established decades ago that operators
under-scrutinize systems that are usually right, and that the effect intensifies as reliability
improves (co-05). Spam filtering established that a false-positive-tolerant workflow with a cheap
recovery path beats a more accurate classifier with no recovery path (co-15). Autocomplete
established that a suggestion the user can ignore at zero cost can be wrong most of the time and
still be valuable, because the interaction is designed around rejection (co-13). Each of those is
the same move: accept the distribution, design the recovery, and scope the feature until its
failure rate fits the workflow. This course collects those moves for a component whose error rate
is higher and whose errors are more fluent than anything the earlier examples faced.

## Read more

- **Designing Machine Learning Systems** -- Chip Huyen (2022). For the production framing of ML
  features as products with measured failure rates rather than as models with accuracies.
- A primary reference on **automation bias, complacency, and trust calibration** in
  human-automation interaction -- the research grounding co-04, co-05, and co-12. Verify against a
  primary source before citing a specific study.
- A primary reference on **the vigilance decrement** in monitoring tasks -- the research grounding
  the claim that reviewer accuracy decays with volume and with system reliability. Verify against a
  primary source before citing a specific study.

---

Next: [Learning Overview](./learning/overview.md) →
