---
description: |-
  Creates repository rules and conventions in repo-governance/ directories. Documents standards, patterns, and quality requirements.
disallowedTools: |-
  agent, agent_output
name: rules-maker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/rules-maker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
