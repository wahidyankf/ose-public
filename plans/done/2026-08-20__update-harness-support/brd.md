# Business Requirements — Update Harness Support

## Business Goal

Reduce the repository's declared coding-agent harness surface from eleven to the three that are
actually used, correct the verified factual defects in those three, and install the one piece of
machinery whose absence let the defects accumulate silently: a validator that fails when any file in a
binding directory has no declared owner.

The governing insight is that this repository does not have a harness-compatibility problem — it has
an **unowned-file problem**. Eleven declared harnesses means eleven upstream conventions to track, and
alongside them a scatter of binding files belonging to no declared category at all: `.opencode/skills/`
sat ungoverned for months, excluded from the word budget by a comment explaining that it merely
existed. The same shape covers the vendored plugin skills in `.agents/skills/` and the tooling-provided
files in `.codex/`. Each is a place where reality and our declarations can diverge with nothing
failing — which is exactly how `forbid-dir: .codex/agents` came to enforce a false belief while every
check stayed green.

Shrinking to three harnesses cuts the tracked surface by roughly two thirds. Total ownership of
binding files is what converts "we support N harnesses" from an assertion into a maintained
commitment: every file generated from one source of truth, every exception declared with a reason, and
nothing unclassified.

## Business Impact

**Cost of the status quo:**

- **Wrong instructions to real agents.** The `forbid-dir: .codex/agents` assertion means that if a
  contributor creates the officially-correct Codex subagent surface, a pre-push gate rejects it.
  The repository's tooling currently prevents correct configuration.
- **Eight harnesses' worth of unbacked maintenance.** Every governance edit, every catalog
  re-verification, and every parity sweep pays a tax proportional to the declared harness count, not
  the used harness count.
- **Codex contributors work with a second-class binding.** Claude Code and OpenCode contributors get
  93 generated agent definitions [Repo-grounded — `git ls-files .claude/agents | grep '\.md$' | grep
  -v 'README\.md$'` = 93; the raw `git ls-files .claude/agents` count of 107 includes 14 `README.md`
  index files with no `name:` frontmatter, which a name-keyed emitter cannot emit]. Codex
  contributors get two hand-maintained TOML files [Repo-grounded — `git ls-files .codex` = 2]. The
  same repository knowledge is available to one harness and not another.
- **Silent decay.** The catalog is the decision surface for which binding files this repository
  emits. A stale row can mean emitting a file no harness reads, or omitting one a harness now
  expects — and nothing surfaces either failure until someone notices by hand.
- **Unowned files accumulate unchallenged.** Nothing today enumerates a binding directory and asks
  what produced each file, so a tree can appear, be excluded from the one gate that would have
  measured it, and persist.

**Value delivered:**

- Three harnesses at genuine parity, each generated from one source of truth.
- 113 tracked binding files retired (`.cursor/` 93, `.amazonq/` 2, `.pi/` 1, `.opencode/skills/` 16,
  `.opencode/commands/` 1), plus their governance prose [Repo-grounded — `git ls-files` counts].
- Roughly 638 generated files added in their place (`.codex/agents/` 93, the `.agents/skills/`
  mirror ~545) — a deliberate trade of hand-maintained surface for generated, byte-parity-guarded
  surface.
- A binding tree in which every file has exactly one declared owner, so nothing can sit unnoticed the
  way `.opencode/skills/` did.
- A safety net for work done in the wrong place: a hand edit inside a mirror is detected by content
  and can be carried back to canonical source through a reviewed diff, instead of being discovered
  only when the next regeneration overwrites it.
- A catalog that is data, not prose — so adding, dropping, or re-verifying a harness is a
  `repo-config.yml` edit rather than a hand-edited markdown table.

## Affected Roles

| Role                             | How this changes their work                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository maintainer (solo)     | Tracks three upstream conventions instead of eleven; owns vendor re-verification manually and cheaply, and is told by CI the moment any binding file becomes unowned                                                            |
| Contributor driving Claude Code  | No change to daily workflow; `.claude/` remains the hand-authored source of truth                                                                                                                                               |
| Contributor driving OpenCode     | Generated agent mirrors unchanged and upstream citation corrected; **loses** the seven Nx skill directories and the `/monitor-ci` command, with no fallback; gains a reviewed path to promote a mirror-side edit back to source |
| Contributor driving Codex CLI    | Gains 93 generated agent definitions and a full real-file skills mirror; stops being blocked from creating the officially-correct `.codex/agents/` dir                                                                          |
| Agents executing governance work | Read a catalog that is generated from declared data, so a claim and its machine-readable source can no longer disagree                                                                                                          |
| The private sibling maintainer   | Receives exactly one paired twin branch and PR for the whole plan; `apps/rhino-cli/**` byte-identity never breaks mid-plan                                                                                                      |

## Success Signals

These are observable checks, not measured KPIs.

1. `repo-config.yml` `harness:` section contains exactly three entries, and
   `rhino-cli repo-config validate` exits 0.
2. `rhino-cli harness bindings validate` exits 0 with `.codex/agents/` **present** and byte-parity
   with the generator — the exact state today's `forbid-dir` assertion rejects.
3. Introducing an undeclared file under any binding directory makes
   `rhino-cli harness ownership validate` exit non-zero naming that exact file; removing or declaring
   it makes the validator exit 0. Falsifiable in both directions.
4. `docs/reference/platform-bindings.md` regenerates byte-identically from `repo-config.yml` — the
   catalog and its data source cannot disagree.
5. A full `npm run generate:bindings` run leaves all 24 vendored `.agents/skills/` files
   byte-identical, verified by SHA-256 comparison against a pre-run baseline — the emitter owns only
   what it generates, and a matching file count alone does not satisfy this.
6. `.agents/skills/` contains zero symlinks (`find .agents/skills -type l` returns nothing) — the
   mirror is real files, so nothing depends on unverified symlink behaviour in either direction.
7. Zero tracked files under `repo-governance/`, `docs/`, `specs/`, `.claude/`, `AGENTS.md`,
   `CLAUDE.md`, and `repo-config.yml` reference any of the eight dropped harnesses as a supported
   platform, verified by a per-file audited verdict rather than a bulk substitution.
8. `harness sync triage` exits 0 on a clean tree and exits non-zero naming both files when canonical
   source and its mirror have both been hand-edited — and `harness sync promote` leaves
   `git diff --quiet` over canonical source exiting 0, proving it never overwrites.
9. `apps/rhino-cli/parity-manifest.sha256` matches between `ose-public` and the private sibling at every
   terminal paired merge, so the nightly `rhino-cli-parity-audit.yml` stays green.

## Business-Scope Non-Goals

- **Not a re-evaluation of which three harnesses to support.** The three are given.
- **Not a bet that eight harnesses will never come back.** The registry is designed so re-adding one
  is a config entry plus a catalog row, exactly as the current comment promises. Re-adding a
  _generated_ tier still costs an emitter.
- **Not an attempt to reach feature parity between harnesses.** Codex reaches parity on the
  _bindings this repository emits_, not on capability. Claude Code's hook surface, worktree
  isolation, and rules directory have no Codex equivalent and none is invented.
- **Not a governance-prose rewrite.** The sweep removes dropped-harness references; it does not
  restructure the documents that carried them.

## Business Risks

| Risk                                                                                           | Likelihood | Impact | Mitigation                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Blind text substitution over 669 "Cursor"-matching files corrupts unrelated code               | High       | High   | 441 of those are under `apps/` and are database/text/CSS cursors. Sweep is scoped to a verified 60-file governance set with a per-file verdict; no repo-wide `sed`             |
| No automated check tells anyone a vendor moved, so an upstream change goes unnoticed           | Medium     | Medium | Accepted by decision. Mitigated structurally — eleven tracked upstream conventions become three — and the compatibility workflow remains runnable on demand for a manual check |
| Dropping a harness someone silently depended on                                                | Low        | Medium | Solo-maintainer repository; the three survivors are user-confirmed. Re-adding a native-tier harness is a one-line registry entry                                               |
| The private sibling twin drifts and the nightly parity audit goes red after a one-sided merge  | Medium     | High   | Exactly two PRs exist and they merge in the same session; the parity ritual is a checklist block before the merge, not a follow-up                                             |
| Generated catalog fights Prettier and breaks byte-equality (the `.amazonq/` post-mortem class) | Medium     | Medium | Design the generator to emit Prettier-stable output OR add the catalog to `.prettierignore`, decided by measurement in Phase 10                                                |

## Related

- [prd.md](./prd.md) — the product requirements and Gherkin acceptance criteria derived from these goals
- [tech-docs.md](./tech-docs.md) — the technical design that realizes them
- [2026-05-03 Amazon Q bindings Prettier parity-guard break](../../../docs/explanation/post-mortems/2026-05-03-amazonq-bindings-prettier-parity-guard-break.md) —
  the prior incident behind the Prettier risk row
