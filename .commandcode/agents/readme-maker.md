---
description: |-
  Creates and updates README.md content while maintaining engagement, accessibility, and quality standards. Rewrites jargony sections, adds context to acronyms, breaks up dense paragraphs, and ensures navigation-focused structure. Use when adding or updating README content.
disallowedTools: |-
  agent, agent_output
name: readme-maker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/readme-maker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
