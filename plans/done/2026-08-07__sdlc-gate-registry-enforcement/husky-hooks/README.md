---
title: "Target-State Husky Hooks — SDLC Gate Registry Enforcement"
description: The post-rewire hook shims for each repo, showing that no check list survives in shell
category: explanation
subcategory: plans
tags:
  - ci-cd
  - git-hooks
  - parity
created: 2026-08-02
---

# Target-State Husky Hooks

Twenty-four files: the twelve hooks as they will be, and — in [`current/`](./current/) — the twelve
they replace, captured verbatim. Both sides are complete files, so the replacement is reviewable in
full rather than described.

**The two sets are named differently on purpose.** The target-state shims carry `.sh`; the captures
in `current/` do not. `ose-public`'s own `lint-staged` runs `shfmt -w` on every staged `*.sh`, so a
capture named `*.sh` gets **reformatted on commit** — tabs for spaces, spacing normalized — and
silently stops being the verbatim copy it claims to be. That happened once here and was caught by the
byte-identity check below. Dropping the extension puts the captures outside the glob, which is also
why they mirror the live hook filenames exactly. The trade is that `current/` is not shellcheck-swept
in this repo; that is fine, since each file is already gated by its own repo's `*.sh`-free hook path
and these are evidence, not shipped code.

`[Web-cited]` A Husky v9 hook is the project-owned file under `.husky/`, so each `.sh` here **is**
the entire file, not an excerpt. Husky's official [How To](https://typicode.github.io/husky/how-to.html)
(accessed 2026-08-04) says adding a hook is simply creating that file and shows `.husky/pre-commit`
containing the command. The official [v4 migration](https://typicode.github.io/husky/migrate-from-v4.html)
(accessed 2026-08-04) likewise says to copy commands into the corresponding v9 hook.

| Hook         | After (lines) | Before (lines, `ose-public`) | Replaces                                                       |
| ------------ | ------------- | ---------------------------- | -------------------------------------------------------------- |
| `commit-msg` | 9             | 1                            | A one-line `commitlint` call                                   |
| `pre-commit` | 13            | 29                           | Four hand-ordered steps plus an inline lockfile loop           |
| `pre-push`   | 13            | 39                           | Seven repo-wide commands plus a hand-written path-gating block |

Copy each top-level `.sh` to `.husky/<hook>` in its repo, dropping the `.sh` extension. The extension
exists only so these files are covered by `shellcheck --severity=warning` while they live in the plan
folder — both the before and after sets pass it today, which is a cheap check that the shipped hooks
will too.

## What `current/` is for

`[Repo-grounded]` Captured 2026-08-02 from each repo's live `.husky/`. Two uses:

1. **Phase 0 reconciliation.** Before overwriting, diff `current/{hook}-{repo}` against the live
   file. A non-empty diff means someone else changed that hook after the 2026-08-04 revalidation —
   reconcile it rather than overwriting, exactly as
   [`repo-configs/`](../repo-configs/README.md) requires for the registry.
2. **Evidence for the central claim.** The plan asserts the four repos' hooks have silently diverged.
   `current/` is that assertion made checkable rather than asserted.

Both uses depend on the captures actually being verbatim, so verify that first — this prints
`identical` twelve times:

```sh
# Set this to the directory that contains the authorized OSE checkouts.
SDLC_REPOS_ROOT=/path/to/ose-checkouts
for r in ose-public ose-primer <private-sibling> beaver-nest; do
  for h in commit-msg pre-commit pre-push; do
    diff -q "$SDLC_REPOS_ROOT/$r/.husky/$h" "current/$h-$r" >/dev/null \
      && printf '%-13s %-11s identical\n' "$r" "$h" \
      || printf '%-13s %-11s DIFFERS\n' "$r" "$h"
  done
done
```

`[Repo-grounded]` Ran 2026-08-02 and re-ran against all four current `main` refs on 2026-08-04:
twelve `identical` both times. A `DIFFERS` has two possible causes and they
need opposite responses — either the live hook changed since capture (reconcile, per use 1), or a
formatter rewrote the capture (re-capture, and check what glob matched it).

### Measured divergence before the plan

`[Repo-grounded]` Each cell is `diff` against `ose-public`'s copy of the same hook:

| Hook         | `ose-primer`       | The private sibling | `beaver-nest`      |
| ------------ | ------------------ | ------------------- | ------------------ |
| `commit-msg` | identical          | identical           | identical          |
| `pre-commit` | identical          | 27 lines differ     | identical          |
| `pre-push`   | **4 lines differ** | **56 lines differ** | **2 lines differ** |

`pre-push` is the drift surface: it differs in **all three** downstream repos, and nothing detects
that today. The private sibling's larger delta is partly legitimate (it carries an `iac-lint` pair the
others lack) and partly drift — the plan does not assume which, it moves every one of those lines
into `repo-config.yml` where the difference becomes declared data instead of divergent shell.

Reproduce:

```sh
# Note the missing extension: files in current/ mirror the live hook names.
cd current
for h in commit-msg pre-commit pre-push; do
  for r in ose-primer <private-sibling> beaver-nest; do
    diff -q "$h-ose-public" "$h-$r" >/dev/null \
      && echo "$h/$r: identical" || echo "$h/$r: differs"
  done
done
```

## The whole point: they are identical across all four repos

Open any two and diff them. They are byte-identical, because **every per-repo difference now lives in
`repo-config.yml`** rather than in shell. That is the structural claim this plan makes, made
inspectable: if these twelve files are not four identical triples, something is still hand-wired that
should be declared.

```sh
# Run from this folder. Should print nothing.
for h in commit-msg pre-commit pre-push; do
  for r in ose-primer <private-sibling> beaver-nest; do
    diff "$h-ose-public.sh" "$h-$r.sh"
  done
done
```

Run the same loop inside [`current/`](./current/) and it prints plenty — that contrast is the whole
argument for the change.

## What disappears from `pre-push`

The current `pre-push` carries a hand-written block that computes an upstream range and greps the
changed file list against six regexes to decide which governance validators to run:

```sh
RANGE=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 && echo '@{u}..HEAD' || echo "")
if [ -n "$RANGE" ]; then
  CHANGED=$(git diff --name-only "$RANGE" 2>/dev/null || echo "")
  if echo "$CHANGED" | grep -qE '^(\.claude/agents/|\.opencode/agents/)'; then
    ...
```

That excerpt is elided for readability only — the block in full, with all six regexes, is in
[`current/pre-push-ose-public`](./current/pre-push-ose-public), and the three downstream repos'
copies sit beside it.

Every one of those triggers becomes a `trigger:` list on a `scope: path-gated` gate, and `gate run`
computes the changed set itself. This is the single largest source of surface drift the audit found,
because a maintainer adding a validator had to remember to add a matching regex here — in four repos.
The divergence table above is what that costs: `pre-push` differs in all three downstream repos.

## What deliberately does not change

`pre-commit` still delegates per-file work to `npx lint-staged`. `gate run --surface=pre-commit` does
not reimplement file-type dispatch; it invokes `lint-staged`, whose block is itself generated from
the registry. `[Web-cited]` That preserves its backup and restore behavior. The official
[lint-staged README](https://github.com/lint-staged/lint-staged) (accessed 2026-08-04) states that it
creates a stash backup by default and restores task modifications on error; a bespoke dispatcher
would have to re-earn that safety. See
[tech-docs §2.2.2](../tech-docs.md#222-lint-staged-is-generated-not-replaced).

## Related

- [repo-configs/](../repo-configs/README.md) — where every check these shims run is declared
- [package-json/](../package-json/README.md) — the generated `lint-staged` block `pre-commit` delegates to
