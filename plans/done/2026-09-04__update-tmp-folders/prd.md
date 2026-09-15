# Product Requirements — Update Temporary Folders

## Product Overview

The product surface here is a rule and the agent behavior that follows it. There is no UI and no
runtime feature. The deliverable is that a maintainer, and every agent acting on their behalf, can
answer one question without hesitating:

> Does this artifact go in `generated-reports/` or `local-tmp/`?

Today the answer depends on the artifact's shape. After this plan it depends on who asked for it.

## The Rule

**`generated-reports/`** — an artifact a human asked for and will read. It is the answer to a
request, not a step toward one.

**`local-tmp/`** — everything an agent produces for itself or hands to another agent. Audit reports,
fix reports, execution-chain state, suppression ledgers, todo lists, progress tracking, scratch
files, intermediate analysis, draft output.

**The test**, applied to any artifact before writing it:

1. Did a human ask for this specific artifact, in their own words?
2. Is it the answer, rather than a step toward the answer?

Both yes → `generated-reports/`. Anything else → `local-tmp/`.

**Layout inside `local-tmp/`**: one directory per agent family, `local-tmp/<agent-family>/`.

`<agent-family>` is **declared, not derived**. Each checker and fixer states its own family in its
Markdown body — "Report family: `docs`. Write reports to `local-tmp/docs/`." — because the family
token in historical report filenames drifted into 38 spellings for roughly 20 families and cannot be
trusted as a source. Where a historical filename prefix and the declared family disagree, the
declaration wins.

Each agent runs `mkdir -p local-tmp/<family>/` before its first write. `local-tmp/`'s tracked
`.gitkeep` guarantees only that `local-tmp/` itself exists; that guarantee does not extend to the
per-family subdirectories.

Cross-family shared state that belongs to no single family sits at `local-tmp/` root.

## Personas

**The maintainer.** Asks for a report in plain language ("find out how testing is enforced in this
repo, then write the report in `generated-reports`"), then opens the directory expecting to find it.
Does not want to scroll past 471 machine artifacts. Never reads a checker audit unless they invoked
the checker.

**A checker or fixer agent.** Writes an audit or fix report progressively during a run, names it
with a UUID chain and timestamp, and expects a sibling agent to find it. Does not need a human to
see it. Currently mandated to write to `generated-reports/`.

**A downstream agent.** Reads a prior audit report, or the accepted-false-positive ledger, to avoid
re-reporting settled findings. Needs a stable, discoverable path — not a human-facing one.

## User Stories

**US-1** — As a maintainer, I ask for a report and find it in `generated-reports/` without scrolling
past machine output, so the directory is usable as an outbox.

**US-2** — As a checker agent, I write my audit to my family's `local-tmp/` directory, so my output
does not compete for the maintainer's attention with work they actually requested.

**US-3** — As a fixer agent, I find the audit my paired checker produced, so the maker → checker →
fixer loop still closes after the move.

**US-4** — As a fixer agent, I append an accepted false positive to a ledger that `rhino-cli` still
reads by default, so settled findings stay settled after the move.

**US-5** — As a maintainer of both repositories, I find the same rule stated in `ose-public` and
the private sibling, so the two do not drift.

**US-6** — As an agent reading the convention, I can classify a novel artifact from the rule alone
without inventing a category, so the rule does not decay the way the type-based rule did.

## Acceptance Criteria

### AC-1: A requested report lands in `generated-reports/` (US-1)

```gherkin
Scenario: A maintainer explicitly requests a report
  Given a maintainer asks in their own words for a named investigation to be written up as a report
  When the agent produces that report
  Then the report file is created under "generated-reports/"
  And the directory contains no artifact the maintainer did not request
```

### AC-2: A checker audit lands in its family directory (US-2)

```gherkin
Scenario: A checker agent writes its audit report
  Given a "*-checker" agent has been invoked and has findings to record
  When the agent writes its audit report
  Then the report path is "local-tmp/<agent-family>/<family>__<uuid-chain>__<timestamp>__audit.md"
  And no file is created under "generated-reports/"
  And the report is written progressively rather than buffered until the run ends
```

### AC-3: The checker-to-fixer handoff still closes (US-3)

```gherkin
Scenario: A fixer agent locates its paired audit report
  Given a checker agent has written an audit report under its family directory in "local-tmp/"
  When the paired fixer agent is invoked to apply that audit's findings
  Then the fixer resolves the audit report from the same family directory
  And the fixer writes its own fix report beside it under the same family directory
```

### AC-4: The suppression ledger survives the move (US-4)

```gherkin
Scenario: rhino-cli loads accepted false positives from the relocated ledger
  Given the accepted-false-positive ledger has been moved out of "generated-reports/"
  When "rhino-cli" runs a governance audit without an explicit ledger path argument
  Then it loads the ledger from its new default path under "local-tmp/"
  And every previously accepted false positive is still suppressed
```

### AC-5: Both repositories state the same rule (US-5)

```gherkin
Scenario: The rule is stated identically in both repositories
  Given the Temporary Files Convention exists in "ose-public" and "private-sibling" under different shard filenames
  When the intent-based rule is propagated to both
  Then each repository's convention states the same two-question test and the same "local-tmp/<agent-family>/" layout
  And neither repository retains a live instruction to write agent output to "generated-reports/"
```

### AC-6: No live instruction points agent output at `generated-reports/` (US-6)

```gherkin
Scenario: The repository carries no stale write instruction
  Given the propagation sweep across governance, agents, skills, and harness mirrors has completed
  When every remaining occurrence of "generated-reports" is classified
  Then each occurrence is one of: the rule text describing the directory's purpose, an ignore-file entry, a tool skip-list, or a historical record under "plans/done/"
  And no occurrence instructs an agent to write its own output there
```

### AC-7: The historical backlog is cleared reversibly (US-1)

```gherkin
Scenario: Accumulated artifacts are removed without losing anything load-bearing
  Given both repositories hold accumulated artifacts in "generated-reports/"
  When the cleanup step runs
  Then every artifact is first moved to a dated quarantine directory rather than deleted outright
  And the repository's quality gates pass with the quarantine in place
  And only then is the quarantine deleted
```

### AC-8: Markdown written to `local-tmp/` is not reformatted (US-2)

```gherkin
Scenario: The formatter leaves agent reports alone
  Given agent reports are now written as Markdown under "local-tmp/"
  When the repository's Prettier configuration is evaluated against one of those paths
  Then the path is ignored by Prettier
  And it is also ignored by markdownlint
```

### AC-11: Every checker and fixer declares exactly one family (US-2)

```gherkin
Scenario: The family token is declared rather than derived
  Given every "*-checker" and "*-fixer" agent definition has been edited
  When each definition is read
  Then it declares exactly one report family in its Markdown body
  And its stated report destination is "local-tmp/<that-family>/"
  And two agents of the same maker/checker/fixer triple declare the same family
  And no agent frontmatter gained a "family" field
```

### AC-9: Every propagated rule carries an enforcement disposition (US-6)

```gherkin
Scenario: The rules-propagation run leaves no rule undispositioned
  Given the four normalized statements have been written into a repository's governance surface
  When the rules-propagation run reaches its enforcement-disposition step
  Then each statement carries exactly one of "covered", "gated", or "unenforced by decision"
  And no statement is left silent
  And every "unenforced by decision" statement records its reason on the rule itself
  And no statement claims "covered" by citing a check that never executes
```

### AC-10: The propagation runs terminate cleanly in both repositories (US-5)

```gherkin
Scenario: Both repository runs reach a landed terminal state
  Given the rules-propagation workflow has been run independently against "ose-public" and "private-sibling"
  When both runs complete
  Then each reports "final-status: landed" rather than "partial" or "halted"
  And each run's PR body states every statement's destination, disposition, and any supersession or eviction it caused
  And the sibling obligation is recorded in the first run and recorded as discharged in the second
```

## Product Scope

**In**

- The rule text in both repositories' Temporary Files Convention shard sets.
- Every `.claude/agents/**` and `.claude/skills/**` file carrying a report-destination instruction,
  in both repositories, plus their generated harness mirrors.
- `AGENTS.md`, the glossary's content-trees entry, and any convention cross-reference that states
  the split.
- `.prettierignore` (add `local-tmp/`; `.markdownlintignore` already has it).
- The `outputs:` declaration of the `rules-propagation` workflow, and of any other workflow under
  `repo-governance/workflows/` whose declared output pattern names `generated-reports/`.
- A full `rules-propagation` run per repository — normalized statements, conflict scan, placement
  and eviction, enforcement dispositions, verification, and the recorded sibling obligation.
- `rhino-cli`'s suppression-ledger default path, its tests, and the parity manifest.
- One-time deletion of accumulated artifacts in both repositories, including per-worktree copies.

**Out**

- Any new validator, gate, or CI check.
- A retention/expiry policy for `generated-reports/`.
- Changes to report file naming, UUID chain generation, or the progressive-writing requirement.
- Changes to `local-tmp/`'s existing reclamation predicates.
- `Harness.fs`'s `validateGeneratedReportsTools`, which is unreachable — it tests whether an agent's
  own path under `.claude/agents/` contains `generated-reports`, which it never does. Recorded in
  `tech-docs.md` as an observation, not fixed here.

## Product Risks

| Risk                                                                                               | Severity | Mitigation                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| An agent edited for the new path keeps a second stale mention elsewhere in its own file            | Medium   | Classify every occurrence per file with a recorded verdict; AC-6 is the falsifiable close condition.                        |
| The `local-tmp/<agent-family>/` token is ambiguous for agents whose name is not `<family>-checker` | Medium   | `tech-docs.md` fixes the token as the report filename's existing `{agent-family}` component — one source, not two.          |
| Harness mirrors are hand-edited instead of regenerated, so `validate:sync` fails                   | Low      | Regeneration is an explicit step; mirrors are never edited directly.                                                        |
| The two repositories land in different windows and the nightly parity audit reports drift          | Low      | `ose-public` lands first as canonical; the private sibling follows in the same session, before the 02:00 UTC scheduled run. |
