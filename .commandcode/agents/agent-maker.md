---
description: |-
  Creates new canonical AI agent files in .agents/agents/ following AI Agents Convention, then routes them to every harness via ./rhino harness adapters generate. Ensures proper structure, skills integration, and documentation.
disallowedTools: |-
  agent, agent_output, edit_file
name: agent-maker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/agent-maker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
