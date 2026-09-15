<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: scaffold-plan-archival-cleanup

## L-1 — Fixture verification is not both-directions verification

**What happened.** Item 7 was verified against four constructed fixtures — fires on two, silent on
two — and declared verified in both directions. It was not. Every fixture had been authored to the
`### Plan Archival` heading the rule named, so the fixture set was structurally incapable of
exposing that the rule keyed on that literal heading. Running the same check against the private sibling's
real plans at Phase 3 produced a false positive within minutes, on a plan
(`sync-ci-iac-carveout-widening-to-siblings`) that carries all three cleanup steps but files them
under `## Phase 3: <private-sibling> Archival`.

**Why it matters.** A fixture set written by the same author, at the same sitting, from the same
mental model as the rule inherits that model's blind spots. Fixtures prove a rule is internally
consistent. Only the live corpus proves it matches the world — and in a cross-repository
propagation, only the _second_ repository's corpus, because the first one's shapes are the ones the
author already had in mind.

**Routing** — `repo-governance`: the verification guidance for a new `plan-checker` rule should
require a live-corpus run in every scoped repository, not fixtures alone. Filed as a follow-up
rather than landed here; it is a rule change about how rules are verified, which is its own
propagation.

## L-2 — A gate registry's `command:` value is not a runnable CLI invocation

**What happened.** RP-8.2 named six deterministic gates by their `repo-config.yml` `command:`
values — `md links validate`, `md frontmatter validate`, and four more. Every one exits **2** with
`rhino-cli: unrecognized or not-yet-routed invocation` when handed straight to
`apps/rhino-cli/scripts/rhino-bin.sh`.

**The tell.** A _uniform_ exit 2 across six unrelated gates is an invocation error, not six failing
gates. Six real failures would not agree on an exit code.

**Why.** Those strings are registry entries the gate runner consumes; the runner supplies each
gate's `args` — for `md-links`, `exclude: [plans/done]`, which is what keeps several hundred
archived-plan broken links out of the failure set. The runnable form is
`rhino-bin.sh gate run --surface=<surface>`, which exits 0 and reports each gate by name.

**Routing** — `repo-governance`: worth a line wherever a plan is told to "run each gate", so an
executor neither chases six phantom failures nor, worse, reads exit 2 as a pass.

## L-3 — Word-budget headroom is per repository, and RP-5 fires in one repo but not the other

**What happened.** `ose-public`'s Rule 10 shard is 519 words and absorbed the new item with room to
spare. The private sibling's is **625** — the same insertion would have crossed the 650-word target, so
the RP-5 evict-rather-than-raise protocol became mandatory there and was a no-op here. The eviction
candidate had to be found in that repository's own text: a `**Finding severity**:` paragraph
restating in one list the severity every numbered item already carried inline.

**Why it matters.** A propagation plan that sizes its edit against one repository has not sized it.
The two shards had already drifted — the private sibling's carries an item 8 that `ose-public`'s does not,
which is also why the new check is item 7 there and item 9 here.

**Routing** — `repo-governance`: `rules-propagation` RP-4 should say headroom is measured per
repository at that repository's own placement step, never carried over from the first run.

## L-4 — `git checkout -B <branch> origin/main` silently retargets the branch's upstream to `main`

**What happened.** Re-pointing the delivery branch at a freshly-merged `origin/main` between
delivery units set the branch's upstream to `origin/main`. A subsequent bare `git push` would have
targeted `main` directly — on a repository whose `main` is branch-protected and whose convention
forbids exactly that. Caught by reading `git status -sb`, which said
`Your branch is based on 'origin/worktree/...', but the upstream is gone`.

**The fix.** `git branch --unset-upstream` immediately after, then `push -u origin HEAD` to set the
correct one. Same trap applies to `git worktree add -b <branch> origin/main`, which also tracks
`origin/main`.

**Routing** — `repo-governance`: the worktree-and-branch procedures should carry the
`--unset-upstream` step, since both the provisioning command and the between-units re-point command
produce the same wrong upstream.

## L-5 — Hand-fitting a template clause into a live plan quietly drops its qualifiers

**What happened.** The archival template's classification step reads "a retained entry names who
owns it **and why it outlives the plan**". When that step was fitted by hand into four live plans
across both repositories, the justification clause was dropped from every one of them — the
obligation survived, the reason it exists did not. The gate wording in two of those plans kept "with
its owner named" and still lost "why".

**Why it matters.** A propagation is judged on the canonical edit, so the hand-fitted copies get
less scrutiny than the template they came from. But the copies are what an executor actually reads.
The failure mode is silent: every plan still has a classification step, the presence check the same
delivery unit introduced still passes, and the weakened clause looks complete.

**The tell.** Diff the fitted text against the template clause-by-clause rather than reading it for
sense. A second independent validation pass caught this; the first did not.

**Routing** — `repo-governance`: `rules-propagation` RP-6 should require a clause-level diff when a
canonical template's text is fitted into a downstream document, not just presence of the step.

## L-6 — A step that names a canonical structure needs that structure to exist in the target

**What happened.** The new classification step instructs the executor to classify every
`Delivery Branch Inventory` entry. Two live the private sibling plans — both `worktree-to-pr`, both
therefore owing an inventory under `worktree-specification.md` — declared none; they carried a
differently-named `### Delivery Boundaries` table instead. The step landed correctly and was
literally unexecutable, because the thing it classifies did not exist in the document.

**Why it matters.** The presence check introduced alongside it verifies the _step_, not its
_referent_, so nothing in the delivery unit would ever have surfaced this. The gap predated the
propagation, and the propagation made it load-bearing.

**Routing** — `repo-governance`: `rule10`'s inventory item should fire on a worktree-mode plan that
declares no `Delivery Branch Inventory` at all, which would have caught both plans before this
delivery unit ever touched them. Recorded as a follow-up.

## L-7 — A presence check cannot catch an ordering defect

**What happened.** `worktree-specification.md` puts inventory classification _before_ worktree
removal, for a concrete reason: removal deletes the worktree whose current branch the classification
reads. One live plan hand-fitted the new steps in the opposite order — removal, then classification
— and every check passed. The rule this delivery shipped verified that all three steps were
_present_; nothing verified they were in sequence. The fixer recipe's own instruction ("insert
immediately before the completion-date step") is what produces that ordering when the steps are
appended to a plan that already removes a worktree.

**Why it matters.** A checklist whose steps are individually correct and collectively misordered
fails at execution time, not at validation time — the worst place to find it. Presence is the
cheapest property to check and the least informative one.

**Routing** — landed inline. The rule and the fixer now require the three steps in order, and the
fixer says to move classification above an existing removal step rather than appending. This is a
defect in the rule this plan shipped, not a general governance improvement.

## L-8 — "Main mode" is two modes, and they differ where it counts

**What happened.** The exemption written for the three cleanup steps read "a main mode", treating
`main-to-pr` and `main-to-origin-main` as interchangeable. They are not: `main-to-pr` opens a PR and
therefore creates a delivery branch that still owes branch cleanup. Only `main-to-origin-main`
creates no branch at all. The blanket exemption would have excused a real obligation.

**Why it did not bite.** No plan in either repository selects `main-to-pr` today, so the defect was
dormant — which is why it survived three validation passes before a checker traced the mode
definitions instead of the mode _name_.

**A second, unfixed contradiction.** `per-repository-restrictions-enforcement-and-file-naming.md`
disagrees across the two repositories about whether `plan-checker` flags `main-to-pr` in
`ose-public`: the public copy says it does, the private copy names only "either direct-main mode".
That disagreement determines whether the exemption is reachable at all. It predates this delivery
and is a convention-surface change of its own.

**Routing** — the exemption fix landed inline in both repositories, since the rule shipped here was
wrong. The cross-repository contradiction is reported as a follow-up.

## Triage

Most entries below are `repo-governance` rule changes — changes to how rules are written, verified,
and executed — and are reported rather than landed, because landing them would have widened this
delivery past its stated scope, which is the archival scaffolding itself. L-7 and L-8 are the
exceptions: both are defects in the rule this plan shipped, so both landed inline. None is code, so
none routes to `plans/backlog/` under the code-routing rule, and no `plans/ideas/` artifact was
created because the user has not literally authorized one.

| Entry                                                                                                                                                                 | Terminal state                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L-1                                                                                                                                                                   | `Reported without plan authorization` — live-corpus verification required per scoped repository, not fixtures alone                                    |
| L-2                                                                                                                                                                   | `Reported without plan authorization` — a gate registry `command:` value is not a runnable CLI invocation                                              |
| L-3                                                                                                                                                                   | `Reported without plan authorization` — RP-4 headroom is measured per repository at its own placement step                                             |
| L-4                                                                                                                                                                   | `Reported without plan authorization` — worktree/branch procedures should carry the `--unset-upstream` step                                            |
| L-5                                                                                                                                                                   | `Reported without plan authorization` — RP-6 should require a clause-level diff when fitting a canonical template into a downstream document           |
| L-6                                                                                                                                                                   | `Reported without plan authorization` — `rule10` should fire on a worktree-mode plan that declares no `Delivery Branch Inventory`                      |
| L-7                                                                                                                                                                   | Landed inline in both repositories — the ordering requirement is now in the template, the rule, and the fixer                                          |
| L-8                                                                                                                                                                   | Exemption fix landed inline in both repositories; the cross-repository `main-to-pr` enforcement contradiction is `Reported without plan authorization` |
| [tech-docs §Follow-Ups Recorded, Not Delivered](./tech-docs.md#follow-ups-recorded-not-delivered) — should `plan-execution-checker` verify cleanup actually happened? | `Reported without plan authorization`                                                                                                                  |

**Handoff evidence.** All nine are recorded in this file, which archives with the plan under
`plans/done/`, and are restated in the delivery unit's PR body. No separate tracker exists, so this
file plus the PR body is the handoff surface. Each names its destination surface, so a future
`rules-propagation` run can pick any of them up without re-deriving the finding.
