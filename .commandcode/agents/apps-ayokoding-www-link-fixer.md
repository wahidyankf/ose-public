---
description: Applies validated fixes from link-checker audit reports. Re-validates link findings before applying changes.
disallowedTools: |-
  agent, agent_output
name: apps-ayokoding-www-link-fixer
tools: |-
  read_file, read_directory, grep, glob, write_file, edit_file, shell_command, run_command, kill_shell, web_search, web_fetch, mcp__serena__activate_project, mcp__serena__initial_instructions, mcp__serena__get_current_config, mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__find_implementations, mcp__serena__find_declaration, mcp__serena__get_diagnostics_for_file, mcp__serena__get_diagnostics_for_symbol, mcp__serena__search_for_pattern, mcp__serena__read_memory, mcp__serena__list_memories, mcp__serena__replace_symbol_body, mcp__serena__insert_after_symbol, mcp__serena__insert_before_symbol, mcp__serena__rename_symbol, mcp__serena__safe_delete_symbol, mcp__serena__replace_content, mcp__serena__replace_in_files, mcp__serena__create_text_file, mcp__serena__delete_lines, mcp__serena__replace_lines, mcp__serena__insert_at_line, mcp__serena__write_memory, mcp__serena__delete_memory, mcp__serena__rename_memory, mcp__serena__edit_memory, mcp__serena__execute_shell_command, mcp__serena__remove_project
---

Before acting, read the complete canonical agent definition at the repository-root path
.agents/agents/apps-ayokoding-www-link-fixer.md and follow it as authoritative.
If it cannot be read, stop and report the missing path.
