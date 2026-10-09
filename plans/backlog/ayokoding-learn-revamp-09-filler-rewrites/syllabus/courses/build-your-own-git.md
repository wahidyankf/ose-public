# Build Your Own Git (By Example)

**Course ID**: `build-your-own-git` · **Format**: By Example.

**Scope note**: Rebuilds Git's local data model in Python and proves it against real Git: the four object types,
loose-object storage, refs and HEAD, the index, and a thin set of commands (`add`, `commit`, `log`, `status`,
`diff`, `checkout`, `branch`, a fast-forward and a line-level three-way merge). It reads packfiles but does not
write them, and it leaves out network protocols, delta compression for writing, submodule workflows, and
worktree edge cases (`version-control-and-git` covers using Git; this course covers how it stores things).

**Short summary**: Git is a content-addressed store with a few small files on top. You build the store, the
names, and the staging area, and every id you print is checked against what the real `git` computes.

## Why this exists · the big idea

- **The problem before the solution**: engineers use Git daily as a set of commands to memorize, so every
  surprising state (detached HEAD, "dirty" checkout, a rebase that rewrote history) feels arbitrary.
- **Keep-this-if-you-forget-everything**: Git stores snapshots as objects named by the hash of their bytes;
  branches are movable names for commits; the index is the next snapshot being assembled. Everything else is
  bookkeeping on those three ideas.

## Learning objectives

- Compute a Git object id by hand: build the header, hash it, and explain why the size counts bytes.
- Write and read blobs, trees, commits, and tags, including tree mode strings and sort order.
- Explain how refs, HEAD, symbolic refs, and branches work, and update a ref safely.
- Read and write the version 2 index and turn it into trees.
- Implement `add`, `commit`, `log`, `status`, `diff`, `checkout`, and a simple merge on top of the store.
- Read a packfile, including an offset delta, and say what a SHA-256 repository changes.
- Prove each result against real Git instead of trusting your own code.

## Prerequisites

- **Prior courses**: `just-enough-python`, `version-control-and-git`.
- **Assumed knowledge**: reading bytes and hexadecimal in Python; using `git add`, `commit`, and `log`.

## Mode and targets

- **Mode**: By Example. **Reason**: every Git rule is a byte layout or a small algorithm with one right answer,
  and real Git can confirm it. A reader learns a rule fastest by producing the bytes and seeing the id match.
- **Examples**: 78 (floor 75), 26 per level. **Words**: at least 28,000. **Diagrams**: 32 marked `[D]` (band 30–50).
- **Metadata**: `format: by-example`; `category: tools-and-practices`; `description` kept from plan 03
  ("Rebuild Git's objects, refs, and index in Python to see how it really works."); `prerequisites` unchanged;
  `estimatedHours` from the drift test.

## Defects found 2026-10-09

- All 78 example headings read `Example N: git-internals-NN` and share one two-sentence body (unique-body
  ratio 0.01).
- All 78 `example.py` files and the capstone `store.py` hash `b"\\0"` (a backslash and a zero) where Git uses the
  NUL byte, so every id they print is wrong; nothing compared an id with Git.
- No example prints output; there are no expected files, no `run.yaml`, no diagrams, and no `Examples by Level`.
- The drilling page has the six template headings and no katas.

## Accuracy notes

- Object format, loose objects, and the header `"<type> <size>\0"`: Git documentation (`git-scm.com/docs`,
  "Git Internals" in Pro Git, `gitformat-*`); the maker cites URLs with access dates (not read by the authoring
  session beyond the facts below).
- The SHA-1 ids of the empty blob (`e69de29bb2d1d6434b8b29ae775ad8c2e48c5391`), the blob "hello world" plus a
  line feed (`3b18e512dba79e4c8300dd08aeb37f8e728b8dad`), and the empty tree
  (`4b825dc642cb6eb9a060e54bf8d69288fbee4904`), and the SHA-256 ids of the empty tree and that blob, were computed
  with Python's `hashlib` on 2026-10-09 ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#the-hash-facts-the-course-must-reproduce)).
  The maker recomputes them and takes the rest from real Git in the oracle unit.
- Git's default hash is SHA-1; SHA-256 repositories exist (`git init --object-format=sha256`); the planned
  change of the default in Git 3.0 had not shipped by October 2026 (`git-scm.com/docs/BreakingChanges`, seen in
  search results 2026-10-09). The maker states the date and re-checks.
- The index file format version 2 (`gitformat-index`), the pack format and its offset delta (`gitformat-pack`):
  the maker reads both pages and cites them. The maker verifies by a Phase 2 probe that `update-index
--cacheinfo` writes zero stat fields so the raw index bytes are reproducible; if not, the unit compares
  `ls-files --stage` instead.
- The shell toolchain's Git version is whatever its Debian snapshot holds (probably 2.47); the course never
  prints it.

## Concepts

- **co-01 · content-addressing** — an id is a function of the bytes; the same bytes always give the same id.
- **co-02 · hash-functions** — SHA-1 by default and SHA-256 optionally; ids are 40 or 64 hex digits.
- **co-03 · blob-object** — file content with no name or mode.
- **co-04 · tree-object** — a directory listing of names, modes, and ids.
- **co-05 · commit-object** — a tree plus parents, identity, time, and message.
- **co-06 · tag-object** — an annotated name for an object, with tagger and message.
- **co-07 · object-header** — `<type> <size>` and a NUL byte come before the payload; the size counts bytes.
- **co-08 · zlib-compression** — loose objects are deflated; the id is of the plain bytes.
- **co-09 · loose-object-path** — the first two hex digits are the fan-out directory.
- **co-10 · hash-object** — hash a file's bytes and optionally write the object.
- **co-11 · cat-file** — read, inflate, parse the header, and check type and size.
- **co-12 · tree-serialization** — mode strings, sort order, and raw id bytes.
- **co-13 · tree-parse** — decode tree bytes back into entries.
- **co-14 · commit-serialization** — header lines, a blank line, the message, and the time zone.
- **co-15 · commit-parent** — parent links form a DAG; changing one commit changes every descendant id.
- **co-16 · refs** — a ref is a file that holds an id; namespaces, `packed-refs`, and the reflog.
- **co-17 · head** — HEAD selects the current state.
- **co-18 · symbolic-ref** — HEAD may name a branch instead of holding an id.
- **co-19 · branch** — a branch is a ref that moves when you commit.
- **co-20 · index-format** — header, sorted entries with padding, trailing checksum.
- **co-21 · staging** — `add` stores content in the object store and the path in the index.
- **co-22 · write-tree** — the flat index becomes nested trees.
- **co-23 · commit-porcelain** — snapshot the staged state, create a commit, move the branch.
- **co-24 · log-walk** — follow parents, newest first.
- **co-25 · checkout** — materialize a tree; refuse to lose local changes.
- **co-26 · status** — compare HEAD, index, and working tree; ignore rules.
- **co-27 · diff** — line diff, unified output, rename detection, and a three-way merge.
- **co-28 · integrity-and-safety** — verify on read, find unreachable objects, keep teaching stores isolated.
- **co-29 · deterministic-fixtures** — fixed identity and time make ids repeatable.
- **co-30 · plumbing-porcelain** — small commands compose into the commands people use.
- **co-31 · pack-format** — pack header, object types, and deltas, read-only.
- **co-32 · sha256-repositories** — a different object format, 32-byte raw ids, and the transition.

## Worked examples

### Beginner (`learning/beginner.md`, Examples 1–26)

- **ex-01 · what-is-content-addressing** — hash two byte strings and one with a single changed byte — verify
  equal input gives equal ids and the changed byte gives a different id. (co-01) [D]
- **ex-02 · hash-the-header** — build `blob <size>` NUL payload and hash it — verify `3b18e512…` for "hello
  world" plus a line feed equals the vector from real Git. (co-02, co-07)
- **ex-03 · empty-blob-and-tree** — compute the ids of the empty blob and the empty tree — verify `e69de29…` and
  `4b825dc…`. (co-03, co-04)
- **ex-04 · size-in-bytes** — hash a string with a multibyte character — verify the header counts bytes, not
  characters, and the id matches the vector. (co-07)
- **ex-05 · ask-real-git** — a shell unit computes the same ids with real Git under fixed config — verify every
  line of the vectors file matches. (co-02) [S]
- **ex-06 · the-nul-trap** — hash with a backslash and a zero in place of NUL, built without writing the two
  characters as one literal — verify the wrong id `3049e353…` differs from the right one and say why. (co-07) [D]
- **ex-07 · zlib-loose-object** — deflate an object and inflate it — verify the round trip is equal and the id is
  of the uncompressed bytes. (co-08)
- **ex-08 · loose-path** — split an id into directory and file — verify `3b/18e512…`. (co-09)
- **ex-09 · write-a-loose-object** — write an object into a temporary store — verify the file exists at the
  path and a second write changes nothing. (co-09, co-10) [D]
- **ex-10 · read-it-back** — read, inflate, and parse the header — verify type, size, and payload. (co-11)
- **ex-11 · reject-corrupt-object** — flip one byte in a stored object — verify the read fails on a size or id
  mismatch. (co-11, co-28)
- **ex-12 · hash-object-command** — implement `hash-object` with and without `-w` — verify the printed id and
  that without `-w` nothing is written. (co-10)
- **ex-13 · cat-file-command** — implement `cat-file -t`, `-s`, `-p` for a blob — verify the three outputs.
  (co-11)
- **ex-14 · tree-entry-bytes** — encode one tree entry as mode, space, name, NUL, and the 20 raw id bytes —
  verify the bytes in hexadecimal. (co-12) [D]
- **ex-15 · tree-modes** — list the modes `100644`, `100755`, `120000`, `40000`, and `160000` — verify a
  directory's mode has no leading zero. (co-12)
- **ex-16 · tree-sort-order** — sort entries so a directory sorts as its name plus a slash — verify `a.b`
  against `a/` gives the id real Git computes. (co-12) [D]
- **ex-17 · write-a-tree** — build a tree from a mapping of names to blob ids — verify the id against the
  vector. (co-04, co-12) [D]
- **ex-18 · parse-a-tree** — decode tree bytes — verify the entries equal the ones written. (co-13)
- **ex-19 · nested-trees** — turn a directory into a subtree recursively — verify the root id against the
  vector. (co-04, co-12) [D]
- **ex-20 · commit-text** — format a commit's lines: tree, parent, author, committer, blank line, message —
  verify the bytes. (co-05, co-14) [D]
- **ex-21 · commit-id** — create a commit with a fixed identity and the time `1700000000 +0000` — verify the id
  against the vector. (co-14, co-29)
- **ex-22 · timezone-offsets** — encode `+0700` and `-0530` — verify the header text and that the sign matters.
  (co-14)
- **ex-23 · parent-chain** — chain three commits — verify that changing the first message changes all three ids.
  (co-15) [D]
- **ex-24 · tag-object** — write an annotated tag object — verify the id against the vector and the `object`,
  `type`, `tag`, and `tagger` lines. (co-06)
- **ex-25 · lightweight-vs-annotated** — compare a ref straight to a commit with a ref to a tag object — verify
  the two ids differ and that peeling the tag gives the commit. (co-06, co-16) [D]
- **ex-26 · object-store-class** — assemble an `ObjectStore` with write, read, and exists — verify a round trip
  over a blob, a tree, and a commit. (co-10, co-11, co-30) [D]

### Intermediate (`learning/intermediate.md`, Examples 27–52)

- **ex-27 · ref-file** — write `refs/heads/main` as an id plus a line feed — verify the bytes. (co-16)
- **ex-28 · resolve-ref** — resolve a short name through `refs/heads` and `refs/tags` — verify the order of
  lookup and an ambiguous name. (co-16)
- **ex-29 · head-symbolic-ref** — read a HEAD that holds `ref: refs/heads/main` — verify it resolves to the
  commit. (co-17, co-18) [D]
- **ex-30 · detached-head** — set HEAD to a bare id — verify it resolves and is reported as detached. (co-17)
- **ex-31 · update-ref-safely** — update a ref only if its old value matches — verify a stale old value is
  refused. (co-16)
- **ex-32 · create-branch** — create a branch at HEAD — verify the file content. (co-19)
- **ex-33 · branch-name-rules** — validate names (no `..`, no space, no trailing `.lock`) — verify an
  accept/reject table. (co-19)
- **ex-34 · move-branch** — advance the current branch on a commit — verify HEAD is unchanged and the branch
  moved. (co-19) [D]
- **ex-35 · packed-refs** — read a `packed-refs` file and let a loose ref win — verify precedence. (co-16)
- **ex-36 · reflog-line** — append a reflog entry — verify the line format. (co-16)
- **ex-37 · index-header** — write the 12-byte header (`DIRC`, version 2, entry count) — verify the hexadecimal.
  (co-20) [D]
- **ex-38 · index-entry** — write one entry with zeroed stat fields, mode, id, flags, and name padded to eight
  bytes — verify the length is a multiple of eight. (co-20)
- **ex-39 · index-checksum** — a shell unit builds an index with `update-index --cacheinfo`, and the program
  appends the trailing SHA-1 over the same bytes — verify the checksum equals the last 20 bytes of Git's file.
  (co-20) [S]
- **ex-40 · index-sorting** — sort entries by path bytes — verify the order. (co-20)
- **ex-41 · parse-index** — read the bytes of an index written by real Git (a hex fixture) — verify the entries.
  (co-20)
- **ex-42 · stage-a-file** — add a path: write the blob and the entry — verify the listing shows mode, id, and
  path. (co-21) [D]
- **ex-43 · restage-changed-file** — change a file and add it again — verify only that entry changed. (co-21)
- **ex-44 · unstage** — remove an entry — verify it is gone and the blob stays in the store. (co-21)
- **ex-45 · executable-bit** — stage a file with mode `100755` — verify. (co-12, co-21)
- **ex-46 · write-tree-from-index** — turn flat index entries into nested trees — verify the root id equals what
  real Git's `write-tree` printed (in the vectors). (co-22) [D]
- **ex-47 · commit-tree** — create a commit from a tree and a parent — verify the id. (co-23) [D]
- **ex-48 · commit-porcelain** — run write-tree, commit-tree, and move the branch — verify the branch moved and
  the reflog line was added. (co-23) [D]
- **ex-49 · empty-commit-guard** — refuse a commit whose tree equals its parent's unless allowed — verify both
  cases. (co-23)
- **ex-50 · log-walk** — follow parents newest first — verify the list. (co-24) [D]
- **ex-51 · log-with-merges** — walk a two-parent history with a queue ordered by commit time — verify the
  order. (co-24) [D]
- **ex-52 · compare-log-with-git** — a shell unit replays the course session with real Git — verify its
  `rev-list` output equals the vectors the Python units use. (co-22, co-23, co-24) [S]

### Advanced (`learning/advanced.md`, Examples 53–78)

- **ex-53 · tree-to-files** — materialize a tree into a directory — verify the files, contents, and modes.
  (co-25) [D]
- **ex-54 · checkout-branch** — switch HEAD, the index, and the files together — verify all three. (co-25) [D]
- **ex-55 · checkout-refuses-dirty** — refuse when a local change would be overwritten — verify the refusal and
  that nothing changed. (co-25, co-28)
- **ex-56 · three-state-compare** — classify files across HEAD, index, and working tree — verify six states.
  (co-26) [D]
- **ex-57 · status-short** — print the short status codes — verify the output equals real Git's `status
--porcelain` for the same tree. (co-26) [S]
- **ex-58 · ignore-rules** — match globs, directories, and negation — verify a table of paths. (co-26)
- **ex-59 · line-diff-lcs** — compute a line diff with the longest common subsequence — verify the edit script.
  (co-27) [D]
- **ex-60 · unified-diff** — format hunks with context — verify the text equals real Git's `diff --no-index`
  output. (co-27) [S]
- **ex-61 · diff-index-vs-worktree** — diff a staged file against the working copy — verify the hunk. (co-27)
- **ex-62 · rename-detection** — detect a rename by identical blob id, then by similarity — verify the ratio and
  the pair. (co-27)
- **ex-63 · merge-base** — find the common ancestor of two commits — verify it on a forked history. (co-15,
  co-24) [D]
- **ex-64 · fast-forward** — move a branch forward when it is an ancestor, refuse otherwise — verify both.
  (co-19)
- **ex-65 · three-way-merge-lines** — merge non-overlapping changes and mark an overlap — verify the merged text
  and the conflict markers. (co-27) [D]
- **ex-66 · merge-commit** — create a two-parent commit — verify the id and the parent order. (co-15)
- **ex-67 · cherry-pick** — reapply a commit's change on another parent — verify the new id differs and the tree
  content is equal. (co-23)
- **ex-68 · pack-header** — read the `PACK` header, version, and object count — verify the three fields. (co-31)
  [D]
- **ex-69 · pack-object-types** — decode the type and size varint of each entry — verify a table. (co-31)
- **ex-70 · read-a-small-pack** — parse a pack of undeltified objects from a hex fixture — verify the ids.
  (co-31) [D]
- **ex-71 · offset-delta** — apply an offset delta from the fixture — verify the rebuilt blob and its id.
  (co-31) [D]
- **ex-72 · verify-pack-with-git** — a shell unit converts the fixture to bytes and runs `index-pack` — verify
  the object count and the pack checksum. (co-31) [S]
- **ex-73 · sha256-object-format** — hash with SHA-256 and 32-byte raw ids in trees — verify the vector. (co-02,
  co-32)
- **ex-74 · mixed-hash-guard** — refuse a SHA-1-length id in a SHA-256 store — verify the error. (co-32) [D]
- **ex-75 · fsck-lite** — walk reachable objects and report missing or corrupt ones — verify the report. (co-28)
- **ex-76 · reachability-sweep** — mark reachable objects and list the unreachable — verify the counts. (co-28)
  [D]
- **ex-77 · plumbing-composes-porcelain** — build `add`, `commit`, `log`, and `status` from plumbing calls only
  — verify the session output. (co-30) [D]
- **ex-78 · capstone-preview** — run the capstone's scripted session — verify each id appears in the vectors
  file. (co-01–co-32)

## Drilling

- **Recall Q&A**: at least 24. **Applied problems**: at least 8.
- **Code katas**: `kata-01-wrong-header-terminator`, `kata-02-tree-sort-order`, `kata-03-directory-mode-leading-zero`,
  `kata-04-hex-id-in-tree`, `kata-05-ref-missing-newline`, `kata-06-index-entries-unsorted`,
  `kata-07-commit-timezone-sign`, `kata-08-checkout-overwrites-dirty-file`. Each `before/` prints a `FAIL:` line
  naming the symptom; each `after/` exits 0.
- **Self-check checklist**: at least 24. **Why and why-not prompts**: at least 6 (for example, why not name
  objects by a counter, and why hash the header as well as the content).

## Capstone spec

**A mini Git.** A command-line program (`minigit`) with `init`, `hash-object`, `cat-file`, `add`, `write-tree`,
`commit`, `log`, `branch`, `checkout`, `status`, and `diff`, over a store in a temporary directory. The unit runs
a scripted session with fixed identity and time and prints every object id. The capstone's own tests assert
the ids against `git-oracle-vectors.txt`, which the capstone folder carries as its own copy (a capstone imports
nothing from the example folder). The completion test checks that every 40-digit id in the capstone's expected
output also appears in the example folder's vectors file, which the shell unit verified with real Git.

## Code and harness

- Python standard library only; `hashlib`, `zlib`, `struct`, `pathlib`, `unittest`. The six oracle units use the
  `shell` toolchain ([tech-docs/004](../../tech-docs/004-code-harness-and-determinism.md#the-git-oracle)).
- Shared files under `learning/code/`: `git-oracle-vectors.txt`, `fixture-small.pack.hex`,
  `fixture-index.hex`. No compressed bytes are compared; units print lengths or round trips.
- No unit touches the repository that hosts the course; every store is under `/tmp`.
- Units never print the Git version.

## Lineage

- Replaces the templated course measured on 2026-10-09 (2,710 words, 81 code files). Topic lineage: the
  `build-your-own-git` brief of the 2026-07-19 fundamentally-strong plan and cohort 2 of the 2026-08-15
  jvm-and-build-your-own plan.

## In which paths

- `careers/fundamentally-strong/software-engineer`, `careers/immediately-effective/software-engineer`, and
  `careers/interview-ready/software-engineer` — extension phase `systems-and-tooling`. No manifest change.
