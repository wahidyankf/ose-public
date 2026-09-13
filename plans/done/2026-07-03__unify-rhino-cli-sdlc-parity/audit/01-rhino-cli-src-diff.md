# Phase 0 Re-Audit — 2026-07-02 (re-run before Phase 1)

## rhino-cli src diff -rq (pairwise)

```
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_config/mod.rs and ~/ose-projects/ose-primer/apps/rhino-cli/src/application/repo_config/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/cucumber_expr.rs and ~/ose-projects/ose-primer/apps/rhino-cli/src/application/speccoverage/cucumber_expr.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/extractors.rs and ~/ose-projects/ose-primer/apps/rhino-cli/src/application/speccoverage/extractors.rs differ
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/application: testcoverage
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/commands: git.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/specs_coverage.rs and ~/ose-projects/ose-primer/apps/rhino-cli/src/commands/specs_coverage.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/specs_validate_counts.rs and ~/ose-projects/ose-primer/apps/rhino-cli/src/commands/specs_validate_counts.rs differ
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/commands: specs_validate_links.rs
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/commands: test_coverage_validate.rs
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/commands: testcoverage.rs
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: agents
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: cliout
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: contracts
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: docs
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal/git: runner.rs
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: java
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: mermaid
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: naming
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: speccoverage
Only in ~/ose-projects/ose-primer/apps/rhino-cli/src/internal: testcoverage
---
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/agent_validator.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/agent_validator.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/bindings.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/bindings.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/claude_validator.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/claude_validator.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/converter.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/converter.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/detect_duplication.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/detect_duplication.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/frontmatter.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/frontmatter.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/reporter.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/reporter.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/skill_validator.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/skill_validator.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/sync.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/sync.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/sync_validator.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/sync_validator.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/types.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/types.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/agents/yaml_formatting.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/agents/yaml_formatting.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/allowlist.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/allowlist.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/bcregistry.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/bcregistry.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application: behavior_coverage
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/docs/frontmatter.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/docs/frontmatter.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/docs/heading_hierarchy.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/docs/heading_hierarchy.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/docs/links.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/docs/links.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/application/docs: md_walk.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/docs/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/docs/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/docs/naming.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/docs/naming.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/doctor/checker.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/doctor/checker.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/doctor/fixer.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/doctor/fixer.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/doctor/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/doctor/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/doctor/reporter.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/doctor/reporter.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/doctor/tools.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/doctor/tools.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/domain_coverage/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/domain_coverage/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/env/backup.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/env/backup.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/env/injection.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/env/injection.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/env/validate.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/env/validate.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application: git
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/glossary.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/glossary.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/naming/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/naming/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/naming/reporter.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/naming/reporter.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_config/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_config/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/agents_md_size.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/agents_md_size.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/audit_orchestrator.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/audit_orchestrator.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/emoji_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/emoji_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/frontmatter_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/frontmatter_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/gherkin_keyword_cardinality_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/gherkin_keyword_cardinality_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/instruction_size.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/instruction_size.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/layer_coherence.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/layer_coherence.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/license_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/license_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/readme_index_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/readme_index_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/traceability_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/traceability_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/repo_governance/vendor_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/repo_governance/vendor_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/severity.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/severity.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/checker.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/checker.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/cucumber_expr.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/cucumber_expr.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/extractors.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/extractors.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/matcher.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/matcher.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/parser.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/parser.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/reporter.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/reporter.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/types.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/types.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/speccoverage/util.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/speccoverage/util.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/application/specs.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/application/specs.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/application: testcoverage
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/cli.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/cli.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: agents_detect_duplication.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: agents_emit_bindings.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: agents_sync.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: agents_validate_bindings.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: agents_validate_claude.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: agents_validate_naming.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: agents_validate_sync.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: contracts_dart_scaffold.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: contracts_java_clean_imports.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/convention_validate_instruction_size.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/convention_validate_instruction_size.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: ddd_bc.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: ddd_ul.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: docs_validate_frontmatter.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: docs_validate_heading_hierarchy.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: docs_validate_links.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: docs_validate_mermaid.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: docs_validate_naming.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/doctor.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/doctor.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/env_backup.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/env_backup.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/env_init.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/env_init.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/env_restore.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/env_restore.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/env_staged_guard.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/env_staged_guard.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/env_validate.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/env_validate.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands: git_pre_commit.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: governance_agents_md_size.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: governance_emoji_audit.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: governance_frontmatter_audit.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: governance_gherkin_keyword_cardinality_audit.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/governance_layer_coherence.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/governance_layer_coherence.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: governance_license_audit.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: governance_readme_index_audit.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/governance_traceability_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/governance_traceability_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/governance_vendor_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/governance_vendor_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/harness_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/harness_audit.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/harness_generate_bindings.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/harness_generate_bindings.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands: harness_validate_instruction_size.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/harness_validate_naming.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/harness_validate_naming.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: java_validate_annotations.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/lang_java_validate_null_safety.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/lang_java_validate_null_safety.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/md_validate_heading_hierarchy.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/md_validate_heading_hierarchy.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/md_validate_links.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/md_validate_links.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: spec_coverage_validate.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/specs_audit.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/specs_audit.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands: specs_bc.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/specs_coverage.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/specs_coverage.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/specs_gherkin_cardinality.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/specs_gherkin_cardinality.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/specs_structure_validate.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/specs_structure_validate.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands: specs_ul.rs
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands: specs_validate_adoption.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/specs_validate_counts.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/specs_validate_counts.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands: specs_validate_tree.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: test_coverage_diff.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: test_coverage_merge.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/commands: test_coverage_validate.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands/workflows_validate_naming.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands/workflows_validate_naming.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/commands.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/commands.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/domain/git/staged_files.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/domain/git/staged_files.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/infrastructure/git/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/infrastructure/git/mod.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/infrastructure/git/root.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/infrastructure/git/root.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/infrastructure/git: staged_files.rs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/infrastructure/mod.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/infrastructure/mod.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: agents
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/agents.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/agents.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/allowlist.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/allowlist.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: application
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/bcregistry.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/bcregistry.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: cliout.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: docs
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/docs.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/docs.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: doctor
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/doctor.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/doctor.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: domain
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/git/root.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/git/root.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/git.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/git.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/glossary.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/glossary.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: infrastructure
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: mermaid.rs
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: naming
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/naming.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/naming.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: repo_governance
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/repo_governance.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/repo_governance.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/severity.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/severity.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: speccoverage
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/speccoverage.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/speccoverage.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/specs.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/specs.rs differ
Only in ~/ose-projects/ose-infra/apps/rhino-cli/src/internal: testcoverage
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal/testcoverage.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal/testcoverage.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/internal.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/internal.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/lib.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/lib.rs differ
Files ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src/main.rs and ~/ose-projects/ose-infra/apps/rhino-cli/src/main.rs differ
Only in ~/ose-projects/ose-public/worktrees/unify-rhino-cli-sdlc-parity/apps/rhino-cli/src: test_support.rs
```
