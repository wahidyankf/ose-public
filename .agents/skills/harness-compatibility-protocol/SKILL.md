---
name: harness-compatibility-protocol
description: Cross-vendor parity invariants, lifecycle delegation, and seven external-drift dimensions shared by the harness compatibility checker and fixer.
when_to_use: When acting as harness-compatibility-checker or harness-compatibility-fixer — running/interpreting a Phase 0 invariant or Phase 1 drift dimension, or writing an audit/fix report.
---

# Repository Harness Compatibility Protocol

## Overview

Two agents share one taxonomy: deterministic and semantic Phase 0 parity invariants (offline,
Bash-based) and seven Phase 1 external-drift dimensions (web-research-backed). The checker
detects; the fixer remediates what's safely mechanical and flags the rest for human judgment.

## Reference Modules

- [phase0-parity-invariants.md](./reference/phase0-parity-invariants.md) — the five
  invariants, each with detection tool/pass/fail/criticality AND fix scope (auto-fixable vs.
  human-required)
- [phase0-quality-gate-filter.md](./reference/phase0-quality-gate-filter.md) — exact-ID delegation
  and retained semantic parity for quality-gate invocation
- [phase1-drift-dimensions-d1-d3.md](./reference/phase1-drift-dimensions-d1-d3.md) and
  [phase1-drift-dimensions-d4-d7.md](./reference/phase1-drift-dimensions-d4-d7.md) — the
  seven dimensions (D1–D7), each with drift indicator/criticality AND fix target/action
- [checker-workflow.md](./reference/checker-workflow.md) and
  [checker-finding-format.md](./reference/checker-finding-format.md) — the checker's own
  workflow steps, research delegation pattern, and finding format
- [fixer-confidence-and-scope.md](./reference/fixer-confidence-and-scope.md),
  [fixer-patterns-and-process.md](./reference/fixer-patterns-and-process.md), and
  [fixer-report-format.md](./reference/fixer-report-format.md) — the fixer's own confidence
  re-validation, fix patterns, process summary, fix report format, and FALSE_POSITIVE
  carry-forward

## Core Principles

1. **Standalone Phase 0 runs in full.** In the quality-gate workflow, exact
   `delegated-gate-ids` filter registered vendor, binding, ownership, catalog, and duplication
   predicates. Missing/stale evidence is `pending`, not a fallback run; unregistered semantic
   parity still runs.
2. **Only Invariant 3 (binding sync) and most Phase 1 dimensions auto-fix** — anything touching
   governance prose, root-instruction files, agent-set divergence, or a new color/tier mapping
   requires human judgment.
3. **Confidence propagates from the checker's cited source**: `[Verified]` → HIGH,
   `[Needs Verification]`/`[Unverified]` → MEDIUM (fixer downgrades and skips),
   `[Outdated]` → FALSE_POSITIVE.
4. **Conservative drift threshold** — flag substantive changes only (a different filename, a
   renamed directory, a removed required field), never minor wording differences.

## Lifecycle Capture Registrations

Hand-authored registrations that forward harness lifecycle events to FERRET (`.claude/settings.json`,
`.codex/hooks.json`, `.opencode/plugins/ferret.ts`) follow these rules; a violation is a parity defect.

1. **Verified events only.** Register an event only when current official documentation for that harness
   names it, and record the URL and accessed date in the delivery evidence. A capability the harness does not
   expose stays `unknown` and is never inferred (Codex skill invocation is `unknown`).
2. **Raw forwarding through one wrapper.** Claude Code and Codex register `.claude/hooks/ferret-capture.sh`. It
   forwards stdin byte-for-byte to `ferret capture-hook --harness <slug> --event <event>` with static
   arguments, never parses or interpolates payload text, always exits 0, writes nothing to stdout, and kills
   its child by 1,000 ms (TERM at 900 ms). The OpenCode plugin forwards its raw bounded payload to the same
   command under the same deadline and swallows every exception.
3. **Parity.** The three harnesses register together; a change to one carries to the others or records why
   not (Multi-Harness Binding Rule 10).
4. **Canonical source, declared mirrors.** This skill's canonical source is
   `.agents/skills/harness-compatibility-protocol/SKILL.md`. `./rhino harness adapters generate` writes only the
   routes `repo-config.yml` declares: the claude-profile pointer `.claude/skills/harness-compatibility-protocol/SKILL.md`.
   No `.opencode/skills` or `.codex` mirror exists for it, and a generated route is never hand-edited.

## Related Agents

`harness-compatibility-checker`, `harness-compatibility-fixer`, `web-researcher`
(delegated Phase 1 research), `rules-checker` and `rules-propagation` (different scope).
