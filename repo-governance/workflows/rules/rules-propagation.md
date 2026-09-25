---
description: "Places newly-stated rules on the correct surface — instruction surface first, governance layers below — de-conflicting, deduplicating, arming enforcement."
when_to_use: "Use when a decided rule must be written into the repository, or an existing rule superseded."
---

# Repository Rules Propagation Workflow

Rules arrive as free prose. They are normalized into falsifiable statements, routed to the
narrowest surface that binds, checked against existing rules under layer-aware precedence,
consolidation-reviewed within their subject, and dispositioned for enforcement. The run works in the
caller's current tree by default.

The instruction surface is a **fixed-size cache**: an admission without enough headroom requires
eviction. A threshold is never raised to make room for a placement. A separately justified,
class-wide policy recalibration follows the governance word-budget convention and is not an
eviction substitute.

**Semantic-preservation hard gate:** a word budget may change placement, never meaning. Propagation
must preserve every obligation, audience qualifier, scope boundary, exception, pass condition, and
violation condition verbatim enough to remain unambiguous. It may use progressive disclosure or an
indexed split; it may not generalize, weaken, compress away, or paraphrase a material qualifier to
make a counter pass. For example, “junior engineer fresh from bootcamp with no professional work
experience” cannot become merely “new engineer” for brevity.

Agents composed: `.agents/agents/rules-maker.md` and `rules-checker`. There is no
`rules-fixer`: propagation is the sole writer of every rule edit. It never invokes
`rules-quality-gate`, which hands work to propagation and is never called back.

## Goal and Termination

**Goal**: Land every stated rule correctly, contradicting nothing, retaining no unjustified duplicate, carrying an enforcement disposition

**Termination**: No-op verified, or PR green with every rule placed and dispositioned; halts on an unfalsifiable rule or a higher-layer conflict

## Inputs

- **`rules`** (string, required) — Rules as free prose, normalized at Step 0
- **`max-concurrency`** (number, optional, default `3`) — Concurrent background agents — the N in the N+1 model
- **`isolation`** (enum: current, dedicated, optional, default `current`) — Use the caller's tree, or create a worktree for the run
- **`dry-run`** (boolean, optional, default `false`) — Emit the manifest and conflict report, write nothing

## Outputs

- **`placement-manifest`** (file, pattern `local-tmp/rules-propagation/rules-propagation__*__manifest.md`) — Subject inventory with per-surface verdict, canonical home or replacement, keep rationale; plus placement, layer, enforcement, supersessions
- **`final-status`** (enum: no-op, landed, halted, partial) — Terminal state of the run
- **`pr-url`** (string) — PR opened by the run
- **`sibling-obligation`** (string) — Obligation naming the sibling repository, or an explicit none

## Contents

- [Purpose and Scope](./rules-propagation/purpose-and-scope.md) — what it places, what it refuses.
- [Execution Mode](./rules-propagation/execution-mode.md) — delegation and invocation.
- [Step 0: Intake](./rules-propagation/step-0-intake-and-normalization.md) — prose to falsifiable rule.
- [Step 1: Working Tree](./rules-propagation/step-1-worktree-and-branch.md) — where the run writes.
- [Step 2: Classification](./rules-propagation/step-2-classification.md) — subject, layer, neutrality.
- [Step 3: Semantic Sufficiency and Conflict Scan](./rules-propagation/step-3-conflict-scan.md) — semantic no-op, precedence, supersession.
- [Step 4: Placement](./rules-propagation/step-4-placement-decision.md) — admission test, home table.
- [Step 5: Eviction](./rules-propagation/step-5-eviction-protocol.md) — making room on a full surface.
- [Step 6: Write and Tidy](./rules-propagation/step-6-write-and-tidy.md) — classify, consolidate, reindex.
- [Step 7: Enforcement](./rules-propagation/step-7-enforcement-disposition.md) — the mandatory three-way outcome.
- [Step 8: Verification](./rules-propagation/step-8-verification.md) — bindings, gates, semantic closure.
- [Step 9: Delivery](./rules-propagation/step-9-delivery-and-sibling-obligation.md) — PR, recorded obligation.
- [Termination Criteria](./rules-propagation/termination-criteria.md) — landed, halted, partial.
- [Success Criteria](./rules-propagation/success-criteria.md) — Gherkin.
- [Safety Features](./rules-propagation/safety-features.md) — guards on destructive authority.
- [Example Usage](./rules-propagation/example-usage.md) — worked invocations.
- [Related Workflows](./rules-propagation/related-workflows.md) — what runs before and after it.
- [Principles Implemented/Respected](./rules-propagation/principles-implemented-respected.md) — traceability.
- [Conventions Implemented/Respected](./rules-propagation/conventions-implemented-respected.md) — traceability.
