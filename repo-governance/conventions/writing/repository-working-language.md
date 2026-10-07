---
description: English working-language rules and exceptions for repository-authored material
when_to_use: Use when choosing the natural language for repository-authored material or localized content.
---

# Repository Working Language Convention

English is the repository's working language. A shared language keeps rules, engineering work, and
operational knowledge reviewable across teams without preventing content intended for another
language audience.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**:
  one stated working language removes ambiguity from authoring and review.
- **[Accessibility First](../../principles/content/accessibility-first.md)**: localized and
  language-native content remains available to the audience it serves.
- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: one
  default avoids mixed-language maintenance across shared technical artifacts.

## Rule

Write repository-authored governance, contributor instructions, documentation, plans,
specifications, source-code identifiers, comments and docstrings, logs, error messages, test names
and descriptions, and other developer-facing text in English.

Keep comments, commit messages, and work notes brief.

Use clear, simple, natural English in those texts so readers who use English as an additional language can follow.

When a comment or work note explains code, state why it is needed rather than narrating what the code does.

Use British `behaviour`, `behavioural`, and `behaviour-driven` in repository-authored generic
prose, locally owned identifiers, and paths. Preserve American `behavior` only when a third-party
API or required identifier, exact quotation, proper name, URL, vendored/generated material, or an
explicitly localized audience requires it.

Use another natural language only when observable repository context identifies the text as one of
the exceptions below.

## Exceptions

The following may use Bahasa Indonesia or another required language:

- localized or language-native documentation and content identified by a locale-specific path,
  frontmatter, parent index, applicable content policy, or other explicit audience declaration;
- user-facing localized strings, translation resources, locale fixtures, and test assertions that
  quote those strings;
- quotations, proper names, regulated terminology, and domain phrases whose original language is
  material, with English context or a translation when readers need one; and
- imported, vendored, or generated third-party material that the repository does not author.

The exception belongs to the text, not its containing file. Code identifiers, comments, test
descriptions, and surrounding explanations remain English even when they manipulate or quote a
localized value. A contributor's intention, or a topic associated with a country or language, is
not by itself an exception.

## Enforcement Disposition

**Unenforced by decision.** Reviewers and rules-quality checks evaluate this convention. A
deterministic language or dialect gate would misclassify code, names, quotations, required
third-party identifiers, and deliberately localized text, so no mechanical gate is declared.
Non-English repository-authored text or generic American `behavior` vocabulary outside the
exceptions above is a violation. Review also judges brevity, natural wording, and whether an explanation gives a
reason; a mechanical check cannot distinguish useful context from needless narration.

## Related Documentation

- [Indonesian Content Policy](./indonesian-content-policy.md) — language selection for AyoKoding
  content.
- [Content Quality Principles](./quality.md) — universal Markdown writing standards.
- [Internal AyoKoding References](../linking/internal-ayokoding-references.md) — language-aware
  link selection from repository documentation.
