# Plan Archival (Mandatory Final Section)

Every delivery plan MUST end with a plan archival section:

```markdown
### Plan Archival

- [ ] Perform the **preliminary** plan-execution end-to-end delivery completeness audit: trace approved scope and
      every canonical PRD acceptance criterion through delivery units, as-built artifacts,
      automated/manual proof, applicable migration/rollout/rollback evidence, conditional recovery
      dispositions, and Knowledge Capture. Reopen execution at the earliest affected packet for
      every missing or unsupported non-delivery row; only final-delivery proof may remain explicitly
      pending. Checked boxes alone are not proof.
- [ ] Verify ALL delivery checklist items are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Verify ALL manual assertions pass with committed `evidence/` artifacts (screenshots plus
      HTTP `rtk curl` or non-HTTP protocol-native wire output, as applicable)
- [ ] Verify ALL supported locales were exercised in UI verification (not just the default)
- [ ] Verify every rule-15 EWT/UWT/DWT defect finding is fixed (ticked) — deferral requires explicit user permission (only when genuinely impossible)
      for EWT/UWT/DWT defect findings; SG-### proposals and USS-### suggestions may be triaged or deferred
- [ ] Verify every rule-16 AET defect finding is fixed (ticked) — deferral requires explicit user permission (only when genuinely impossible)
      for AET defect findings; SG-### spec-gap proposals may be triaged or deferred
- [ ] Register the workflow-owned terminal audit task and its required post-delivery proof fields;
      do not mark that gate complete before merge or direct-push confirmation. Its result belongs in
      the plan-execution final report, not a speculative pre-merge checkbox.
- [ ] Classify every `Delivery Branch Inventory` entry as delivered, unused, or
      retained/escalated; a retained entry names who owns it and why it outlives the plan, and an
      entry whose state is ambiguous or whose proof is missing is escalated, never deleted
      — worktree modes only; a main mode declares no branch inventory
- [ ] Remove each worktree this plan provisioned, non-force, from the repository root:
      `rtk git worktree remove worktrees/<plan-identifier>`, after the checks in
      `repo-governance/development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md`
      — worktree modes only, like the step above
- [ ] Complete branch cleanup for every branch this plan created, in every repository it delivered
      to, per `repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md`,
      then run `rtk git worktree prune`. Follow that convention's proof gates; never relax them
      here — every mode that creates a branch owes this step, including `main-to-pr`
- [ ] After every pre-archival gate, including the preliminary audit, passes, run `rtk date +%F`; record the output as
      `<completion-date>`. Do not hardcode or predict this value while authoring the plan.
- [ ] Move the plan via
      `rtk git mv plans/in-progress/<plan-name>/ plans/done/<completion-date>__<plan-name>/` (the
      `evidence/` subfolder moves with it)
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry using the same resolved completion date
- [ ] Update any other READMEs that reference this plan
- [ ] Commit: `chore(plans): move [plan-name] to done`
```

After the archival delivery is pushed or merged, plan execution must run the registered terminal
audit against the delivered head before assigning `pass` or cleaning the worktree. A failed
terminal audit reopens execution and is never papered over with a post-merge checkbox edit.

The three cleanup steps are scaffolding, not the procedure. Worktree removal routes to
[Mandatory Pre-Removal Checks](../../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md)
and branch deletion to
[Branch Cleanup](../../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md);
those two own the proof gates, and a plan never restates or weakens either. The three run in the
listed order: removal deletes the worktree classification reads. A worktree mode owes all three. A
`main-to-pr` plan declares no branch inventory and provisions no worktree, so it owes only branch
cleanup for its PR branch; a `main-to-origin-main` plan creates neither and owes none.

See [knowledge-capture-scaffold-and-entries.md](knowledge-capture-scaffold-and-entries.md) and [knowledge-capture-phase-template.md](knowledge-capture-phase-template.md) for the mandatory phase that precedes archival, and [common-mistakes.md](common-mistakes.md) for authoring pitfalls to avoid before reaching this section.
