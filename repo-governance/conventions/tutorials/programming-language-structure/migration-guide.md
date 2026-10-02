---
description: Six-step walkthrough for completing the Full Set Tutorial Package for a language created before the Full Set requirement existed.
when_to_use: Use when backfilling missing Full Set Tutorial Package components for an existing language.
---

# Migration Guide

## Completing Full Set Tutorial Package for Existing Language

If a language is missing components (created before Full Set requirement), follow these steps:

**Step 1: Audit current state**

```bash
cd apps/ayokoding-www/content/en/learn/software-engineering/programming-language/[language]/tutorials/
ls -la  # Check what exists
```

**Step 2: Create missing components in priority order**

```bash
# Component 3 (PRIORITY) - by-example/ if missing
mkdir -p by-example
touch by-example/_index.md         # weight: 1000000
touch by-example/overview.md       # weight: 10000000
touch by-example/beginner.md       # weight: 10000001 (Examples 1-25)
touch by-example/intermediate.md   # weight: 10000002 (Examples 26-50)
touch by-example/advanced.md       # weight: 10000003 (Examples 51-75)

# Component 4 - by-concept/ if missing
mkdir -p by-concept
touch by-concept/_index.md         # weight: 1000001
touch by-concept/overview.md       # weight: 10000000
touch by-concept/beginner.md       # weight: 10000001 (0-40%)
touch by-concept/intermediate.md   # weight: 10000002 (40-75%)
touch by-concept/advanced.md       # weight: 10000003 (75-95%)

# Component 5 - cookbook/ if missing
mkdir -p cookbook
touch cookbook/_index.md           # weight: 1000002
```

**Step 3: Update tutorials/\_index.md navigation**

Ensure correct order (by-example first):

```markdown
- [By Example](/en/.../by-example) # Component 3 - PRIORITY
- [By Concept](/en/.../by-concept) # Component 4
- [Cookbook](/en/.../cookbook) # Component 5
- [Initial Setup](/en/.../initial-setup) # Component 1
- [Quick Start](/en/.../quick-start) # Component 2
```

**Step 4: Verify all component weights**

```bash
# Verify weight values:
# by-example/_index.md → 1000000
# by-concept/_index.md → 1000001
# cookbook/_index.md → 1000002
# initial-setup.md → 1000003
# quick-start.md → 1000004
```

**Step 5: Write content**

Follow [By Example Tutorial Convention](../swe-by-example.md) to create 75-90 annotated examples.

**Step 6: Validate**

Run `tutorial-by-example-checker` to verify structure and content quality.
