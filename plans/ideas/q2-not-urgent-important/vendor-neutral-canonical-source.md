# Vendor-neutral canonical source

One-line summary: move the canonical agent and skill source out of `.claude/` into a vendor-neutral
location so that no harness is privileged and every harness — Claude Code included — becomes a
generated mirror.

> Idea, added 2026-08-19 — captured from `update-harness-support`, which established single-source
> generation and total file ownership and then deliberately left this move out of scope.

## Problem / context

`.claude/` is canonical **by history, not by design**. It is where the agents happened to be written
first, and every emitter since has been built to read from it. Nothing about the content is
Claude-Code-specific: an agent definition is a name, a description, a model tier, a tool policy, and
a body of instructions. The vendor-independence convention already insists governance prose stays
vendor-neutral; the source tree that governance prose describes does not.

The consequence is asymmetry. Claude Code edits the source directly; OpenCode and Codex users edit a
mirror and their edit fails validation. That is defensible only as long as one harness is obviously
primary. The moment a second harness sees real day-to-day use, the arrangement reads as arbitrary —
and it is, because the choice was never made.

**The scale is the reason this is an idea and not a task.** `.claude/` holds **59 skill directories**
and **659 tracked files**. Four validators walk it today by path:

- `governance word-budget validate`
- `governance readme-index validate`
- `harness duplication validate`
- `harness ownership validate`

Every one of those takes `.claude/**` as a configured surface, so the move is a coordinated rename
across the registry, the validators, the emitters, and every governance document that cites a
`.claude/` path — not a `git mv`.

## Why now

Not now — that is the point. What is worth recording now is that
**`update-harness-support` is explicitly point zero for this move.** Before it, the work was
intractable for two reasons that no longer hold:

1. **Single-source generation.** Bindings are emitted from one canonical tree through one shared
   emit path, driven by a `repo-config.yml` registry rather than per-harness branches in code.
   Retargeting the source is now a registry change plus one emitter for the harness that used to be
   the source, not a rewrite.
2. **Total file ownership.** Every tracked file under every binding directory carries a declared
   class — `generated`, `vendored`, or `source`. Before that, "which files are canonical" was not
   answerable mechanically, so a move could not be verified as complete.

And one prerequisite is now in place rather than merely wished for: **divergence triage and reviewed
promotion** (Rule 9). Under a neutral source, _every_ contributor in _every_ harness edits a mirror.
Without a way to detect which side moved and to promote a mirror edit back into source as a reviewed
patch, that arrangement would be hostile — a hand edit in the tool you actually use would simply be
destroyed by the next regeneration. Rule 9 is what makes a neutral source livable, so this brief
depends on it.

## Prior art / precedents

- **[Governance Vendor-Independence Convention](../../../repo-governance/conventions/structure/governance-vendor-independence.md)** —
  the same argument already applied to governance prose; this extends it to the source tree.
- **[Multi-Harness Binding Convention](../../../repo-governance/conventions/structure/multi-harness-binding.md)** —
  Rule 8 (ownership classes) and Rule 9 (divergence triage) are the two prerequisites.
- **[AGENTS.md standard](https://agents.md/)** — the precedent that a vendor-neutral filename at the
  repository root can be the thing every harness reads. `AGENTS.md` already works this way here; the
  agent and skill trees do not.
- **[opencode-v2-migration](./opencode-v2-migration.md)** — a reminder that any harness's schema can
  move under the source; a neutral source makes that a mirror concern rather than a source rewrite.

## Proposed direction (sketch)

- Decide the location first and once — a root `agents/`+`skills/` pair, or a single neutral
  directory — and record the decision, because a second move would cost the same again.
- Add a Claude Code emitter so `.claude/` becomes a generated mirror like the others, and reclassify
  `.claude/**` from `source` to `generated` in the ownership registry. The reclassification is the
  falsifiable proof the move actually happened.
- Retarget the four path-configured validators via `repo-config.yml`, not by editing each validator.
- Move in one commit with the mirrors regenerated in it, since the byte-parity guard would otherwise
  fail the intermediate state.
- Sweep every governance document citing a `.claude/` path — this is the same class-wide sweep the
  harness purge needed, and the same trap applies: fix the class, not only the cited sites.

## Rough scope & non-goals

In scope: the canonical location, a Claude Code emitter, the ownership reclassification, the four
validators' configured surfaces, and the documentation sweep.

Out of scope: changing what an agent or skill _is_; adding or removing harnesses; the vendored
`.agents/skills/` plugin payloads, which have no in-repo source and are unaffected by where the
source lives.

## Risks & open questions

- Does Claude Code tolerate a generated `.claude/`? Nothing suggests otherwise — it reads files, it
  does not own them — but this has not been tested. (open)
- Is a neutral source worth its cost while Claude Code remains the overwhelmingly dominant harness
  here? Honestly arguable; the answer likely changes with usage, not with argument. (open)
- Does making `.claude/` generated weaken the byte-identity story with the private sibling, or strengthen
  it by making both repositories mirror the same neutral tree? (open)

## What success looks like + promotion signal

Success: no harness directory is hand-authored, `.claude/**` is declared `generated` alongside every
other mirror, and a contributor working in any supported harness has the same relationship to the
source. Promote to a `backlog/` plan when a second harness reaches routine day-to-day use here, or
when a contributor first hits the mirror-edit wall in something other than Claude Code — whichever
comes first.
