# Requirements — Remove Obsidian Compatibility from Docs

This document captures the user stories and acceptance criteria (Gherkin format) for removing Obsidian compatibility from the `docs/` directory, related conventions, and agent/skill definitions.

## Stakeholders

- **Primary**: Repository maintainers who author and edit `docs/`, `governance/`, and `.claude/` content.
- **Secondary**: AI agents (`docs-maker`, `docs-file-manager`, `docs-link-general-checker`) that read and write docs.
- **Tertiary**: Contributors browsing `docs/` via GitHub web, VS Code, or any modern markdown viewer.

## User Stories

### US-1: Remove Obsidian vault config

**As a** repository maintainer,
**I want** the `docs/.obsidian/` directory and its `.gitignore` entries removed,
**so that** the repo no longer carries dead configuration for an authoring tool nobody uses.

#### Acceptance criteria

```gherkin
Feature: Obsidian vault config is removed
  Scenario: Vault directory is deleted
    Given the repository at the current main branch
    When I run "find docs -name .obsidian"
    Then no results are returned

  Scenario: .gitignore no longer references Obsidian artifacts
    Given the current .gitignore file
    When I grep for "obsidian", ".trash", or "smart-connections"
    Then zero matches are found

  Scenario: No Obsidian JSON files remain tracked
    Given the repository at the current main branch
    When I run "git ls-files docs/.obsidian"
    Then no files are listed
```

### US-2: Rename prefixed docs files to GitHub-compatible kebab-case

**As a** repository maintainer,
**I want** every prefixed filename in `docs/` renamed to plain kebab-case that is standard markdown and GitHub-compatible, while preserving git history,
**so that** filenames carry semantic meaning, render correctly as GitHub URLs on any platform, and survive case-sensitive filesystems.

#### Acceptance criteria

```gherkin
Feature: Docs files use GitHub-compatible kebab-case naming
  Scenario: No prefix-pattern filenames remain
    Given the docs/ directory after the rename
    When I run "find docs -type f -name '*__*.md'"
    Then zero results are returned

  Scenario: README files are preserved
    Given the docs/ directory after the rename
    When I enumerate index files per subdirectory
    Then every directory that had a README.md before the rename still has one
    And no README.md was renamed

  Scenario: docs/metadata/ is untouched
    Given the docs/metadata/ directory before the rename
    When I compare its contents after the rename
    Then every file in docs/metadata/ has the same name as before

  Scenario: Git history is preserved for renamed files
    Given a sampled file like docs/explanation/software-engineering/architecture/c4-architecture-model/tooling-standards.md
    When I run "git log --follow" on the new path
    Then commits from before the rename appear in the log

  Scenario: No collisions inside a directory after prefix removal
    Given the prefix-removal mapping
    When I group new filenames by their parent directory
    Then no directory contains two files with the same new name

  Scenario: Filenames use lowercase kebab-case only
    Given every renamed file
    When I match each basename against "^[a-z0-9-]+\.[a-z]+$"
    Then every basename matches

  Scenario: Filenames contain only GitHub-safe characters
    Given every renamed file
    When I inspect each basename
    Then it contains no spaces, uppercase letters, or any of these characters: ":" "?" "*" "<" ">" "|" "\"" backslash
    And it contains only ASCII printable characters
    And it does not start or end with a hyphen

  Scenario: Filenames are case-sensitive-safe
    Given the docs/ directory after the rename
    When I list all filenames and lowercase-compare them pairwise within each directory
    Then no two files in the same directory differ only by case
```

### US-3: Update all internal links to renamed files

**As a** contributor following cross-references,
**I want** every link in the repository that pointed at an old prefixed filename updated to the new filename using standard GitHub-compatible markdown link syntax,
**so that** browsing the documentation does not produce 404s on GitHub web or any markdown viewer.

#### Acceptance criteria

```gherkin
Feature: All internal links resolve after rename using GitHub-compatible syntax
  Scenario: No references to old prefixed filenames remain
    Given the repository after the rename and link-update phases
    When I run "ripgrep '__[a-z0-9-]+\.md'" over tracked markdown files
    Then only matches inside plans/done/, apps/oseplatform-web/content/updates/, and other explicitly allowed historical files remain

  Scenario: Markdown lint passes
    Given the repository after the link updates
    When I run "npm run lint:md"
    Then the command exits with status 0

  Scenario: CLAUDE.md cross-links resolve
    Given the CLAUDE.md file
    When I follow every relative markdown link in it
    Then every target file exists at the linked path

  Scenario: Governance index pages link to renamed convention files
    Given governance/conventions/README.md
    When I follow every link
    Then every target file exists

  Scenario: ayokoding-cli link checker passes for docs/ (if applicable)
    Given a link checker run is applicable to docs/
    And the ayokoding-cli supports link checking for docs/
    When the checker is run scoped to docs/
    Then zero broken internal links are reported

  Scenario: All rewritten links use standard GitHub-compatible markdown syntax
    Given every internal link rewritten by this plan
    When I inspect its syntax
    Then it uses the form "[Display Text](./relative/path.md)" or "[Display Text](../relative/path.md)"
    And it includes the ".md" extension for docs links
    And it does not use wiki-link syntax "[[...]]"
    And it does not use absolute filesystem paths
```

### US-4: Rewrite the File Naming Convention on a markdown + GitHub basis

**As a** contributor learning how to name new files,
**I want** `governance/conventions/structure/file-naming.md` rewritten with **standard markdown + GitHub compatibility** as its explicit rationale,
**so that** the rule is justified by where the files are actually rendered (GitHub web, standard markdown viewers) rather than by tools the project no longer uses.

#### Acceptance criteria

```gherkin
Feature: File Naming Convention anchors on standard markdown + GitHub compatibility
  Scenario: Convention does not mention Obsidian
    Given the rewritten file-naming.md
    When I grep for "obsidian", "vault", "wiki link"
    Then zero matches are found

  Scenario: Convention does not prescribe prefix encoding
    Given the rewritten file-naming.md
    When I grep for "hierarchical-prefix", "ex-go-", "ex-soen-", "subdirectory code"
    Then zero matches are found

  Scenario: Convention explicitly states its rationale
    Given the rewritten file-naming.md
    When I read the rationale section
    Then it cites "standard markdown" and "GitHub" as the compatibility targets
    And it does not cite any other authoring tool as a compatibility target

  Scenario: Convention prescribes GitHub-safe character set
    Given the rewritten file-naming.md
    When I read the naming rules
    Then it requires lowercase ASCII letters, digits, and hyphens only
    And it forbids spaces, uppercase, and the characters ":" "?" "*" "<" ">" "|" "\"" backslash
    And it requires filenames to be case-insensitive-unique within a directory (to survive macOS/Windows case-insensitive filesystems)

  Scenario: Convention retains README and metadata exemptions
    Given the rewritten file-naming.md
    When I read the Special Cases section
    Then README.md is documented as the index-file exception with GitHub auto-rendering as the reason
    And docs/metadata/ is documented as the operational-file exemption

  Scenario: Convention is concise
    Given the rewritten file-naming.md
    When I count its lines
    Then the total is at most 120 lines

  Scenario: Dependent docs no longer cite the prefix scheme
    Given governance/conventions/README.md and docs/README.md
    When I grep each for "prefix", "ex-go-", "hoto__", "tu__", "re__", "ex__"
    Then zero matches are found
```

### US-4b: Refresh the Linking Convention on the same basis

**As a** contributor writing cross-references,
**I want** `governance/conventions/formatting/linking.md` rewritten so its rationale is **standard markdown + GitHub compatibility** (not cross-compat with Obsidian or any other tool),
**so that** the linking rules are justified by the platforms where links are actually followed.

#### Acceptance criteria

```gherkin
Feature: Linking Convention anchors on standard markdown + GitHub compatibility
  Scenario: Convention does not cross-reference Obsidian
    Given the rewritten linking.md
    When I grep for "obsidian"
    Then zero matches are found

  Scenario: Convention explicitly states its rationale
    Given the opening section of linking.md
    When I read the "Why" paragraph
    Then it cites "standard markdown" and "GitHub" compatibility as the sole rationale
    And it does not frame the rules as cross-compat across multiple authoring tools

  Scenario: Convention requires the .md extension for docs links
    Given the link syntax rules in linking.md
    When I read the required format
    Then "[Display Text](./relative/path.md)" is the required pattern
    And the ".md" extension is explicitly mandatory for internal docs links

  Scenario: Convention requires relative paths only
    Given the link syntax rules in linking.md
    When I read the path rules
    Then relative paths are required
    And absolute filesystem paths are explicitly forbidden

  Scenario: Convention requires descriptive link text
    Given the link syntax rules in linking.md
    When I read the link-text rules
    Then descriptive text (not filenames or cryptic identifiers) is required

  Scenario: Convention rejects wiki-link syntax on GitHub-rendering grounds
    Given the rejected-syntax section of linking.md
    When I read the justification for rejecting "[[...]]"
    Then the stated reason is that GitHub does not render it
    And the stated reason does not mention Obsidian

  Scenario: Convention prescribes GitHub kebab-case anchor slugs
    Given the anchor-link rules in linking.md
    When I read the syntax for deep links
    Then anchors use GitHub's kebab-case heading slug format (e.g., "#section-heading")
```

### US-5: Scrub Obsidian references from governance, agents, and skills

**As a** contributor reading the repository's rulebook,
**I want** Obsidian-specific callouts, anti-patterns, and cross-platform compatibility notes removed from active governance, agents, and skills,
**so that** the rulebook does not reference tools the project no longer uses.

#### Acceptance criteria

```gherkin
Feature: No Obsidian references in active repository content
  Scenario: Governance files are Obsidian-free
    Given the governance/ directory
    When I run "ripgrep -i obsidian governance/"
    Then zero matches are found

  Scenario: .claude agents and skills are Obsidian-free
    Given the .claude/agents/ and .claude/skills/ directories
    When I run "ripgrep -i obsidian" over both directories
    Then zero matches are found

  Scenario: TAB-for-Obsidian rule is removed
    Given governance/conventions/writing/conventions.md
    When I read the bullet-indentation rule
    Then it no longer states "for Obsidian compatibility"

  Scenario: YAML-quoting justification is Obsidian-free
    Given governance/workflows/meta/workflow-identifier.md
    When I read the YAML Syntax Requirements section
    Then it cites YAML parsers generally, not Obsidian specifically

  Scenario: docs-validating-links no longer classifies wiki links as an error
    Given .claude/skills/docs-validating-links/SKILL.md
    When I read the error classification list
    Then the "Obsidian wiki links" error class is not present

  Scenario: docs-maker and docs-file-manager no longer warn about wiki links
    Given .claude/agents/docs-maker.md and .claude/agents/docs-file-manager.md
    When I grep each for "[[" or "wiki link"
    Then zero matches are found

  Scenario: docs/README.md no longer recommends Obsidian
    Given docs/README.md
    When I read the top of the file
    Then no sentence recommends opening docs/ as an Obsidian vault
```

### US-6: Preserve historical records

**As a** contributor researching past decisions,
**I want** historical plans and published update posts that reference Obsidian left untouched,
**so that** the historical record remains accurate to the state of the repo at the time of writing.

#### Acceptance criteria

```gherkin
Feature: Historical content is preserved verbatim
  Scenario: plans/done/ is not modified
    Given the plans/done/ directory before the plan starts
    When I diff plans/done/ after the plan's execution
    Then zero files differ

  Scenario: Published update posts are not modified
    Given apps/oseplatform-web/content/updates/2025-12-14-phase-0-week-4-initial-commit.md
    When I diff the file after the plan's execution
    Then the file is unchanged
```

### US-7: Remove rhino-cli docs naming validator

**As a** repository maintainer,
**I want** the `rhino-cli docs validate-naming` command and its prefix-enforcement Go code deleted,
**so that** the pre-push hook does not fail on unprefixed filenames and the CLI no longer enforces an obsolete convention.

#### Acceptance criteria

```gherkin
Feature: rhino-cli docs validate-naming is removed
  Scenario: The validate-naming cmd files are deleted
    Given the apps/rhino-cli/cmd/ directory
    When I list files matching "docs_validate_naming*"
    Then zero results are returned

  Scenario: The prefix-enforcement internal files are deleted
    Given the apps/rhino-cli/internal/docs/ directory
    When I list files matching one of "prefix_rules*", "validator*", "fixer*", "scanner*", "reporter*", "link_updater*"
    Then zero results are returned

  Scenario: The docs parent command no longer registers validate-naming
    Given the apps/rhino-cli/cmd/docs.go file
    When I read its subcommand registrations
    Then "validate-naming" is not registered
    And "validate-links" is still registered

  Scenario: The links_* files are preserved
    Given the apps/rhino-cli/internal/docs/ directory
    When I list files matching "links_*"
    Then the full family (scanner, validator, categorizer, reporter, types) is present

  Scenario: The rhino-cli README documents only the remaining commands
    Given the apps/rhino-cli/README.md
    When I grep for "validate-naming"
    Then zero matches are found

  Scenario: rhino-cli build passes after removal
    Given the post-removal state
    When I run "nx run rhino-cli:build"
    Then the build succeeds with exit status 0

  Scenario: rhino-cli tests pass after removal
    Given the post-removal state
    When I run "nx run rhino-cli:test:quick"
    Then tests pass with coverage at least 90%

  Scenario: No other code references the removed packages or types
    Given the rest of the monorepo
    When I grep Go sources for imports of the removed files or their exported symbols
    Then zero references remain

  Scenario: The Gherkin feature file for validate-naming is deleted
    Given the specs/apps/rhino/cli/gherkin/ directory
    When I list files matching "docs-validate-naming.feature"
    Then zero results are returned

  Scenario: The validate-naming step patterns const block is removed from steps_common_test.go
    Given apps/rhino-cli/cmd/steps_common_test.go
    When I grep for "stepDeveloperRunsValidateDocsNaming"
    Then zero matches are found

  Scenario: The validate-naming delegation vars are removed from testable.go
    Given apps/rhino-cli/cmd/testable.go
    When I grep for "docsValidateAllFn"
    Then zero matches are found
```

### US-8: Update all related agents, skills, conventions, and navigation docs

**As a** contributor reading any part of the repository,
**I want** every `.claude/` agent, `.claude/` skill, governance file, root navigation file (`CLAUDE.md`, `AGENTS.md`, `README.md`, `ROADMAP.md`), subproject `README.md`, and `playwright.config.ts` that referenced an old prefixed filename or explained the prefix-encoding scheme updated in lockstep,
**so that** no cross-reference points at a file that no longer exists and no document still describes a scheme the repo has abandoned.

#### Acceptance criteria

```gherkin
Feature: All related references are updated in lockstep
  Scenario: swe-programming-* skills reference the new filenames
    Given all 11 .claude/skills/swe-programming-*/SKILL.md files
    When I extract every markdown link that points into docs/explanation/software-engineering/programming-languages/
    Then every link resolves to an existing file
    And no link contains the substring "ex-soen-prla-"

  Scenario: swe-*-developer agents reference the new filenames
    Given all 12 .claude/agents/swe-*-developer.md files
    When I extract every markdown link that points into docs/explanation/software-engineering/programming-languages/
    Then every link resolves to an existing file
    And no link contains the substring "ex-soen-prla-"

  Scenario: docs-* and repo-* agents and skills reference the new filenames
    Given the full .claude/agents/docs-*.md and .claude/skills/docs-*/SKILL.md sets, plus the repo-* equivalents
    When I extract markdown links into docs/
    Then every link resolves to an existing file
    And no link contains the prefix patterns "hoto__", "tu__", "re__[a-z]", "ex-go-", "ex-soen-", "ex-ru-", "ex-wf-", "ex-de-", or "ex-co-"

  Scenario: Root navigation files are consistent
    Given CLAUDE.md, AGENTS.md, README.md, ROADMAP.md at the repo root
    When I extract every markdown link into docs/
    Then every link resolves to an existing file

  Scenario: Subproject READMEs point at the new filenames
    Given every apps/*/README.md file
    When I extract markdown links into docs/
    Then every link resolves to an existing file

  Scenario: Playwright configs point at the new filenames
    Given every apps/*/playwright.config.ts file referencing docs/ paths
    When I inspect the path strings
    Then every referenced file exists at the specified path

  Scenario: Governance docs no longer describe the prefix encoding scheme
    Given the full governance/ directory
    When I grep for "hierarchical-prefix", "subdirectory code", "ex-go-", "ex-soen-", "hoto__", or "tu__"
    Then zero matches are found outside governance/conventions/structure/plans.md (which may retain a "not applicable to plans/" note)

  Scenario: Prefix-pattern grep is clean across the repo
    Given the repository after all edits
    When I run "ripgrep '(hoto__|tu__|re__[a-z]|ex-go-|ex-soen-|ex-ru-|ex-wf-|ex-de-|ex-co-)'" excluding plans/done/, apps/ayokoding-web/content/en/learn/software-engineering/automation-tools/, local-temp/, .opencode/, and docs/metadata/external-links-status.yaml
    Then zero matches are found

  Scenario: tutorial example content is preserved as-is
    Given tutorial content files under apps/ayokoding-web/content/en/learn/software-engineering/automation-tools/sed/ and .../jq/
    When I diff these files after the plan executes
    Then zero changes occur
    Because these files contain prefix-pattern strings as intentional teaching examples, not as references
```

### US-9: Sync .claude/ to .opencode/

**As a** user of both Claude Code and OpenCode,
**I want** the OpenCode mirrors regenerated after the `.claude/` agent and skill edits,
**so that** both tool stacks see the same agent definitions.

#### Acceptance criteria

```gherkin
Feature: OpenCode mirrors reflect .claude/ updates
  Scenario: Sync script runs cleanly
    Given the updated .claude/ agents and skills
    When I run "npm run sync:claude-to-opencode"
    Then the script exits with status 0

  Scenario: Mirror files match sources
    Given the updated .claude/ files for docs-maker, docs-file-manager, and docs-validating-links
    When I inspect the corresponding .opencode/ mirror files
    Then each mirror reflects the edits made in .claude/

  Scenario: Pre-commit configuration validator passes
    Given the post-sync working tree
    When I run the pre-commit hook
    Then validation for .claude/ and .opencode/ passes
```

## Out of scope

- Migrating `docs/` to a different documentation platform (Hugo, Docusaurus, Astro, etc.).
- Restructuring the Diátaxis folder layout (`tutorials/`, `how-to/`, `reference/`, `explanation/`) — only filenames change.
- Touching `apps/ayokoding-web/` or `apps/oseplatform-web/content/` authoring conventions — those apps have their own content rules.
- Cross-repo sync to `ose-infra` — handled by the existing one-way sync workflow after this plan lands.

## Definition of Done

- All acceptance criteria across US-1 through US-9 pass.
- `git status` is clean after validation.
- Commits on `main` follow Conventional Commits and split by domain (rename / content edits / config sync).
- Plan folder is moved from `plans/in-progress/` to `plans/done/` after all validation passes and indices are updated.
