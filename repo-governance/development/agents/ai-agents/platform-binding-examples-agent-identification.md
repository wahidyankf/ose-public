---
description: "Continues color accessibility guidance with a worked agent-identification example."
when_to_use: Use when working through a concrete example of identifying an agent by its color and name.
---

# Platform Binding Examples — Agent Identification Example

**Example agent: `docs-maker`**

```yaml
---
name: docs-maker
description: Expert documentation writer specializing in GitHub-compatible markdown and Diátaxis framework. Use when creating, editing, or organizing project documentation.
tools: Read, Write, Edit, Glob, Grep
model: sonnet
color: blue
---
```

**How users identify this agent (without seeing color):**

1. **Name**: "docs-maker" (text identifier)
2. **Suffix**: "-maker" implies writer/creator role
3. **Description**: "Expert documentation writer" (semantic identifier)
4. **Emoji**: 🟦 appears as a square (shape), regardless of color perception
5. **Field**: `color: blue` is a text value in YAML

**For users with protanopia/deuteranopia**: The blue square appears as a distinct shade but is identifiable by its square shape and accompanying text.

**For users with tritanopia**: The blue square appears pinkish but is identifiable by its square shape and accompanying text.

**For users with complete color blindness (achromatopsia)**: All squares appear as different shades of gray but are identifiable by their position next to agent names and descriptions.
