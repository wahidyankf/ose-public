---
description: The header, body, and footer parts of a commit message and the rules for each.
when_to_use: Use when writing a commit message and needing the exact rules for the header, body, or footer.
---

# The Format Explained

## Header Line (Required)

```
<type>(<scope>): <description>
```

**Components:**

- **`<type>`** (required): The kind of change being made
- **`(<scope>)`** (optional): The area of the codebase affected
- **`<description>`** (required): A brief summary of the change

**Rules:**

- `<type>` must be lowercase (e.g., `feat`, not `Feat` or `FEAT`)
- `(<scope>)` is optional but recommended for clarity
- `<description>` must be in imperative mood (e.g., "add" not "added" or "adds")
- No period at the end of the description
- Aim for a total header length of 50 characters or less; Commitlint, when you run it, rejects anything over 100

## Body (Optional)

The body explains why the change was needed when the subject alone is not enough:

```
Close the gap that let expired sessions remain active after sign-out.
```

**Rules:**

- Blank line required between header and body
- Each line must be 100 characters or less
- Use imperative mood
- Explain the reason for the change without narrating what the code does

## Footer (Optional)

The footer contains metadata about the commit:

```
BREAKING CHANGE: description of breaking change
Fixes #123
Refs #456, #789
```

**Common footers:**

- `BREAKING CHANGE:` - Indicates a breaking API change
- `Fixes #issue` - Links to resolved issues
- `Refs #issue` - References related issues
