---
description: "Covers sync automation, documentation references, migration history, best practices, and troubleshooting for multi-harness binding operations."
when_to_use: Use when an agent or Skill change needs to propagate across the multi-harness adapters, or when troubleshooting a sync failure.
---

# Multi-Harness Binding Operation — Sync Automation, References, History, Practices, and Troubleshooting

## Sync Automation

**Generator**: `./rhino harness adapters generate` (Rust). No `scripts/sync-agent-configs.sh` /
`.js` exists in this repository.

**Commands**:

- `./rhino harness adapters generate` - Full sync, every generated-tier harness, in one declared
  transaction
- `./rhino harness adapters validate` - every generated-tier binding including `.codex/`; no
  lifecycle gate runs it, so run it after any binding change

Neither command has an npm script wrapper.

**Conversion Logic**:

- **`.opencode/agents/`**: canonical Markdown/YAML → Markdown/YAML permission object plus model
  mapping
- **`.codex/agents/`**: canonical metadata/body → TOML `name`, `description`, and
  `developer_instructions`; tool/model frontmatter is omitted, and the generator also owns the
  delimited agent-table region in `.codex/config.toml`
- **Agent skills**: one harness reads `.agents/skills/` natively; the other gets non-vendored
  real-file byte-copy mirrors under `.agents/skills/`; vendored plugin subtrees are preserved
- **Validation**: three generated sets now, not two — `.opencode/agents/`, `.codex/agents/` (plus
  the generated region in `.codex/config.toml`), and non-vendored mirrors under `.agents/skills/`.
  `./rhino harness adapters validate` checks all three.

## Documentation References

- **[CLAUDE.md](../../../../CLAUDE.md)** - the coding agent's shim, `class: source` (hand-authored)
- **[AGENTS.md](../../../../AGENTS.md)** - vendor-neutral root file read by `.opencode/` and
  `.codex/`, `class: source` for both (hand-authored, no auto-generated warning)
- **[Agent catalog](../../../../.agents/agents/README.md)** - authoritative for every binding;
  `.opencode/agents/` and `.codex/agents/` carry no catalog of their own
- **[Agent skills catalog](../../../../.agents/skills/README.md)** - authoritative source catalog;
  **[secondary mirror](../../../../.agents/skills/README.md)** is Codex's generated real-file copy

## Migration History

- **2026-01-12**: Initial secondary platform binding migration
- **2026-01-16**: Dual-binding setup established, `.claude/` created as source of truth

## Best Practices

1. **Edit the declared source** - Never edit a `class: generated` file directly; changes will be
   overwritten. Edit registry-declared vendored paths such as `.opencode/opencode.json` or the
   undelimited region of `.codex/config.toml` in place.
2. **Run sync after changes** - Ensure every generated-tier binding stays synchronized
3. **Test every platform** - Verify agents work in all supported platforms after major changes
4. **Document sync status** - Keep canonical README indexes current, then regenerate every
   registry-declared mirror
5. **Security policy** - Only use skills from trusted sources (all platforms)

## Troubleshooting

**Problem**: generated agent routes out of sync with `.agents/agents/`
**Solution**: Run `./rhino harness adapters generate` to regenerate

**Problem**: Conversion errors during sync
**Solution**: Check canonical metadata in `.agents/agents/` with `./rhino metadata validate`, fix it, re-sync

**Problem**: agent skills missing in one directory
**Solution**: Verify skills exist in `.agents/skills/`, then run `./rhino harness adapters generate`

---

**Appendix Added**: 2026-01-16
**See Also**: [Repository Governance Architecture](../../../repository-governance-architecture.md)
