---
title: "Nested Code Fence Convention"
description: Standards for properly nesting code fences when documenting markdown structure within markdown content
category: explanation
subcategory: conventions
tags:
  - markdown
  - code-fences
  - nesting
  - syntax
  - documentation
created: 2025-12-23
---

# Nested Code Fence Convention

This convention defines how to properly nest code fences when documenting markdown structure within markdown content. Understanding the correct nesting pattern prevents rendering bugs that break markdown formatting.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Explicitly documents nesting depth rules and fence pairing requirements. Makes the implicit markdown parsing behavior explicit through clear examples.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Uses a simple depth rule (outer = 4 backticks, inner = 3 backticks) that's easy to remember and apply consistently.

## Purpose

This convention establishes the pattern for nesting code fences when documenting markdown structure. It prevents orphaned fence syntax that breaks rendering by using 4 backticks for outer fences and 3 for inner fences, ensuring markdown examples display correctly.

## Scope

### What This Convention Covers

- **Nested fence syntax** - 4 backticks outer, 3 backticks inner
- **When to nest** - Documenting markdown structure, code blocks, or fence syntax
- **Nesting depth** - How deep nesting can go (rarely beyond 2 levels)
- **Language hints** - How to specify syntax highlighting for nested blocks

### What This Convention Does NOT Cover

- **Regular code blocks** - Single-level code blocks use standard 3 backticks
- **Code quality** - This is about markdown syntax, not code content
- **Hugo shortcodes** - Alternative approaches for Hugo sites (different syntax)

## Scope

This convention applies to markdown content in:

- **docs/** - Documentation showing markdown examples
- **Hugo sites** - Content demonstrating markdown structure (ayokoding-web, oseplatform-web)
- **plans/** - Planning documents with markdown examples
- **Repository root files** - README.md, CONTRIBUTING.md when documenting markdown

**Universal Application**: Any markdown file that shows "how to write markdown" needs nested code fences.

## The Problem: Orphaned Closing Fences

When documenting markdown structure (showing "how to write markdown"), we need to display code fences within code fences. Incorrect nesting breaks rendering:

**Broken Structure** (causes rendering bugs):

`````markdown
````markdown
### Example: Code Block

**Code**:

```javascript
const x = 5;
```
````

**Summary**: This demonstrates...

```← EXTRA CLOSING FENCE (orphaned - breaks rendering)

```
`````

**Result**: Text after the orphaned fence shows as literal markdown (`**bold**` not rendered as **bold**).

**Why it breaks**: Markdown parser sees the orphaned ``` and treats remaining content as literal code, not formatted markdown.

## The Solution: Fence Depth Rules

### Rule 1: Outer Fence Uses 4 Backticks

When showing markdown examples that contain code blocks, the outer fence MUST use **4 backticks**:

````markdown
```markdown
### Example Content

This is markdown content being documented.
```
````

### Rule 2: Inner Fence Uses 3 Backticks

Code blocks within the markdown example use **3 backticks**:

`````markdown
````markdown
### Example: Code Block

```javascript
const x = 5;
```
````
`````

### Rule 3: No Orphaned Fences

**Every opening fence MUST have exactly one matching closing fence.** No extra fences allowed.

**Validation**: Count backtick groups in your content:

- Opening 4-backtick fence: ```````` (start of outer)
- Opening 3-backtick fence: ``` (start of inner)
- Closing 3-backtick fence: ``` (end of inner)
- Closing 4-backtick fence: ```````` (end of outer)

**Correct pairing**:

- 4-backtick open → 4-backtick close (outer pair)
- 3-backtick open → 3-backtick close (inner pair)

## Complete Nesting Examples

### Example 1: Single Code Block in Markdown

**Correct** (showing how to write markdown with a code block):

`````markdown
````markdown
### Example 1: Hello World

**Code**:

```javascript
console.log("Hello, World!");
```

**Key Takeaway**: This prints a greeting to the console.
````
`````

**Structure breakdown**:

1. ```(4 backticks) - Opens outer fence

   ```

2. `### Example 1:` - Markdown heading being documented

3. ```(3 backticks) - Opens inner fence for code block

   ```

4. `console.log(...)` - Code content

5. ```(3 backticks) - Closes inner fence

   ```

6. `**Key Takeaway**:` - More markdown content being documented

7. ```(4 backticks) - Closes outer fence

   ```

### Example 2: Multiple Code Blocks

**Correct** (multiple code blocks within documented markdown):

`````markdown
````markdown
### Example 2: Variables

**Code**:

```javascript
const name = "Alice";
const age = 30;
```

**Explanation**: This declares two variables.

**Advanced**:

```javascript
const person = { name, age };
```
````
`````

**Structure breakdown**:

1. ```(4 backticks) - Opens outer fence

   ```

2. First ``` pair - First code block (3 backticks open/close)
3. `**Explanation**:` - Markdown content
4. Second ``` pair - Second code block (3 backticks open/close)

5. ```(4 backticks) - Closes outer fence

   ```

### Example 3: Nested Markdown Without Code

**Correct** (documenting markdown structure without code blocks):

````markdown
```markdown
## Tutorial Structure

### Learning Objectives

By the end of this tutorial, you'll understand:

- Concept A
- Concept B
- Concept C

### Prerequisites

You should have basic knowledge of...
```
````

**Note**: Even without inner code blocks, use 4 backticks for outer fence when documenting markdown structure.

## Common Mistakes and How to Fix Them

### Mistake 1: Extra Closing Fence

**Broken**:

`````markdown
````markdown
### Example

```javascript
code here
```
````

```← ORPHANED! Breaks rendering

```
`````

**Fixed**:

`````markdown
````markdown
### Example

```javascript
code here
```
````
`````

**Fix**: Remove the orphaned closing fence after the proper 4-backtick closure.

### Mistake 2: Wrong Fence Depth

**Broken** (using 3 backticks for outer fence):

`````markdown
````markdown
### Example

```javascript
code here
```
````
`````

```

```

``````

**Problem**: Parser can't distinguish outer from inner fences. Rendering is unpredictable.

**Fixed** (using 4 backticks for outer fence):

`````markdown
````markdown
### Example

```javascript
code here
```
``````

``````

### Mistake 3: Mismatched Fence Pairs

**Broken**:

`````markdown
`````markdown
### Example

`````javascript
code here
````   ← WRONG! Closes with 4 backticks (should be 3)
````   ← WRONG! Extra 4-backtick fence
``````

```

```

**Fixed**:

`````markdown
````markdown
### Example

```javascript
code here
```
````
`````

**Fix**: Each fence pair must use same depth (3-3 or 4-4, not 3-4).

## Validation Checklist

Before committing markdown with nested fences:

- [ ] **Outer fence uses 4 backticks** - When documenting markdown structure
- [ ] **Inner fences use 3 backticks** - For code blocks within the example
- [ ] **Every opening fence has matching closing fence** - Count pairs
- [ ] **No orphaned fences** - No extra ``` after proper closure
- [ ] **Fence pairs use same depth** - Opening and closing match (3-3, 4-4)
- [ ] **Content renders correctly** - Test in preview or GitHub
- [ ] **Bold/italic formatting works** - Verify markdown not shown as literals

## Troubleshooting Rendering Issues

### Symptom: Bold/Italic Shows as Literals

**Issue**: Content like `**bold**` displays as literal `**bold**` instead of **bold**.

**Diagnosis**: Orphaned closing fence is treating remaining content as code.

**Solution**:

1. Search for all ``` in the file
2. Count opening and closing fences
3. Remove any orphaned closing fences
4. Verify every opening fence has exactly one matching closing fence

### Symptom: Unexpected Code Block Rendering

**Issue**: Content that should be formatted markdown displays as monospace code.

**Diagnosis**: Fence depth mismatch or unclosed fence pair.

**Solution**:

1. Verify outer fence uses 4 backticks
2. Verify inner fences use 3 backticks
3. Check every opening fence has a closing fence at same depth
4. Test rendering in preview

### Symptom: Fence Markers Visible in Output

**Issue**: Backtick markers (``` or ````) show in rendered output.

**Diagnosis**: Fence pairs are broken or nested incorrectly.

**Solution**:

1. Use 4 backticks for outer fence (not 3)
2. Ensure inner fences use 3 backticks
3. Remove any stray backtick groups
4. Verify proper nesting structure

## Testing Your Nested Fences

**Process**:

1. **Write the nested structure** following depth rules
2. **Preview the file** in GitHub preview or markdown editor
3. **Verify formatting** - Check bold, italic, headings render correctly
4. **Count fence pairs** - Every opening fence has one closing fence
5. **Check for literals** - No markdown syntax showing as plain text

**Tools**:

- **GitHub Preview**: View file on GitHub web interface
- **VS Code**: Use markdown preview (Cmd/Ctrl + Shift + V)
- **hugo server**: For Hugo sites, test with local server

## Integration with Other Conventions

This convention works with:

- **[Content Quality Principles](../writing/quality.md)**: Proper code block formatting is part of content quality
- **[Indentation Convention](./indentation.md)**: Code blocks use language-specific indentation
- **[Hugo Content Convention - Shared](../hugo/shared.md)**: Hugo sites need nested fences for markdown examples
- **[Tutorial Convention](../tutorials/general.md)**: Tutorials often demonstrate markdown syntax

## Related Conventions

**Formatting Standards**:

- [Content Quality Principles](../writing/quality.md) - Code block formatting standards
- [Indentation Convention](./indentation.md) - Code block indentation rules
- [Mathematical Notation Convention](./mathematical-notation.md) - LaTeX in markdown (no nesting needed)

**Context-Specific**:

- [Hugo Content Convention - Shared](../hugo/shared.md) - Hugo markdown specifics
- [Tutorial Convention](../tutorials/general.md) - Teaching markdown syntax in tutorials
- [README Quality Convention](../writing/readme-quality.md) - Code examples in README files

## Examples in Documentation Types

### Tutorial Example

Showing code block structure in a tutorial:

`````markdown
````markdown
### Step 3: Create Your First Function

**Code**:

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

**Explanation**: This function takes a name parameter and returns a greeting string.
````
`````

### How-To Guide Example

Documenting a code pattern:

`````markdown
````markdown
## Solution: Error Handling Pattern

**Implementation**:

```typescript
try {
  const result = await fetchData();
  return result;
} catch (error) {
  console.error("Fetch failed:", error);
  throw error;
}
```

**When to use**: Use this pattern for async operations that might fail.
````
`````

### Reference Example

Showing API documentation format:

`````markdown
````markdown
### Method: `calculate()`

**Syntax**:

```javascript
calculate(value: number): number
```

**Parameters**:

- `value` - The input number to calculate

**Returns**: The calculated result
````
`````

## References

**Markdown Specifications**:

- [CommonMark Spec - Fenced Code Blocks](https://spec.commonmark.org/0.30/#fenced-code-blocks) - Official syntax specification
- [GitHub Flavored Markdown](https://github.github.com/gfm/#fenced-code-blocks) - GitHub's markdown implementation

**Related Standards**:

- [Content Quality Principles](../writing/quality.md) - Universal content standards
- [Conventions Index](../README.md) - All documentation conventions
