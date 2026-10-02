---
description: "Per-specialist SUPPRESS blocks, and the instruction-decay specialist."
when_to_use: "Use when scoping a specialist's SUPPRESS block."
---

# Cost-Control and Noise-Control Mechanics: Per-Specialist SUPPRESS Blocks and the Instruction-Decay Specialist (D14)

## Per-specialist SUPPRESS blocks

Beyond the "NOT its job → routes to X" column in the discipline table above (inter-agent routing),
every specialist ALSO carries an explicit **`SUPPRESS` block** — findings it must not raise **at
all**, regardless of which discipline would otherwise own them: nitpicks, style already enforced by
a mechanical gate, speculative "consider adding X" when X is already present, and defense-in-depth
suggestions on a path whose primary defenses are already adequate. The `SUPPRESS` block is the
single highest-value noise lever available to a specialist prompt — it targets **few, high-confidence
findings** as the goal, not maximal coverage; raw-finding-count is an anti-goal, not a proxy for
review quality.

## Instruction-decay dedicated specialist (D14)

Instruction-decay — a framework, build-tool, package-manager, env-var, or CI change in the diff that
is not reflected in `AGENTS.md`/`CLAUDE.md`/`.claude/` — gets its own dedicated eighth specialist,
`pr-review-instruction-checker`, rather than being folded into `pr-review-governance-checker`.
`pr-review-governance-checker` checks conformance to the documented rules; it does not check whether
those rules themselves have gone stale against a changed toolchain. `pr-review-instruction-checker`
also penalizes instruction bloat — generic filler that adds no enforceable rule. It does not police
file length: the word-budget gate owns that, and owns it deterministically.
