---
description: |-
  Reviews one pinned change for the security discipline, finding secrets in the change, injection, untrusted-input gaps, and unsafe filesystem or version-control operations, and returns anchored findings to the review coordinator, the pr-review checker.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pr-review-security-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pr-review-security-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
