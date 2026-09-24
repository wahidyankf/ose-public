# Phase 1 Drift Dimensions: D4-D7

## D4 — Custom-agent surface

**Check**: confirm the directory path and file format for custom agent definitions match the
harness docs. **Drift indicator**: harness changed the directory path, YAML/frontmatter schema,
or discovery mechanism. **Default criticality**: HIGH — incorrect surface means agents are
silently ignored. **Fix**: update catalog row; for each committed agent file flagged in D6,
add/remove/rename frontmatter fields per the new schema; run `./rhino harness adapters generate` after
editing a canonical agent in `.agents/agents/`. **Confidence**: HIGH for catalog-only; MEDIUM for schema migration of
committed files (each must be re-validated individually).

## D5 — Skills surface

**Check**: confirm the skill discovery path and loading mechanism match the harness docs.
**Drift indicator**: harness changed how skills are discovered/loaded. **Default criticality**:
MEDIUM. **Fix**: update the catalog's "Skills surface" column.

## D6 — Committed binding file conformance

**Check**: beyond catalog-vs-docs drift, inspect committed binding files for structural
violations — agent definitions must match the harness's current required frontmatter schema;
config files must not use fields the harness has removed/deprecated. **Drift indicator**: a
field present in committed files is no longer valid per current docs. **Default criticality**:
MEDIUM (runtime behaviour may silently degrade). **Fix**: remove or rename deprecated fields; do
not add undocumented fields. **Confidence**: HIGH only when the deprecated field is explicitly
documented in a `[Verified]` source; MEDIUM otherwise (skip for safety).

## D7 — Codex agent-file extension conformance (Codex only)

**Check**: every file under `.codex/agents/` must use the extension Codex actually parses
(`.toml`), never `.md`. **Tool**: `git ls-files .codex/agents | grep -c '\.md$'`. **Pass**: no
match. **Fail**: any `.md` file under that directory. **Default criticality**: HIGH (a `.md`
agent file is silently ignored, so the agent simply does not exist for that harness).
**Confidence**: HIGH (mechanical comparison).
