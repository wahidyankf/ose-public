# Business Requirements Document

## Problem Statement

The `rhino-cli docs validate-mermaid` command exists to enforce a single quality bar:
"diagrams must be readable on mobile". It runs in the pre-push hook and is supposed to
catch diagrams that are too wide, too dense, or have over-long labels before they
reach `main`.

In practice, the validator misses three classes of failures, and a recent plan
diagram (`plans/in-progress/2026-04-26__organiclever-ci-staging-split/tech-docs.md`)
slipped through with subgraphs of 7+ nodes that render unreadably narrow on mobile.
Diagnosing why required reading the validator source. Three causes combined:

1. **Plans are not scanned.** The default scan paths in
   `cmd/docs_validate_mermaid.go:202` are `docs/`, `governance/`, `.claude/`, and
   root `*.md` only. Diagrams in `plans/` — including five-document plans like the
   organiclever-ci-staging-split — are never opened by the validator. The pre-push
   hook (`--changed-only`) compounds this: a changed file outside the scan dirs is
   silently skipped.

2. **`&` multi-target operator is not expanded.** The parser in
   `internal/mermaid/parser.go:200` treats each side of an arrow as a single node ID.
   When a developer writes `T1 --> SC & LINT & BEI & FEI & DC` (the standard
   Mermaid shortcut for fan-out), only the edge `T1 → SC` is captured. The other
   four targets become orphan nodes with rank 0, breaking the rank-width
   calculation. Even diagrams in `docs/` and `governance/` that use `&` are
   miscounted.

3. **Rank-width does not equal render-width.** The validator's `MaxWidth=4`
   threshold counts nodes-at-one-rank. It does not account for the bounding-box
   width of a subgraph. A subgraph with 6 children stacked vertically (so no rank
   has more than 1 node from that subgraph) still renders with a wide subgraph
   boundary on mobile because Mermaid sizes the subgraph box to fit its widest
   child plus the subgraph label.

Each cause alone is a defect. Together they let the staging-split plan ship with
diagrams that would have triggered violations under any of the three checks if
implemented correctly.

## Business Goals

| #   | Goal                              | Description                                                                                                                                 |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Plans are validated**           | Add `plans/` to the default scan paths so plan diagrams are caught at pre-push.                                                             |
| 2   | **`&` operator parsed correctly** | Expand `&` multi-target edges in `extractEdgeLine` so rank-width is computed from the true edge set.                                        |
| 3   | **Subgraph density caught**       | New `MaxSubgraphNodes` warning (default 6) flags subgraphs with too many children — a separate signal from rank-width that targets mobile.  |
| 4   | **Existing diagrams re-checked**  | After fixes land, run the validator against the affected diagrams in `plans/` and `docs/`; create follow-up tickets for any new violations. |

## Stakeholders and Affected Roles

| Role                         | Impact                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Maintainer as developer      | Pre-push hook now blocks more diagrams that would render poorly — fewer post-merge fixes.          |
| Maintainer as plan author    | Plan diagrams now go through the same quality bar as `docs/` content.                              |
| Maintainer as CLI maintainer | Three small, well-scoped Go changes; ≥90% coverage maintained; new Gherkin scenarios for each fix. |

## Success Criteria

| Criterion                              | How to verify                                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plans/` scanned by default            | `nx run rhino-cli:test:unit` includes a unit test confirming `collectMDDefaultDirs` returns paths from `plans/`                                                       |
| `&` multi-target edges expanded        | `nx run rhino-cli:test:unit` includes a parser test where `A --> B & C & D` produces three edges; existing tests still pass                                           |
| `MaxSubgraphNodes` warning rule active | `nx run rhino-cli:test:unit` includes a validator test where a 7-child subgraph emits a `subgraph_density` warning at default threshold                               |
| New Gherkin scenarios in BDD spec      | `specs/apps/rhino/cli/gherkin/docs-validate-mermaid.feature` has one new scenario per fix, all passing                                                                |
| Coverage threshold preserved           | `nx run rhino-cli:test:quick` exits 0 with coverage ≥ 90%                                                                                                             |
| Existing plan diagrams now flagged     | `nx run rhino-cli:run -- docs validate-mermaid plans/in-progress/2026-04-26__organiclever-ci-staging-split/` reports the expected width and subgraph-density findings |
| Local quality gates pass               | `nx affected -t typecheck lint test:quick spec-coverage` exits 0                                                                                                      |
| Post-push CI green                     | All GitHub Actions triggered by the push to `main` pass                                                                                                               |

## Non-Goals

- **Splitting existing plan diagrams**. This plan adds the validation rules; a
  follow-up plan (or in-line work during the staging-split plan execution) splits
  any diagrams the new rules flag.
- **Render-width simulation**. We do not simulate actual SVG rendering width.
  `MaxSubgraphNodes` is a node-count proxy, same family as `MaxWidth` — but
  targeted at subgraph boundaries.
- **Pre-push hook changes**. The hook already calls
  `nx run rhino-cli:validate:mermaid --args="--changed-only"`; no hook change needed.
- **Changes to existing default thresholds** (`MaxLabelLen=30`, `MaxWidth=4`).
- **Validator output format changes** (text/JSON reporters stay as-is).
- **`ose-infra` or `ose-primer` changes**.

## Business Risks

| Risk                                                                | Likelihood | Impact | Mitigation                                                                                                                                              |
| ------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adding `plans/` to scope surfaces dozens of pre-existing violations | Medium     | Medium | Phase 4 explicitly runs the new validator against `plans/` and `docs/` and lists findings; treat as discovery, fix in follow-up commits or future plan. |
| `&` expansion changes edge counts in existing diagrams              | Low        | Medium | New tests confirm both old (single-target) and new (multi-target) cases. Existing diagrams that did not use `&` are unaffected.                         |
| `MaxSubgraphNodes` default of 6 is too tight                        | Medium     | Low    | Threshold is a flag (`--max-subgraph-nodes`) — tune in follow-up if the default proves disruptive. Warning, not violation, on first ship.               |
| Coverage drops below 90% during refactor                            | Low        | High   | Each phase lands with its own tests; `test:quick` runs at end of each phase, not just at the end.                                                       |
| Pre-push hook now blocks PRs that previously passed                 | Medium     | Low    | Expected and desired. The whole point is to catch what slipped through.                                                                                 |
