# Hugo Content Conventions

Historical Hugo site-specific content conventions. **All Hugo sites have migrated to Next.js 16.** Preserved for reference only.

## Purpose

These conventions defined **WHAT Hugo content rules applied** to our former Hugo-based websites. All Hugo sites have migrated to Next.js 16. These conventions are preserved for historical reference only.

## Scope

**✅ Belongs Here:**

- Hugo content writing standards
- Theme-specific conventions (Hextra, PaperMod)
- Frontmatter requirements for Hugo
- Navigation and weight management
- Shared Hugo content patterns

**❌ Does NOT Belong:**

- Hugo theme/layout development (that's development/hugo/)
- General markdown formatting (that's formatting/)
- Tutorial content structure (that's tutorials/)
- Non-Hugo documentation standards

## Conventions

- [Hugo Content - ayokoding](./ayokoding.md) - **DEPRECATED** — Historical Hugo conventions for ayokoding-web (Hextra theme). ayokoding-web has migrated to Next.js 16
- [Hugo Content - OSE Platform](./ose-platform.md) - **DEPRECATED** — Historical Hugo conventions for oseplatform-web (PaperMod theme). oseplatform-web has migrated to Next.js 16
- [Hugo Content - Shared](./shared.md) - **DEPRECATED** — Historical shared Hugo content conventions. No active Hugo sites remain
- [Indonesian Content Policy - ayokoding-web](../writing/indonesian-content-policy.md) - **MOVED** to `conventions/writing/` — Policy defining when and how to create Indonesian content in ayokoding-web

## Principles Implemented/Respected

This set of conventions implements/respects the following core principles:

- **[Accessibility First](../../principles/content/accessibility-first.md)**: Hugo content conventions enforce accessible HTML structure, proper ARIA labels, and semantic markup to ensure web content is accessible to all users.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Frontmatter requirements and weight-based ordering make content structure explicit rather than implicit, ensuring predictable site navigation and organization.

- **[Progressive Disclosure](../../principles/content/progressive-disclosure.md)**: Bilingual content strategy and structured frontmatter enable layering content complexity for different audience levels.

## Related Documentation

- [Conventions Index](../README.md) - All documentation conventions
- [Hugo Development Convention](../../development/hugo/development.md) - Hugo theme/layout development standards
- [Tutorial Conventions](../tutorials/README.md) - Tutorial structure and naming
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model
