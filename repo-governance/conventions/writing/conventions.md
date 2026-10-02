---
description: Meta-convention defining how to write and organize convention documents in the conventions/ directory
when_to_use: Use when writing, restructuring, or reviewing a convention document under repo-governance/conventions/.
---

# Convention Writing Convention

This meta-convention defines how to write convention documents in the `repo-governance/conventions/` directory. It ensures consistency, clarity, and completeness across all convention documentation.

## Contents

- [Purpose, Principles, and Scope](./conventions/purpose-principles-and-scope.md) — why this meta-convention exists, the principles it implements, and the conventions/ vs. development/ scope boundary.
- [Convention Document Structure — Required Sections](./conventions/document-structure-required-sections.md) — the mandatory frontmatter, introduction, Principles, Purpose, Scope, and Standards sections.
- [Convention Document Structure — Recommended and Optional Sections](./conventions/document-structure-recommended-and-optional-sections.md) — Examples, Comparison Tables, Special Considerations, Tools and Automation, References, and the optional sections.
- [Quality Checklist](./conventions/quality-checklist.md) — completeness, clarity, usability, compliance, integration, and accessibility checks before publishing.
- [Creation Criteria and Length Guidelines](./conventions/creation-criteria-and-length-guidelines.md) — when to create, update, or merge a convention, and expected document length ranges.
- [Naming, Maintenance, and Example Conventions](./conventions/naming-maintenance-and-example-conventions.md) — file/title naming pattern, review and deprecation process, and exemplary conventions.
- [Examples and Common Mistakes](./conventions/examples-and-common-mistakes.md) — a full good-vs-bad worked example plus a table of common authoring mistakes.

## Integration with Agents and References

### Integration with Agents

Conventions are most effective when enforced or assisted by agents:

#### Agents That Create Conventions

- **docs-maker** - Creates convention documents following this meta-convention
- **rules-maker** - Propagates convention changes across repository

#### Agents That Use Conventions

- **docs-checker** - Validates documentation follows conventions
- **docs-link-checker** - Enforces linking convention
- **content-checker** - Validates general ayokoding-web content conventions
- **tutorial-by-example-checker** - Validates by-example tutorial conventions
- **rules-checker** - Audits convention compliance

#### Agent Integration Checklist

When creating a convention:

- [ ] Identify which agents should reference this convention
- [ ] Update agent prompts if needed to reference new convention
- [ ] Add convention to agent's "References" section
- [ ] Test that agents correctly apply the convention

### References

**Related Meta-Documentation:**

- [Content Quality Principles](./quality.md) — Universal quality standards for all markdown content
- [Diátaxis Framework](../structure/diataxis-framework.md) — Four-category documentation organization framework

**File Conventions:**

- [File Naming Convention](../structure/file-naming.md) — Kebab-case file naming rules
- [Linking Convention](../formatting/linking.md) — How to link between documentation files

**Development Practices:**

- [AI Agents Convention](../../development/agents/ai-agents.md) — How to create AI agents (parallel meta-doc for development/)

**Repository Guidance:**

- [AGENTS.md](../../../AGENTS.md) — Project-wide guidance for AI agents
- [Conventions Index](../README.md) — Index of all convention documents

**Agents:**

- `docs-maker` - Creates convention documents following this structure
- `rules-maker` - Propagates convention changes
- `rules-checker` - Validates convention compliance
