---
description: >-
  Product rules the content quality gate applies to OSE Platform website pages under apps/ose-www/content/, overriding
  generic rules only where this adapter names them.
when_to_use: >-
  Use when running, or repairing for, the content quality gate on ose-www pages, or when deciding which ose-www rule a
  finding cites.
---

# OSE WWW Gate Adapter

**Covers:** every page under `apps/ose-www/content/`. **Configures:** the
[Content Quality Gate](../../../workflows/quality/content-quality-gate.md). A checker cites a rule here by name; a rule
this adapter does not state is never applied. The site's rules are held by the `apps-ose-www-developing-content` skill
and its `reference/` pages; this adapter states what the gate judges.

## Deterministic Boundary Here

`markdownlint`, `format-staged`, `md-naming` (kebab-case only, never the date prefix), and the two Mermaid validators
reach these pages. Front matter, internal links, and asset paths reach no declared gate here, so they are judgeable.

## Rules

- **Site standards.** Content meets the Next.js content layer and landing-page standards of the
  `apps-ose-www-developing-content` skill.
- **English only.** No language subdirectories and no bilingual management.
- **Flat structure.** `content/updates/` (with its `_index.md`) and `content/about.md`; no deeper hierarchy.
- **File names.** Update posts are `YYYY-MM-DD-title.md`; the about page uses a plain slug.
- **Required front matter.** `title`, `date`, and `draft`, with `draft` set correctly.
- **Date format.** `date` is `YYYY-MM-DDTHH:MM:SS+07:00`.
- **Description length.** A `description`, when present, is 150 to 160 characters.
- **Summary.** Every post provides a `summary` for list pages.
- **Front matter form.** YAML with two-space indentation; `tags` and `categories` are arrays when present.
- **Cover alt text.** A cover image has `alt` text.
- **Internal links.** Absolute paths with no `.md` extension and no language prefix.
- **Assets.** Files live under `apps/ose-www/static/{images/{updates,about},casts}` and are referenced from the site
  root, for example `/images/...`.
- **Authors.** The `author` field is allowed on any post, with one or several authors.
- **No AyoKoding rules.** AyoKoding conventions, such as bilingual paths or the no-body-H1 rule, never apply here.

## Related Documentation

- [Gate Adapters](README.md) — every adapter in this repository.
- [AyoKoding WWW Gate Adapter](ayokoding-www.md) — the contrasting site's rules.
