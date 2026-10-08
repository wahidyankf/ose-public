---
description: |-
  Validates internal and external documentation links. Always uses docs/metadata/external-links-status.yaml as its sole cache, prunes it, and updates lastFullScan on every invocation. Use for dead links, URL reachability, internal references, or link-health audits.
disallowedTools: |-
  agent, agent_output
name: docs-link-checker
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell, web_search, web_fetch
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/docs-link-checker.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
