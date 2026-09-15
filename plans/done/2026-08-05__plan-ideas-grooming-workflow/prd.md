# Product Requirements Document: `plan-ideas-grooming` Workflow

## Product Overview

A new workflow document, `repo-governance/workflows/plan/plan-ideas-grooming.md`, that defines a
repeatable mechanism for sweeping one or more OSE repos' `plans/ideas/` folders — the direct
analogy to Scrum's "backlog grooming": merging/splitting near-duplicate ideas, classifying every
idea into an Eisenhower quadrant folder, reshaping each into strict two-pager compliance,
correcting cross-repo residency per three placement rules (generalizable → `ose-public`,
secrets-bearing → the private sibling only, single-repo-only → that repo only), and **renaming** an
idea-doc's filename when it no longer matches its content (post-merge/split, non-kebab-case, or a
residency-driven context change), with every rename's inbound/outbound links rewritten by the same
mechanism that already handles relocation link-rewriting. This plan authors the workflow document
once and its supporting `grooming` type-token convention amendment, then propagates both to all
four OSE repos so the workflow is invocable from any of them. The workflow's own reorganization
logic is **specified, not executed**, by this plan.

## Personas

Solo-maintainer repo — personas are hats the maintainer wears, plus the agents that consume these
files directly:

- **Idea author**: files a new `plans/ideas/<slug>.md` two-pager in whichever repo they're working
  in at the time.
- **Idea triager**: periodically reviews `plans/ideas/` to decide what to promote, merge, or
  discard; is the direct beneficiary of the classification/dedup/rename mechanism this plan
  specifies.
- **`repo-rules-checker`** (consumer, indirect): the workflow's amendment to `workflow-naming.md`
  must keep passing the existing `rhino-cli repo-governance workflows naming validate` audit this
  checker already relies on.
- **Future invoker of `plan-ideas-grooming`**: the maintainer (or an agent acting for them),
  running the workflow from whichever of the four repos they currently have open — the explicit
  reason this plan propagates the workflow file rather than leaving it `ose-public`-only.

## User Stories

**US-1**: As the maintainer, I want a workflow type token that accurately describes a recurring
sweep-and-reorganize process, so that I don't force-fit `plan-ideas-grooming` into a type
(`quality-gate`, `execution`, `setup`, `planning`) whose semantics don't match what it actually
does.

**US-2**: As the maintainer, I want `plan-ideas-grooming.md` to exist in every one of the four
repos I work across, so that I can invoke it from whichever repo I currently have open, without
first having to `cd` to `ose-public`.

**US-3**: As the idea triager, I want the workflow to specify a falsifiable urgency rubric and a
falsifiable importance rubric, so that Eisenhower classification is a repeatable, auditable
decision rather than a per-run judgment call that could classify the same idea differently on
different runs.

**US-4**: As the maintainer, I want the workflow's cross-repo relocation mechanism to fail safe
(duplication, not loss) if a relocation is interrupted partway, so that a crashed or killed run
never silently drops an idea that only existed in one place.

**US-5**: As the maintainer, I want the workflow to state its own re-run trigger explicitly, so
that "grooming" is a real, recurring commitment rather than a one-time migration wearing a
recurring name.

**US-6**: As a future reader of a relocated idea file, I want its provenance blockquote to record
where it moved from and when, so that the file's history is recoverable even though git history
does not follow a file across independent repositories.

**US-7**: As the maintainer, I want the workflow to rename an idea-doc's filename when it no longer
matches its content — after a merge or split leaves the wrong survivor name, when the name doesn't
follow kebab-case, or when a relocation reveals the name was scoped to the wrong context — with
every inbound/outbound link rewritten as part of the same rewrite mechanism already used for
relocation, so a rename never produces a broken link as a side effect.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: grooming type token in workflow-naming.md

  Scenario: rhino-cli accepts the new workflow filename
    Given workflow-naming.md's Type Vocabulary table includes a "grooming" row
    When rhino-cli repo-governance workflows naming validate runs against repo-governance/workflows/
    Then plan-ideas-grooming.md is reported as a compliant filename
    And no existing workflow filename is newly reported as non-compliant

  Scenario: the enforcement regex is updated consistently with the table
    Given workflow-naming.md documents the audit command find | grep -vE -- '-(quality-gate|execution|setup|planning)$'
    When the grooming token is added to the Type Vocabulary table
    Then the documented regex is updated to '-(quality-gate|execution|setup|planning|grooming)$'
    And the Examples section lists plan-ideas-grooming under the grooming type
```

```gherkin
Feature: plan-ideas-grooming.md exists identically across all four repos

  Scenario: the workflow file is byte-identical in every repo after propagation
    Given plan-ideas-grooming.md has been authored and pushed to origin/main in ose-public
    When the file is propagated to ose-primer, private-sibling, and beaver-nest
    Then diff between ose-public's copy and each sibling repo's copy reports no differences
    And each sibling repo's own naming-validate check passes on the propagated file

  Scenario: the workflow file names no machine-local absolute path
    Given the workflow file's steps reference the four-repo propagation target set
    When the file is read for machine-path portability
    Then no step hardcodes an absolute filesystem path specific to one contributor's machine
    And the repos input parameter is the sole place a concrete repo list is supplied at invocation
```

```gherkin
Feature: workflow-naming.md convention amendment propagates without blind-copy drift

  Scenario: each repo's amendment is adapted, not overwritten
    Given ose-primer, private-sibling, and beaver-nest each already carry a workflow-naming.md that
      differs from ose-public's copy by 12 to 68 lines before this plan's changes
    When the grooming type token is propagated to a sibling repo
    Then that repo's own pre-existing content outside the Type Vocabulary table is unchanged
    And that repo's Type Vocabulary table gains the same grooming row definition as ose-public's
```

```gherkin
Feature: the workflow specifies falsifiable Eisenhower classification rubrics

  Scenario: the urgency rubric is checkable against an idea's own content
    Given an idea brief's Why now section is read by the workflow
    When the urgency rubric is applied
    Then the idea is classified urgent only if it names or blocks an active in-progress or backlog plan, or documents an already-observed live defect
    And an idea with no such reference is classified not-urgent

  Scenario: the importance rubric is checkable against an idea's own content
    Given an idea brief's content is read by the workflow
    When the importance rubric is applied
    Then the idea is classified important only if it affects two or more repos, a security or secrets concern, a data-integrity or data-loss risk, a currently-blocking CI gate, or a rule an existing checker enforces
    And an idea matching none of those signals is classified not-important
```

```gherkin
Feature: cross-repo relocation fails safe toward duplication, not loss

  Scenario: an interrupted relocation leaves the idea duplicated, never dropped
    Given the workflow's relocation mechanism creates the destination copy first, verifies it landed, then deletes the source copy
    When the delete-from-source step fails or is interrupted after the create-in-destination step succeeded
    Then the idea still exists in both the source and destination repos
    And the workflow's ledger records the duplication as an unresolved follow-up rather than silently completing
```

```gherkin
Feature: the workflow states its own recurrence trigger

  Scenario: the workflow document names a concrete re-run condition
    Given plan-ideas-grooming.md's authored content
    When the document is read for its recurrence policy
    Then it states a file-count threshold, an elapsed-time threshold, or both, as the trigger for re-running the workflow against a given repo
    And it does not read as a one-time migration procedure
```

```gherkin
Feature: relocated ideas carry recoverable provenance

  Scenario: a relocated idea's provenance blockquote records the move
    Given an idea file that the workflow relocates from one repo to another
    When the relocation's create-in-destination step writes the new file
    Then the file's existing provenance blockquote gains an appended line naming the source repo, source path, and relocation date
    And the original provenance content is preserved verbatim above the appended line
```

```gherkin
Feature: the workflow renames idea-doc filenames when warranted, with links rewritten

  Scenario: a stale filename is renamed and every reference is rewritten
    Given an idea file's filename no longer matches its content after a merge, a split, or a residency-driven relocation, or the filename does not follow kebab-case
    When the workflow's rename step runs
    Then the file is renamed to a filename that matches its current content and follows kebab-case
    And every inbound relative link to the old filename, within the same repo, is rewritten to the new filename by the same link-rewrite mechanism used for relocation
    And no separate, untracked rename mechanism exists outside that link-rewrite step
```

```gherkin
Feature: this plan's own delivery never operates the grooming workflow against live plans/ideas/ content

  Scenario: no idea file is created, edited, or deleted by running the grooming workflow, merging, splitting, or relocating
    Given this plan's declared scope excludes running the grooming workflow
    When this plan's delivery checklist (Phases 0-4, the workflow-authoring-and-propagation scope) is executed to completion
    Then no file under any repo's plans/ideas/ directory is created, modified, or deleted by invoking plan-ideas-grooming.md, merging/splitting/renaming/relocating an existing idea file, or creating a q1-q4 quadrant subfolder
    And no repo's plans/ideas/README.md is changed by any such operation

  Scenario: the Knowledge Capture phase MAY add or update a plans/ideas/ two-pager as a routing destination
    Given the repo-wide Knowledge Capture Convention names plans/ideas/ two-pagers as a legitimate durable home for a future-work learning
    When this plan's mandatory Phase 5 (Knowledge Capture) routes a surviving learning to that home
    Then creating a new two-pager, folding a learning into an existing one, or updating plans/ideas/README.md's index is in scope for Phase 5 specifically
    And this carve-out never extends to Phases 0-4 — the grooming-workflow-authoring-and-propagation work itself still never touches plans/ideas/
```

## Product Scope

**In scope**:

- The `grooming` type-token convention amendment (`ose-public`, then adapted to the three
  siblings).
- The `plan-ideas-grooming.md` workflow document (authored in `ose-public`, propagated
  byte-identical to the three siblings).
- The `workflows/README.md` catalog update in all four repos (adapted per-repo, not blind-copied).
- The workflow document's own internal specification of: the merge/split mechanism, the Eisenhower
  quadrant folder names and both rubrics, the cross-repo relocation safety model, the
  provenance-preservation rule, the rename mechanism (folded into the link-rewrite step, not a
  separate mechanism), the link-rewrite step itself, and the recurrence trigger.

**Out of scope**:

- Running `plan-ideas-grooming` against any repo's live `plans/ideas/` content.
- Creating any `q1-…`–`q4-…` quadrant subfolder in any repo.
- Modifying, merging, splitting, renaming, or relocating any existing idea file.
- Running `npm run generate:bindings` or any `.claude`/`.opencode`/harness-sync command — this plan
  touches only `repo-governance/` content, which is not part of the harness-binding sync surface.

**Carve-out (added 2026-08-05, Phase 6)**: the four bullets above bind Phases 0-4 (the
grooming-workflow-authoring-and-propagation work) only. Phase 5's mandatory Knowledge Capture
routing MAY create or edit a `plans/ideas/` two-pager, including `plans/ideas/README.md`'s index,
when a surviving learning routes there per the Knowledge Capture Convention — that convention is a
separate, standing, plan-wide obligation this plan cannot opt out of, and "modifying
`plans/ideas/README.md`" was originally listed as flatly out of scope without anticipating this
overlap. Discovered when Phase 5 needed to route two learnings there and the original wording
would have been silently violated; corrected here rather than left contradictory. See
`learnings.md` for the routing detail.

## Product-Level Risks

- **UX risk**: a workflow document that is comprehensive but never run risks becoming stale
  relative to the actual shape of `plans/ideas/` by the time it is first invoked. Mitigated by the
  recurrence-trigger requirement (US-5) and a Knowledge Capture entry recommending prompt
  first-use.
- **Feature-interaction risk**: the new `grooming` type token interacts with every other
  workflow-authoring surface (`plan-maker`, `repo-rules-checker`'s naming audit,
  `workflows/README.md`'s catalog). Mitigated by `delivery.md` treating the
  `workflows/README.md` update as a mandatory, gated step alongside the convention amendment, not
  an optional follow-up.
- **Rename-scope risk**: folding rename into the link-rewrite step (rather than a separate
  mechanism) could under-specify rename-specific edge cases (e.g., a rename target that collides
  with an existing filename). Mitigated by `tech-docs.md` DD-7 stating the rename mechanism
  explicitly, including the collision case, inside the same design section as the link-rewrite
  step.
