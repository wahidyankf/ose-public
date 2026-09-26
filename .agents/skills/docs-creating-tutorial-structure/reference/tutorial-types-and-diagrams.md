# Tutorial Types and Diagram Orientation

## Tutorial Types and Coverage Levels

Seven tutorial types with progressive coverage depth:

1. **Initial Setup** (0-5% coverage) — environment setup, installation, first run
2. **Quick Start** (5-30% coverage) — fast introduction to core features
3. **Beginner** (0-60% coverage) — foundational concepts and common patterns
4. **Intermediate** (60-85% coverage) — complex scenarios and integration
5. **Advanced** (85-95% coverage) — performance tuning, optimization, edge cases
6. **Cookbook** (varies) — common recipes and solutions
7. **By Example** (75-90% coverage) — heavily annotated code examples for experienced developers
   (see `docs-creating-by-example-tutorials` Skill)

**Coverage percentages indicate topic depth, NOT time to complete.** See
[Tutorial Naming Convention](../../../../repo-governance/conventions/tutorials/naming.md) for
complete details. Coverage percentages indicate comprehensiveness, not duration; a tutorial may
state a time estimate separately, labelled as an estimate.

## Diagram Creation

All diagrams use Mermaid with the accessible color palette from `docs-creating-accessible-diagrams`
(verified color codes, character escaping, no `style` commands in sequence diagrams — see that
Skill for the full ruleset). See
[Diagrams Convention](../../../../repo-governance/conventions/formatting/diagrams.md) for
complete requirements.

### Diagram Orientation (Tutorial-Specific Override)

**This overrides the general `docs-creating-accessible-diagrams` default** (which prefers
vertical `graph TD` for mobile). For tutorials specifically:

- **Flowcharts**: LR (Left-Right) by default; TD only when top-down direction is semantically
  required, with a `%% TD required: [reason]` justification comment on the immediately preceding
  line
- **Sequence diagrams**: automatic left-to-right layout
- **State diagrams**: LR (Left-Right) for state transitions
- **Class diagrams**: automatic layout
