# Harness binding catalog drift

One-line summary: triage the 2026-07-20 harness-compat audit findings and reconcile the
platform-binding catalog with upstream harness conventions that have since moved.

> De-promoted 2026-07-21 from a full backlog plan (full detail preserved in git history).

## Problem / context

A `repo-harness-compatibility-checker` run at ose-public commit `6aea08047` found several catalog rows
describing upstream harness conventions that have since drifted. The catalog decides which binding
files this repo emits and which instruction surfaces each vendor reads, so a stale row is not
cosmetic — it can mean shipping a binding file a harness no longer reads or omitting one it now
expects. Phase 0 of the same run was clean (**all five deterministic parity invariants PASS** across
`.claude/`, `.opencode/`, `.amazonq/`); this is entirely about external drift. The highest-rated
findings: **Windsurf → Devin Desktop** (HIGH/HIGH — full vendor+product rebrand as of 2026-06-02 with
an already-passed EOL date), **OpenAI Codex CLI** custom-agent declaration (HIGH/MEDIUM — reportedly
moved from `[agents.<name>]` sub-tables to standalone `.codex/agents/*.toml`, while the repo's live
`.codex/config.toml` still uses the old form), **GitHub Copilot** MCP path (MEDIUM/HIGH) and skills
surface (MEDIUM/MEDIUM — reportedly now reads `.claude/skills/`), and **OpenCode** skills prose (LOW,
incomplete not wrong). Note the audit's own summary contradicts its report body in at least one place:
the summary flagged JetBrains Junie as HIGH, but the report records it `FALSE_POSITIVE`.

> **Narrowed by `update-harness-support` (2026-08-19).** Most of this brief is now closed, and by
> two different mechanisms.
>
> Closed because the harness is gone: **Windsurf → Devin Desktop** and **GitHub Copilot** (both MCP
> path and skills surface). Supported harnesses are now exactly Claude Code, OpenCode, and Codex CLI;
> a catalog row for a harness this repository does not bind cannot mis-emit anything.
>
> Closed because it was fixed: the **OpenAI Codex CLI** custom-agent finding was real. Codex declares
> custom agents as standalone `.codex/agents/*.toml` files, the emitter now produces them, and a
> validator rejects any other extension in that directory. The **OpenCode** skills prose was
> rewritten in the same plan, along with the repository citation (now `anomalyco/opencode`, after
> the upstream organization move), the plural `.opencode/agents/` rationale, the v1
> `theme`/`keybinds`/`tui` deprecation, and the `permission`-versus-`tools` distinction.
>
> What survives, and is the whole of this brief now: the **cautionary note that the audit's own
> summary disagreed with its report body** — the summary rated JetBrains Junie HIGH while the report
> recorded it `FALSE_POSITIVE`. Read the body, never the summary. That is a durable lesson about the
> checker, not about any harness, and it outlives every finding above.
>
> Also still open, and unrelated to the purge: the Amazon Q → Kiro CLI succession term, tracked
> separately in [vendor-audit-kiro-term](./vendor-audit-kiro-term.md). The vendor-audit scanner keeps
> its dropped-harness tokens deliberately — the scanner's job is catching vendor names in
> vendor-neutral prose, which is unrelated to which harnesses the repository binds.

### Folded in from `update-harness-support` Knowledge Capture (2026-08-19)

Each is catalog-shaped and none justifies its own brief.

**A narrow observation became a broad rule.** The defect Phase 4 fixed was not an omission but an
inversion: `validate_no_codex_agents_dir` actively failed when `.codex/agents/` existed. Its true
origin was a correct observation about a **file extension** — Codex reads `.toml` there — hardened
into a false rule about the **directory**. The general shape is worth watching for whenever a
harness observation is turned into a validator: state the rule at the width of the evidence, and
no wider.

**The Codex `Status` cell may understate what loads.** It reads `Partial`, while that plan proved
non-interactively that the project `.codex/config.toml`, root `AGENTS.md`, and the
`.agents/skills/` root all load. Only subagent discovery is unverified, for want of a
non-interactive listing in codex-cli 0.146.0. Re-rate the cell when a listing exists, or restate
what `Partial` is measuring.

**A declared count is a maintenance liability without an expiry.** Catalog and convention prose
that says "the seven surfaces" or "183 hits" is correct on the day it is written and silently
wrong afterwards — that plan found both a stale "seven" and a stale hit count. Prefer a claim the
reader can re-derive, or carry a dated re-verification note.

## Why now

Harness conventions move continuously and each stale row is a latent mis-emit. The audit is already
done and copied to `findings.md` in the folder (the `generated-reports/` original is gitignored and
vanishes on clean), so the evidence exists now but decays as vendors keep changing.

## Prior art / precedents

- **AGENTS.md standard** — the open cross-vendor instruction format the binding catalog resolves each
  harness against. [agents.md](https://agents.md/)
- **Multi-Harness Binding convention** — defines the two-tier binding model and no-shadowing rule the
  catalog implements. [multi-harness-binding](../../../repo-governance/conventions/structure/multi-harness-binding.md)
- **Platform Bindings reference** — the catalog document itself, the primary artifact this triage
  reconciles. [platform-bindings](../../../docs/reference/platform-bindings.md)
- **harness-compatibility-checker** — the agent whose 2026-07-20 run produced the drift findings
  being triaged. [checker agent](../../../.agents/agents/harness-compatibility-checker.md)

## Proposed direction (sketch)

- Triage each Phase 1 finding, deciding per row: update the catalog, update the emitted binding files,
  or record the row as deliberately unchanged with a dated reason.
- Delegate re-verification to `web-researcher` rather than trusting the report's citations — several
  findings are MEDIUM confidence precisely because the checker could not fully settle them.
- Read the report body, not its summary (the summary is known to disagree with it).
- Rows confirmed correct-as-written gain a dated "re-verified" note so the next audit does not
  re-litigate them.

## Rough scope & non-goals

In scope: triage and reconcile the Phase 1 findings; touches `docs/reference/platform-bindings.md` and
possibly the emitters.

Out of scope (for now): Amazon Q → Kiro CLI succession (logged no-drift by request, already in the
catalog); any Phase 0 parity work (already green).

## Risks & open questions

- MEDIUM-confidence findings may not survive independent re-verification — acting on the report
  directly risks chasing a non-issue (the Junie FALSE_POSITIVE is the cautionary example).
- The Codex `config.toml` carries an Nx-tooling provenance caveat — establish who owns that file
  before editing it. (open)
- Any change to emitted output must keep the three-repo binding parity invariants green — re-run the
  checker's Phase 0 before merging.

## What success looks like + promotion signal

Success: the surviving cautionary note is carried into whatever governs the next
`repo-harness-compatibility-checker` run, so no future reader trusts an audit summary over its report
body. There is no longer a promotion signal tied to re-verifying the Windsurf/Devin, Codex CLI, or
Copilot rows — the first and third are moot and the second is done. Promote only if a fresh audit
produces a new drift set worth triaging.
