---
description: Collects the sibling workflows this one relates to, the principles and conventions it implements, and links to the in-the-field tutorial convention and involved agents.
when_to_use: Use when looking for related workflows, tracing which principles and conventions this workflow implements, or finding the involved agent definitions.
---

# Related Workflows, Principles, Conventions, and Documentation

## Related Workflows

This workflow is part of the **Tutorial Quality Family**:

- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: General pattern
- **ayokoding-web-swe-by-example-quality-gate**: Specialized for by-example tutorials
- **ayokoding-web-in-the-field-quality-gate** (this workflow): Specialized for in-the-field production guides

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, decisions, and criteria are explicit
- PASS: **Automation Over Manual**: Automated validation and fixing where safe
- PASS: **Quality Over Speed**: Iterative refinement until excellent
- PASS: **Convention Over Configuration**: Standardized in-the-field validation criteria

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Workflow file follows plain name convention for workflows
- **[Linking Convention](../../../conventions/formatting/linking.md)**: All cross-references use GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../../conventions/writing/quality.md)**: Active voice, proper heading hierarchy, single H1

## Related Documentation

- **[In-the-Field Tutorial Convention](../../../conventions/tutorials/in-the-field.md)**: Quality standards
- **[Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md)**: Workflow pattern
- **[`apps-ayokoding-www-in-the-field-checker` agent](../../../../.agents/agents/apps-ayokoding-www-in-the-field-checker.md)**: Validation agent
- **[`apps-ayokoding-www-in-the-field-fixer` agent](../../../../.agents/agents/apps-ayokoding-www-in-the-field-fixer.md)**: Fixing agent
- **[`apps-ayokoding-www-in-the-field-maker` agent](../../../../.agents/agents/apps-ayokoding-www-in-the-field-maker.md)**: Content creation agent
