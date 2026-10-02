---
description: Validation focus and implementing agent per content type (docs/, ayokoding-www, ose-www, plans/, README files), plus links to related quality standards and development practices.
when_to_use: Use when determining which validation focus and agent applies to a specific content type, or looking up related quality/validation documentation.
---

# Integration Guidance and Related Documentation

## Integration Guidance for Different Content Types

### Documentation (`docs/`)

**Validation Focus:**

- Command syntax accuracy
- Code examples work as shown
- Version numbers are current
- External links are accessible
- No contradictions within/across files

**Agent:** `docs-checker`, `docs-fixer`

### Educational Content (ayokoding-www)

**Validation Focus:**

- Tutorial code compiles/runs
- Learning objectives are achievable
- Difficulty levels are accurate
- Indonesian/English consistency
- Educational sequences are logical

**Agent:** `content-checker`, `content-fixer`

### Platform Content (ose-www)

**Validation Focus:**

- Feature claims are accurate
- Release information is current
- Links to external resources work
- Version compatibility is correct

### Plans (`plans/`)

**Validation Focus:**

- Technology choices are maintained (not deprecated)
- Codebase assumptions are accurate (files exist, structure correct)
- Documentation URLs are accessible
- Version requirements are current

**Agent:** `plan-checker`

### README Files

**Validation Focus:**

- Installation instructions work
- Version requirements are current
- Feature claims are accurate
- Links to documentation are valid

**Agent:** `readme-checker`, `readme-fixer`

## Related Documentation

**Implementation Agents:**

- `docs-checker.md` - Documentation factual accuracy validator (implements this convention for `docs/`)
- `content-checker.md` - Educational content factual validator (implements this convention for ayokoding-www)
- `plan-checker.md` - Plan accuracy validator (implements portions of this convention)

**Quality Standards:**

- [Content Quality Principles](../quality.md) — Universal markdown quality standards
- [Mathematical Notation Convention](../../formatting/mathematical-notation.md) — LaTeX notation standards
- [Color Accessibility Convention](../../formatting/color-accessibility.md) — Accessible color palette
  **Development Practices:**

- [Maker-Checker-Fixer Pattern](../../../development/pattern/maker-checker-fixer.md) — Three-stage quality workflow
- [Fixer Confidence Levels](../../../development/quality/fixer-confidence-levels.md) — Fix confidence assessment
- [Repository Validation Methodology](../../../development/quality/repository-validation.md) — Standard validation patterns

---

This convention provides the **universal methodology** for factual validation. Individual agents implement domain-specific checks while following these shared verification patterns and confidence classifications.
