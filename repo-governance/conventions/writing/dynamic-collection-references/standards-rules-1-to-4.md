---
description: The first four normative rules — never hardcode counts, layer descriptions must omit counts, index summaries must omit counts, and directory tree comments must omit counts.
when_to_use: Use when checking a specific piece of prose (a sentence, a layer description, an index summary, or a directory tree comment) against the no-hardcoded-count rules.
---

# Standards (Rules 1-4)

See [Standards (Rules 5-7)](./standards-rules-5-to-7.md) for the remaining rules.

## Rule 1: Never Hardcode Dynamic Collection Counts in Documentation

**FAIL: Hardcoded count**:

```markdown
The repository contains 69 specialized AI agents.
```

**PASS: Reference by name with link**:

```markdown
The repository contains [specialized AI agents](./.agents/agents/README.md).
```

> **Note**: The path `./.agents/agents/README.md` in the example above is illustrative. Use the correct relative path based on your file's actual location. For example, from `repo-governance/conventions/writing/`, the correct path would be `../../../.agents/agents/README.md`.

**PASS: Omit the count entirely**:

```markdown
Specialized AI agents automate documentation creation, validation, and content generation.
```

## Rule 2: Layer Descriptions Must Not Include Counts

The six-layer architecture is frequently summarized in documentation. Layer descriptions MUST NOT include counts of the items within that layer.

**FAIL: Layer description with count**:

```markdown
- **Layer 1: Principles** - WHY we value approaches (11 core principles)
- **Layer 2: Conventions** - WHAT documentation rules (30 standards)
- **Layer 3: Development** - HOW we develop (30 practices)
- **Layer 4: AI Agents** - WHO enforces rules (69 specialized agents)
```

**PASS: Layer description without count**:

```markdown
- **Layer 1: Principles** - WHY we value approaches
- **Layer 2: Conventions** - WHAT documentation rules
- **Layer 3: Development** - HOW we develop
- **Layer 4: AI Agents** - WHO enforces rules
```

## Rule 3: Collection Descriptions in Index Documents Must Not Use Counts in Headers or Summaries

Index documents (README files and architecture documents) that list collections MUST NOT embed counts in summaries that appear outside the collection itself.

**FAIL: Count in summary description**:

```markdown
- **Conventions Index** - 30 documentation standards
- **Development Index** - 17 software practices
- **Agents Index** - 69 specialized agents
```

**PASS: Description without count**:

```markdown
- **Conventions Index** - Documentation writing and organization standards
- **Development Index** - Software development practices and workflows
- **Agents Index** - Specialized agents organized by role and responsibility
```

## Rule 4: Directory Tree Comments Must Not Include Counts

Code blocks showing repository structure often include comments that describe what a directory contains. These comments MUST NOT include counts of the directory's contents.

**FAIL: Count in directory comment**:

```
├── .claude/
│   ├── agents/    # 69 specialized AI agents
│   └── skills/    # 37 skill packages
```

**PASS: Description without count**:

```
├── .claude/
│   ├── agents/    # specialized AI agents
│   └── skills/    # skill packages
```
