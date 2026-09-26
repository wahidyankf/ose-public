---
description: Generated harness mirrors in the binding directories belong on the ledger and must land in the same commit as their canonical `.agents/` source, never a follow-up sync commit
when_to_use: Use whenever you edit a file under the canonical `.agents/` directory, or any other file that has a generated mirror or derived artifact.
---

# Standard 9: Generated Mirrors

## Standard 9 — Generated Mirrors Belong on the Ledger and in the Same Commit

`.agents/agents/` and `.agents/skills/` are the canonical hand-authored agent and Skill sources the
adapter generator reads; `repo-config.yml` `harness:` declares which routes it emits
(`.claude/agents/`, `.claude/skills/`, `.codex/agents/`, and `.opencode/agents/`, each with
its `catalog.json` and `provenance.json`). Secondary binding roots also hold hand-maintained paths
the generator does not own. Editing one canonical definition can therefore modify several
generated files you never opened — all of those generated changes are yours, while unrelated
hand-maintained paths are not.

Rhino provides the generators; nothing runs `generate` for you:

| Command                             | What it does                                                       |
| ----------------------------------- | ------------------------------------------------------------------ |
| `./rhino harness adapters generate` | Regenerates every generated mirror in one declared transaction     |
| `./rhino harness adapters validate` | Byte-parity guard against the emitter output, across every harness |

Neither command has an npm script wrapper. The `harness-adapters` registry gate runs `validate` on
the pre-commit and pull-request surfaces, so a stale adapter fails the commit and the pull request
that carry it; no hook or gate runs `generate`. The obligations follow from that:

1. **Put the mirrors on your ledger.** Generated is not unaccounted-for. Editing
   `.agents/agents/plan-maker.md` rewrites its source digest in the `catalog.json` and
   `provenance.json` of every generated root, and a description or tier change also rewrites its
   route files; Standard 6's reconcile must expect them.
2. **Source and mirror land in the same commit — always.** A commit where they disagree is a broken
   tree for whoever checks it out, and fails the byte-parity guard for unrelated reasons.
3. **Regenerate before you commit.** No hook does it for you. After editing a canonical source, run
   `./rhino harness adapters generate` and stage its output with that source, so the adapters are
   current in the commit that changes them.
4. **Verify rather than assume.** `./rhino harness adapters validate` is the all-harness check. Run
   it after every canonical-source edit, before committing, rather than waiting for the gate to
   reject the commit.
5. **Never hand-edit a generated mirror.** A direct edit to a registry-declared `class: generated`
   path or generated delimited region is overwritten by the next generate. A registry-declared
   `class: vendored` path is maintained in place and covers two structurally different subclasses;
   see [the two vendored
   subclasses](../../../glossary/vendored-exception-subclasses.md)
   for which one applies before hand-editing.

The same reasoning covers every other generated artifact — lockfiles, coverage manifests, emitted
spec stubs. Record the generating command, and let its declared outputs ride in the same commit.
