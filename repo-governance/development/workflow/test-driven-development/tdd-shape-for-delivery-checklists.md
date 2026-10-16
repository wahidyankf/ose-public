---
description: The mandatory granular RED/GREEN/REFACTOR checklist sequence within one outcome section.
when_to_use: Use when writing a delivery outcome section that ships code and must preserve detailed TDD proof.
---

# TDD Shape for Delivery Checklists

Every code-shipping outcome section preserves RED → GREEN → REFACTOR as separate, ordered,
independently verifiable checkboxes. The section keeps them tied to one acceptance criterion and
observable outcome; the checkboxes keep progress, commands, and evidence visible to a junior
engineer with no professional experience.

Use [Focused Runs and Regression Gates](./the-red-green-refactor-cycle.md#focused-runs-and-regression-gates) for case selection, positive execution evidence, and boundary gates.

```markdown
### AC-### — [cohesive behaviour outcome]

- **Input:** canonical acceptance-criterion reference, prerequisites, and affected scope.
- **Outcome:** [observable behaviour].
- [ ] [AI] **RED:** write `[test path and exact case]`; run `[copyable focused command]`;
      acceptance: it fails for `[expected missing behaviour or diagnostic]` and selected existing boundary cases
      remain green; save output at `[evidence destination]`.
- [ ] [AI] **GREEN:** implement `[exact symbol]` in `[source path]`; run `[copyable focused command]`;
      acceptance: the new test passes and no unrelated focused case regresses.
- [ ] [AI] **REFACTOR:** clean up `[specific concern/path]`; run `[named affected-boundary selection]`;
      acceptance: behaviour, public contract, and expected diagnostics remain unchanged.
- **Proof:** RED evidence plus passing focused outputs, executed case identities, and positive counts.
  Full required regression belongs to the phase/pre-PR gates.
```

If one outcome needs several TDD cycles, write a separate RED/GREEN/REFACTOR checkbox trio for each
independently testable behaviour slice inside that outcome section. Do not collapse cycles to keep the
checklist short. Every RED checkbox names what must fail and why; “test fails” alone is insufficient.

## Batched cycles in planned delivery

When a plan already delivers work in batches — one pull request or one delivery boundary at a time — one RED run and
one GREEN run cover the batch's scenarios instead of one full trio per scenario, so planned work does not pay a
full red-green ceremony for every scenario. Batched is the rule; per-scenario trios remain a recorded adaptation
where junior-engineer readability needs each behaviour's own failing proof:

1. Write the batch's tests first, from its scenarios, before any production change in the batch.
2. Run one focused RED run for the batch. Every scenario's test must fail for its stated reason; group the reasons in
   one batch record, not one record per scenario. A test that passes is repaired before implementation starts.
3. Implement the batch, then run the identical selection to GREEN. Keep the selection frozen between RED and GREEN.
4. Refactor inside the batch with the selection green; a behaviour change noticed along the way joins the batch's tests
   or becomes its own cycle.
5. Run the full applicable regression and touched end-to-end flows only at the phase or push boundary.
6. Do not repeat an accepted RED whose tests and production code are unchanged.

The batch record names every scenario's failing test and reason, so the per-scenario proof requirement above stays
satisfied. A batch is one cohesive behaviour slice sharing a boundary and fixtures. Unrelated failures in one RED run
mean the batch is too large; split it. Small single-scenario changes and single bug fixes keep the per-scenario trio
above. This section changes run and evidence granularity only: it never permits writing tests after the code.

Non-code outcome sections do not require RED-GREEN-REFACTOR. Each independently verifiable action is
still its own detailed checkbox.

```markdown
### [Outcome]

- **Input:** [source, prerequisites, and scope].
- **Outcome:** [observable state].
- [ ] [AI] Update `[exact path/section]`; acceptance: `[observable result]`; verify with
      `[copyable inspection or gate]`; save evidence at `[destination]` when the result is not committed.
- **Proof:** [final section-level gate].
```

`plan-checker` flags a code outcome that combines or omits RED, GREEN, or REFACTOR checkboxes; lacks
exact paths, commands, expected observations, or proof; or separates those actions into unrelated
outcome sections. It also flags micro-checkboxes that expose keystrokes rather than independently
verifiable work.

These RED/GREEN/REFACTOR actions are `[AI]` work — each checkbox carries the `[AI]`/`[HUMAN]`
executor tag, and the phase they belong to ends with a `### Phase N Gate` plus a Pause Safety note,
per [Plans Organization Convention §Executor Tagging](../../../conventions/structure/plans/executor-tagging-tags-and-bias.md#executor-tagging--ai-vs-human-hard-rule)
and [§Phases as Natural Pauses With Clear Gates](../../../conventions/structure/plans/phases-as-natural-pauses.md#phases-as-natural-pauses-with-clear-gates-hard-rule).
