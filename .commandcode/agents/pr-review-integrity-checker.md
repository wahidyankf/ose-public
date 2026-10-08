---
description: |-
  Reviews one pinned change for the test integrity discipline, finding tests that were loosened, disabled, or cut back, gamed coverage, and bug fixes that land without a regression test, and returns anchored findings.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: pr-review-integrity-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/pr-review-integrity-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
