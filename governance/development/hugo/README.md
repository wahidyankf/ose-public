# Hugo Development

Standards for developing Hugo sites (layouts, themes, assets, configuration) for oseplatform-web. (ayokoding-web has migrated to Next.js 16 and is no longer a Hugo site.)

## Purpose

These standards define **HOW to develop Hugo themes and layouts**, covering theme development, asset pipeline, i18n/l10n, performance optimization, and SEO best practices. This is about building the technical infrastructure of Hugo sites, not writing content.

## Scope

**✅ Belongs Here:**

- Hugo theme/layout development
- HTML templates and partials
- Asset pipeline (CSS, JS)
- Build configuration
- Performance and SEO optimization

**❌ Does NOT Belong:**

- Hugo content writing (that's conventions/hugo/)
- General markdown formatting (that's conventions/formatting/)
- Content quality standards (that's conventions/writing/)

## Documents

- [Hugo Development Convention](./development.md) - Complete standards for Hugo site development including theme development, asset pipeline, i18n/l10n, performance optimization, and SEO best practices

## Companion Documents

- [Anti-Patterns](./anti-patterns.md) - Common Hugo development mistakes to avoid (with examples and corrections)
- [Best Practices](./best-practices.md) - Recommended Hugo development patterns and techniques

## Related Documentation

- [Development Index](../README.md) - All development practices
- [Hugo Content Conventions](../../conventions/hugo/README.md) - Hugo content writing standards
- [Reproducibility First Principle](../../principles/software-engineering/reproducibility.md) - Why build reproducibility matters
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model

## Principles Implemented/Respected

This set of development practices implements/respects the following core principles:

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: Hugo development practices ensure consistent builds across environments through explicit configuration and build process standardization.

- **[Accessibility First](../../principles/content/accessibility-first.md)**: Hugo template development enforces semantic HTML, proper ARIA attributes, and accessible markup to ensure generated content is accessible to all users.

## Conventions Implemented/Respected

This set of development practices respects the following conventions:

- **[Hugo Content Conventions](../../conventions/hugo/README.md)**: Development aligns with content requirements, supporting theme-specific frontmatter and multilingual infrastructure.

- **[Color Accessibility Convention](../../conventions/formatting/color-accessibility.md)**: Hugo themes and layouts use verified accessible color palette for all UI elements and interactive components.

---

**Last Updated**: 2026-01-01
