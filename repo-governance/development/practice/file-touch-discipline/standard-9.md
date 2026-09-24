---
description: Generated harness mirrors in the secondary binding directories belong on the ledger and must land in the same commit as their primary binding directory source, never a follow-up sync commit
when_to_use: Use whenever you edit a file under the primary binding directory, or any other file that has a generated mirror or derived artifact.
---

# Standard 9: Generated Mirrors

## Standard 9 — Generated Mirrors Belong on the Ledger and in the Same Commit

`.claude/agents/` and `.agents/skills/` are the canonical hand-authored agent and Skill sources.
Secondary binding roots mix generated outputs with registry-declared vendored paths;
`repo-config.yml` is authoritative at path and region level. Editing one canonical definition can
therefore modify several generated files you never opened — all of those generated changes are
yours, while unrelated vendored paths are not.

Rhino provides the generators, and this repository already automates them:

| Command                             | What it does                                                       |
| ----------------------------------- | ------------------------------------------------------------------ |
| `./rhino harness adapters generate` | Regenerates every generated mirror in one declared transaction     |
| `./rhino harness adapters validate` | Byte-parity guard against the emitter output, across every harness |

Neither command has an npm script wrapper.

**Pre-commit Step 3 runs `harness adapters generate` and auto-stages the result**, so in the normal
path the mirrors are committed for you. The obligations are therefore about the paths where that
automation does _not_ protect you:

1. **Put the mirrors on your ledger.** Auto-staged is not unaccounted-for. Editing
   `.claude/agents/foo.md` puts three mirror paths in your commit; Standard 6's reconcile must
   expect them.
2. **Source and mirror land in the same commit — always.** A commit where they disagree is a broken
   tree for whoever checks it out, and fails the byte-parity guard for unrelated reasons.
3. **Never bypass the hook that generates them.** `--no-verify` skips Step 3, producing that broken
   state — forbidden by the
   [No Destructive Git Operations Convention](../../workflow/no-destructive-git-operations.md).
4. **Verify rather than assume.** `./rhino harness adapters validate` is the all-harness check. Run
   it after any `.claude/` edit not committed through the hook.
5. **Never hand-edit a generated mirror.** A direct edit to a registry-declared `class: generated`
   path or generated delimited region is overwritten by the next generate. A registry-declared
   `class: vendored` path is maintained in place and covers two structurally different subclasses;
   see [the two vendored
   subclasses](../../../glossary/vendored-exception-subclasses.md)
   for which one applies before hand-editing.

The same reasoning covers every other generated artifact — lockfiles, coverage manifests, emitted
spec stubs. Record the generating command, and let its declared outputs ride in the same commit.
