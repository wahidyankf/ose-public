# Claude Code Agents

This directory contains specialized AI agents for the open-sharia-enterprise project. These agents are organized by role and follow the Maker-Checker-Fixer pattern where applicable.

## Agent Organization

### 🟦 Content Creation (Makers)

- **docs-maker** - Expert documentation writer
- **docs-tutorial-maker** - Tutorial creation specialist
- **readme-maker** - README file writer
- **apps-ayokoding-web-general-maker** - General content for AyoKoding
- **apps-ayokoding-web-by-example-maker** - By-example tutorials
- **apps-ayokoding-web-in-the-field-maker** - In-the-field tutorials for AyoKoding
- **apps-oseplatform-web-content-maker** - OSE Platform content
- **plan-maker** - Project plan creation
- **repo-governance-maker** - Governance document creation
- **repo-workflow-maker** - Workflow documentation
- **specs-maker** - Spec area scaffolding and feature file creation
- **social-linkedin-post-maker** - LinkedIn content creation
- **agent-maker** - Agent definition creation

### 🟩 Validation (Checkers)

- **docs-checker** - Factual accuracy validation
- **docs-tutorial-checker** - Tutorial quality validation
- **docs-link-general-checker** - Link validity checking
- **docs-software-engineering-separation-checker** - Programming language docs separation validation
- **readme-checker** - README quality validation
- **apps-ayokoding-web-general-checker** - General content validation
- **apps-ayokoding-web-by-example-checker** - By-example validation
- **apps-ayokoding-web-in-the-field-checker** - In-the-field content validation
- **apps-ayokoding-web-facts-checker** - Factual accuracy for AyoKoding
- **apps-ayokoding-web-link-checker** - Link validation for AyoKoding
- **apps-oseplatform-web-content-checker** - OSE content validation
- **plan-checker** - Project plan validation
- **plan-execution-checker** - Plan execution validation
- **repo-governance-checker** - Governance compliance validation
- **repo-workflow-checker** - Workflow documentation validation
- **specs-checker** - Gherkin/BDD specs directory structural and content validation
- **swe-code-checker** - Validates projects against platform coding standards (validates application code rather than documentation)

### 🟨 Fixing (Fixers)

- **docs-file-manager** - File organization and management
- **docs-fixer** - Apply validated documentation fixes
- **docs-tutorial-fixer** - Apply tutorial fixes
- **docs-software-engineering-separation-fixer** - Fix programming language docs separation issues
- **readme-fixer** - Apply README fixes
- **apps-ayokoding-web-general-fixer** - Apply general content fixes
- **apps-ayokoding-web-by-example-fixer** - Apply by-example fixes
- **apps-ayokoding-web-in-the-field-fixer** - Fix in-the-field content issues
- **apps-ayokoding-web-facts-fixer** - Apply factual corrections
- **apps-ayokoding-web-link-fixer** - Fix broken links
- **apps-oseplatform-web-content-fixer** - Fix OSE content issues
- **plan-fixer** - Apply plan fixes
- **repo-governance-fixer** - Fix governance compliance issues
- **repo-workflow-fixer** - Fix workflow documentation
- **specs-fixer** - Fix specs structural and accuracy issues

### 🟪 Operations

- **apps-ayokoding-web-deployer** - AyoKoding deployment (Next.js via Vercel)
- **apps-oseplatform-web-deployer** - OSE Platform deployment
- **apps-organiclever-web-deployer** - organiclever-web deployment
- **plan-executor** - Execute project plans

### 💻 Development

- **swe-clojure-developer** - Clojure application development
- **swe-csharp-developer** - C# application development
- **swe-dart-developer** - Dart application development
- **swe-e2e-test-developer** - E2E testing with Playwright
- **swe-elixir-developer** - Elixir application development
- **swe-fsharp-developer** - F# application development
- **swe-golang-developer** - Go application development
- **swe-hugo-developer** - Hugo site development (oseplatform-web)
- **swe-java-developer** - Java application development
- **swe-kotlin-developer** - Kotlin application development
- **swe-python-developer** - Python application development
- **swe-rust-developer** - Rust application development
- **swe-typescript-developer** - TypeScript application development

## Agent Format (Claude Code)

Agents use YAML frontmatter with the following structure:

```yaml
---
name: agent-name
description: Expert in X specializing in Y. Use when Z.
tools: Read, Glob, Grep
model: inherit
color: blue
skills: []
---
```

**Name**: Required field - unique identifier using lowercase letters and hyphens
**Description**: Required field - when Claude should delegate to this agent
**Tools**: Comma-separated string with capitalized tool names (only tools the agent needs)
**Model**: Required field - use `inherit` (default), `haiku`, `sonnet`, or `opus`
**Color**: Required field - `blue` (makers), `green` (checkers), `yellow` (fixers), `purple` (implementors)
**Skills**: Required field - list of Skill names (empty array `[]` if no Skills used)

Note: Frontmatter MUST NOT contain YAML inline comments (# symbols). Put explanations in the document body.

## Maker-Checker-Fixer Pattern

Three-stage quality workflow:

1. **Maker** (🟦 Blue) - Creates content
2. **Checker** (🟩 Green) - Validates content, generates audit reports
3. **Fixer** (🟨 Yellow) - Applies validated fixes

**Criticality Levels**: CRITICAL, HIGH, MEDIUM, LOW
**Confidence Levels**: HIGH, MEDIUM, FALSE_POSITIVE

## Dual-Mode Operation

**Source of Truth**: This directory (`.claude/agents/`) is the PRIMARY source.
**Sync Target**: Changes are synced to `.opencode/agent/` (SECONDARY) via automation.

**Making Changes**:

1. Edit agents in `.claude/agents/` directory
2. Run: `npm run sync:claude-to-opencode` (powered by `rhino-cli` for fast syncing)
3. Both systems stay synchronized

**Implementation**: Sync powered by `rhino-cli agents sync` (~121ms, 25-60x faster than bash)

**See**: [CLAUDE.md](../../CLAUDE.md) for complete guidance, [AGENTS.md](../../AGENTS.md) for OpenCode documentation, [apps/rhino-cli/README.md](../../apps/rhino-cli/README.md) for rhino-cli details

## Skills Integration

Agents leverage skills from `.claude/skills/` for progressive knowledge delivery. Skills are NOT agents - they provide reusable knowledge and execution services to agents.

**See**: [.claude/skills/README.md](../skills/README.md) for complete skills catalog

## Governance Standards

All agents follow governance principles:

- **Documentation First** - Documentation is mandatory, not optional
- **Explicit Over Implicit** - Clear tool permissions, no magic
- **Simplicity Over Complexity** - Single-purpose agents, minimal abstraction
- **Accessibility First** - WCAG AA compliance in all outputs

**See**: [governance/principles/README.md](../../governance/principles/README.md)

---

**Last Updated**: 2026-03-24
