# Doc command existence validation

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: a `rhino-cli` validator that mechanically detects documentation-cited commands
that do not exist, the same way the repo already gates links, headings, and file naming.

> De-promoted 2026-07-21 from a full backlog plan (full detail preserved in git history).

## Problem / context

The repo already treats several classes of documentation claim as machine-checkable — internal
links, heading hierarchy, file naming, README indexes, Gherkin cardinality — but a command cited in
a doc is the same shape of claim (an assertion about repository reality) and is currently ungated.
In a single working session, three independent surfaces each cited `rhino-cli` Nx targets that do
not exist: `AGENTS.md`, a live plan's `delivery.md` (as verbatim executable gate acceptance
criteria — two independent `plan-checker` runs flagged it CRITICAL), and
`repo-governance/development/infra/nx-targets.md`, the doc that is _supposed_ to be the authority on
target names. Ground truth: `npx nx show project rhino-cli --json` resolves **21 targets**, none
matching the citations; and the `nx-targets.md` canonical table lists **six** nonexistent targets,
not three. Because agents read these files as executable instruction, a stale command does not get
charitably reinterpreted — an agent runs it, fails, and either stalls or silently improvises.

### Corroboration — a trap this validator would fall into (2026-08-21)

`repository-onboarding-readme-refresh` Phase 0 needed exactly the check this brief proposes, by
hand, and got it wrong the obvious way. A `rhino-cli` command group requires a subcommand, so
`./rhino md --help` exits `2` with `error: './rhino md' requires a subcommand but one was not
provided`. `rhino-cli help md mermaid` also exits `2` while printing its full help page correctly.
An existence check written as `cmd --help && echo ok` therefore reports **every real subcommand as
missing**.

That matters here because it is the shape a first implementation of this validator would reach for.
The working method is to parse the `Commands:` section of
`rhino-bin.sh --no-color help <group> <subcommand>` and never read its exit status — and to pass
`--no-color`, or ANSI escapes defeat the parser. Whatever this validator ends up doing, "shell out
and check the exit code" is a known-wrong design for at least one of the CLIs it must cover.

## Why now

The drift is self-inflicted and recurring: commands get renamed and removed routinely, and every
rename silently invalidates an unknown number of citations across both parity repos. No amount of
"check the canonical doc" discipline helps when the canonical doc is itself the thing that drifted.
Only a mechanical check against the running system closes this, and the sibling `md * validate`
family already establishes the exact pattern to extend.

## Prior art / precedents

- **rhino-cli `md * validate` family** — the existing link/heading/mermaid validators this new
  `md commands validate` extends.
  [markdown quality](../../../repo-governance/development/quality/markdown.md)
- **Rust doctests** — prior art for verifying documentation claims (code examples) against the real
  system, the same principle applied to cited commands.
  [doctests](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html)
- **markdownlint** — established mechanical validation of documentation against declared rules.
  [markdownlint](https://github.com/DavidAnson/markdownlint)
- **Nx targets reference** — the canonical target doc that itself drifted, motivating a check
  against the running project graph. [nx-targets](../../../repo-governance/development/infra/nx-targets.md)

## Proposed direction (sketch)

- A new `rhino-cli` subcommand `md commands validate` scanning tracked markdown, in the existing
  `md <subject> validate` family (functional core / imperative shell).
- Three detector families, each with an authoritative in-repo oracle: Nx targets (against the
  resolved project graph, inferred targets included), npm scripts (against the relevant
  `package.json`), and rhino-cli subcommands (against rhino-cli's own live clap command tree).
- Conservative-by-default detection (fenced blocks only, templates/`$VAR`/`<placeholder>` ignored)
  with an opt-in `--strict` wider sweep.
- A two-tier exemption mechanism: inline per-occurrence annotation with a mandatory written reason,
  plus a config path allowlist for structurally out-of-scope trees.
- Wire into `pre-push` and the CI `markdown-per-file` job; remediate existing violations first so
  it lands green; propagate byte-identically to the private sibling.

## Rough scope & non-goals

In scope: existence-only detection of Nx target, npm script, and rhino-cli subcommand citations, in
tracked markdown, wired as a pre-push + CI gate across both parity repos.

Out of scope (for now): shell script and `make` target citations (highest false-positive surface,
deferred); flag and argument validation (harder problem, weaker oracle); external tools (`git`,
`docker`, `jq`); cross-repo command citations; and auto-fixing violations (the validator reports; a
human or agent decides whether the doc or the tooling is wrong).

## Risks & open questions

- False positives get a validator disabled, and a disabled validator has negative value — the
  precision-first default and pre-designed exemption mechanism are the mitigation, but the actual
  false-positive rate on this corpus is unmeasured until built.
- Nx graph resolution cost/failure inside a worktree — snapshot once per run, hard-error on
  resolution failure rather than silent pass.
- Regex extraction misfiring on unusual fenced formatting (multi-line continuations, run-many
  forms) — each edge case needs its own Gherkin scenario before implementation.

## What success looks like + promotion signal

Success: `md commands validate` exits 0 across both parity repos after remediation, and reintroducing
any one of the three originally-cited nonexistent targets into tracked markdown fails the pre-push
hook. No numeric adoption or defect-reduction target is claimed; none has been measured. Ready to
re-promote to a backlog plan as-is — the design decisions are already settled in git history (CLI
shape, detector scope, hook placement, exemption model, Nx oracle, and the `nx-targets.md`
remediation were all resolved); this is a well-specified idea awaiting a build slot rather than an
open question.
