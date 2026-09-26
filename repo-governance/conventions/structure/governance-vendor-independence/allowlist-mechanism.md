---
description: The one mechanism that permits a vendor name in a governed file — a per-file vocabulary exception in repo-config.yml — and how binding-example fences and Platform Binding Examples headings relate to it.
when_to_use: Use when a governed file must legitimately name a vendor, product, or model, and you need to declare that without weakening the vendor gate.
---

# Allowlist Mechanism

## Per-file vocabulary exceptions (the only mechanism)

A vendor name may appear in a governed file only when `repo-config.yml`
`policies.governance.vendor.vocabulary-exceptions` holds an entry that pairs that exact term with
that exact repository-relative file path:

```yaml
vocabulary-exceptions:
  - term: "<forbidden term>"
    paths:
      - repo-governance/<path-to>/platform-binding-examples.md
```

An exception covers one term and the listed files only. It never covers a directory, another term,
or another file, so a broad exception cannot silently disable the gate elsewhere.

Declare an exception only for a file that must name the vendor:

- a page of this convention that catalogues the terms themselves;
- a Platform Binding Examples page or section, including a page whose vendor-specific content sits in
  a `binding-example` fence.

Everywhere else, reword with the [Vocabulary Map](./vocabulary-map.md) instead.

## `binding-example` fences and "Platform Binding Examples" headings

Both remain the way a page shows readers where its vendor-specific content lives:

- a ` ```binding-example ` fence marks an inline vendor-specific example;
- a heading whose text is `Platform Binding Examples` groups a page's vendor-specific content.

Neither is a scanner exemption. `./rhino governance vendor validate` has no skip logic: it reads the
whole file, fences, headings, code spans, link targets, comments, and frontmatter included. A page
that uses either marker and names a forbidden term still needs a vocabulary exception for each term
it names.

```markdown
## Platform Binding Examples

### <Harness name>

The `<binding-directory>/agents/plan-maker.md` frontmatter sets `model: <model-id>`.
```
