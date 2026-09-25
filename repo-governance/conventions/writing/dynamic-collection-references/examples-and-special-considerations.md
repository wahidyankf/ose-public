---
description: Before/after conversion examples for common hardcoded-count patterns, plus edge cases like the index footer count and workflow/category count distinction.
when_to_use: Use when converting an existing hardcoded count to a compliant reference, or when unsure whether a specific edge case (index footer, workflow count, category count) is exempt.
---

# Examples and Special Considerations

## Examples

### Converting Existing References

**Before (FAIL)**:

```markdown
## AI Agents (69 Specialized Agents)

**Agent skills Infrastructure**: Agents leverage 37 skills providing two modes:
```

**After (PASS)**:

```markdown
## AI Agents

**Agent skills Infrastructure**: Agents leverage skills providing two modes:
```

---

**Before (FAIL)**:

```markdown
- **Conventions Index**: [repo-governance/conventions/README.md](./repo-governance/conventions/README.md) — 30 documentation standards
- **Development Index**: [repo-governance/development/README.md](./repo-governance/development/README.md) — 17 software practices
- **Principles Index**: [repo-governance/principles/README.md](./repo-governance/principles/README.md) — 11 foundational principles
- **Agents Index**: [.agents/agents/README.md](./.agents/agents/README.md) — 69 specialized agents
```

**After (PASS)**:

```markdown
- **Conventions Index**: [repo-governance/conventions/README.md](./repo-governance/conventions/README.md) — Documentation writing and organization standards
- **Development Index**: [repo-governance/development/README.md](./repo-governance/development/README.md) — Software development practices and workflows
- **Principles Index**: [repo-governance/principles/README.md](./repo-governance/principles/README.md) — Foundational values governing all layers
- **Agents Index**: [.agents/agents/README.md](./.agents/agents/README.md) — Specialized agents organized by role
```

---

**Before (FAIL)**:

```markdown
**Current State**: 37 skills serving 69 agents
```

**After (PASS)**:

```markdown
**Current State**: agent skills serving agents across multiple families
```

### Recognizing the Pattern

Any phrase matching these patterns is a violation of this convention:

- `[number] specialized AI agents`
- `[number] skills`
- `[number] conventions` / `[number] standards`
- `[number] practices`
- `[number] principles` (when referring to the collection as a whole)
- `[number] agents` in a summary context
- `([number] [collection-name])` parenthetical after a layer description

## Special Considerations

### The "Total Agents: N" Footer Pattern

Index documents (the READMEs that list all items in a collection) may maintain a `**Total Agents**: N` line at the bottom as a convenience. This is acceptable because:

1. The index is the single source of truth for counts
2. Maintainers updating the index will see the footer and update it in the same commit
3. The count is local to the document that owns the collection

All other documents MUST NOT replicate this count.

### Workflow Counts and Category Counts

Workflow counts in documentation are covered by this convention and must be removed. However, a count of workflow categories or directory structure categories describes a static organizational structure, not the number of workflow documents, and is acceptable when those categories are not expected to change frequently.

### When Refactoring Existing Documents

When you encounter a hardcoded count in an existing document, update it to remove the count. Do not leave it for later. The convention applies to all documents, not just new ones. If the update is large in scope, create a plan in `plans/` and address it systematically.
