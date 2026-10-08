---
description: |-
  Audits one annotated-concept tutorial's mode, worked examples, and diagrams against the annotated-concept tutorial rules, with every product threshold read from the adopting repository's adapter, and returns criticality-rated findings without modifying anything.
disallowedTools: |-
  agent, agent_output, write_file, edit_file
name: tutorial-annotated-concept-checker
tools: |-
  read_file, read_directory, grep, glob, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/tutorial-annotated-concept-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
