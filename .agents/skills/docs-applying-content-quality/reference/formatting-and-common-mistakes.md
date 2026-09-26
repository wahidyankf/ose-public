# Content Quality — Formatting Conventions and Common Mistakes

## Formatting Conventions

**Code Blocks**: Always specify language for syntax highlighting.

````markdown
✅ Good:

```javascript
const x = 10;
```
````

❌ Bad:

```
const x = 10;  ← No language specified
```

**Paragraph Length**: Keep paragraphs concise (≤5 lines for readability).

**Line Length**: Aim for 80-100 characters per line for better readability.

**Lists**: Use consistent formatting:

- Unordered lists: Use `-` (hyphen) for consistency
- Ordered lists: Use `1.` numbering
- Nested lists: Indent with 2 spaces per level

## Time Estimates

Documentation may state a time estimate when it helps the reader, labelled as an estimate:

- ✅ "Estimated time: 30-45 minutes, depending on your network speed"
- ❌ "This takes 30 minutes" (an unlabelled estimate reads as a measurement)

Plan documents are the exception: they state no time estimates. See the
[No Time Estimates principle](../../../../repo-governance/principles/content/no-time-estimates.md).

## Common Quality Checklist

Before publishing any markdown content, verify:

- [ ] Active voice used throughout
- [ ] Exactly one H1 heading
- [ ] Proper heading nesting (no skipped levels)
- [ ] All images have descriptive alt text
- [ ] Code blocks specify language
- [ ] Any time estimate is labelled as an estimate
- [ ] Professional, welcoming tone
- [ ] Paragraphs ≤5 lines
- [ ] Clear, jargon-free language (or jargon explained)
- [ ] WCAG AA color contrast for any custom colors
- [ ] Semantic formatting (bold for emphasis, proper lists)

## Common Mistakes

### ❌ Mistake 1: Missing alt text

**Wrong**: `![](./image.png)`
**Right**: `![Detailed description of image content](./image.png)`

### ❌ Mistake 2: Skipped heading levels

**Wrong**:

```markdown
# Title

### Subsection ← Skips H2
```

**Right**:

```markdown
# Title

## Section

### Subsection
```

### ❌ Mistake 3: Unlabelled time estimate

**Wrong**: "This tutorial takes 30 minutes to complete."
**Right**: "Estimated time: about 30 minutes. This tutorial covers X, Y, and Z concepts."

### ❌ Mistake 4: Passive voice overuse

**Wrong**: "The file is created by the command."
**Right**: "The command creates the file."

### ❌ Mistake 5: Code blocks without language

**Wrong**:

```
npm install
```

**Right**:

```bash
npm install
```
