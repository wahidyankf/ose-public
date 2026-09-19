---
description: "Covers the benefits of proper separation, the implementation pattern, measurement and success criteria, ongoing vigilance, and related agent skills."
when_to_use: Use when implementing an agent-skill separation and deciding how to measure whether it succeeded.
---

# Agent-Skill Separation — Benefits, Implementation, Measurement, and Vigilance

## Benefits of Agent-Skill Separation

1. **Single Source of Truth**: Update Skill once, all agents benefit
2. **Reduced Duplication**: Eliminate 50-90% of duplicated content
3. **Easier Maintenance**: Convention changes require updating Skill only
4. **Better Scalability**: New agents reference existing agent skills
5. **Clearer Agents**: Agents focus on task workflows, not standards
6. **Progressive Disclosure**: agent skills load on-demand, reducing context bloat

## Implementation Pattern

When simplifying an agent:

1. **Identify duplication**: Look for content appearing in 3+ agents
2. **Check existing agent skills**: Does a Skill already cover this?
   - YES → Reference the Skill
   - NO → Consider creating new Skill
3. **Extract to Skill**: Create/extend Skill with reusable knowledge
4. **Update agent**: Replace duplicated content with Skill reference
5. **Add frontmatter**: Include Skill in `skills:` field
6. **Verify size**: Confirm agent is within tier limits
7. **Test functionality**: Ensure agent still works correctly

## Measurement and Success Criteria

**Target Size Reduction**: 20-40% average across all agents

**Quality Metrics**:

- All agents within tier limits (Simple <800, Standard <1,200, Complex <1,800)
- Zero functionality regressions
- All agent skills referenced exist
- All convention links valid

**Project Achievement** (2026-01-03):

- All agents simplified
- 82.7% average reduction (4x better than target)
- 28,439 lines eliminated
- 100% tier compliance (all in Simple tier)
- agent skills created/used to eliminate duplication (at the time: 18; see [agent skills README](../../../../.agents/skills/README.md) for current catalog)

## Ongoing Vigilance

**Prevent duplication creep**:

1. **New agent creation**: Reference agent skills instead of duplicating
2. **Agent updates**: Extract new duplication to agent skills
3. **Periodic audits**: Run rules-checker for duplication detection
4. **Code reviews**: Check for embedded Skill knowledge
5. **Documentation**: Keep AI Agents Convention updated with examples

## Related agent skills

**Current agent skills** (see [agent skills README](../../../../.agents/skills/README.md) for complete catalog):

- `repo-generating-validation-reports` - Report generation, UUID chains, timestamps
- `repo-assessing-criticality-confidence` - Criticality levels, confidence assessment
- `repo-applying-maker-checker-fixer` - Three-stage workflow, mode handling
- `apps-ayokoding-www-developing-content` - Next.js 16 content patterns for ayokoding-www, bilingual content strategy
- `apps-ose-www-developing-content` - Next.js 16 content patterns for ose-www
- `docs-creating-by-example-tutorials` - Annotation standards, five-part structure
- `docs-creating-accessible-diagrams` - Color palettes, accessibility
- `docs-applying-content-quality` - Markdown quality standards
- `docs-validating-factual-accuracy` - Verification methodology
- `docs-validating-links` - Link validation, caching
- Plus more in Content Creation, Standards Application, Process Execution categories

See [agent skills README](../../../../.agents/skills/README.md) for complete catalog.
