# An unsourced `ci-monitor-subagent.md` mirror survives only by a hardcoded filename skip

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: the private sibling carries `.opencode/agents/ci-monitor-subagent.md` with no
`.claude/agents/` source, and the mirror-drift validator stays quiet about it only because
`rhino-cli` hardcodes a skip for that exact filename — a carve-out that both parity repos inherit
through the byte-identity boundary.

> Provenance: routed to `backlog/` by
> [adopt-cursor-platform-binding](../../done/2026-07-28__adopt-cursor-platform-binding/README.md) during
> its Knowledge Capture phase (verdict row I14, recorded **NO CHANGE, RECORD**), then demoted from a
> full `backlog/` plan to this two-pager on 2026-08-05. The original plan referred to the repository
> by its former name, `ose-infra`.

## Problem / context

This repo's binding model is unambiguous: `.claude/` is the only hand-authored surface, and
`.opencode/`, `.codex/`, and `.agents/` are emitted by `./rhino harness adapters generate`. A
file sitting in a generated mirror directory with no source is therefore drift by construction — no
regeneration will ever update it, and no source edit will ever reach it. The private sibling has exactly
one such file: `.opencode/agents/ci-monitor-subagent.md`, present in the mirror and absent from
`.claude/agents/`.

The interesting part is why nothing flags it. `harness naming validate` compares the two directory
listings, but `list_agent_files` in `apps/rhino-cli/src/commands/harness_validate_naming.rs` (line 157) skips two filenames unconditionally — `README.md` and `ci-monitor-subagent.md` — so the one file
that would be reported is filtered out before the comparison runs. That is the same vacuous-gate
shape as [mermaid-validator-does-not-check-syntax](../q1-urgent-important/mermaid-validator-does-not-check-syntax.md): the
board is green because nothing looked.

Two concrete data points sharpen the shape of it. First, `ose-public` itself is clean —
`.claude/agents/` and `.opencode/agents/` held 91 files each at the time of writing, and neither
contained a `ci-monitor-subagent.md`. Second, the filename
matches a plugin-provided agent (`nx:ci-monitor-subagent`, the CI helper for `/monitor-ci`), which
raises the real possibility that the file was installed by tooling rather than authored — in which
case the right answer is a declared exclusion, not a deletion. That origin is not established.

The carve-out also does not stay in one repo. `apps/rhino-cli` is byte-identical across `ose-public`
and the private sibling with no carve-outs, so both ship a validator that names a
specific file that exists in only one of them.

## Why now

The evidence is already gathered and fresh: the Cursor-binding plan enumerated the orphan, traced it
to the exact source line, deliberately left it alone, and wrote down why. Re-deriving that costs more
than acting on it.

Each new generated binding also widens the asymmetry rather than closing it. Every emitter reads
`.claude/agents/`, so the orphan is simply absent from the other generated trees — the file exists in
one and not the rest, and the same hardcoded skip keeps that difference invisible too. Every
additional harness compounds a divergence nobody can see.

> Narrowed by `update-harness-support`. Three of that plan's outcomes bear on this brief. The
> `.cursor/` and `.amazonq/` trees named above are deleted; `.codex/` and `.agents/` replace them.
> The `.opencode/commands/` and `.opencode/skills/` counter-example paths are deleted too, so the
> ose-public cleanliness argument now rests on the agent directories alone. And Rule 8 makes vendored
> ownership a **declared** class — ose-public declares `.codex/ci-monitor-subagent.toml` vendored
> with a reason, which is exactly the "declared exclusion, not a deletion" outcome this brief
> proposed, applied to the Codex sibling of the same file. The private-sibling orphan and the hardcoded
> `list_agent_files` skip that hides it both survive untouched.

Finally, the skip lives in a byte-identity-gated file. Every future change to the naming validator
carries the carve-out forward into both parity repos, so the cost of leaving it is not static.

## Prior art / precedents

- **[adopt-cursor-platform-binding](../../done/2026-07-28__adopt-cursor-platform-binding/README.md)** —
  the plan that found it. Its
  [`tech-docs.md`](../../done/2026-07-28__adopt-cursor-platform-binding/tech-docs.md) section on
  pre-existing divergence holds the full verdict-row reasoning and the source-line citation; read it
  before anything else.
- **[Multi-Harness Binding Convention](../../../repo-governance/conventions/structure/multi-harness-binding.md)**
  — defines the two-tier source/generated model that makes an unsourced mirror file a defect at all.
- **[File-Touch Discipline](../../../repo-governance/development/practice/file-touch-discipline.md)** —
  the rule that generated mirrors are never hand-edited and land in the same commit as their source;
  this orphan is that rule's unenforced case.
- **[sdlc-gate-registry-enforcement](../../done/2026-08-07__sdlc-gate-registry-enforcement/README.md)** —
  the plan that fulfilled and retired the `tri-repo-rhino-cli-byte-identity-gate` idea, landing the
  standing byte-identity boundary that turns a one-line validator change into a coordinated
  multi-repo landing. Any fix here is constrained by it.
- **[multi-harness-compatibility](../../done/2026-05-24__multi-harness-compatibility/README.md)** — the
  original binding-parity effort; whatever it did or did not normalize about mirror completeness is
  where the skip most likely originated.

## Proposed direction (sketch)

Measure before deciding. The single question that resolves everything downstream is where the file
came from: installed by tooling, hand-authored and later orphaned, or a leftover from a binding
generation that predates the current model. That answer selects one of three outcomes.

- **Leftover** — delete the mirror file and drop the filename from the validator's skip list.
- **Genuinely sourced, source lost** — restore the `.claude/agents/` source and regenerate, so the
  mirror is produced rather than tolerated.
- **Tool-installed and legitimate** — keep the file, but stop expressing that as a hardcoded filename
  in Rust. `repo-config.yml` already holds the authoritative harness registry with per-entry
  `agent-dir` / `mirrors` fields; a declared exclusion belongs there, read by the validator, visible
  to anyone auditing what the gate does and does not check.

In every outcome the terminal state is the same: no filename-specific literal remains in
`list_agent_files`, and whatever exemption survives is declared where a reader can find it.

## Rough scope & non-goals

In scope: the one orphan file in the private sibling; the hardcoded skip in
`apps/rhino-cli/src/commands/harness_validate_naming.rs` across all three byte-identical copies; and
any governance sentence that currently implies every `.opencode/agents/*.md` has a `.claude/` source
when the validator cannot actually certify that.

Out of scope:

- The Cursor platform binding itself — shipped and closed; this brief inherits an observation from
  that plan, not its scope.
- The `README.md` entry in the same skip list. That exclusion is well understood and separately
  justified; only the agent-file carve-out is in question.
- The `.opencode/agents/README.md` present in `ose-public` but not in the siblings — a related but
  distinct mirror-shape divergence recorded by the same plan, invisible to the same guards, and not
  routed here.
- What the CI-monitoring workflow or its plugin actually does. Its behaviour is not being re-litigated;
  only the provenance of one mirror file is.
- Any private-sibling infrastructure content. This brief concerns governance and tooling shape only.

## Risks & open questions

- **Where did the file come from?** Nobody has established whether it was authored, installed by a
  plugin, or left behind by an older generation pass. Every proposed outcome depends on this. (open)
- **Does the plugin-agent name match by coincidence or by origin?** The filename matches a
  plugin-provided CI-helper agent, which is suggestive but not proof. (open)
- **Does removing the skip surface more than one file?** The skip is filename-scoped, so it may be
  masking unsourced mirrors elsewhere. Running the validator without it is the cheapest way to size
  the whole problem — and the answer may be zero, one, or many. (open)
- **Is a coordinated two-repo landing proportionate?** The validator sits inside the byte-identity
  boundary, so even a two-line change must land in both parity repos in lockstep. That cost may
  exceed the value of removing one carve-out. (open)
- **Does the private sibling want this at all?** It is proprietary and sits outside the content-parity
  loop, so a normalization that `ose-public` finds obviously correct may not be wanted there. Same
  question shape as
  [sibling-main-ci-never-runs-on-merge](./sibling-main-ci-never-runs-on-merge.md). (open)
- Deleting a mirror file that an active OpenCode session resolves by name could break that session
  silently, since nothing else references it. Unverified.

## What success looks like + promotion signal

Success: for every repository, `.opencode/agents/` contains exactly the generated mirrors of that
repo's `.claude/agents/`, and the naming validator hardcodes no filename. Any surviving exemption is
declared in `repo-config.yml` where an auditor can read it, so the gate's coverage is legible rather
than buried in a Rust literal.

Promotion signal: ripe once two things are known — the file's actual origin in the private sibling, and the
count of unsourced mirror files that appear when the skip is removed across all repos. Those two
answers also decide whether this deserves a plan at all: if the origin is "stale leftover" and the
count is one, this is a delete plus a small validator change and should simply be done, folded into
the next `apps/rhino-cli` parity landing rather than promoted. Promote only if the count comes back
greater than one, or if the file turns out to be legitimately tool-installed and the exclusion
therefore needs a designed, declared home.
