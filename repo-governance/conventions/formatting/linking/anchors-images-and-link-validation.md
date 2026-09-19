---
description: Anchor-link syntax and slug validation rules, image link syntax, and the pre-commit link verification checklist.
when_to_use: Use when linking to a heading within a page, embedding an image, or verifying links before committing.
---

# Anchors, Images, and Link Validation

## Anchor Links (Same Page)

For linking to headings within the same document:

```markdown
[See Examples](#examples-by-location)
[Jump to Key Rules](#key-rules)
```

**Anchor validation**: `./rhino md links validate` validates `#fragment` references. A `#fragment` with no matching heading in the target file (or in the source file for pure `#fragment` links) is reported as a `broken-anchor` finding. The validator uses the GitHub slug algorithm (verified against the `github-slugger` v2 reference implementation): underscores and Unicode letters/digits are kept, spaces map to hyphens (no collapsing), and duplicate slugs receive `-1`, `-2`, … suffixes.

## Image Links

For embedding images:

```markdown
<!-- Same directory -->

![Diagram](./diagram.png)

<!-- Subdirectory -->

![Architecture](./images/architecture-diagram.png)
```

## PASS: Verification Checklist

Before committing documentation with links:

- [ ] All links use `Text` syntax
- [ ] All internal links include `.md` extension
- [ ] All paths are relative (not absolute)
- [ ] Link text is descriptive (not filename-based)
- [ ] No wiki-link syntax (`[[...]]`) used
- [ ] Manually verified links point to existing files
- [ ] Paths tested from the current file's location

## Link Validation

When creating documentation, verify links by:

1. **Manual Testing**: Click links in your markdown viewer
2. **File Existence**: Use `ls` or `find` to verify target files exist
3. **Path Correctness**: Count `../` levels to ensure correct relative path
4. **Extension Check**: Confirm `.md` is present in all internal links
