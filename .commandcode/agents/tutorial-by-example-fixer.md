---
description: |-
  Executes Tutorial By Example Propagation on a frozen tutorial-by-example ledger, repairing only what each example itself settles, with every threshold read from the adopting repository's adapter, and leaving authoring and pedagogy to the author.
disallowedTools: |-
  agent, agent_output
name: tutorial-by-example-fixer
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/tutorial-by-example-fixer.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
