# Hugo Content Conventions

Hugo site-specific content conventions for oseplatform-web. (ayokoding-web has migrated to Next.js 16 and is no longer a Hugo site.)

## Purpose

These conventions define **WHAT Hugo content rules apply** to our Hugo-based websites, covering theme-specific requirements, content structure, navigation patterns, and bilingual support. All Hugo content must follow these standards.

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
- [Hugo Content - OSE Platform](./ose-platform.md) - Site-specific conventions for oseplatform-web (PaperMod theme, English-only)
- [Hugo Content - Shared](./shared.md) - Common Hugo content conventions applying to all Hugo sites in this repository
- [Indonesian Content Policy - ayokoding-web](./indonesian-content-policy.md) - Policy defining when and how to create Indonesian content in ayokoding-web. Establishes English-first policy for technical tutorials, defines Indonesian content categories (unique content, strategic translations, discouraged mirrors), and provides decision tree for language selection

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

---

**Last Updated**: 2026-02-07
