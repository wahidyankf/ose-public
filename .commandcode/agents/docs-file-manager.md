---
description: |-
  Expert at managing files and directories in docs/ directory. Use for renaming, moving, or deleting files/directories while maintaining kebab-case conventions, fixing links, and preserving git history.
disallowedTools: |-
  agent, agent_output, write_file
name: docs-file-manager
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-file-manager.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
