# Business Requirements — Update Temporary Folders

## Business Goal

Make `generated-reports/` a directory a maintainer can actually use as an outbox, by removing the
machine traffic that currently fills it, and give that machine traffic an honest home in
`local-tmp/`.

## The Problem, Stated Concretely

The Temporary Files Convention splits the two directories by artifact shape. Its own examples list
under `generated-reports/`:

- Validation reports
- Audit reports
- Execution verification reports
- **Todo lists and progress tracking**

That last line is the defect in miniature. Todo lists and progress tracking are pure interim
process — an agent's working state, never a maintainer's deliverable — and the convention
explicitly authorizes putting them in the folder a maintainer reads. Every other misplacement in
the repository follows the same permission.

Seventeen `*-checker` agent families are separately mandated — under a heading reading
"**NO EXCEPTIONS**" — to write their audit reports to `generated-reports/`. In the maker → checker →
fixer loop those audits are consumed by the fixer agent, not by a person. They are the single
largest source of the 567 accumulated artifacts.

## Business Impact

- **A requested report is unfindable.** New output lands in a directory holding 471 (`ose-public`)
  and 96 (the private sibling) prior entries with no ordering a human reads by. The deliverable exists and
  is still effectively lost.
- **The distinction has stopped teaching anything.** Two directories that both mean "temporary
  machine output" carry no information. An agent choosing between them is guessing, so the choice
  keeps drifting.
- **The convention is self-contradicting.** `local-tmp/` carries a careful seven-predicate
  reclamation rule with a quarantine step. `generated-reports/` carries no retention rule at all —
  yet it is the one that accumulated 567 files. The care is on the wrong directory.

## Affected Roles

| Role                            | Effect                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Repository maintainer           | Gets an outbox that holds only what they asked for. Loses nothing — the deleted artifacts are already unread and regenerable.   |
| `*-checker` / `*-fixer` agents  | Write to `local-tmp/<agent-family>/` instead. Report naming, UUID chains, and progressive writing are unchanged.                |
| Any agent reading a prior audit | Reads the same filename under a new parent. Discovery changes from one flat directory to one directory per family.              |
| `rhino-cli` maintenance         | One default-path constant changes, inside the cross-repository byte-identity boundary, so both repositories move in one window. |

## Success Metrics

Measured after delivery, in both repositories:

1. `generated-reports/` contains zero entries that no human requested. At delivery close it contains
   zero entries at all, since the historical backlog is deleted and nothing new has been requested.
2. Every `*-checker` and `*-fixer` agent definition names `local-tmp/<agent-family>/` as its report
   destination, and no agent definition names `generated-reports/` as a default write target.
3. `rhino-cli`'s suppression-ledger default path resolves under `local-tmp/`, and its unit tests
   assert that path.
4. A repository-wide search for `generated-reports` returns only: the new rule text describing what
   the directory is _for_, ignore-file entries, tool skip-lists, and historical `plans/done/`
   records — no live instruction telling an agent to write there.
5. Both repositories state the same rule. Filenames differ (the two shard sets were sharded
   independently); the normative content does not.

## Business-Scope Non-Goals

- **No new enforcement machinery.** The maintainer explicitly chose documented rules over a gate.
  Adding a validator here would be scope the maintainer declined.
- **No retention policy for `generated-reports/`.** The accumulation is cleared once; a standing
  expiry rule is a separate decision.
- **No change to `local-tmp/`'s reclamation predicates.** They work and stay verbatim.
- **No change to report file naming, UUID chains, or progressive writing.** Mature machinery,
  orthogonal to placement.

## Business Risks

| Risk                                                                                                  | Severity | Mitigation                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Deleting 567 artifacts destroys something still referenced                                            | Medium   | Delete via the existing dated-quarantine pattern, prove nothing load-bearing moved, then delete. Reversible until the final step.             |
| The suppression ledger is lost in the move, so previously accepted false positives resurface silently | Medium   | Move the file explicitly as a named step with a byte-count check, in the same delivery unit as the code default that reads it.                |
| The two repositories diverge because propagation is partial                                           | Medium   | The private sibling is delivered inside this plan, not deferred. The `rhino-cli` parity manifest makes any code-side divergence a CI failure. |
| The new rule drifts back, because nothing enforces it                                                 | Medium   | Accepted by the maintainer. The mitigation is that the rule now states a test an agent can apply, not a category an agent must classify.      |
| A stale absolute path in an agent leaves reports written somewhere unswept                            | Low      | The sweep is discovery-driven with a recorded per-file verdict, not a hardcoded edit list.                                                    |
