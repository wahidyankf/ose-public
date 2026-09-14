---
description: "Specifies the required title/metadata section and the introduction (hook) section that open every tutorial."
when_to_use: "Read when drafting the title/metadata section or the introduction (hook) of a tutorial."
---

# Tutorial Structure Requirements: Required Sections (Items 1-2)

All tutorials must follow a consistent structure that supports the learning journey.

## Required Sections (In Order)

### 1. Title and Metadata

**Format**:

```markdown
---
title: "[Subject] Quick Start" or "Tutorial: [Topic]"
description: Brief description (1-2 sentences) of what learner will achieve
category: tutorials
tags:
  - [subject]
  - [domain]
  - quick-start (if applicable)
created: YYYY-MM-DD
---

# [Subject] Quick Start
```

**Requirements**: - Title clearly indicates it's a tutorial/quick start - Description states learning outcome (not just topic) - Tags include subject and domain - Follows [File Naming Convention](../../structure/file-naming.md): kebab-case basenames

### 2. Introduction (The Hook)

**Purpose**: Motivate the learner and set expectations

**Required Elements**: - Opening hook (why this topic matters) - Learning context (real-world relevance) - What learner will achieve by the end - Motivational element (builds excitement)

**Example Structure**:

```markdown
# [Subject] Quick Start

[Opening paragraph: Why this topic matters in real-world context]

**What you'll learn:**

- [Learning objective 1]
- [Learning objective 2]
- [Learning objective 3]

**What makes this valuable**: [Real-world impact or application]
```

**Anti-Pattern**: Starting with dry definitions or theory. Lead with relevance and motivation.
