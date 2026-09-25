# Maker-Checker-Fixer — Common Workflows and Agent Families

## Common Workflows

### Basic: Create → Validate → Fix

```
1. User: "Create new tutorial"
2. Maker: Creates content + dependencies
3. User: Reviews, looks good
4. Checker: Validates, finds minor issues
5. User: Reviews audit, approves fixes
6. Fixer: Applies validated fixes
7. Done: Production-ready
```

### Iterative: Maker → Checker → Fixer → Checker

```
1. User: "Update existing content"
2. Maker: Updates content + dependencies
3. Checker: Validates, finds issues
4. User: Reviews audit, approves fixes
5. Fixer: Applies fixes
6. Checker: Re-validates to confirm
7. Done: Content verified clean
```

**When to use**: Critical content, major refactoring, uncertain fixer confidence

## Agent Families Using This Pattern

Multiple agent families implement this pattern. See [AI Agents Index](../../../../.agents/agents/README.md) for the complete list. Key families include:

1. **repo-rules-\*** - Repository-wide consistency
2. **apps-ayokoding-www-\*** - Content (ayokoding-web, Next.js)
3. **docs-tutorial-\*** - Tutorial quality
4. **apps-ose-www-content-\*** - Next.js 16 content (ose-web)
5. **readme-\*** - README quality
6. **docs-\*** - Documentation factual accuracy
7. **plan-\*** - Plan completeness and structure

Each family has:

- **Maker** (Blue) - Creates/updates content
- **Checker** (Green) - Validates, generates audits
- **Fixer** (Yellow) - Applies validated fixes
