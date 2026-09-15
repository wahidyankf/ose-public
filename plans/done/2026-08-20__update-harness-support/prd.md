# Product Requirements — Update Harness Support

## Product Overview

The product surface here is the repository's **harness-compatibility system**: the machine-readable
registry that declares which coding agents are supported, the generators that emit each agent's
binding files, the validators that keep those files honest, and the catalog document that explains
the whole thing to a human.

Today that system is a mix of data and prose. The registry is data; the catalog is prose; the
validators are partly data-driven and partly hard-coded match arms. This plan pushes the whole system
onto the data side and shrinks its declared surface to what is actually used.

This is a governance/tooling plan. It is **not UI-bearing** — it adds no user-facing screen or
component under `apps/` or `libs/` — so the UI-design-funnel does not apply. It touches no web UI and
no HTTP API, so the rule-15 web-triad retest and the rule-16 API exploratory retest do not apply
either. It does change CLI behaviour, so the plan carries manual CLI behavioural assertions in their
place (see `delivery.md` §Manual Behavioural Assertions).

## Personas

**P1 — Solo maintainer (`wahidyankf`).** Owns every harness claim in the repository. Needs the
maintenance cost of a claim to be proportional to its value: a single generated source of truth
instead of eleven hand-maintained surfaces, total binding-file ownership with no unclassified
residue, and a documented manual re-verification procedure to run on demand — not an automated
freshness or expiry notification, which was designed and deliberately withdrawn because it times out
this repository's own claims without ever inspecting a vendor (`tech-docs.md` DD-10, DD-11).

**P2 — Delegated execution agent (execution-grade).** Reads `AGENTS.md` or `CLAUDE.md`, then whatever
binding surface its harness exposes. Needs the surfaces it reads to exist, to be current, and to be
identical in content across harnesses.

**P3 — Contributor driving OpenAI Codex CLI.** Today gets two hand-maintained TOML files and a gate
that forbids the officially-correct subagent directory. Needs the same 93 agent definitions the
other two harnesses get, and a skills surface Codex can actually read.

**P4 — Future maintainer re-verifying a harness row.** Needs to know when a claim was last checked
and against what, without reading git history.

## User Stories

### US-1 — Contract the registry to three harnesses

> As P1, I want `repo-config.yml` to declare exactly the three harnesses I use, so that governance
> maintenance is proportional to real usage rather than to aspiration.

**Acceptance criteria:**

```gherkin
@harness-registry
Feature: The harness registry declares only supported harnesses

  @unit
  Scenario: The registry contracts from eleven entries to three
    Given repo-config.yml declared eleven harness entries before this change, including amazonq, copilot, cursor, windsurf, junie, antigravity, pi, and aider
    When rhino-cli repo-config validate runs after the contraction
    Then it exits 0 with exactly three harness entries named claude-code, opencode, and codex
    And a search of the harness section for any of the eight dropped names returns zero matches, where the same search returned eight matches before the change

  @unit
  Scenario: A dropped harness name is rejected rather than silently ignored
    Given the contracted three-entry registry
    When a harness entry named cursor is reintroduced without a corresponding catalog row
    Then rhino-cli harness catalog validate exits non-zero naming the uncatalogued entry
    And the same command exits 0 once the catalog row is declared
```

### US-2 — Purge dropped-harness bindings and code arms

> As P1, I want the eight dropped harnesses to leave behind no binding directory, no code arm, and no
> governance reference, so that nothing in the repository implies support that does not exist.

**Acceptance criteria:**

```gherkin
@harness-purge
Feature: Dropped harness bindings are fully removed

  @unit
  Scenario: Generated binding directories for dropped harnesses no longer exist
    Given .cursor/ tracked 93 files, .amazonq/ tracked 2 files, and .pi/ tracked 1 file before this change
    When git ls-files is run against those three paths after the purge
    Then each returns zero tracked files
    And rhino-cli harness bindings validate exits 0, where before the purge it required .amazonq/ byte-parity

  @unit
  Scenario: The bindings generator rejects a dropped harness name
    Given rhino-cli harness bindings generate previously accepted --harness cursor and --harness amazonq
    When the command is invoked with --harness cursor after the purge
    Then it exits non-zero with an unknown-harness error naming the accepted set
    And invoking it with --harness codex exits 0, where before the change that value was also rejected

  @unit
  Scenario: Historical records keep their dropped-harness references
    Given docs/explanation/post-mortems/ and plans/done/ record incidents involving Amazon Q and Cursor
    When the governance sweep completes
    Then those historical documents still contain their original harness names
    And no live governance document under repo-governance/ presents any dropped harness as supported
```

### US-3 — Codex reaches generated parity with OpenCode

> As P3, I want my harness to receive the same generated agent definitions the other two receive, so
> that the repository's agent knowledge is not harness-conditional.

**Acceptance criteria:**

```gherkin
@codex-binding
Feature: Codex agent definitions are generated from .claude/agents/

  @unit
  Scenario: The forbid-dir defect is corrected
    Given repo-config.yml declared forbid-dir .codex/agents and the catalog asserted that directory was never official
    When the codex registry entry is corrected to the generated tier
    Then rhino-cli harness bindings validate exits 0 with .codex/agents/ present
    And the same validator exits non-zero when a markdown file appears under .codex/agents/, since only TOML is official there

  @unit
  Scenario: Every Claude agent gets a Codex TOML counterpart
    Given 93 tracked agent files under .claude/agents/ (excluding README.md index files) and 0 tracked files under .codex/agents/
    When rhino-cli harness bindings generate runs
    Then .codex/agents/ contains one .toml file per .claude/agents/ agent, keyed on the agent name frontmatter rather than the source subfolder
    And each emitted file declares name, description, and developer_instructions

  @unit
  Scenario: Regeneration is idempotent and hand edits are caught
    Given a clean tree immediately after rhino-cli harness bindings generate
    When the command runs a second time
    Then git diff --quiet .codex/ exits 0, proving no churn
    And after a single character is changed in one emitted TOML file, rhino-cli harness bindings validate exits non-zero naming that file

  @unit
  Scenario: The hand-maintained Codex config entry survives regeneration
    Given .codex/config.toml carries a hand-maintained agents.ci-monitor-subagent table pointing at ci-monitor-subagent.toml
    When rhino-cli harness bindings generate rewrites the generated agent region of that file
    Then the ci-monitor-subagent table is still present and unchanged
    And the mcp_servers.nx-mcp and features tables are also unchanged
```

### US-4 — `.agents/skills/` becomes a generated real-file mirror of `.claude/skills/`

> As P3, I want the repository's skills reachable from Codex — which reads only `.agents/skills/` —
> as ordinary files rather than links, so that skill knowledge is not Claude-and-OpenCode-only and
> nothing depends on unverified symlink behaviour.

**Acceptance criteria:**

```gherkin
@agents-skills-mirror
Feature: .agents/skills/ is a generated real-file mirror

  @unit
  Scenario: The mirror target is declared in the registry
    Given the harness registry declared a mirrors key only for the OpenCode agent directory
    When the codex entry is updated to declare .agents/skills as a mirror of .claude/skills
    Then rhino-cli repo-config validate exits 0 with two declared mirror relationships, where it previously validated one
    And rhino-cli harness bindings generate emits the .agents/skills mirror without a new command-line flag

  @unit
  Scenario: Every repository skill is mirrored as real files, not links
    Given 59 skill directories and 545 tracked files under .claude/skills/ and 0 mirrored skill directories under .agents/skills/
    When rhino-cli harness bindings generate runs
    Then .agents/skills/ contains one real directory per .claude/skills/ skill
    And find .agents/skills -type l returns zero results, proving no symlink was created in either direction

  @unit
  Scenario: Regeneration is idempotent and a hand edit is caught
    Given a clean tree immediately after rhino-cli harness bindings generate
    When the command runs a second time
    Then git diff --quiet .agents/ exits 0, proving no churn
    And after a single character is changed in one mirrored file, rhino-cli harness bindings validate exits non-zero naming that file, where it exited 0 before the edit

  @unit
  Scenario: The npm entry points cover the new mirror
    Given npm run generate:bindings and npm run validate:sync covered only the OpenCode and Amazon Q surfaces
    When both scripts run after the mirror is wired
    Then generate:bindings emits .agents/skills/ and validate:sync reports it as in-parity
    And neither script required a new flag, because both delegate to the registry-driven commands

  @unit
  Scenario: The emitted mirror survives the formatter
    Given this repository has previously broken a generated byte-equality guard by letting the formatter rewrite emitted files
    When rhino-cli harness bindings generate is followed by prettier --write over .agents/ and then rhino-cli harness bindings validate
    Then the validator exits 0
    And where it exits non-zero instead, .agents/ is added to .prettierignore and the same sequence then exits 0
```

### US-4b — Vendored third-party skills survive regeneration untouched

> As P1, I want the eight vendored plugin skill directories already living in `.agents/skills/` to be
> declared and protected, so that a generator which now owns that tree cannot clobber content it did
> not create and cannot recreate.
>
> **The byte-identity criterion for these files lives in US-8**, whose vendored-class scenario covers
> them alongside every other vendored binding file. It is not repeated here.

**Acceptance criteria:**

```gherkin
@vendored-skill-preservation
Feature: The emitter owns only what it generates

  @unit
  Scenario: Vendored subdirectories are declared, not inferred
    Given .agents/skills/ holds 24 tracked files across 8 vendored plugin directories with no .claude/skills/ source and no way to regenerate them
    When the harness registry declares those 8 directories as vendored
    Then rhino-cli repo-config validate exits 0
    And an undeclared directory appearing under .agents/skills/ with no .claude/skills/ counterpart makes rhino-cli harness bindings validate exit non-zero, where an ownership heuristic would have silently deleted it instead

  @unit
  Scenario: Stale-mirror cleanup never reaches a vendored directory
    Given a skill directory is renamed under .claude/skills/ so its old mirror becomes stale
    When rhino-cli harness bindings generate runs
    Then the stale mirrored directory is removed and the new one created
    And all 8 vendored directories are still present, proving cleanup is scoped to emitter-owned paths
```

### US-4c — `.opencode/skills/` and `.opencode/commands/` are deleted as an accepted capability loss

> As P1, I want the tool-generated OpenCode skill and command trees removed, accepting that OpenCode
> users may lose Nx skill access, so that no ungoverned instruction surface survives by exclusion.

**Acceptance criteria:**

```gherkin
@opencode-skills-removal
Feature: The ungoverned OpenCode trees are deleted deliberately

  @unit
  Scenario: Both trees are removed and their word-budget exclusions removed with them
    Given .opencode/skills/ tracks 16 files across 7 directories and .opencode/commands/ tracks 1 file, both introduced by the same tool-generated commit and both excluded from the word budget by a tree-level prefix
    When both trees are deleted
    Then git ls-files .opencode/skills .opencode/commands returns zero tracked files, where it returned 17 before
    And neither prefix remains in the governance-word-budget gate exclude list, where both were present before
    And rhino-cli governance word-budget validate exits 0, proving the exclusions were removed because the trees are gone rather than because coverage was weakened

  @unit
  Scenario: The capability loss is recorded, not silent
    Given OpenCode does not read Claude Code plugins and no nx-mcp equivalent covers the gap for OpenCode
    When the deletion lands
    Then the platform-bindings catalog records the removal as a deliberate accepted capability loss naming the lost Nx skills and the monitor-ci command
    And no document describes the change as routine cleanup
```

### US-5 — The catalog becomes generated from registry data

> As P4, I want the platform-bindings catalog to be rendered from declared data, so that the document
> and the machine-readable registry cannot disagree.

**Acceptance criteria:**

```gherkin
@catalog-generation
Feature: The platform-bindings catalog is generated, not hand-written

  @unit
  Scenario: The catalog table renders from the harness registry
    Given each harness entry in repo-config.yml carries catalog fields including display name, instruction surfaces, agent surface, skills surface, and status
    When rhino-cli harness catalog generate runs
    Then docs/reference/platform-bindings.md contains one table row per registry entry between the generated-region markers
    And prose outside those markers is byte-identical to its pre-run content

  @unit
  Scenario: A hand edit inside the generated region is rejected
    Given a freshly generated catalog with a clean git diff
    When one cell inside the generated region is edited by hand
    Then rhino-cli harness catalog validate exits non-zero naming the drifted region
    And it exits 0 after rhino-cli harness catalog generate is re-run
```

### US-6 — Instruction word budget covers every live entry point

> As P2, I want every instruction file my harness actually reads to carry the same word budget, so
> that no entry point grows unbounded just because nothing measured it.

**Acceptance criteria:**

```gherkin
@word-budget-coverage
Feature: Word-budget surfaces track the three surviving harnesses

  @unit
  Scenario: Retired binding surfaces leave the budget and live ones enter it
    Given the word-budget surface list declared .cursor/, .pi/, and .amazonq/ globs and the path-gated trigger list named the same three directories
    When the surface and trigger lists are rewritten for the three survivors
    Then the surface list names AGENTS.md, CLAUDE.md, .claude/, .opencode/, .codex/, .agents/, repo-governance/, and the README glob, and names none of the three retired directories
    And rhino-cli governance word-budget validate exits 0 at the unchanged 500-word fail threshold

  @unit
  Scenario: The threshold itself is unchanged
    Given AGENTS.md measures 487 words and CLAUDE.md measures 423 words before this change
    When the word-budget configuration is rewritten
    Then the fail threshold for both files is still 500
    And appending 20 words to AGENTS.md makes the validator exit non-zero, proving the threshold is still armed
```

### US-7 — OpenCode v1 claims are correct and v2 is deferred as an idea

> As P4, I want OpenCode's row to describe v1 stable accurately and the v2-beta migration to exist as
> a promotable brief, so that a future major-version move starts from written evidence.

**Acceptance criteria:**

```gherkin
@opencode-conformance
Feature: OpenCode claims target v1 stable and v2 is filed as an idea

  @unit
  Scenario: The stale upstream repository citation is corrected
    Given repository documents cite the OpenCode upstream repository under its former organization path
    When the citation sweep completes
    Then a search for that former organization path across tracked non-archival documents returns zero matches, where it returned at least one before the sweep
    And the current organization path appears in its place

  @unit
  Scenario: The v2 migration is filed as an idea, not a backlog plan
    Given plans/ideas/ is organized into Eisenhower quadrant subfolders and already holds two harness-related briefs
    When the OpenCode v2 brief is filed
    Then a single new file exists under a plans/ideas/ quadrant subfolder and no new folder exists under plans/backlog/
    And plans/ideas/README.md lists the new brief in the same quadrant section as the file's location
```

### US-8 — Every binding file has exactly one declared owner

> As P1, I want every tracked file under every binding directory to fall into exactly one declared
> class — generated, vendored, or source — so that nothing can sit in a binding directory unowned and
> unnoticed the way `.opencode/skills/` did for months.

**Acceptance criteria:**

```gherkin
@binding-ownership
Feature: Total ownership of binding files

  @unit
  Scenario: An unclassified file under a binding directory fails the validator
    Given every tracked file under the three surviving harnesses' binding directories is declared generated, vendored, or source
    When a file with no declared class is introduced under a binding directory
    Then rhino-cli harness ownership validate exits non-zero naming that exact file as unclassified
    And it exits 0 once the file is removed or declared, proving the check is falsifiable in both directions rather than always-green

  @unit
  Scenario: A generated file must reproduce byte-for-byte
    Given .opencode/agents/, .codex/agents/, and the emitter-owned subdirectories of .agents/skills/ are declared generated
    When rhino-cli harness bindings generate runs and one emitted file is then hand-edited
    Then rhino-cli harness ownership validate exits non-zero naming the drifted generated file
    And it exits 0 after regeneration restores the canonical bytes

  @integration
  Scenario: A regeneration run leaves every vendored file byte-identical
    Given 24 vendored files across eight .agents/skills/ plugin directories, plus .codex/ci-monitor-subagent.toml and .opencode/opencode.json, are declared vendored with a recorded reason and a recorded SHA-256
    When rhino-cli harness bindings generate runs twice and the hashes are recaptured
    Then every recorded hash matches its baseline byte-for-byte
    And the vendored file count is unchanged, so neither a rewrite-in-place nor a deletion occurred

  @unit
  Scenario: A source file is never written by the emitter
    Given .claude/, AGENTS.md, and CLAUDE.md are declared source
    When rhino-cli harness bindings generate runs
    Then git diff --quiet over all declared source paths exits 0
    And the emitter refuses a write targeting a source path rather than silently succeeding

  @unit
  Scenario: A partially-owned config file is guarded only within its generated region
    Given .codex/config.toml is declared vendored with a delimited generated region, since its mcp_servers, features, and ci-monitor-subagent tables are tooling-maintained
    When an edit is made inside the markers and then an equivalent edit is made outside them
    Then rhino-cli harness ownership validate exits non-zero for the edit inside the markers
    And it exits 0 for the edit outside them, proving the ownership boundary is enforced rather than declared

  @unit
  Scenario: There is no fourth class and no undeclared reason
    Given the three legal classes are generated, vendored, and source
    When a registry entry declares a fourth class value, or declares vendored without a reason
    Then rhino-cli repo-config validate exits non-zero in both cases
    And it exits 0 for a vendored entry carrying a non-empty reason, so the reason field cannot be omitted silently
```

### US-9 — Divergence is triaged by content, and promotion is human-reviewed

> As P2, I want a hand edit made inside a mirror to be detected and offered for promotion back into
> canonical source, so that work done in whichever harness I happen to be using is not silently lost —
> and I want that promotion to show me what it would cost before anything is written.

**Acceptance criteria:**

```gherkin
@sync-triage
Feature: Divergence triage and reviewed promotion

  @unit
  Scenario: An in-sync tree reports no divergence
    Given every generated mirror matches what the generator produces from canonical source
    When rhino-cli harness sync triage runs
    Then it exits 0 reporting zero divergences
    And it reads no file modification times, so the result is unchanged in a fresh clone where every mtime is checkout time

  @unit
  Scenario: One-sided divergence is detected and promotion is offered
    Given a tree that reported zero divergences and then had exactly one generated mirror hand-edited
    When rhino-cli harness sync triage runs
    Then it exits non-zero naming that mirror as the hand-edited side and naming the promote command
    And it exits 0 again once the mirror is restored, so the detection is falsifiable in both directions

  @unit
  Scenario: Divergence on both sides is a hard stop with no automatic resolution
    Given a canonical source file and its corresponding generated mirror have both been hand-edited
    When rhino-cli harness sync triage runs
    Then it exits non-zero naming both files
    And it offers neither promotion nor any automatic resolution, because no correct automatic answer exists
    And it exits 0 once both files are restored

  @unit
  Scenario: Promotion emits a reviewable diff and never writes canonical source
    Given a generated OpenCode mirror carries a hand edit worth keeping
    When rhino-cli harness sync promote runs against that mirror
    Then a proposed unified diff against the canonical source is emitted
    And git diff --quiet over the canonical source exits 0 afterwards, proving nothing was overwritten, and exits non-zero only once a human applies the diff

  @unit
  Scenario: Promotion lists the canonical fields at risk of loss
    Given a canonical agent carries permissionMode and isolation, which the editing harness's schema cannot represent
    When rhino-cli harness sync promote runs against that harness's mirror
    Then the output lists both fields under an at-risk heading before any diff is applied
    And promoting an agent whose canonical source carries neither field lists nothing, proving the set is computed from the field policy rather than hardcoded

  @unit
  Scenario: Vendored files are excluded from triage entirely
    Given .agents/skills/ holds both generated mirror directories and declared vendored plugin directories
    When one vendored file and one generated file are each hand-edited and rhino-cli harness sync triage runs
    Then the generated file is reported as diverged
    And the vendored file produces no finding at all, because the generator does not own it and it is never promotable

  @unit
  Scenario: The default failure behaviour is unchanged and points at the new path
    Given generation remains one-way and promotion is opt-in
    When a generated mirror is hand-edited and rhino-cli harness bindings validate runs without triage
    Then it exits non-zero exactly as it did before triage existed
    And its message names both the canonical file to edit and the harness sync promote command as an alternative
```

### US-10 — Cross-repo parity never breaks mid-plan

> As P1, I want the plan's `apps/rhino-cli/**` changes to land in both parity repositories together
> as a single paired merge, so that the nightly parity audit never goes red because of this plan.

**Acceptance criteria:**

```gherkin
@cross-repo-parity
Feature: rhino-cli changes land as one paired cross-repo merge

  @integration
  Scenario: The whole plan lands as exactly two PRs merged together
    Given apps/rhino-cli/parity-manifest.sha256 currently holds 579 entries and is identical in both parity repositories
    When the plan reaches its terminal merge
    Then exactly one ose-public PR and exactly one private-sibling PR exist on branch worktree/update-harness-support, where the default per-boundary rule would have produced three PRs per repository
    And both are merged in the same session
    And rhino-cli parity manifest validate exits 0 in both repositories, where merging only one side would make the nightly parity audit diff exit non-zero
```

## Product Scope

### In scope

- The `harness:` registry in `repo-config.yml`, extended with catalog fields, the `.agents/skills`
  mirror target, and the vendored-subdirectory declaration.
- The rhino-cli harness command family: `bindings generate`, `bindings validate`, `duplication
validate`, `sync validate`, `claude validate`, `audit`, plus new `catalog` and `ownership` nouns and
  the `sync triage` / `sync promote` capabilities.
- Binding directories: `.claude/` (unchanged as source), `.opencode/agents/` (unchanged as
  generated), `.codex/` (raised to generated), `.agents/skills/` (new generated real-file mirror with
  declared vendored exclusions), and the removal of `.cursor/`, `.amazonq/`, `.pi/`,
  `.opencode/skills/`, `.opencode/commands/`.
- `docs/reference/platform-bindings.md`, converted to a generated document.
- Word-budget surface and trigger configuration in `repo-config.yml`.
- The `gates:` registry entries for `harness-bindings`, `governance-word-budget`,
  `governance-readme-completeness`, and a new catalog gate.
- Gherkin features under `specs/apps/rhino/behavior/rhino-cli/gherkin/`.
- Governance prose under `repo-governance/`, `docs/reference/`, `.claude/agents/`, `.claude/skills/`,
  `AGENTS.md`, and `CLAUDE.md` that describes the harness set.

### Out of scope

- Everything listed under `README.md` §Out of scope, notably the OpenCode v2 migration, the newly
  available Claude Code surfaces (`.claude/rules/`, the 29-event hook set, merged Skills/commands),
  and the `apps/` "cursor" false positives.
- Post-mortems and archived plans that record dropped-harness history. These are historical records
  and keep their references verbatim.
- The `vendor_audit.rs` forbidden-token table. See `tech-docs.md` DD-3.

## Product Risks

| Risk                                                                                                            | Mitigation                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The `.agents/skills/` emitter clobbers the 24 vendored plugin files it did not create and cannot regenerate     | DD-7 declares the 8 vendored directories in the registry rather than inferring ownership; US-4b requires a byte-identical SHA-256 comparison across a double regeneration run                                                       |
| OpenCode users lose Nx skill access when `.opencode/skills/` is deleted                                         | Accepted, not mitigated. DD-8 records it as a deliberate capability loss with the caveat stated plainly; remedy is deliberate restoration or `.claude/`-sourced equivalents                                                         |
| Prettier reformats the ~545 emitted mirror files and breaks the byte-equality guard                             | Phase 6 measures the generate → format → validate round trip before wiring the guard, and adds `.agents/` to `.prettierignore` only if measurement shows drift                                                                      |
| A generated 93-file `.codex/agents/` tree trips a gate nobody anticipated (README index, word budget, Prettier) | Phase 5's gate runs the full pre-push suite, not just the harness gates; the `.cursor/agents/` 93-file precedent is the sizing reference                                                                                            |
| The catalog generator's output is not Prettier-stable, breaking byte-equality on the next commit                | Phase 10 measures the round trip explicitly before wiring the guard; `.amazonq/` in `.prettierignore` is the documented precedent                                                                                                   |
| No automated external-drift detection ships, so a vendor change goes unnoticed until someone looks              | Accepted by decision (`tech-docs.md` DD-11). Mitigated structurally: eleven declared harnesses become three, cutting the tracked upstream surface by roughly two thirds, and the compatibility workflow remains available on demand |
| A promote silently drops canonical fields the editing harness cannot represent, losing data                     | Impossible by construction (`tech-docs.md` DD-13): promote never writes canonical source, emits a reviewable diff, and lists the at-risk fields computed from the field policy                                                      |
| Detection scripts return false zeros and a sweep reads as complete when it is not                               | Every sweep clause states its pre-change count as well as its post-change count; ugrep, wrapped-checklist, and marker-first traps are named in `tech-docs.md` §Detection Traps                                                      |

## Related

- [brd.md](./brd.md) — the business goals these requirements serve
- [tech-docs.md](./tech-docs.md) — the design decisions and file-impact analysis
- [delivery.md](./delivery.md) — the phased execution checklist
- [Acceptance Criteria Convention](../../../repo-governance/development/infra/acceptance-criteria.md) —
  the Step-Keyword Cardinality rule every scenario above obeys
