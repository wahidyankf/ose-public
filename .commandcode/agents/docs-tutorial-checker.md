---
description: |-
  Validates tutorial quality focusing on pedagogical structure, narrative flow, visual completeness, hands-on elements, and tutorial type compliance. Complements docs-checker (accuracy) and docs-link-checker (links).
disallowedTools: |-
  agent, agent_output, edit_file
name: docs-tutorial-checker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell, web_search, web_fetch
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-tutorial-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
