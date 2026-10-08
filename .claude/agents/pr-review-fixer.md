---
description: |-
  Executes PR Review Propagation on a frozen review ledger, answering each blocking row on one change with a fix, a reasoned reject, or a deferral, tagging each answer's cause, and committing fixes only to the change's own branch.
effort: xhigh
model: sonnet
name: pr-review-fixer
skills:
  - pr-review-fixer-resolution
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
tools: |-
  Read, Glob, Grep, Write, Edit, Bash, mcp__serena__activate_project, mcp__serena__initial_instructions, mcp__serena__get_current_config, mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__find_implementations, mcp__serena__find_declaration, mcp__serena__get_diagnostics_for_file, mcp__serena__get_diagnostics_for_symbol, mcp__serena__search_for_pattern, mcp__serena__read_memory, mcp__serena__list_memories, mcp__serena__replace_symbol_body, mcp__serena__insert_after_symbol, mcp__serena__insert_before_symbol, mcp__serena__rename_symbol, mcp__serena__safe_delete_symbol, mcp__serena__replace_content, mcp__serena__replace_in_files, mcp__serena__create_text_file, mcp__serena__delete_lines, mcp__serena__replace_lines, mcp__serena__insert_at_line, mcp__serena__write_memory, mcp__serena__delete_memory, mcp__serena__rename_memory, mcp__serena__edit_memory, mcp__serena__execute_shell_command, mcp__serena__remove_project
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/pr-review-fixer.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
