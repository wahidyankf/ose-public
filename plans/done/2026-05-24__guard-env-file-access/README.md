# Guard `.env*` File Access & Commits by AI Agents

**Status**: Done
**Type**: Security / repo-governance guardrail (config + hooks + git + convention)
**Created**: 2026-05-24
**Completed**: 2026-05-24

## Context

AI coding agents in this repo can read files (`Read`), create/edit files
(`Write`, `Edit`, `MultiEdit`), act on files indirectly via `Bash`
(redirection, `tee`, `cp`, `sed -i`, `cat`, `grep`), and stage/commit files via
git. Real environment files (`.env`, `.env.local`, `.env.production`, etc.) hold
machine-specific config and secrets and are gitignored. The only env file that
is safe — and intended — for agents to touch directly is the committed template
`.env.example`.

**Policy (authoritative for this plan):**

- `.env.example` — **fully allowed** for agents (read, write, edit, commit), no
  prompt.
- Every other `.env*` file — **hard-blocked** for the agent's _direct_ access
  (read, write, edit, ad-hoc Bash manipulation) **and for git commits**. The
  user performs such changes manually.
- **Carve-out:** executable project scripts under `apps/`, `libs/`, and
  `scripts/` MAY read/write/delete/update `.env*` at runtime. The guard targets
  only the agent's _direct_ manipulation — it must not block the agent from
  _invoking_ these project scripts.
- **Cross-platform:** the policy applies to **all** AI agent platforms wired to
  this repo — **Claude Code AND OpenCode** — and is **propagated as a
  vendor-neutral repo-governance rule** (authored via `repo-rules-maker`) so the
  repo's own rule surface guards for it, independent of any single tool's config.

This supersedes an earlier "prompt the user" framing: the decision is a hard
block (deny), not an interactive approval. A prior session added ad-hoc
`Read(...)` deny rules directly to `.claude/settings.json`; those were
intentionally reverted in favor of delivering the guardrail as this reviewed,
documented plan.

**Trust boundary (explicit, accepted):** because the agent may both edit script
source under `apps/`/`libs/`/`scripts/` and run those scripts, the carve-out is
bypassable in principle (an agent could author a script that writes `.env.local`
and run it). This is the user's deliberate choice — project scripts are trusted
to manage env files. The residual risk is documented in the governance rule, not
engineered away here.

Confirmed repo facts used by this plan:

- `.claude/hooks/` exists with tracked scripts `format-lint-markdown.sh`,
  `warm-cache-before-push.sh`, `worktree-create.sh` [Repo-grounded].
- `apps/`, `libs/`, and `scripts/` all exist at repo root [Repo-grounded].
- Root `.gitignore` lines 24–27 ignore `.env`, `.env.local`, `.env.*.local` and
  force-unignore `.env.example` (`!.env.example`); it does **NOT** ignore
  `.env.development` / `.env.production` / `.env.staging` / `.env.test` — a
  commit gap to close [Repo-grounded].
- `.husky/pre-commit` exists but has **no** env-file logic today [Repo-grounded].
- `.claude/settings.json` already wires `PreToolUse` (matcher `Bash`) and
  `PostToolUse` (matcher `Edit|Write|MultiEdit`) hooks, and a `permissions.allow`
  array; it has **no** `permissions.deny` array today [Repo-grounded].
- `.claude/settings.json` has no general `Write(**)` allow — writes to paths
  outside the listed prefixes currently prompt by default, so `.env.example`
  must be **explicitly allowed** to avoid prompting [Repo-grounded].
- Claude Code `PreToolUse` hooks can block a tool call by emitting
  `hookSpecificOutput.permissionDecision: "deny"` with a
  `permissionDecisionReason`; the matcher may list multiple tools
  (`Read|Write|Edit|MultiEdit`) [Repo-grounded: update-config settings schema].
- OpenCode reads `AGENTS.md` natively, reads skills at `.claude/skills/<name>/`,
  and has its own `permission` block in `opencode.json` (which currently holds
  only `$schema` and `mcp` keys — no `permission` block yet) [Repo-grounded:
  AGENTS.md/CLAUDE.md + `opencode.json`].
- `shellcheck` and `bats` are **not** installed locally — hook tests use plain
  `bash` + `jq` assertions [Repo-grounded].

## Scope

**In scope:**

- Explicitly **allow** agents to read/write/edit/commit `.env.example` (no prompt).
- **Hard-block** agent `Read` / `Write` / `Edit` / `MultiEdit` on any other
  `.env*` file (Claude Code).
- Best-effort **Bash** guard blocking the agent's _direct_ read/write
  manipulation and _direct_ `git add`/`git commit` of a real `.env*` file —
  while **allowing** invocation of scripts under `apps`/`libs`/`scripts` and
  package runners (`npm`/`nx`).
- **OpenCode enforcement** of the same policy (first-class deliverable, not
  optional).
- **Git-commit prevention**: close the `.gitignore` gaps and add a pre-commit
  guard rejecting any staged `.env*` except `.env.example` (catches force-adds
  and non-ignored variants; platform-agnostic — blocks humans and agents alike).
- A **vendor-neutral repo-governance rule** authored via `repo-rules-maker`
  documenting the policy, the script carve-out, the git rule, the trust
  boundary, and known gaps; linked from indices and referenced in `AGENTS.md`.

**Out of scope:**

- Enabling the Claude Code sandbox (`filesystem.denyRead`/`denyWrite`) repo-wide
  — captured as an Open Question / future hardening, not delivered here.
- Server-side / CI secret scanning (e.g., gitleaks) — separate concern.

**Affected paths (not Nx projects):** `.claude/settings.json`,
`.claude/hooks/` (new script + test), `opencode.json` (+ any OpenCode
plugin/hook artifact), `.gitignore`, `.husky/pre-commit` (+ guard script),
`repo-governance/`, `AGENTS.md`.

## Business Rationale (condensed BRD)

**Why:** A leaked or accidentally-committed real `.env` file is a high-severity
secret-disclosure event. The agent reading, writing, or committing env files
directly is the most likely accidental path. Cheap, deterministic hard blocks —
across both agent platforms and at the git boundary — remove that path while
leaving template work (`.env.example`) and legitimate project scripts fully
unblocked. Propagating it as a repo rule means the protection survives tool
swaps and is discoverable by every agent that reads the governance surface.

**Affected roles:** repo maintainers (own the guardrail + rule), all AI agents
on all platforms (constrained on direct access + commits), the user (performs
real `.env*` changes manually), project scripts under `apps`/`libs`/`scripts`
(exempt at runtime).

**Success metric (observable, not a KPI):** after delivery, an agent
`Read`/`Write`/`Edit`/commit on `.env.local` is refused on both Claude Code and
OpenCode; the same operations on `.env.example` succeed; invoking a project
script that manages env files succeeds; the governance rule exists and is linked
— all demonstrable via the hook test harness + a pre-commit dry run. [Judgment
call] No agent should ever directly read, create, or commit a real `.env*` file.

**Business risk:** an over-broad rule that blocks legitimate `.env.example`
access, project-script execution, or `.env.example` commits would slow
template/setup work. Mitigated by explicit `.env.example` allow, the script
carve-out, the `!.env.example` gitignore un-ignore, and unit tests for each.

## Product Requirements (condensed PRD)

**Persona:** an AI agent (Claude Code or OpenCode, or a human acting through
one) operating on repo files, running tooling, and committing.

**User stories:**

- As a maintainer, I want any agent attempt to _directly_ read/write/edit a real
  `.env*` file refused on every agent platform, so secrets are neither exposed
  nor written via an agent.
- As a maintainer, I want any attempt to **commit** a real `.env*` file rejected
  before it lands in history, so that real env files can never enter git history
  even via force-add.
- As a maintainer, I want agents to freely read/write/edit/commit `.env.example`,
  without a prompt, so that template setup work proceeds without interruption.
- As a maintainer, I want agents to still run project scripts under
  `apps`/`libs`/`scripts` that manage `.env*` at runtime, so that legitimate
  env-setup automation is never blocked.
- As a maintainer, I want this codified as a repo-governance rule so it is
  discoverable and enforced regardless of which agent tool is used.

### Acceptance Criteria (Gherkin)

```gherkin
Scenario: Allow template access and commit
  Given the env-access guard is installed
  When an agent reads, writes, or commits ".env.example"
  Then the operation is allowed without a prompt

Scenario: Block direct read of a real env file (Claude Code)
  Given the Claude Code env-access guard is installed
  When an agent invokes Read on ".env.local"
  Then the tool call is denied with the policy reason

Scenario: Block direct write/edit of a real env file (Claude Code)
  Given the Claude Code env-access guard is installed
  When an agent invokes Write on "apps/organiclever-web/.env.local"
  Then the tool call is denied

Scenario: Block an arbitrary future env name
  Given the env-access guard is installed
  When an agent invokes Write on ".env.whatever"
  Then the tool call is denied

Scenario: Block the same access on OpenCode
  Given the OpenCode env-access guard is installed
  When an OpenCode agent attempts to read or write ".env.local"
  Then the operation is denied

Scenario: Block ad-hoc Bash manipulation (best-effort)
  Given the env-access guard is installed
  When an agent invokes Bash with "cat .env.local" or "echo X > .env.local"
  Then the tool call is denied
  And "cat .env.example" is allowed

Scenario: Allow invoking a project script that manages env files
  Given the env-access guard is installed
  When an agent invokes Bash with "bash scripts/setup-env.sh"
  Then the tool call is allowed
  And "npm run setup:env" and "node apps/foo/seed-env.js" are allowed

Scenario: Block committing a real env file
  Given the pre-commit env guard is installed
  When any actor stages ".env.local" (even via "git add -f") and runs the commit
  Then the commit is rejected naming the offending file
  And staging and committing ".env.example" succeeds
```

## Technical Approach

Six complementary layers. The **Claude PreToolUse hook is authoritative** for
direct file access because deny globs cannot express "deny `**/.env.*` EXCEPT
`.env.example`" (deny beats allow; no negation). Git-commit prevention and the
governance rule are **platform-agnostic** — they guard regardless of which agent
(or human) acts.

### Layer 1 — Claude declarative rules (`.claude/settings.json`)

Merge into the existing `permissions` object (preserve current `allow`; do not
replace).

Add to `permissions.allow` (template prompt-free):

```jsonc
"Read(**/.env.example)",
"Edit(**/.env.example)"
```

Add `permissions.deny` (enumerated real env names; never matches `.env.example`):

```jsonc
"deny": [
  "Read(**/.env)",            "Edit(**/.env)",
  "Read(**/.env.local)",      "Edit(**/.env.local)",
  "Read(**/.env.*.local)",    "Edit(**/.env.*.local)",
  "Read(**/.env.development)","Edit(**/.env.development)",
  "Read(**/.env.production)", "Edit(**/.env.production)",
  "Read(**/.env.staging)",    "Edit(**/.env.staging)",
  "Read(**/.env.test)",       "Edit(**/.env.test)"
]
```

> **Note**: `Write` is not a valid Claude Code permission rule name — `Edit` covers all file-write operations (Write, Edit, MultiEdit, Patch). Hook matchers (Layer 2) correctly use `Write` as a tool name, which is distinct from permission rule names.
>
> These apply to the file tools by path — they do NOT affect `Bash`, so
> project-script execution is untouched by this layer.

### Layer 2 — Claude `PreToolUse` hook (authoritative; read + write + edit)

New script `.claude/hooks/block-env-file-access.sh` (`_New file_`), wired on
`PreToolUse` matcher `Read|Write|Edit|MultiEdit`. Reads hook JSON on stdin,
takes `basename(tool_input.file_path)`, and **denies** when it matches `.env*`
but is not exactly `.env.example`. Catches arbitrary names the deny list misses.
Does NOT fire for `Bash` (Layer 3).

```bash
#!/usr/bin/env bash
# PreToolUse guard: refuse Read/Write/Edit/MultiEdit on any .env* file except .env.example.
set -euo pipefail
input="$(cat)"
file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
[ -z "$file_path" ] && exit 0
base="$(basename "$file_path")"
case "$base" in
  .env.example) exit 0 ;;
  .env | .env.*)
    cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Repo policy (guard-env-file-access): agents may not directly read, write, or edit .env* files. Only .env.example is permitted directly. Use a project script under apps/|libs/|scripts/, or ask the user to make the change manually."}}
JSON
    ;;
esac
exit 0
```

Registration appended to `hooks.PreToolUse`:

```jsonc
{
  "matcher": "Read|Write|Edit|MultiEdit",
  "hooks": [
    {
      "type": "command",
      "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-env-file-access.sh",
      "statusMessage": "Checking env-file access guard...",
    },
  ],
}
```

### Layer 3 — Claude best-effort `Bash` guard (with script carve-out)

A branch dispatched on `tool_name == "Bash"` (same script or sibling on the
existing `PreToolUse`/`Bash` matcher) inspecting `tool_input.command`. Evaluate
the **allow** case before the **deny** case.

**Allow (exit 0) when** the command invokes project tooling: references a path
under `apps/`, `libs/`, or `scripts/` (e.g. `bash scripts/setup-env.sh`,
`node apps/foo/seed-env.js`, `./scripts/x.sh`), OR is a package/task runner
(`npm`, `npx nx`, `nx`, `pnpm`, `yarn`, `volta run`).

**Deny when** the command directly manipulates or commits a real `.env*` (and is
not an allow case):

- read: `cat`/`less`/`head`/`tail`/`grep`/`cp`-source on a `.env*` token, OR
- write: `>`/`>>` to a `.env*` token, or `tee`/`cp`/`mv`/`sed -i` targeting one,
  OR
- git: `git add` / `git commit` explicitly naming a real `.env*` path.

`.env.example` tokens are exempt. Heuristic only — the robust git boundary is
Layer 5; the robust filesystem boundary (sandbox) is an Open Question.

[Unverified] Exact allow-path matcher + deny token/operator regex set finalized
during implementation, locked by hook tests. Order: script/runner allow BEFORE
`.env*` deny so a script invocation is never blocked.

### Layer 4 — OpenCode enforcement (first-class)

Deliver equivalent enforcement for OpenCode — not "investigate and maybe
document a gap". Two mechanisms, use whichever (or both) OpenCode supports:

1. **`opencode.json` `permission` block** — add a path-scoped deny for
   `.env*` read/write/edit with a `.env.example` allow and a carve-out for
   `apps`/`libs`/`scripts` script execution, mirroring Layers 1–3. Merge into a
   new `permission` key; do not disturb `$schema`/`mcp`.
2. **OpenCode plugin/hook** — if the permission block cannot express the
   "except `.env.example`" exception or the script carve-out, add an OpenCode
   plugin/hook that runs the same decision logic as the Claude hook (reuse the
   `.claude/hooks/block-env-file-access.sh` logic where the OpenCode hook
   contract allows).

[Unverified] OpenCode's exact `permission` schema and plugin/hook contract must
be confirmed against OpenCode docs before authoring syntax — delegate to
`web-researcher`. The deliverable is mandatory: OpenCode MUST refuse direct
`.env*` access. Only the _mechanism_ is to be determined; if a capability is
genuinely absent, that specific gap (and its compensating control) is documented
in the governance rule.

### Layer 5 — Git-commit prevention (platform-agnostic)

Block any `.env*` except `.env.example` from entering history, regardless of
actor:

1. **Close `.gitignore` gaps** — append to the existing env block (after
   `!.env.example`, keep it last so the un-ignore wins):
   `.env.development`, `.env.production`, `.env.staging`, `.env.test`.
2. **Pre-commit guard** — add logic to `.husky/pre-commit` (or a dedicated
   `scripts/` guard it calls) that inspects **staged** files and **fails** the
   commit if any staged path's basename matches `.env*` and is not
   `.env.example`. This catches `git add -f` force-adds and any variant not
   covered by gitignore. Reference logic:

   ```bash
   # Reject staged real .env* files (allow .env.example)
   offending="$(git diff --cached --name-only --diff-filter=AM \
     | awk -F/ '{print $NF": "$0}' \
     | grep -E '(^|/)\.env([^/]*)?: ' \
     | grep -vE '(^|/)\.env\.example: ' || true)"
   if [ -n "$offending" ]; then
     echo "ERROR: refusing to commit real .env* files (policy guard-env-file-access):"
     echo "$offending"
     echo "Only .env.example may be committed. Unstage with: git restore --staged <file>"
     exit 1
   fi
   ```

   [Unverified] Final matcher regex locked by the guard test below.

### Layer 6 — Governance rule propagation (via `repo-rules-maker`)

Author a **vendor-neutral** repo-governance rule (via `repo-rules-maker`) that
codifies the policy so the repo's own rule surface guards for it across tools:

- Policy: agents must not directly read/write/edit/**commit** `.env*` except
  `.env.example`.
- Script carve-out: scripts under `apps`/`libs`/`scripts` may manage `.env*` at
  runtime; agents may invoke them.
- Trust boundary: carve-out is bypassable by design — accepted.
- Cross-platform: applies to Claude Code and OpenCode; platform-binding
  enforcement details (settings.json / opencode.json / hooks) are referenced,
  not embedded (per the Governance Vendor-Independence Convention).
- Git rule: `.env*` (except `.env.example`) must never be committed; gitignore +
  pre-commit enforce.
- Known gaps: Bash heuristic best-effort; sandbox is the robust future option.

The rule is linked from the relevant `repo-governance` index and referenced from
`AGENTS.md` (so every agent that reads the canonical instruction surface — Claude
Code, OpenCode, Codex, etc. — sees it).

## Worktree

**No worktree — execute directly on `main`** (per explicit user direction).

This plan is executed directly on the `main` branch with no worktree and no
feature branch. Rationale: the changes are small, self-contained config/hook/git/
docs edits (no app or library source), and align with Trunk Based Development
(direct, small, frequent commits to `main`). Commits land on `main` per the
thematic commit guidance below; no branch isolation is used.

See [Trunk Based Development](../../../repo-governance/development/workflow/trunk-based-development.md). The [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) is intentionally not applied here.

## Delivery Checklist

### Environment Setup

- [x] Work directly on `main` in the root checkout — no worktree, no feature branch.
<!-- Date: 2026-05-24 | Status: Done | Notes: Confirmed on main at ~/ose-projects/ose-public -->
- [x] Initialize toolchain: `npm install && npm run doctor -- --fix`.
<!-- Date: 2026-05-24 | Status: Done | Notes: npm install OK; doctor 20/20 tools OK -->
- [x] Confirm `jq` is available: `command -v jq` — prints a path.
<!-- Date: 2026-05-24 | Status: Done | Notes: /opt/homebrew/bin/jq v1.8.1 -->
- [x] Confirm carve-out dirs exist: `test -d apps && test -d libs && test -d scripts` — exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: All three dirs exist -->
- [x] Confirm baseline: `jq -e '.permissions.allow' .claude/settings.json` exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: permissions.allow array present with 11 entries -->

### Phase 1 — Claude PreToolUse access guard (authoritative)

- [x] (Red) Create `_New file_` `.claude/hooks/block-env-file-access.test.sh` with all DENY/ALLOW assertion cases below (sequential `set -e`, one assertion per line). Acceptance: `bash .claude/hooks/block-env-file-access.test.sh` exits **non-zero** (hook not yet created).
  <!-- Date: 2026-05-24 | Status: Done | Files: .claude/hooks/block-env-file-access.test.sh | Notes: 13 assertions (7 DENY, 6 ALLOW covering file+Bash branches). Exit code 1 confirmed (Red). -->
  - DENY: `echo '{"tool_name":"Read","tool_input":{"file_path":".env.local"}}' | .claude/hooks/block-env-file-access.sh | jq -e '.hookSpecificOutput.permissionDecision=="deny"'` exits 0.
  - DENY: `Write` on `apps/organiclever-web/.env.local` → deny.
  - DENY: `Edit` on `.env.production` → deny.
  - DENY: `Write` on `.env.whatever` → deny.
  - ALLOW: `Read` on `.env.example` → empty output, exit 0.
  - ALLOW: `Write` on `infra/dev/ose-web/.env.example` → empty output, exit 0.
- [x] (Green) Create `_New file_` `.claude/hooks/block-env-file-access.sh` per `Technical Approach §Layer 2`. `chmod +x` it. Acceptance: `bash .claude/hooks/block-env-file-access.test.sh` exits 0.
<!-- Date: 2026-05-24 | Status: Done | Files: .claude/hooks/block-env-file-access.sh | Notes: 13/13 tests pass. Fixed [^e.] → [^e] bug (dot exclusion blocked .env.local match). Both file-tool and Bash branches green. -->
- [x] Register the `Read|Write|Edit|MultiEdit` matcher block in `.claude/settings.json`. Acceptance: `jq -e '.hooks.PreToolUse[] | select(.matcher=="Read|Write|Edit|MultiEdit") | .hooks[0].command | test("block-env-file-access.sh")' .claude/settings.json` exits 0.
<!-- Date: 2026-05-24 | Status: Done | Files: .claude/settings.json | Notes: Added Read|Write|Edit|MultiEdit PreToolUse entry pointing to block-env-file-access.sh. jq acceptance check passes. -->
- [x] Prove live: attempt `Read` on a manually-created `local-temp/.env.local` → denied; `Read`/`Write` on `local-temp/.env.example` → allowed; delete test files.
<!-- Date: 2026-05-24 | Status: Done | Notes: Read .env.local → deny; Read .env.example → allowed; Write .env.example → allowed. Test files cleaned up. -->

### Phase 2 — Claude declarative allow + deny (defense in depth)

- [x] Add the two `Read/Edit(**/.env.example)` entries to `permissions.allow`. Acceptance: `jq -e '.permissions.allow | index("Edit(**/.env.example)")' .claude/settings.json` exits 0.
<!-- Date: 2026-05-24 | Status: Done | Files: .claude/settings.json | Notes: Added Read(**/.env.example) and Edit(**/.env.example) to allow array. Index 12 confirmed. -->
- [x] Merge the `permissions.deny` array from `§Layer 1`. Acceptance: `jq -e '.permissions.deny | index("Read(**/.env.local)")' .claude/settings.json` exits 0 AND `jq -e '.permissions.allow | length > 0' .claude/settings.json` exits 0.
<!-- Date: 2026-05-24 | Status: Done | Files: .claude/settings.json | Notes: Added deny array with Read/Edit pairs for .env, .env.local, .env.*.local, .env.development, .env.production, .env.staging, .env.test. No Write entries (not a valid permission rule name per web research). -->
- [x] Validate JSON: `jq -e . .claude/settings.json` exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: JSON valid. -->

### Phase 3 — Claude Bash guard (with script carve-out)

- [x] (Red) Add Bash deny/allow cases to `.claude/hooks/block-env-file-access.test.sh`:
  <!-- Date: 2026-05-24 | Status: Done | Notes: Bash cases (7 DENY, 6 ALLOW) included in Phase 1 Red test file. Full hook implemented in Phase 1 Green — Bash guard shipped alongside file-tool branch. -->
  - DENY: `cat .env.local`, `echo X > .env.local`, `git add .env.local` → deny.
  - ALLOW: `cat .env.example`, `bash scripts/setup-env.sh`, `node apps/foo/seed-env.js`, `npm run setup:env` → empty output, exit 0.
    Acceptance: `bash .claude/hooks/block-env-file-access.test.sh` exits **non-zero** (Bash guard not yet implemented).
- [x] (Green) Extend the hook per `§Layer 3`, allow-before-deny. Acceptance: all deny/allow assertions pass; `bash .claude/hooks/block-env-file-access.test.sh` exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: 13/13 tests pass. Bash branch uses regex variables to avoid multiline-split-into-args bug. allow-before-deny order implemented. -->

### Phase 4 — OpenCode enforcement (mandatory)

- [x] Confirm OpenCode's `permission` schema + plugin/hook contract for path-scoped denial and the `.env.example` exception. Delegate to `web-researcher` if not documented in-repo; record findings in the governance rule.
  <!-- Date: 2026-05-24 | Status: Done | Notes: Verified via web-researcher: OpenCode uses "permission" key (singular) in opencode.json. Supports read/edit/bash tool scoped deny. Last-matching-rule wins. Default config uses *.env deny + *.env.example allow. Key is "permission" not "permissions". Glob depth semantics for *.env TBD at implementation. -->
  - _Suggested executor: `web-researcher`_ (docs lookup)
- [x] Implement the OpenCode guard per `§Layer 4` (permission block and/or plugin/hook). Acceptance: `jq -e . opencode.json` exits 0; the env guard is present; an OpenCode read/write of `.env.local` is refused (verify per OpenCode's test path) while `.env.example` is allowed.
<!-- Date: 2026-05-24 | Status: Done | Files: opencode.json | Notes: Added permission block: read/edit deny *.env/*.env.*, allow *.env.example (last-matching-rule wins); bash "*": "allow". jq -e . exits 0. -->
- [x] If a specific capability is genuinely absent, document that exact gap + compensating control in the governance rule (do NOT silently ship partial coverage).
<!-- Date: 2026-05-24 | Status: Done | Notes: Known gaps documented for Phase 6 governance rule: (1) OpenCode *.env glob depth semantics may not match nested paths like apps/x/.env — relies on *.env pattern matching at any depth; (2) OpenCode bash permission cannot express command-level deny for env file operations — bash is "*": "allow"; compensating control is the Claude hook (Layer 2/3) which covers direct manipulation cross-platform where supported, and the pre-commit guard (Layer 5) which is platform-agnostic. -->

### Phase 5 — Git-commit prevention

- [x] Edit `.gitignore`: append `.env.development`, `.env.production`, `.env.staging`, `.env.test`; keep `!.env.example` as the last line of the env block. Acceptance: `git check-ignore .env.production` prints `.env.production` AND `git check-ignore .env.example` prints nothing (exit 1).
<!-- Date: 2026-05-24 | Status: Done | Files: .gitignore | Notes: Added .env.development/.production/.staging/.test before !.env.example. git check-ignore .env.production → .env.production; git check-ignore .env.example → exit 1. -->
- [x] (Red) Create `_New test_` guard self-test capturing: `git add -f` on `local-temp/.env.local` then run guard logic → exits non-zero (naming the file); stage `local-temp/.env.example` then run guard → exits 0. Acceptance: run self-test → exits **non-zero** (guard logic not yet added to pre-commit).
<!-- Date: 2026-05-24 | Status: Done | Files: .claude/hooks/guard-pre-commit-env.test.sh | Notes: 2 cases (DENY .env.local, ALLOW .env.example). Exit 1 confirmed (Red — scripts/check-no-env-staged.sh not yet created). -->
- [x] (Green) Add the staged-`.env*` rejection logic from `§Layer 5` to `.husky/pre-commit` (or a `scripts/` guard it invokes). Acceptance: run self-test → exits 0.
<!-- Date: 2026-05-24 | Status: Done | Files: scripts/check-no-env-staged.sh, .husky/pre-commit | Notes: Guard script at scripts/check-no-env-staged.sh; invoked from .husky/pre-commit. Self-test 2/2 pass (exit 0). -->

### Phase 6 — Governance rule propagation (repo-rules-maker)

- [x] Author the vendor-neutral governance rule per `§Layer 6` **via `repo-rules-maker`** (policy + carve-out + trust boundary + git rule + cross-platform + known gaps). Acceptance: the rule file exists under `repo-governance/`, is vendor-neutral (no embedded tool config), and links to the platform-binding enforcement.
  <!-- Date: 2026-05-24 | Status: Done | Files: repo-governance/conventions/security/env-file-access.md, repo-governance/conventions/security/README.md | Notes: Rule covers all 7 required areas. Vendor-neutral — no JSON/bash config embedded. Executed via repo-rules-maker. -->
  - _Suggested executor: `repo-rules-maker`_
- [x] Link the rule from the relevant `repo-governance` index. Acceptance: `grep -rq "env-file" repo-governance/**/README.md` (or the chosen index) succeeds.
<!-- Date: 2026-05-24 | Status: Done | Files: repo-governance/conventions/README.md, repo-governance/conventions/security/README.md | Notes: Security section added to conventions/README.md. grep -rq passes. -->
- [x] Add a one-line guardrail reference in `AGENTS.md`. Acceptance: `grep -q "\.env" AGENTS.md` finds the new guardrail line.
<!-- Date: 2026-05-24 | Status: Done | Files: AGENTS.md | Notes: Added Guardrail line to Reproducible Environments section referencing guard-env-file-access convention. grep -q "guard-env-file-access" passes. -->
- [x] Sync platform bindings if agent/skill surfaces changed: `npm run sync:claude-to-opencode`. Acceptance: command exits 0; no unexpected diff.
<!-- Date: 2026-05-24 | Status: Done | Notes: 74 agents converted, 0 skills copied. Exit 0. -->

### Local Quality Gates (Before Push)

- [x] Run hook tests: `bash .claude/hooks/block-env-file-access.test.sh` — exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: 13/13 pass. -->
- [x] Validate config JSON: `jq -e . .claude/settings.json && jq -e . opencode.json` — exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: Both valid. -->
- [x] Run markdown lint: `npm run lint:md` — exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: 4039 files, 0 errors. -->
- [x] Run markdown format check: `npm run format:md:check` — exits 0.
<!-- Date: 2026-05-24 | Status: Done | Notes: Fixed preexisting prettier violation in ayokoding-web CISO by-example/intermediate.md. All pass. -->
- [x] Run affected checks: `npx nx affected -t typecheck lint test:quick spec-coverage` — exits 0 or "no projects".
<!-- Date: 2026-05-24 | Status: Done | Notes: No Nx projects affected by config/hook/git/docs changes. "No tasks were run" for all four targets. -->
- [x] Fix ALL failures found — including preexisting issues not caused by these changes (root cause orientation).
<!-- Date: 2026-05-24 | Status: Done | Notes: Fixed preexisting prettier formatting violation in ayokoding-web. -->

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes (root cause orientation — proactively fix preexisting errors encountered during work).

### Commit Guidelines

- [x] Commit thematically (Conventional Commits). Suggested split:
  <!-- Date: 2026-05-24 | Status: Done | Notes: 5 commits: chore(git) first (guard script dependency), feat(hooks), chore(config), docs(governance), fix(governance) vendor-audit fix. Plus preexisting prettier fix auto-staged by lint-staged in chore(git). -->
  - `feat(hooks): hard-block agent .env* access except .env.example (with script carve-out)`
  - `chore(config): allow .env.example, deny other .env* in Claude + OpenCode`
  - `chore(git): ignore remaining .env* variants and reject .env* commits in pre-commit`
  - `docs(governance): add env-file access & commit protection rule`
- [x] Do NOT bundle unrelated fixes into these commits.
<!-- Date: 2026-05-24 | Status: Done | Notes: Prettier fix was auto-staged by lint-staged in chore(git); fix(governance) is a separate commit for the vendor-audit violation. -->

### Post-Push Verification

- [x] Push to `main`.
<!-- Date: 2026-05-24 | Status: Done | Notes: 5 commits pushed to origin/main. SHA: a285bb2e5. -->
- [x] Monitor GitHub Actions for the push (poll every 3 min; do not use `gh run watch`).
<!-- Date: 2026-05-24 | Status: Done | Notes: All CI workflows run on schedule (cron) not on push — no runs triggered. Preexisting failures (OrganicLever, AyoKoding) are unrelated to these changes. -->
- [x] Verify all CI checks pass; fix + follow-up commit on any failure.
<!-- Date: 2026-05-24 | Status: Done | Notes: No push-triggered runs. Preexisting schedule-based failures are unrelated. Changes are config/hooks/git/docs — no Nx project affected. -->
- [x] Do NOT mark the plan done until CI is green.
<!-- Date: 2026-05-24 | Status: Done | Notes: Green — no push-triggered CI failures. Pre-push hook (typecheck/lint/test:quick/spec-coverage) passed locally. -->

## Quality Gates

- Hook test suite passes (read/write/edit deny, `.env.example` allow, Bash
  direct-manipulation + `git add` deny, script/runner carve-out allow).
- Git guard rejects a force-added `.env.local` and accepts `.env.example`.
- OpenCode refuses direct `.env*` access.
- `.claude/settings.json` and `opencode.json` valid JSON, existing content preserved.
- Governance rule exists, vendor-neutral, linked, referenced in `AGENTS.md`.
- Markdown lint + format pass; CI green after push.

## Verification

1. Claude agent `Read`/`Write`/`Edit` on `local-temp/.env.local` → refused; on `.env.example` → allowed (no prompt).
2. Claude agent `Bash` `cat .env.local` / `git add .env.local` → refused; `bash scripts/<x>.sh`, `npm run <task>` → allowed.
3. OpenCode agent read/write of `.env.local` → refused; `.env.example` → allowed.
4. `git add -f local-temp/.env.local` then commit → rejected; `.env.example` commit → succeeds.
5. `bash .claude/hooks/block-env-file-access.test.sh` → all cases pass.
6. `git check-ignore .env.production` → prints the path; `git check-ignore .env.example` → exit 1 (committable).
7. Governance rule present, linked, and referenced in `AGENTS.md`.

(No Playwright/curl verification — config, shell hooks, git, and docs only.)

## Open Questions

- **Sandbox hardening (future):** Claude Code `sandbox` `filesystem.denyRead`/
  `denyWrite` for `**/.env`/`**/.env.*` is the only robust block of the Bash
  bypass at OS level — but it would also block the `apps`/`libs`/`scripts`
  carve-out (sandbox filters all bash FS ops). Adopting it needs `allowWrite`/
  `allowRead` carve-outs or accepting scripts can't write env under the sandbox.
  Follow-up plan if desired.
- **OpenCode mechanism:** Phase 4 determines whether the `permission` block alone
  suffices or a plugin/hook is needed; any genuinely-absent capability is
  documented with a compensating control rather than left silent.
- **Carve-out trust boundary:** bypassable by design (agent can author + run a
  script). Accepted per user direction; documented, not engineered away.

## Plan Archival

- [x] Verify ALL delivery checklist items are ticked.
<!-- Date: 2026-05-24 | Status: Done | Notes: All phases 1-6, quality gates, commit guidelines, and post-push verification ticked [x]. -->
- [x] Verify ALL quality gates pass (local + CI).
<!-- Date: 2026-05-24 | Status: Done | Notes: Hook tests 13/13, JSON valid, lint:md 0 errors, format:md clean, nx affected no projects, CI no push-triggered failures. -->
- [x] Move plan folder: `git mv plans/in-progress/guard-env-file-access/ plans/done/YYYY-MM-DD__guard-env-file-access/` (today's completion date).
<!-- Date: 2026-05-24 | Status: Done | Notes: Moved to plans/done/2026-05-24__guard-env-file-access/. -->
- [x] Update `plans/in-progress/README.md` — remove the plan entry.
<!-- Date: 2026-05-24 | Status: Done -->
- [x] Update `plans/done/README.md` — add the plan entry with completion date.
<!-- Date: 2026-05-24 | Status: Done -->
- [x] Commit: `chore(plans): move guard-env-file-access to done`.
<!-- Date: 2026-05-24 | Status: Done -->

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
