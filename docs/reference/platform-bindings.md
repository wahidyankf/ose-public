---
title: "Platform Bindings Catalog"
description: Catalog of all AI coding agent platform bindings in ose-public, their directories, root instruction files, and mechanical translation artifacts.
category: reference
created: 2026-05-02
---

# Platform Bindings Catalog

This reference catalogs every AI coding agent platform binding in this repository: where it lives,
what root instruction file it reads, its current status, and what mechanical translations exist
between bindings.

A **platform binding** is the platform-specific directory and configuration that wires an AI coding
agent to this repository. Governance prose lives in `repo-governance/` (vendor-neutral). Platform
bindings live in their own directories and are explicitly excluded from the
[Governance Vendor-Independence Convention](../../repo-governance/conventions/structure/governance-vendor-independence.md).

## Current stable v0.4 contract

The checksum-pinned v0.4 Rhino configuration is authoritative. Canonical content is `AGENTS.md`,
`.agents/agents/*.md`, and `.agents/skills/*/SKILL.md`. The current profiles generate only the
declared routes: Claude receives `CLAUDE.md`, `.claude/agents/plan/` for the three plan agents, and
one pointer `.claude/skills/{name}/SKILL.md` per canonical skill; Codex receives `.codex/agents/`;
and OpenCode receives `.opencode/agents/` and reads `.agents/skills/` natively. No other mirror of a
canonical skill exists. Run `./rhino harness adapters generate` followed by
`./rhino harness adapters validate`; do not hand-edit those generated routes.

The catalog and migration discussion below record the predecessor binding model. They are retained
for provenance, not as instructions for the v0.4 adapter layout.

## Platform Binding Directories

The table below catalogs the three supported coding-agent harnesses — exactly the entries declared
in `repo-config.yml` `harness:`. Columns record every surface each harness exposes so contributors
know which files to create or extend. Harnesses absent from the registry are not supported; adding
one starts with a registry entry, not a row here.

<!-- >>> Rhino generated: historical harness catalog - do not edit inside this region -->

**Verified 2026-08-26.**

| Platform         | Reads root `AGENTS.md` natively?           | Tool-specific instruction surface                                                     | Project MCP config                         | Custom-agent surface                                                                                    | Skills surface                                    | Status                     |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------- |
| Claude Code      | No — reads `CLAUDE.md` (shim `@AGENTS.md`) | `CLAUDE.md`, `.claude/`                                                               | `.mcp.json`                                | `.claude/agents/*.md`                                                                                   | `.agents/skills/*/SKILL.md`                       | Active                     |
| OpenCode         | Yes                                        | `.opencode/agents/` (auto-synced); reads `.agents/skills/` natively                   | `opencode.json`                            | `.opencode/agents/*.md`                                                                                 | reads `.agents/skills/` **and** `.agents/skills/` | Active                     |
| OpenAI Codex CLI | Yes (since Apr 2025)                       | `AGENTS.md`, `RTK.md`, `AGENTS.override.md` (overrides), `.codex/config.toml`[^trust] | `.codex/config.toml` `[mcp_servers]`[^mcp] | `.codex/agents/<name>.toml` standalone files **and** `[agents.<name>]` tables in `config.toml`[^agents] | `.agents/skills/`[^skills]                        | Partial (`.codex/` exists) |

<!-- <<< Rhino generated: harness catalog -->

[^mcp]:
    The MCP key is `mcp_servers` in **snake_case**. The camelCase `mcpServers` form other harnesses
    use is **silently ignored** by Codex — no warning, no error, the servers simply never load.

[^agents]:
    Both mechanisms are official. An `[agents.<name>]` table carries `description` plus an optional
    `config_file` pointing at a TOML layer (e.g. `.codex/<name>.toml`); a standalone
    `.codex/agents/<name>.toml` file needs no entry in `config.toml`. `.codex/agents/<name>.md` is
    not a convention and `./rhino harness adapters validate` rejects it.
    The `[profiles.<name>]` tables that once served this purpose were **removed as of 0.134.0**, in
    favour of standalone `$CODEX_HOME/<name>.config.toml` files.
    The global `[agents]` table accepts `enabled`, `max_concurrent_threads_per_session`,
    `default_subagent_model`, `default_subagent_reasoning_effort`, and `interrupt_message`. Codex
    ships three built-in agents: `default`, `worker`, and `explorer`.

[^trust]:
    Project-level `.codex/` layers are read only for a **trusted** project, and trust is granted
    **per developer on their own machine** — it cannot be shipped in the repository. Codex records
    it in the user's global `~/.codex/config.toml` as
    `[projects."<absolute path>"] trust_level = "trusted"`, keyed by absolute path. A second,
    finer mechanism covers hooks: `[hooks.state."<absolute path>:<event>:<i>:<j>"] trusted_hash =
"sha256:…"`, keyed by path **and** content, so editing `.codex/hooks.json` re-prompts. Until a
    teammate trusts this repository on their own machine, everything under `.codex/` does nothing
    for them. Verified 2026-08-19 against codex-cli 0.146.0.

[^skills]:
    Codex reads the vendor-neutral `.agents/skills/` tree. It does **not** read `.agents/skills/`.
    The older `~/.codex/prompts/` custom-prompt mechanism is officially deprecated in favour of
    Skills.

### Ownership classes

Every path in this catalog carries exactly one declared ownership class, recorded in the
`harness[].ownership` list in `repo-config.yml`. There is no fourth class and no unclassified
residue: `./rhino harness adapters validate` enumerates every tracked file under every binding
directory and fails naming any file it cannot classify.

| Class       | What it means                                                               | Paths here                                                                                                                         |
| ----------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `source`    | Hand-authored canonical input; never written by the emitter                 | `.claude/`, `.agents/agents/`, `CLAUDE.md`, `AGENTS.md`                                                                            |
| `generated` | Emitted from canonical source; must reproduce byte-for-byte                 | `.opencode/agents/`, `.codex/agents/`, `.agents/skills/` (emitter-owned subdirectories)                                            |
| `vendored`  | Third-party payload with no in-repo source; survives regeneration untouched | `.opencode/opencode.json`, `.codex/config.toml`, `.codex/ci-monitor-subagent.toml`, the eight `.agents/skills/` plugin directories |

`.codex/config.toml` is `vendored` **with a delimited generated region**: the emitter owns only the
region between its markers, and the byte guard covers that region alone. Every `vendored`
declaration carries a reason, because an exemption from regeneration with a blank justification is
indistinguishable from an oversight someone silenced.

**See**: [Total Ownership of Binding Files (Rule 8)](../../repo-governance/conventions/structure/multi-harness-binding/ownership-classes.md)

### Root instruction file hierarchy

Platforms that read `AGENTS.md` natively require no additional binding directory — the native read
is sufficient. Platforms that predate the `AGENTS.md` standard (or that require a harness-specific
entry point) receive either a shim that imports `AGENTS.md` (Claude Code's `CLAUDE.md`) or a
generated bridge file.

Some harnesses rank a tool-specific file **above** `AGENTS.md` when both are present. Those files
must never carry content that diverges from `AGENTS.md`. See the
[No-shadowing note](#no-shadowing-note) below.

### Claude Code session settings

`.claude/settings.json` configures the Claude Code sessions opened in this repository:

- A `PostToolUse` hook runs Prettier and then `markdownlint-cli2 --fix` on every Markdown file an
  edit tool writes, alongside the standard formatting and lint pipeline. The hook reads the tool
  payload with `jq`, so `jq` must be installed.
- Reading and editing under `.claude/` and `.opencode/` is pre-authorized, so no approval prompt
  fires. That permission does not override the ownership classes above: edit `source` and
  `vendored` paths only, and regenerate `generated` paths.
- Skills load only from trusted sources. Every skill in this repository is maintained by the
  project team.

### FERRET lifecycle registrations

FERRET (`apps/ferret-cli`) receives harness lifecycle metadata through hand-authored `source` registrations, one per
supported harness. Each forwards the raw hook payload to `ferret capture-hook` and never reads the result. The rules
live in the
[Harness Compatibility Protocol](../../.agents/skills/harness-compatibility-protocol/SKILL.md). Documentation and
installed CLIs were verified 2026-09-21 against Claude Code 2.1.278, Codex 0.155.1, and OpenCode 1.18.7.

| Harness     | Registration source                                           | Documented lifecycle events available to register                                                             | Trust and timing                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code | `.claude/settings.json` to `.claude/hooks/ferret-capture.sh`  | SessionStart, SessionEnd, SubagentStart, SubagentStop, PreToolUse, PostToolUse, PostToolUseFailure            | An interactive session holds hooks until the workspace trust dialog is accepted; `claude -p` runs them and kills async hooks still running at teardown; SessionEnd hooks share a 1.5 s budget      |
| Codex       | `.codex/hooks.json` to `.claude/hooks/ferret-capture.sh`      | SessionStart, SessionEnd, SubagentStart, SubagentStop, PreToolUse, PostToolUse                                | The project `.codex/` layer must be trusted and each hook's exact hash reviewed in `/hooks`, so editing `hooks.json` re-prompts; SessionEnd defaults to 1 s and takes an explicit larger `timeout` |
| OpenCode    | `.opencode/plugins/ferret.ts` (auto-loaded, plural directory) | session.created, session.deleted, session.idle, tool.execute.before, tool.execute.after, message.part.updated | No trust step is documented for project plugins; hooks run in sequence with no documented timeout, so the plugin never awaits the child on frequent events and swallows every exception            |

Capabilities a harness does not expose stay `unknown` rather than inferred. FERRET registers eight Claude Code
events (the tool start, completion, and failure events and a `Skill`-matched `PreToolUse` for skill invocation, which
names the skill in `tool_input.skill`), six Codex events, and four OpenCode events (session created, tool start, tool
completion, and a `skill` tool start). Codex `PostToolUse` also fires after a Bash command exits non-zero, so a
completed Codex tool is recorded with a derived `success` outcome and an unknown duration, and Codex skill invocation
and tool failure stay unknown. OpenCode session end, tool failure, duration, and parent/child relation stay unknown
because the plugin does not register `message.part.updated` and a session-end payload has not been captured live.
Evidence for every row is `evidence/phase-0/harness-probe.txt` and `evidence/phase-4/smoke.txt` in the archived FERRET
Init 01 plan.

### Provenance of pre-existing partial bindings

One binding-adjacent directory exists in the repository but was **not produced by `Rhino agents
sync`**:

- **`.codex/config.toml`** — Provided by the OpenAI Codex CLI tooling. It configures the
  `nx-mcp` MCP server for Codex and declares the `ci-monitor-subagent` agent entry as an
  `[agents.<name>]` table whose `config_file` points to `.codex/ci-monitor-subagent.toml`.
  These files are Codex/Nx infrastructure — not hand-authored custom agents produced by this
  repo's pipeline.

  **Correction (2026-08-19).** The `.codex/agents/` directory was removed on 2026-06-06 under the
  belief that it was not a Codex CLI convention. That was wrong, and the removal note has been
  retracted. Codex CLI recognises **two** per-agent mechanisms, both official:
  1. standalone `.codex/agents/<name>.toml` files, and
  2. `[agents.<name>]` tables in `.codex/config.toml`.

  What never was a convention is `.codex/agents/<name>.md` — Codex reads instruction prose from
  `AGENTS.md`, not from a per-agent Markdown file. `./rhino harness adapters validate` therefore
  permits the directory and fails only on a file whose extension is not `.toml`, naming the
  offending file.

  Note also that a project-level `.codex/` layer is honoured **only for projects the user has
  marked trusted**. On an untrusted project Codex ignores the layer, so nothing in `.codex/` can be
  assumed to load for a fresh clone until that trust decision is made.

`.github/` holds only the in-repo CI surface — GitHub Actions `workflows/` and composite `actions/`,
hand-authored in this repo. The Nx MCP tooling's editor-assistant artifacts that previously lived
there (the `nx-*` agent skills under `.github/skills/`, plus `.github/agents/ci-monitor-subagent.agent.md`
and `.github/prompts/monitor-ci.prompt.md`) were removed; the repo reads Nx skills via the `nx-mcp`
plugin and monitors CI via the `gh` CLI.

The hand-maintained `.codex` files are safe to leave in place; they serve the Nx CI-monitoring
capability and do not affect the canonical `AGENTS.md` instruction surface.

### Generated bindings

Every generated-tier harness in `repo-config.yml` receives its binding mechanically from
`./rhino harness adapters generate` — never by hand:

- **`.opencode/agents/*.md`** — mirrors of `.claude/agents/**/*.md`, flattened to one level, with
  color, model, and tool frontmatter translated (see Translation Artifacts below).
- **`.codex/agents/*.toml`** — one flat TOML file per Claude agent, keyed on the agent's `name`
  frontmatter rather than its filename or role subfolder, carrying `name`, `description`, `model`,
  `model_reasoning_effort`, and `developer_instructions`. Codex reads a role's `config_file` as a
  full config layer, so a `model` set there takes precedence over the session model; a grade with no
  Codex counterpart (`inherit`, a pinned vendor ID) omits the key and raises a conversion warning
  rather than guessing.
- **`.codex/config.toml`** — only the region between the `Rhino generated` markers is
  generator-owned. The hand-maintained `mcp_servers`, `features`, and vendored agent tables outside
  that region are preserved across regeneration.
- **`.agents/skills/`** — a real-file mirror of the whole `.agents/skills/` tree, never symlinks, because the
  mirror is committed and a symlink would not survive `git archive`, a Windows checkout, or a
  container `COPY`. Codex discovers skills only under `.agents/skills/`, whereas Claude Code and
  OpenCode read `.agents/skills/<name>/SKILL.md` natively and need no copy. The registry's
  `vendored:` list names the directories the emitter must never write, delete, or regenerate;
  ownership there is declared, never inferred from "this directory has no source counterpart".

These files are deterministic and idempotent — never hand-edit them. The companion guard
`./rhino harness adapters validate` enforces byte-for-byte parity against the generator and runs in
the pre-push pipeline. The same guard asserts that every present binding directory under `.claude`,
`.opencode`, `.codex`, `.agents`, and `.github` is referenced in this catalog.

### Accepted capability loss: `.opencode/skills/` and `.opencode/commands/`

Both trees were deleted. This was a deliberate, accepted **capability loss**, decided with the
repository owner — not a cleanup, and not a no-op.

What was removed: seven skill directories under `.opencode/skills/` and the `/monitor-ci` command at
`.opencode/commands/monitor-ci.md` — 17 tracked files, all added wholesale by a single commit
(`4239f3d79`, "Nx-generated AI agent configs") with no `.claude/` source of truth this repository
produces or can regenerate.

What the cost is: **OpenCode does not read Claude Code plugins.** Unlike the earlier `.github/skills/`
removal — where the `nx-mcp` plugin covered the gap for Copilot — there is **no equivalent fallback
for OpenCode**. OpenCode users may genuinely lose Nx skill access and the `/monitor-ci` command.
That consequence was stated before the decision and accepted.

### No-shadowing note

Some harnesses rank a tool-specific file **above** the canonical `AGENTS.md` when both files are
present in the repository. These higher-precedence files silently override `AGENTS.md` for that
tool only, producing divergent behaviour invisible to contributors using any other harness.

The following files trigger this rule:

- `AGENTS.override.md` — an **official** OpenAI Codex CLI convention, honoured both globally in
  `~/.codex/` and per-directory in project scope. Codex concatenates `AGENTS.md` files root-down,
  with nearer files overriding farther ones; an `AGENTS.override.md` outranks the `AGENTS.md`
  beside it. Being official is precisely why it is a shadowing hazard rather than a curiosity.

Shadow files belonging to harnesses this repository does not support are out of scope: the rule
applies to the supported set only. `GEMINI.md` and `.junie/AGENTS.md` were previously listed here
and have been removed along with their harnesses.

**This repository's standing decision is to ship no `AGENTS.override.md`.** If a future operational
need forces one to exist, it must be implemented as a pure pointer or import directive referencing `AGENTS.md` —
never as a file with independent prose. Any exception must be recorded in this catalog with an
explicit justification.

See [Multi-Harness Binding Convention](../../repo-governance/conventions/structure/multi-harness-binding.md)
for the full no-shadowing rule (Rule 3 / AD3) and the two-tier binding model that governs all
harness integrations.

### Optional thin pointers

OpenCode and the OpenAI Codex CLI read the root `AGENTS.md` natively, so neither needs a
tool-specific instruction file to receive the canonical instructions. Claude Code is the one
exception, and its `CLAUDE.md` shim is a pure `@AGENTS.md` import.

**Decision: the repo ships no optional thin pointer files** by default. Rationale: each would be
either redundant (the native `AGENTS.md` read already applies) or a drift/shadowing risk. If a thin
pointer is added later, it must be a pure `AGENTS.md` pointer emitted by
`./rhino harness adapters generate` and covered by `./rhino harness adapters validate`.

**Why the generator flattens `.claude/agents/` mirrors:** Claude Code scans `.claude/agents/`
recursively and derives agent identity from the `name` frontmatter key, not the path
([docs](https://code.claude.com/docs/en/sub-agents)). OpenCode does **not** — its maintainers closed
the subdirectory feature request as _not planned_
([opencode#6635](https://github.com/anomalyco/opencode/issues/6635)). Any future reorganization of
`.claude/agents/` into subfolders is safe only when the declared native adapter owns the resulting
mirror family; a mirror consumer that assumed the source shape would break silently.

**Why the directory is `.opencode/agents/` and not `.opencode/agent/`:** the plural form is correct.
The singular name was an OpenCode CLI bug, since fixed. `.opencode/commands/` — also plural — was
likewise the correct path for commands, but this repository ships none: the command tree was deleted
as accepted capability loss (see above), so `.opencode/agents/` exists here and `.opencode/commands/`
does not.

**OpenCode v1 moved presentation keys out of `opencode.json`:** `theme`, `keybinds`, and `tui` now
live in `tui.json`. This repository's `opencode.json` declares `$schema`, `mcp`, `model`,
`permission`, `provider`, `small_model`, and `tools` — none of the three deprecated keys — so no
migration is outstanding.

## Translation Artifacts

Mechanical translations that declared platform profiles apply when generating output from canonical
sources. All translations are performed by `./rhino harness adapters generate`.

### Color Translation (Claude Code → OpenCode)

The Claude Code binding uses named color strings (`blue`, `green`, `yellow`, `purple`, etc.) in
agent frontmatter. OpenCode uses theme tokens (`primary`, `success`, `warning`, `secondary`, etc.).

- **Source**: `.claude/agents/<name>.md` frontmatter `color:` field
- **Transform**: the declared Rhino adapter profile
- **Sink**: `.opencode/agents/<name>.md` frontmatter `color:` field
- **Policy**: [Platform Binding Color Translation](../../repo-governance/development/agents/ai-agents/agent-color-categorization.md#platform-binding-color-translation)
  ("Platform Binding Color Translation" subsection)

| Claude Code color | OpenCode theme token | Role hint            |
| ----------------- | -------------------- | -------------------- |
| `blue`            | `primary`            | Maker agents         |
| `green`           | `success`            | Checker agents       |
| `yellow`          | `warning`            | Fixer agents         |
| `purple`          | `secondary`          | Executor agents      |
| `red`             | `error`              | Critical/alert       |
| `orange`          | `warning`            | (maps to warning)    |
| `pink`            | `accent`             | Reserved future role |
| `cyan`            | `info`               | Informational        |
| unrecognized/hex  | passed through       | Escape hatch         |

### Model ID Translation (Claude Code → OpenCode)

Claude Code agent frontmatter declares a grade alias (`fable`, `opus`, `sonnet`, `haiku`) or
`inherit`. The OpenCode mirror carries **no `model` key at any grade**, so the developer's own
configuration decides: a primary agent falls back to the globally configured model, and a subagent
to the model of the primary that invoked it. OpenCode has no `inherit` sentinel — omitting the key
is the only way to express inheritance.

- **Source**: `.claude/agents/<name>.md` frontmatter `model:` field
- **Transform**: the declared `opencode` profile omits a model projection, so the native adapter
  drops the field
- **Sink**: `.opencode/agents/<name>.md` — no `model:` key is written
- **Policy**: [Model Selection Convention](../../repo-governance/development/agents/model-selection.md)
  ("Platform Binding Examples" section)

Pinning an ID here would override every developer's own model choice and would need re-verifying
against the vendor roster on each roster change. To reverse the decision, add a `model-map:` to the
`opencode` registry entry and re-run `npm run generate:bindings`; no code change is involved.

### Tool Translation (Claude Code → OpenCode)

Claude Code agent frontmatter lists tools as an array of string names. OpenCode uses a
`permission` object mapping each tool to `allow`/`ask`/`deny` (the older boolean flag form
`tools: { read: true, … }` is deprecated/legacy and no longer emitted).

`permission` and `tools` are **separate models in OpenCode, not two spellings of one setting**.
`tools` is a capability switch — whether an action exists for the agent at all. `permission` is a
per-action verdict of `allow`, `ask`, or `deny`, it supports sub-patterns for bash (so
`git push *` can be denied while the rest of bash stays allowed), and **the last matching rule
wins**, which makes declaration order significant. This repository's generated mirrors emit
`permission`; `tools` appears only in the vendored `opencode.json`, never in an emitted agent file.

- **Source**: `.claude/agents/<name>.md` frontmatter `tools:` array
- **Transform**: the declared Rhino adapter profile
- **Sink**: `.opencode/agents/<name>.md` frontmatter `permission:` map (`read: allow`, `write: allow`, etc.)

## Adding a New Platform Binding

To add a new generated binding:

1. Add a `harness:` entry to `repo-config.yml` (tier, agent-dir, mirrors, instruction surfaces, shadow globs, and `skills-dir` / `skills-mirrors` / `vendored:` if the harness needs a skills mirror). Add a `model-map:` giving that harness's model ID for each grade named in the top-level `model-grades:` block only if the harness pins a model per agent; omit it — as the `opencode` entry does — and the mirror emits no `model` key. Also add an `ownership:` list classifying every binding path this entry claims as `generated`, `vendored`, or `source` — `harness ownership validate` is a pre-push gate and fails on any tracked binding file with no declared class.
2. Add the profile's native representation and validate that each required capability is representable.
3. Implement product behavior upstream; consumers only declare profile data and never add a local converter.
4. Add the appropriate consumer proof and upstream product scenarios.
5. Update this document's Translation Artifacts section.
6. Stage the explicit source and generated paths, then run `./rhino harness adapters validate`.
   The generated adapter directories are one recoverable transaction; never hand-edit their
   mirrors. Record any portable sibling obligation in the separate sibling delivery.

## Related

- [Governance Vendor-Independence Convention](../../repo-governance/conventions/structure/governance-vendor-independence.md) —
  policy separating vendor-neutral governance from platform bindings
- [Multi-Harness Binding Convention](../../repo-governance/conventions/structure/multi-harness-binding.md) —
  two-tier binding model, no-shadowing rule, mechanical-generation requirement, and parity guard
- [AI Agents Development Guide](../../repo-governance/development/agents/ai-agents.md) — agent authoring
  guide with binding-specific Platform Binding Examples
- [Model Selection Convention](../../repo-governance/development/agents/model-selection.md) — capability
  tiers and how they resolve to per-binding model IDs
- `AGENTS.md` at repo root — canonical root instruction file read by most platforms
- `CLAUDE.md` at repo root — Claude Code shim importing `AGENTS.md`

Those regenerated mirrors are part of your change: they belong on your touched-file ledger and MUST land in the **same commit** as the `.claude/` source that produced them, never a follow-up sync commit. Verify with `npm run harness:bindings-validation`, which covers every harness including `.codex/`; `npm run validate:sync` checks only the OpenCode mirror and the skills mirror, not `.codex/agents/`. Every generated mirror MUST NOT be hand-edited — except a path an entry's `ownership:` list in `repo-config.yml` declares `vendored`, which is hand-maintained by design. See [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md).
