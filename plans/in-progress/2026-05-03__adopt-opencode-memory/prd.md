# Product Requirements Document (PRD)

## What Gets Built

### Product Overview

This plan delivers two tools for the OpenCode IDE in the `ose-public` repository:

1. **caveman** (primary) — token compression tool that reduces agent communication overhead by ~75%
2. **cavemem** (secondary, deferred) — cross-agent persistent memory; evaluation only, may defer if too early stage

### Personas

- **Maintainer** (single hat): Wahidyan Kresna Fridayoka
- **Consuming agents**: `plan-checker` (validates Gherkin), `plan-execution-checker` (validates completion)

### User Stories

#### Primary — caveman (NOT YET INSTALLED for OpenCode)

```gherkin
Feature: Token Compression in OpenCode
  As a maintainer using OpenCode
  I want to compress agent communication
  So I can reduce token costs by ~75% while preserving technical accuracy

  Scenario: caveman command available in OpenCode session
    Given I have an active OpenCode session
    When I type "/caveman" in the chat
    Then the caveman help text is returned
    And available modes (lite/full/ultra/wenyan) are listed

  Scenario: Compression preserves code and technical content byte-for-byte
    Given I have an active OpenCode session with caveman enabled
    When I send a message containing code, URLs, or file paths
    Then all code, URLs, and file paths are preserved exactly
    And no technical content is altered or truncated

  Scenario: Token savings are measurable
    Given I have run a baseline session without caveman
    When I run a comparable session with caveman enabled
    Then the token usage shows ~75% reduction
    And the savings are visible via "caveman-stats"

  Scenario: Different compression modes available
    Given I have an active OpenCode session
    When I invoke "/caveman lite" or "/caveman full" or "/caveman ultra" modes
    Then the compression level matches the requested mode
    And output verbosity scales appropriately

  Scenario: Terse commit messages via caveman-commit
    Given I have staged changes in git
    When I use "/caveman-commit" to generate a commit message
    Then the message follows caveman terse grammar
    And the commit is valid according to conventional commits format
```

#### Secondary — cavemem (INSTALLED as OpenCode MCP server)

```gherkin
Feature: Cross-Agent Memory in OpenCode
  As a maintainer using OpenCode and Claude Code
  I want persistent memory accessible from both IDEs
  So I don't re-explain context in every session

  Scenario: Memory search returns cross-session context
    Given I have stored observations in cavemem from Claude Code
    When I search from OpenCode with a relevant query
    Then relevant observations from the shared store are returned
    And the SQLite + FTS5 index is accessible

  Scenario: Timeline view of observations
    Given I have stored multiple observations over time
    When I invoke the timeline tool
    Then observations are returned in chronological order
    And relevant context is quickly retrievable

  Scenario: Cross-agent vector search
    Given cavemem vector index is enabled
    When I search for semantic similarity
    Then relevant observations are returned based on meaning
    And not just keyword matching
```

### Acceptance Criteria in Gherkin

All scenarios above are the acceptance criteria. For a complete list, see the [User Stories](#user-stories) section.

### Product Scope

**In-scope**:

- Install and configure caveman for OpenCode in `ose-public`
- Configure compression level (lite/full/ultra)
- Verify token savings via `caveman-stats`
- Document usage in AGENTS.md and CLAUDE.md
- Evaluate cavemem for cross-agent memory (defer if too early stage)

**Out-of-scope**:

- Installing caveman for Claude Code (separate plan/issue)
- claude-mem (AGPL-3.0 license incompatibility)
- Cloud memory services (supermemory Pro, mem0 free tier limited)
- cavekit (different purpose — spec-driven build)

### Product-Level Risks

| Risk                                                             | Mitigation                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| cavemem v0.1.3 is very early stage                               | Defer evaluation; focus on caveman first                   |
| OpenCode caveman integration may differ from documented behavior | Verify during installation; report issues upstream         |
| Token savings may vary by session type                           | Baseline multiple session types; measure average reduction |
