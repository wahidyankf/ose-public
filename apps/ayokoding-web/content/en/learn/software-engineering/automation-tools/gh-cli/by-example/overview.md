---
title: "Overview"
weight: 10000000
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Overview of the GitHub CLI by-example series: structure, approach, and what to expect from each level"
tags: ["gh", "github-cli", "tutorial", "by-example", "code-first"]
---

This series teaches GitHub CLI through heavily annotated, self-contained shell examples.
Each example focuses on a single command or pattern and includes inline annotations showing
the expected output, explaining what each flag does, and describing why the approach matters
in real workflows.

## Series Structure

The examples are organized into three levels based on complexity:

- [Beginner](/en/learn/software-engineering/automation-tools/gh-cli/by-example/beginner) —
  Authentication, repository operations, issue management, pull request basics, and configuration
- [Intermediate](/en/learn/software-engineering/automation-tools/gh-cli/by-example/intermediate) —
  Advanced PR workflows, releases, gists, GitHub Actions management, secrets, variables, labels,
  SSH keys, and Codespaces
- [Advanced](/en/learn/software-engineering/automation-tools/gh-cli/by-example/advanced) —
  REST and GraphQL API calls, pagination, jq filtering, extensions, scripting patterns, search,
  cache management, attestations, GPG keys, Projects, and CI/CD integration

## Structure of Each Example

Every example follows a consistent five-part format:

1. **Brief Explanation** — what the command does and why it exists (2-3 sentences)
2. **Mermaid Diagram** — visual representation of the operation or data flow (when appropriate)
3. **Heavily Annotated Code** — shell commands with `# =>` comments showing output and effects
4. **Key Takeaway** — the core insight to retain from the example (1-2 sentences)
5. **Why It Matters** — production relevance and real-world impact (50-100 words)

## How to Use This Series

Each example contains a complete, runnable shell snippet. Read the `# =>` annotations alongside
the commands to understand both the mechanics and the intent. The examples within each level
build thematically, so reading sequentially provides the fullest understanding. Experienced
developers can also jump directly to the level and topic relevant to their current task.
