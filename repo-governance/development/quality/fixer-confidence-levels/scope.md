---
description: "Which fixer agents this convention covers."
when_to_use: "Use when checking whether a fixer is in scope."
---

# Scope

## Agents Using This System

All fixer agents implement this confidence level system:

- **repo-workflow-fixer** - Repository workflow structural consistency fixes
- **content-fixer** - ayokoding-www general content fixes
- **tutorial-by-example-fixer** - ayokoding-www by-example tutorial fixes
- **content-fixer** - ayokoding-www factual accuracy fixes
- **tutorial-in-the-field-fixer** - ayokoding-www in-the-field tutorial fixes
- **apps-ayokoding-www-link-fixer** - ayokoding-www link validation fixes
- **docs-tutorial-fixer** - Tutorial quality fixes
- **content-fixer** - ose-www Next.js content fixes
- **readme-fixer** - README quality fixes
- **docs-fixer** - Documentation factual accuracy fixes
- **docs-fixer** - Documentation factual-accuracy fixes
- **docs-software-engineering-separation-fixer** - Software engineering documentation separation fixes
- **repo-workflow-fixer** - Repository workflow structural consistency fixes

## Universal Application

The three confidence levels (HIGH, MEDIUM, FALSE_POSITIVE) are universal. Each agent:

1. **Reads audit reports** from corresponding checker agent
2. **Re-validates findings** using same patterns as checker
3. **Assesses confidence** using criteria defined in this convention
4. **Applies HIGH confidence fixes** automatically
5. **Skips MEDIUM and FALSE_POSITIVE** with explanations
6. **Generates fix reports** documenting all decisions
