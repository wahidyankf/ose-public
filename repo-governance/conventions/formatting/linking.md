---
description: Standards for linking between documentation files in open-sharia-enterprise
when_to_use: Use when adding or reviewing a link between documentation files in this repository.
---

# Documentation Linking Convention

This document defines the standard syntax and practices for linking between documentation files in the open-sharia-enterprise project. Following these conventions ensures links render correctly on GitHub and work in any standard markdown viewer.

## In This Convention

- [Purpose, Scope, and Why GitHub-Compatible Links](./linking/purpose-scope-and-why-github-compatible-links.md) — Principles, scope, and the rationale for GitHub-compatible links
- [Link Syntax, Examples, and Correct Usage](./linking/link-syntax-examples-and-correct-usage.md) — Required syntax, key rules, location-based examples, and correct-vs-incorrect examples
- [Nested Directory Linking](./linking/nested-directory-linking.md) — Calculating relative path depth (`../`) from file nesting
- [Anchors, Images, and Link Validation](./linking/anchors-images-and-link-validation.md) — Anchor links, image links, and the verification checklist
- [When to Link Rule References: Formatting and Examples](./linking/when-to-link-rule-references-formatting-and-examples.md) — The two-tier link-then-inline-code formatting rule

## Related Documentation

- [File Naming Convention](../structure/file-naming.md) — How to name documentation files
- [Conventions Index](../README.md) — Overview of all documentation conventions

## When to Link Rule References: Exclusions

This two-tier formatting does NOT apply to:

- **Code blocks** - Already formatted as code
- **Quoted text** - Preserve original formatting
- **File path specifications** - Use literal paths
- **Meta-discussion about naming** - When discussing rule names as strings

**Example exclusions:**

````markdown
<!-- Code block - already formatted -->

```bash
## Apply linking-convention rules
validate_docs_links
```
````

<!-- Quoted text - preserve original -->

> The author wrote "see linking convention for details"

<!-- File path - literal path -->

The rule is defined in `repo-governance/conventions/formatting/linking.md`

<!-- Meta-discussion - discussing the name itself -->

We renamed "link-convention" to "linking-convention" for clarity

```

### Validation

The [docs-checker agent](../../../.agents/agents/docs-checker.md) validates this two-tier formatting requirement:

- **First mention without link** → CRITICAL issue (breaks navigation)
- **Subsequent mention without inline code** → HIGH issue (convention violation)
- **All mentions improperly formatted** → CRITICAL issue (complete non-compliance)

```
