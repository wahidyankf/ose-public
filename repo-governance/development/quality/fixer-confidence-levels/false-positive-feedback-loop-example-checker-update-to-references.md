---
description: "A worked feedback-loop example: checker update through references."
when_to_use: "Use for the second half of a worked feedback-loop example."
---

# False Positive Feedback Loop: Example (part 2)

```

**Checker Update:**

- Maintainer updates rules-checker with corrected AWK pattern
- Re-runs checker: 0 violations found
- False positives eliminated

**Continuous Improvement:**

- Each fixer run identifies new edge cases
- Recommendations accumulate in fix reports
- Checker accuracy improves over time
- Trust in automation increases

##  References

### Fixer Agents Using This Convention

- [apps-ayokoding-www-general-fixer.md](../../../.claude/agents/apps-ayokoding-www/apps-ayokoding-www-general-fixer.md) - ayokoding-www general Next.js content fixer
- [apps-ayokoding-www-by-example-fixer.md](../../../.claude/agents/apps-ayokoding-www/apps-ayokoding-www-by-example-fixer.md) - ayokoding-www by-example tutorial fixer
- [apps-ayokoding-www-facts-fixer.md](../../../.claude/agents/apps-ayokoding-www/apps-ayokoding-www-facts-fixer.md) - ayokoding-www factual accuracy fixer
- [docs-tutorial-fixer.md](../../../.claude/agents/docs/docs-tutorial-fixer.md) - Tutorial quality fixer
- [apps-ose-www-content-fixer.md](../../../.claude/agents/apps-ose-www-content/apps-ose-www-content-fixer.md) - ose-www Next.js content fixer
- [readme-fixer.md](../../../.claude/agents/readme-agents/readme-fixer.md) - README quality fixer
- [docs-fixer.md](../../../.claude/agents/docs/docs-fixer.md) - Documentation factual accuracy fixer
- [apps-ayokoding-www-in-the-field-fixer.md](../../../.claude/agents/apps-ayokoding-www/apps-ayokoding-www-in-the-field-fixer.md) - ayokoding-www in-the-field tutorial fixer
- [apps-ayokoding-www-link-fixer.md](../../../.claude/agents/apps-ayokoding-www/apps-ayokoding-www-link-fixer.md) - ayokoding-www link validation fixer
- [docs-software-engineering-separation-fixer.md](../../../.claude/agents/docs/docs-software-engineering-separation-fixer.md) - Software engineering documentation separation fixer
- [repo-workflow-fixer.md](../../../.claude/agents/repo/repo-workflow-fixer.md) - Repository workflow structural consistency fixer

### Related Conventions

**Validation Methodology:**
- [Repository Validation Methodology Convention](./repository-validation.md) - Standard validation patterns (frontmatter extraction, field checks, link validation)

**AI Agents:**
- [AI Agents Convention](../agents/ai-agents.md) - Standards for all AI agents including fixers

**Content Standards:**
- [Tutorial Convention](../../conventions/tutorials/general.md)
- [Content Quality Principles](../../conventions/writing/quality.md) - Universal content quality standards
- [README Quality Convention](../../conventions/writing/readme-quality.md)
- [Indonesian Content Policy](../../conventions/writing/indonesian-content-policy.md) - ayokoding-www bilingual content policy (English-first for technical tutorials)

**Infrastructure:**
- [Temporary Files Convention](../infra/temporary-files.md) - Where to store fix reports (`local-tmp/<agent-family>/`)

##  Maintenance

### When to Update This Convention

Update this convention when:

1. **New fixer agent created** - Add to scope section
2. **New confidence criteria discovered** - Add to universal criteria
3. **Common patterns emerge** - Document in domain-specific vs universal section
4. **False positive patterns repeat** - Document in feedback loop section
5. **Validation methodology changes** - Update re-validation process

### Propagating Changes

When this convention is updated:

1. **Review all fixer agents** - Ensure they follow updated criteria
2. **Update agent prompts** - Reflect new confidence assessment guidance
3. **Test edge cases** - Verify new criteria work across domains
4. **Document examples** - Add concrete examples of new patterns
5. **Announce changes** - Notify maintainers of fixer agents

### Version History

- **2025-12-14** - Initial convention established based on 5 fixer agents (repo-rules, ayokoding-web, docs-tutorial, ose-web-content, readme)

---

This convention is the single source of truth for confidence level assessment across all fixer agents. All fixers should reference and implement these criteria consistently to ensure safe, effective automated fixing with proper human oversight for subjective quality improvements.
```
