---
title: "PRD — Governance Vendor-Independence Refactor"
description: Product requirements and Gherkin acceptance criteria for the governance/ vendor-neutralization refactor.
created: 2026-05-02
---

# Product Requirements — Governance Vendor-Independence

## Personas

| Persona                                           | Description                                                                       | Primary need from this refactor                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Cassie** — Cursor user, new contributor         | Joining the project, uses Cursor as her only AI tool, never installed Claude Code | Read `AGENTS.md` + `governance/` and ship a compliant PR without translating "Claude Code"-isms |
| **Codex** — Codex CLI / Gemini CLI / Copilot user | Existing engineer in another org, brings their own preferred agent                | The repo loads agent context from `AGENTS.md` automatically; doesn't need `.claude/`            |
| **Hassan** — Human-only contributor, no AI agent  | Reads governance directly to perform a manual code review                         | Plain-prose rules with no vendor-specific jargon to decode                                      |
| **Maintainer Mira** — Repo maintainer             | Reviews PRs, owns governance evolution                                            | Automated check prevents vendor terms drifting back into `governance/`                          |
| **Claude-Code Carl** — Existing power user        | Has invested heavily in current `.claude/` setup                                  | Nothing breaks; `CLAUDE.md` still works; existing agents and skills still load                  |
| **OpenCode Olive** — Existing power user          | Uses OpenCode                                                                     | Nothing breaks; `AGENTS.md` already preferred by OpenCode; sync infrastructure intact           |
| **Primer Pat** — `ose-primer` template adopter    | Forks the template to start a new product                                         | Inherits vendor-neutral governance; can plug in their own agent stack                           |

## User Stories

### US-1: Cursor / Codex / Gemini / Copilot first-class read path

> As **Cassie**, I want my AI tool to read repository conventions from `AGENTS.md` so that I can contribute without installing Claude Code.

### US-2: Plain-prose human readability

> As **Hassan**, I want `governance/` documents to read in plain prose with no vendor-specific path or product names so that I can apply rules during code review without translating jargon.

### US-3: Vendor-term regression gate

> As **Mira**, I want a validation check that flags vendor-specific terms reappearing in `governance/` so that the vendor-neutrality property is enforced over time, not just at this snapshot.

### US-4: Existing Claude Code workflow unchanged

> As **Claude-Code Carl**, I want my existing `.claude/`-rooted workflow (CLAUDE.md, agents, skills, slash commands, settings.json) to keep working with zero behavior change so that this refactor does not cost me productivity.

### US-5: Existing OpenCode workflow unchanged

> As **OpenCode Olive**, I want OpenCode to continue auto-loading instructions and skills exactly as it does today so that this refactor does not require me to re-onboard.

### US-6: Discoverable platform-bindings catalog

> As any persona, I want a single document explaining which platform bindings exist (Claude Code, OpenCode, future Cursor/Copilot/Codex) and where their files live so that I can find or add my own without grepping the tree.

### US-7: Vocabulary mapping reference

> As a contributor migrating an existing PR, I want a vocabulary table mapping old vendor terms to new vendor-neutral terms so that I can rewrite text correctly on the first pass.

### US-8: Capability-tier model selection

> As an agent author writing a new agent, I want governance to describe model selection by capability tier (planning-grade, execution-grade, fast/light) rather than by Anthropic model names so that the same agent file can resolve to whichever vendor model the platform binding maps to.

### US-9: AGENTS.md root instruction file

> As any agent (Claude Code via symlink, OpenCode/Codex/Cursor/Gemini/Copilot natively, Aider via flag), I want a single `AGENTS.md` at repo root containing the build-test-lint quick reference and vendor-neutral conventions so that I can bootstrap context without per-tool divergence.

### US-10: Future-binding extension point

> As a future contributor adding Cursor support, I want a documented place for `.cursor/rules/*.mdc` and a documented relationship to `governance/` so that I can add a binding without mutating the neutral layer.

## Acceptance Criteria (Gherkin)

### AC-1: Vendor-term audit clean for governance prose

````gherkin
Feature: Vendor-term audit on governance prose

  Background:
    Given the repository is at the post-refactor state
    And the governance/ tree contains 157+ markdown files

  Scenario: Plain-text governance prose contains no load-bearing vendor terms
    When I run the vendor-term audit script over governance/**/*.md
    And I exclude code fences explicitly tagged ```binding-example
    And I exclude any section under a heading "Platform Binding Examples"
    Then matches for "Claude Code" must be 0
    And matches for "OpenCode" outside cross-reference links must be 0
    And matches for "Anthropic" must be 0
    And matches for "Sonnet|Opus|Haiku" used as a model selector must be 0
    And matches for "\.claude/" or "\.opencode/" used as a load-bearing path must be 0

  Scenario: Capability-tier replaces vendor model names
    When I grep governance/development/agents/ for model selection guidance
    Then results refer to capability tiers ("planning-grade", "execution-grade", "fast/light", or equivalent neutral terms)
    And specific Anthropic model names appear only inside platform-binding example blocks
````

### AC-2: AGENTS.md exists and is canonical

```gherkin
Feature: AGENTS.md as canonical root instruction file

  Scenario: AGENTS.md exists at ose-public root
    Given I am at ose-public/
    When I list root-level files
    Then "AGENTS.md" is present
    And it contains a "Build/Test/Lint Commands" section
    And it contains a "Conventions" section linking to governance/conventions/
    And it contains a "Platform Bindings" section pointing to .claude/, .opencode/, and future bindings
    And it does not duplicate governance content; it summarizes and links

  Scenario: CLAUDE.md remains discoverable for Claude Code
    Given Claude Code does not natively read AGENTS.md as of the AAIF cutover
    When Claude Code starts a session in ose-public
    Then it can still locate canonical instruction content via CLAUDE.md
    And CLAUDE.md is either a symlink to AGENTS.md OR a thin shim that @-imports AGENTS.md plus Claude-specific notes
    And the chosen shape is documented in the new governance convention
```

### AC-3: Governance vendor-independence convention exists

```gherkin
Feature: New convention codifies the separation rule

  Scenario: Convention file is present and traceable
    Given the post-refactor state
    When I read governance/conventions/structure/governance-vendor-independence.md
    Then it contains a "Principles Implemented/Respected" section linking back to Layer 1 principles
    And it specifies the prohibited vendor terms with regex patterns
    And it specifies allowed escape hatches (binding-example blocks, cross-reference links, allowlisted sections)
    And it specifies the platform-binding directory pattern (per-tool dotdir model)
    And it is registered in governance/conventions/README.md and governance/conventions/structure/README.md
```

### AC-4: Validation tooling enforces the rule

````gherkin
Feature: Vendor-term regression check

  Scenario: Checker exists and runs in CI
    Given the new convention is in place
    When I run the project's repository validation step
    Then a vendor-term audit step executes against governance/**/*.md
    And it fails the run if a non-allowlisted vendor term is detected
    And the failure message points to the new convention

  Scenario: Allowlist mechanism works
    Given an example block fenced with ```binding-example
    When the audit runs
    Then content inside that fence is exempted
    And content outside the fence is still scanned
````

### AC-5: Existing dual-mode sync intact

```gherkin
Feature: No regression in Claude Code / OpenCode dual-mode sync

  Scenario: Sync command runs cleanly
    Given the post-refactor state
    When I run "npm run sync:claude-to-opencode"
    Then the command exits 0
    And no agents under .claude/agents/ become out of sync with .opencode/agents/

  Scenario: OpenCode loads its instructions
    Given OPENCODE_DISABLE_CLAUDE_CODE=1 is set
    When OpenCode starts in ose-public
    Then it discovers AGENTS.md as the primary instruction file
    And it loads skills from .claude/skills/<name>/SKILL.md (per opencode.ai/docs/skills)
```

### AC-6: Pre-existing pre-push gates pass

```gherkin
Feature: No regression in build / lint / test / spec-coverage

  Scenario: Pre-push hook passes
    Given the worktree contains the full refactor
    When pre-push runs (typecheck + lint + test:quick + spec-coverage on affected projects)
    Then all four targets exit 0
    And markdown lint passes
    And markdown link validation passes (no broken intra-doc links)
```

### AC-7: Platform-bindings catalog exists

```gherkin
Feature: Discoverable platform-bindings catalog

  Scenario: Catalog file documents existing and future bindings
    When I open the platform-bindings reference doc (under docs/reference/ or AGENTS.md sub-section)
    Then it lists Claude Code (.claude/, CLAUDE.md), OpenCode (.opencode/, AGENTS.md priority), and reserved paths for Cursor (.cursor/), Codex CLI (AGENTS.md only), Gemini CLI (GEMINI.md or AGENTS.md), GitHub Copilot (.github/copilot-instructions.md), Aider (CONVENTIONS.md flag)
    And each row links to upstream tool documentation
    And each row states whether the binding is currently provided, planned, or unsupported
```

### AC-8: Vocabulary table is authoritative

```gherkin
Feature: Vocabulary mapping table is the single source of truth

  Scenario: Vocabulary table appears in the new convention
    When I read governance/conventions/structure/governance-vendor-independence.md
    Then it contains a "Vocabulary Map" table mapping old vendor terms to new vendor-neutral terms
    And entries cover: Claude Code → "the coding agent" / "AI agent"; OpenCode → as-needed cross-reference only; Skills → "Agent Skills"; slash commands → "agent commands"; subagents → "delegated agents"; Sonnet/Opus/Haiku → capability tier (planning-grade / execution-grade / fast); CLAUDE.md → AGENTS.md (canonical); MCP server → unchanged (cross-vendor standard)
    And every governance file refactored cites this table
```

### AC-9: Layer-0 principles untouched

```gherkin
Feature: Vision and principles do not change

  Scenario: Layer 0 and Layer 1 prose is unchanged
    Given the refactor scope
    When I diff governance/vision/ and governance/principles/ before vs after
    Then any change is limited to (a) removing literal vendor names that crept in, (b) link-target fix-ups
    And no principle is added, removed, or semantically altered
```

### AC-10: Plan archival readiness

```gherkin
Feature: Plan exits with archival evidence

  Scenario: Delivery checklist closes cleanly
    Given all delivery.md items are checked
    When I run the plan-execution-checker against the executed plan
    Then it reports zero outstanding items
    And the plan moves to plans/done/
    And the in-progress index is updated
```

## Product Risks

| Risk                                                                                                                                                       | Likelihood | Mitigation                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| AGENTS.md content diverges from CLAUDE.md over time if the `@AGENTS.md` shim import is removed or bypassed                                                 | Medium     | The shim shape is documented in the new convention; any removal triggers a convention violation flagged by `repo-rules-checker`                 |
| Phase 3 Tier A rewrite introduces broken intra-doc links that the link-checker misses (anchors, not just file paths)                                       | Medium     | Per-file link-check step in the Phase 3 refactor recipe; docs-link-checker runs at each mid-phase gate                                          |
| A future contributor treats AGENTS.md as the primary editing target and ignores the separation rule, causing governance drift                              | Low-Medium | Automated vendor-audit (`rhino-cli governance vendor-audit`) enforced in `test:quick`; convention spells out the forbidden terms                |
| Cassie persona (Cursor user) experiences `AGENTS.md` as incomplete because Platform Bindings section still has TODO markers when Phase 4 is not yet merged | Medium     | Phase 4 is a mandatory phase before plan archival; Phase 2 explicitly marks incomplete sections with TODO to make the gap visible               |
| Vocabulary rewrites change the semantic meaning of a principle or convention, violating AC-9 (Layer 0 / Layer 1 unchanged)                                 | Low        | AC-9 Gherkin scenario guards this; Phase 3.A and 3.B explicitly flag Layer 0 and Layer 1 files for "literal vendor-name removal only" treatment |

## Dependencies and Sequencing

- **No upstream blockers**. Plan can begin immediately.
- **Internal serialization**: New convention (Phase 1) MUST land before bulk vocabulary refactor (Phase 3) so that refactor cites a stable rule.
- **Validation tooling (Phase 5)** lands AFTER the bulk refactor so the first run is a green baseline; running it earlier produces noise.

## Out of Scope (re-stated for PRD readers)

- Adding new platform bindings (`.cursor/`, `.github/copilot-instructions.md`, `GEMINI.md`). Tracked as future plans; this plan only carves out the placeholders.
- Parent `ose-projects/governance/` refactor.
- `ose-primer` propagation. Follow-on plan.
- Renaming `.claude/` or `.opencode/` directory paths.
- Rewriting agent prompts within `.claude/agents/` beyond updating dead links.

## Open Questions

1. **Symlink vs shim for `CLAUDE.md`**: Symlink is simpler but breaks on Windows clones; shim with `@AGENTS.md` import duplicates a small amount but is portable. **Decision deferred to tech-docs.md**, default leaning shim for portability.
2. **Allowlist mechanism**: Per-fence-tag (` ```binding-example `), per-section heading allowlist, or both? **Decision deferred to tech-docs.md**, default leaning per-fence-tag for granularity.
3. **Validation tooling location**: Extend `repo-rules-checker`, add a new `rhino-cli` subcommand, or write a standalone shell script? **Decision deferred to tech-docs.md**, default leaning `rhino-cli` subcommand for consistency with existing repo-management CLI tooling.
