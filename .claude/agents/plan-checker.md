---
description: |-
  Audits a complete plan draft against the plan specification and returns criticality-rated findings to the plan quality gate, without modifying anything it audits.
disallowedTools: |-
  mcp__serena__replace_symbol_body, mcp__serena__insert_after_symbol, mcp__serena__insert_before_symbol, mcp__serena__rename_symbol, mcp__serena__safe_delete_symbol, mcp__serena__replace_content, mcp__serena__replace_in_files, mcp__serena__create_text_file, mcp__serena__delete_lines, mcp__serena__replace_lines, mcp__serena__insert_at_line, mcp__serena__write_memory, mcp__serena__delete_memory, mcp__serena__rename_memory, mcp__serena__edit_memory, mcp__serena__execute_shell_command, mcp__serena__remove_project
model: inherit
name: plan-checker
skills:
  - docs-applying-content-quality
  - plan-writing-gherkin-criteria
  - plan-creating-project-plans
  - plan-validating-quality
  - docs-validating-factual-accuracy
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-understanding-shared-vocabulary
tools: |-
  Read, Glob, Grep, Bash, WebSearch, WebFetch, mcp__serena__activate_project, mcp__serena__initial_instructions, mcp__serena__get_current_config, mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__find_implementations, mcp__serena__find_declaration, mcp__serena__get_diagnostics_for_file, mcp__serena__get_diagnostics_for_symbol, mcp__serena__search_for_pattern, mcp__serena__read_memory, mcp__serena__list_memories
---

Before acting, read the complete canonical agent definition at the repository-root path .agents/agents/plan-checker.md and follow it as authoritative. If it cannot be read, stop and report the missing path.
