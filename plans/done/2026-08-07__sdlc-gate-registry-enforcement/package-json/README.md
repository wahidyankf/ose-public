---
title: "Target-State package.json — SDLC Gate Registry Enforcement"
description: The complete post-change package.json for each of the four repos, plus the lint-staged block gate emit must produce
category: explanation
subcategory: plans
tags:
  - ci-cd
  - rhino-cli
  - parity
created: 2026-08-02
---

# Target-State `package.json`

Two files per repo, eight in total, because two different things need to be inspectable.

**`package-{repo}.json` — the complete file.** Every section reproduced verbatim from that repo's
current `package.json`, with only the `"lint-staged"` object replaced by what this plan emits.
Execution copies from here, so the four files are reviewable side by side before any repo is touched.
Same treatment as [`repo-configs/`](../repo-configs/README.md).

**`lint-staged-{repo}.json` — the emitted block alone.** This is what
`rhino-cli gate emit --surface=pre-commit` writes, and therefore the unit the drift check diffs. It
is not a duplicate of the above; it is the emitter's acceptance oracle, kept separate so the gate has
something byte-exact to compare against.

| Repo                | Complete file                                                    | Emitted block                                                            | Glob keys (live → target) | Top-level keys |
| ------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------- | -------------- |
| `ose-public`        | [`package-ose-public.json`](./package-ose-public.json)           | [`lint-staged-ose-public.json`](./lint-staged-ose-public.json)           | 26 → 25                   | 15             |
| `ose-primer`        | [`package-ose-primer.json`](./package-ose-primer.json)           | [`lint-staged-ose-primer.json`](./lint-staged-ose-primer.json)           | 20 → 22                   | 14             |
| The private sibling | [`package-private-sibling.json`](./package-private-sibling.json) | [`lint-staged-private-sibling.json`](./lint-staged-private-sibling.json) | 18 → 16                   | 14             |
| `beaver-nest`       | [`package-beaver-nest.json`](./package-beaver-nest.json)         | [`lint-staged-beaver-nest.json`](./lint-staged-beaver-nest.json)         | 26 → 16                   | 16             |

`[Repo-grounded]` Counts measured 2026-08-02 by parsing each repo's live `package.json`. Reverified
2026-08-04: each complete target matches its current repo outside `lint-staged`, every complete
target's `lint-staged` object matches its standalone emitted-block oracle, and the key counts above
are unchanged. `beaver-nest` was refreshed a second time after `cd2ec0e4` changed scripts,
dependencies, optional dependencies, and overrides.

## `lint-staged` is the only key that changes

Worth stating because it bounds the blast radius: no script, dependency, version pin, workspace glob,
or Volta pin is touched by this plan. Verified — this prints `IDENTICAL` four times:

```sh
# Run from this folder. REPOS is the directory holding the authorized checkouts.
REPOS=/path/to/ose-checkouts node -e '
const fs = require("fs");
const repos = process.env.REPOS;
for (const r of ["ose-public", "ose-primer", "<private-sibling>", "beaver-nest"]) {
  const a = JSON.parse(fs.readFileSync(`package-${r}.json`, "utf8"));
  const b = JSON.parse(fs.readFileSync(`${repos}/${r}/package.json`, "utf8"));
  delete a["lint-staged"];
  delete b["lint-staged"];
  console.log(r + ": " + (JSON.stringify(a) === JSON.stringify(b) ? "IDENTICAL" : "DIVERGED"));
}'
```

A `DIVERGED` result is a Phase 0 finding: another change landed after the 2026-08-04 revalidation;
reconcile it rather than overwriting, or the copy silently reverts someone else's work.

## The two files must agree

```sh
# Should print MATCH four times.
node -e '
const fs=require("fs");
for(const r of ["ose-public","ose-primer","<private-sibling>","beaver-nest"]){
  const full=JSON.parse(fs.readFileSync(`package-${r}.json`,"utf8"))["lint-staged"];
  const blk=JSON.parse(fs.readFileSync(`lint-staged-${r}.json`,"utf8"));
  console.log(r+": "+(JSON.stringify(full)===JSON.stringify(blk)?"MATCH":"DRIFT"));
}'
```

## The emitter's acceptance oracle

Phase 1's `gate emit` is correct when this diff is empty. Run it from the `ose-public` repository
root:

```sh
rhino-cli gate emit --surface=pre-commit
diff <(jq '."lint-staged"' package.json) \
  plans/done/2026-08-07__sdlc-gate-registry-enforcement/package-json/lint-staged-ose-public.json
```

That is a diff, not a judgement — which is the point of authoring the target rather than describing
it.

## Why prettier keeps separate glob keys

An earlier draft consolidated every prettier file type into one key
(`*.{md,json,yml,yaml,css,scss,html,sql,ts,...}`). That is a **behaviour change**, and a harmful one.

`[Web-cited]` `lint-staged` runs command arrays as sequential subtasks but configured glob tasks
concurrently by default. Its official [README](https://github.com/lint-staged/lint-staged)
(accessed 2026-08-04) says subtasks are always sequential and configured tasks are concurrent by
default. Today `*.md` is an ordered chain — `prettier --write` first, then
`markdownlint-cli2`, then the four `md * validate` commands — so markdown is always formatted before
it is linted. Moving prettier to its own key breaks that ordering guarantee and lets markdownlint run
against unformatted markdown.

So `format-prettier` declares a **list** of globs (`globs:`) rather than one, and the emitter writes
it into each. The emitter preserves declaration order within each generated key, so declaring
`format-prettier` before `markdownlint` places prettier first in the `*.md` chain. `gate run`
positions this generated per-file set as one batch; non-formatter mutations are direct dispatcher
entries after the batch and never appear in these artifacts.

## Verified delta against the current blocks

For `ose-public`, comparing the generated block to the live one in `package.json`:

| Change                                                          | Deliberate?                                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Removed `*.clj`                                                 | Yes — Clojure is the only declared formatter with zero tracked files here    |
| Removed lockfile sync from `lint-staged`                        | Yes — it is a declared direct mutation after the single per-file batch       |
| `--quiet` added to 7 `cargo run` invocations across 4 glob keys | Yes — normalization; the hooks already used `--quiet`, `lint-staged` did not |
| `--exclude apps/ayokoding-www/content` gains quotes             | Yes — an unquoted glob-shaped argument is shell-expandable                   |
| 17 of 26 glob keys run the same command list                    | Unchanged in behaviour — see the note below                                  |

`[Repo-grounded]` Both counts are measured, and the second needs its unit stated or it reads wrong.
The emitter always writes a JSON **array**, while the live block writes single-command entries as
bare **strings**. So of the 17 unchanged keys, only 1 is strictly JSON-equal; the other 16 change
shape without changing what runs. "Byte-identical" would be the wrong word — the honest claim is that
17 keys execute the same command list. Reproduce both numbers:

```sh
# Run from the `ose-public` repository root.
node -e '
const fs = require("fs");
const norm = (v) => JSON.stringify(Array.isArray(v) ? v : [v]);
const live = JSON.parse(fs.readFileSync("package.json", "utf8"))["lint-staged"];
const tgt = JSON.parse(fs.readFileSync("lint-staged-ose-public.json", "utf8"));
let same = 0, strict = 0;
for (const k of Object.keys(tgt)) {
  if (live[k] === undefined) continue;
  if (norm(live[k]) === norm(tgt[k])) same++;
  if (JSON.stringify(live[k]) === JSON.stringify(tgt[k])) strict++;
}
console.log(`same command list: ${same} of ${Object.keys(live).length}; strictly equal: ${strict}`);'
```

Nothing else changed. Any other difference at execution time is drift that landed after the
2026-08-04 revalidation and must be reconciled, not overwritten.

## Related

- [repo-configs/](../repo-configs/README.md) — the registry these blocks are emitted from
- [husky-hooks/](../husky-hooks/README.md) — the `pre-commit` shim that invokes `npx lint-staged`
- [tech-docs §2.2.2](../tech-docs.md#222-lint-staged-is-generated-not-replaced) — why lint-staged is generated rather than replaced
