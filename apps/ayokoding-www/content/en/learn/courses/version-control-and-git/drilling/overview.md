---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Version Control & Git topic: five fixed drills that
force active recall instead of passive re-reading. Work through them in order -- short-answer recall
first, then scenario judgment, then hands-on repetition, then a checklist to confirm real automaticity,
and finally why/why-not prompts that test whether you can explain the reasoning, not just execute the
command. Every answer is hidden in a `<details>` block; try each item yourself before opening it.

Every code kata below was verified with a real `git` CLI session against genuinely fresh scratch
repositories, exactly like `../learning/code/`'s own `setup.sh`/`transcript.txt` convention -- nothing in
this topic's output is simulated or hand-written. The "Output" blocks shown inline below are trimmed
excerpts of each kata's own `code/*/transcript.txt` for readability; the full, byte-for-byte transcript is
always available under `drilling/code/`.

## Recall Q&A

Twenty-nine short-answer questions, one per concept (`co-01` through `co-29`). Answer from memory, then
check.

**Q1 (co-01 -- repository-init-and-clone).** What does `git init` create, and how does `git clone` differ
from it?

<details>
<summary>Answer</summary>

`git init` creates the `.git/` directory that turns a plain folder into a repository, starting from zero
commits. `git clone` instead copies an EXISTING repository's entire object database and history, then
checks out a working tree -- it never starts from empty.

</details>

**Q2 (co-02 -- three-states-model).** Name the three areas every tracked file moves through, in order.

<details>
<summary>Answer</summary>

The working tree (what you edit on disk), the staging area / index (what the next commit will contain),
and committed history (permanent, content-addressed snapshots).

</details>

**Q3 (co-03 -- object-model).** Name Git's four hash-addressed object types, and what each one stores.

<details>
<summary>Answer</summary>

Blob (raw file content), tree (a directory listing: modes, types, hashes, names), commit (a snapshot
pointer plus metadata: tree hash, parent(s), author, committer, message), and tag (an optional,
richer wrapper around a commit with its own tagger/message).

</details>

**Q4 (co-04 -- refs-branches-head).** What is a branch, at the lowest level, and what does `HEAD` point
at?

<details>
<summary>Answer</summary>

A branch is just a named pointer to one commit -- nothing more. `HEAD` normally points at the current
branch (which then points at a commit), a two-step indirection; in a "detached HEAD" state, `HEAD` points
straight at a commit instead, with no branch in between.

</details>

**Q5 (co-05 -- staging-and-status).** What does `git add` do, and what three states can `git status`
report a file in?

<details>
<summary>Answer</summary>

`git add` copies a file's current content from the working tree into the index. `git status` reports
each file as untracked, modified-but-unstaged, or staged ("Changes to be committed").

</details>

**Q6 (co-06 -- hunk-staging).** What does `git add -p` let you do that plain `git add <file>` cannot?

<details>
<summary>Answer</summary>

`-p` walks through a file's changes one hunk at a time, asking whether to stage each one individually --
and `s` can split one hunk into smaller sub-hunks. This lets one physical editing session become several
separately-stageable, separately-committable pieces, instead of forcing the whole file into one commit.

</details>

**Q7 (co-07 -- committing-and-messages).** What does `git commit` record, and what convention does a
well-formed message follow?

<details>
<summary>Answer</summary>

It records whatever is currently staged as a new, permanent commit. The convention is a short imperative-
mood subject line, optionally followed by a blank line and a longer explanatory body.

</details>

**Q8 (co-08 -- amending-commits).** What does `git commit --amend` actually do to the previous commit?

<details>
<summary>Answer</summary>

It does not edit the old commit in place -- Git objects are immutable. It creates a brand-new commit
(same or updated content/message) and moves the branch pointer to it, leaving the old commit unreferenced
(recoverable via reflog for a while).

</details>

**Q9 (co-09 -- diffing).** Name the three kinds of comparisons `git diff` can perform.

<details>
<summary>Answer</summary>

Working-tree-vs-index (plain `git diff`), index-vs-HEAD (`git diff --staged`), and any two arbitrary
commits or branches (`git diff A B`, or the two-dot/three-dot branch-comparison forms).

</details>

**Q10 (co-10 -- history-inspection).** Name three commands (or flag combinations) for reading history,
and what each reveals.

<details>
<summary>Answer</summary>

Any three of: `git log --oneline` (compact one-line-per-commit), `git log --graph --all` (ASCII commit
graph across every branch), `git log --pretty=format:"..."` (custom per-commit template), `git show
<commit>` (metadata plus diff for one commit), `git cat-file -p/-t <hash>` (an object's raw content or
type, directly from storage).

</details>

**Q11 (co-11 -- branching).** Which single command both creates a new branch and switches to it?

<details>
<summary>Answer</summary>

`git switch -c <name>` (equivalent to the older `git checkout -b <name>`) -- combines `git branch <name>`
and `git switch <name>` into one step.

</details>

**Q12 (co-12 -- fast-forward-merge).** When does `git merge` produce a fast-forward instead of a merge
commit?

<details>
<summary>Answer</summary>

When the target (receiving) branch has not diverged at all since the merged-in branch was created -- Git
simply slides the target branch's pointer forward to match the other branch's tip, with no new commit and
no reconciliation needed.

</details>

**Q13 (co-13 -- three-way-merge).** What makes a merge "three-way", and what marks the resulting commit
as a real merge?

<details>
<summary>Answer</summary>

"Three-way" refers to the three trees compared: the common ancestor and both branch tips. The resulting
merge commit has TWO `parent` lines in its raw object -- the unambiguous, low-level proof, visible via
`git cat-file -p`.

</details>

**Q14 (co-14 -- conflict-resolution).** What triggers a merge conflict, and what are the required steps
to resolve one?

<details>
<summary>Answer</summary>

Both sides changing the exact same content in incompatible ways. Resolution: edit the file to remove the
`<<<<<<<`/`=======`/`>>>>>>>` markers with the actually-intended content, `git add` the resolved file,
then `git commit` (or `--continue` for a rebase/cherry-pick) -- or `--abort` to cancel entirely.

</details>

**Q15 (co-15 -- rebase).** What does `git rebase` do differently from `git merge`, mechanically?

<details>
<summary>Answer</summary>

Rebase REPLAYS a branch's commits, one at a time, onto a new base -- each replayed commit gets a brand-new
hash (its parent, and therefore its content-hash, genuinely changed), producing a single linear history
instead of a fork-and-rejoin shape.

</details>

**Q16 (co-16 -- interactive-rebase).** Name the four everyday operations `git rebase -i`'s todo list
supports.

<details>
<summary>Answer</summary>

`reword` (change one commit's message only), `squash` (fold a commit into the one above it), reordering
(swap todo-list lines to change replay order), and `drop` (skip replaying a commit entirely).

</details>

**Q17 (co-17 -- rebase-vs-merge-policy).** What is the discipline this topic teaches for choosing between
rebase and merge?

<details>
<summary>Answer</summary>

Rebase local work (commits nobody else has pulled yet); merge shared work (commits already pushed and
pulled by someone else) -- never rebase history others have already pulled, because rebase rewrites commit
identity and breaks their next push/pull.

</details>

**Q18 (co-18 -- reset-modes).** Name the three `git reset` modes and what each one moves.

<details>
<summary>Answer</summary>

`--soft` moves only `HEAD` (index and working tree untouched -- the undone commit's change reappears
staged). `--mixed` (the default) moves `HEAD` and resets the index, but leaves the working tree's file
content untouched. `--hard` moves `HEAD`, the index, AND forces the working tree to match -- the only mode
that can discard uncommitted-equivalent content.

</details>

**Q19 (co-19 -- revert).** How does `git revert` differ from `git reset --hard` in what it leaves behind?

<details>
<summary>Answer</summary>

`revert` creates a brand-new commit whose diff is the exact inverse of a target commit -- additive; the
original commit stays fully intact in history. `reset --hard` instead moves the branch pointer backward,
removing commits from the branch's reachable history entirely (though not immediately from storage).

</details>

**Q20 (co-20 -- restore-files).** What do `git restore` (no flags) and `git restore --source=<commit>` each
default to, and restore from?

<details>
<summary>Answer</summary>

Plain `git restore <file>` defaults its source to `HEAD`, discarding an uncommitted working-tree edit by
copying `HEAD`'s version back in. `--source=<commit>` picks a different baseline, restoring that file's
content from any other commit's tree, with no effect on `HEAD` or history.

</details>

**Q21 (co-21 -- stash).** What does `git stash` do, and what is the difference between `pop` and `apply`?

<details>
<summary>Answer</summary>

It shelves the current index+working-tree state onto a stack and restores the working tree to match
`HEAD`. `pop` reapplies the most recent entry AND removes it from the stack; `apply` reapplies it but
leaves a copy on the stack (useful for applying the same stash to more than one branch).

</details>

**Q22 (co-22 -- reflog).** What does `git reflog` track, and how is it different from `git log`?

<details>
<summary>Answer</summary>

It records every position `HEAD` has ever occupied, locally, per-repository -- entirely separate from the
commit graph `git log` shows. It only remembers COMMITS `HEAD` pointed to, never uncommitted working-tree
edits.

</details>

**Q23 (co-23 -- remotes-fetch-push-pull).** What are `git fetch` and `git push`'s respective effects on
the local repository?

<details>
<summary>Answer</summary>

`git fetch` downloads new objects and updates remote-tracking refs (`origin/main`), never touching local
branches or the working tree. `git push` uploads local commits the remote lacks and moves the remote's own
ref to match -- rejected if the local branch is behind the remote's current tip (non-fast-forward).

</details>

**Q24 (co-24 -- tracking-branches).** What is a remote-tracking ref, and what does `git push -u` set up?

<details>
<summary>Answer</summary>

A remote-tracking ref (like `origin/feature`) is a local bookmark for "where a branch last looked on that
remote." `git push -u origin <branch>` pushes AND establishes that the local branch tracks the matching
remote ref, so future plain `push`/`pull` know the default target with no branch name needed.

</details>

**Q25 (co-25 -- tagging).** What is the difference between a lightweight and an annotated tag?

<details>
<summary>Answer</summary>

A lightweight tag (`git tag <name>`) is just a ref pointing straight at a commit -- no extra object. An
annotated tag (`git tag -a <name> -m "..."`) creates a genuine tag OBJECT with its own tagger, date, and
message, distinct from the commit it points at (`git cat-file -t` reports "tag", not "commit").

</details>

**Q26 (co-26 -- gitignore).** What does a `.gitignore` pattern do to an already-tracked file, and how do
you force-add an ignored file?

<details>
<summary>Answer</summary>

Nothing -- `.gitignore` only affects UNTRACKED files; an already-tracked file keeps showing up in `git
status` until explicitly untracked with `git rm --cached`. `git add -f <file>` force-stages one ignored
file as a deliberate, one-time exception.

</details>

**Q27 (co-27 -- commit-hooks).** Where do Git hooks live, and what makes a hook block a commit?

<details>
<summary>Answer</summary>

Plain executable scripts under `.git/hooks/` (e.g. `pre-commit`), run automatically at the lifecycle point
their filename names. A nonzero exit code from the hook aborts the commit entirely; exit `0` lets it
proceed.

</details>

**Q28 (co-28 -- pull-request-trunk-flow).** What is the backbone operation of trunk-based development, and
how short-lived should its branches be?

<details>
<summary>Answer</summary>

Short-lived branches, integrated to trunk through frequent review (pull request) and merge -- ideally one
focused, reviewable change per branch, landed almost immediately rather than accumulating drift from
trunk.

</details>

**Q29 (co-29 -- cherry-pick).** What does `git cherry-pick` do, and what is different about the resulting
commit compared to the original?

<details>
<summary>Answer</summary>

It applies the change introduced by one specific commit onto the current branch as a NEW commit -- same
author, message, and content diff as the original, but typically a different hash (because its parent
usually differs).

</details>

## Applied problems

Fourteen scenarios. Each describes a task or situation without naming the command -- decide which Git
mechanism applies, then check. Every scenario is answerable by reasoning about the concepts alone -- no
running repository is required to attempt one.

**AP1.** You have edited two unrelated things in the same file during one sitting: fixed a typo near the
top, and started an unrelated experiment near the bottom. You want two separate, focused commits. Which
mechanism, and what is the key risk if the two edits happen to sit close together in the file?

<details>
<summary>Answer</summary>

`git add -p` (co-06), stepping through hunks and choosing `y`/`n` per hunk. The risk: if the two edits are
close enough to fall inside Git's default 3-line diff context, they merge into ONE combined hunk instead of
two -- pressing `s` (split) inside `add -p` is the fix for that specific case.

</details>

**AP2.** A teammate ran `git commit --amend` on a commit that had already been pushed and pulled by two
other people. What breaks for them, and why?

<details>
<summary>Answer</summary>

`--amend` (co-08) creates a brand-new commit hash for what looks like "the same" change. Their next `git
push` (or `pull`) will not recognize the new hash as a continuation of the old one -- Git sees the local
and remote histories as having diverged (co-17's warning applies to amend exactly as much as to rebase,
since amend is a one-commit rebase).

</details>

**AP3.** Two branches both independently edit `config.yml`, but at completely different, non-overlapping
lines. What does `git merge` do, with no human intervention needed?

<details>
<summary>Answer</summary>

Succeeds automatically as a genuine three-way merge (co-13) -- Git combines both trees into one new commit
with two parents, no conflict, because the two changes touch different parts of the file.

</details>

**AP4.** You need to undo a commit that has ALREADY been pushed and is visible to the whole team. Which
undo mechanism is safe here, and which one would you specifically avoid?

<details>
<summary>Answer</summary>

`git revert` (co-19) -- adds a new, inverse commit, never rewriting anything already shared. Avoid `git
reset --hard` followed by a force-push -- that rewrites history everyone else already has, exactly the
scenario co-17's discipline warns against.

</details>

**AP5.** Three "wip" commits on a local, not-yet-pushed feature branch need to become one clean commit
with a proper message before opening a pull request. Which tool, and which specific operation inside it?

<details>
<summary>Answer</summary>

`git rebase -i` (co-16), marking the later commits `squash` (folding them into the first) and then
`reword` if the combined message needs cleanup -- safe here specifically because the branch is local and
unshared (co-17).

</details>

**AP6.** You just ran `git reset --hard HEAD~3` and realized one of the three discarded commits was
actually needed. What is the exact recovery sequence?

<details>
<summary>Answer</summary>

`git reflog` (co-22) to find the hash `HEAD` pointed to right before the reset (`HEAD@{1}`), then `git
reset --hard HEAD@{1}` (or `git branch <name> <hash>` if only one commit, not the whole branch tip, is
needed) to restore it.

</details>

**AP7.** A file you are about to `git rm --cached` and add to `.gitignore` still needs to exist, with its
current content, on every teammate's disk after they pull. Does `git rm --cached` threaten that?

<details>
<summary>Answer</summary>

No -- `git rm --cached` (co-26) removes a file from the INDEX/tracking only; the `--cached` flag
specifically means "leave the working-tree copy alone." Existing checkouts keep their local file
untouched; only future tracking of NEW changes to it stops.

</details>

**AP8.** A `pre-commit` hook script exists in `.git/hooks/pre-commit` but a commit with an obvious
violation (say, a forbidden `console.log`) still goes through unblocked. Name two possible reasons.

<details>
<summary>Answer</summary>

Either the file is not executable (`chmod +x` was never run, co-27), or the script's own logic exits `0`
regardless of what it finds (a bug in the check itself, not in Git's hook mechanism) -- Git only enforces
"nonzero exit blocks the commit"; it never inspects what the script's logic actually does.

</details>

**AP9.** You need one specific bugfix commit from a long-lived `develop` branch backported onto a
`release-1.2` branch, without bringing over any of `develop`'s other, unrelated commits. Which command?

<details>
<summary>Answer</summary>

`git cherry-pick <hash>` (co-29) on `release-1.2`, naming just that one commit's hash -- replays only that
commit's diff, as a new commit, with no dependency on the rest of `develop`'s history.

</details>

**AP10.** After `git fetch origin`, `git log --oneline` on your local `main` still shows the SAME commits
it did before the fetch, even though you know teammates pushed new work. Is this a bug?

<details>
<summary>Answer</summary>

No -- `git fetch` (co-23) deliberately never touches local branches, only remote-tracking refs
(`origin/main`). `git log origin/main --oneline` would show the new commits; `git pull` (fetch + merge/
rebase) or an explicit `git merge origin/main` is what would move local `main` itself.

</details>

**AP11.** You want a permanent, named marker on the exact commit shipped as `v2.0.0`, including who
tagged it and when, retrievable later by tooling that reads a release's own metadata. Lightweight or
annotated tag?

<details>
<summary>Answer</summary>

Annotated (`git tag -a v2.0.0 -m "..."`, co-25) -- it creates a genuine tag object carrying tagger name,
date, and message; a lightweight tag is a bare pointer with no such metadata to read back.

</details>

**AP12.** A short-lived feature branch was fast-forward-merged into `main` (no divergence, no merge
commit). A teammate later asks "when did this feature branch exist, and where did it fork from main?" Can
`git log --graph` answer that after the fact?

<details>
<summary>Answer</summary>

No -- a fast-forward merge (co-12) leaves no trace that a separate branch ever existed; the commits simply
appear as a linear continuation of `main`. If preserving that visibility matters, `git merge --no-ff`
(co-13) is the alternative that forces a real merge commit even when a fast-forward was possible.

</details>

**AP13.** You are mid-rebase, resolve a conflict, run `git add` on the resolved file, but forget to run
`git rebase --continue` and instead run a plain `git commit`. What happens?

<details>
<summary>Answer</summary>

Git creates an ordinary commit ON TOP of the detached-HEAD state the rebase left you in -- it does NOT
automatically resume replaying the rebase's remaining commits. `git rebase --continue` is a distinct,
required step; a plain `commit` alone leaves the rebase incomplete and any later original commits unreplayed.

</details>

**AP14.** Two developers both clone the same remote at the same starting point. Developer A pushes a
commit. Developer B, without pulling first, tries to push their own independent commit. What happens, and
why is this the correct behavior rather than a bug?

<details>
<summary>Answer</summary>

Developer B's push is REJECTED (non-fast-forward, co-23) -- their local branch does not contain
Developer A's already-pushed commit, so pushing would silently discard it. This is a deliberate safety
check, the exact same principle a local fast-forward-only merge enforces (co-12), applied to the remote.

</details>

## Code katas

Eight hands-on repetition drills. Each is a real, runnable `setup.sh` colocated under `drilling/code/`,
verified against a genuinely fresh scratch repository -- every "buggy" section is a real, common mistake
that actually reproduces the described bug; every "fix" section is the actual correction, re-run in the
same script. Run each yourself, predict the buggy output, then compare against the real, captured
`transcript.txt`.

### Kata 1 -- `.gitignore` added after tracking

**Task.** Adding `config.local.ini` to `.gitignore` should stop Git from tracking further changes to it. The
version below adds the pattern AFTER the file is already tracked, which does nothing to a file Git already
knows about.

**`drilling/code/kata-01-gitignore-after-tracking/setup.sh`** (buggy section)

```bash
echo "secret=123" > config.local.ini; git add config.local.ini; git commit -q -m "accidentally track config.local.ini"

echo "config.local.ini" > .gitignore
git add .gitignore; git commit -q -m "add gitignore (too late)"
echo "secret=456" > config.local.ini      # => edit the already-tracked file again
git status                                 # => BUG: config.local.ini STILL shows as modified -- .gitignore
                                            #    only affects UNTRACKED files, never files already in the index
```

<details>
<summary>Model fix and real output</summary>

**Fix section**

```bash
git rm --cached -q config.local.ini
git commit -q -m "stop tracking config.local.ini"
echo "secret=789" > config.local.ini       # => edit again
git status                                  # => FIXED: config.local.ini no longer appears at all -- now
                                            #    genuinely untracked AND ignored, exactly as .gitignore intended
cat config.local.ini                         # => the file itself is untouched on disk the whole time
```

**Root cause**: `.gitignore` patterns are consulted only when deciding whether to WARN about or ADD an
untracked file -- Git never re-checks an already-tracked path against `.gitignore` on every status call.
`git rm --cached` is the required extra step: it removes the path from the index (stops tracking future
changes) while `--cached` specifically leaves the working-tree copy on disk untouched.

**Output** (real, captured):

```text
=== BUGGY: add the ignore pattern AFTER the file is already tracked ===
On branch main
Changes not staged for commit:
 modified:   config.local.ini

no changes added to commit (use "git add" and/or "git commit -a")
=== FIX: git rm --cached removes it from tracking WITHOUT deleting it from disk ===
On branch main
nothing to commit, working tree clean
secret=789
```

</details>

### Kata 2 -- the detached-HEAD trap

**Task.** Checking out a commit hash directly (rather than a branch), then committing new work there,
looks fine until you switch away -- the new commit has no branch pointing at it.

**`drilling/code/kata-02-detached-head-trap/setup.sh`** (buggy section)

```bash
git checkout -q "$FIRST"                    # => detached HEAD -- HEAD now points straight at a commit,
                                             #    not through any branch (co-04)
git status | head -2                          # => Git itself warns about detached HEAD
echo "hotfix content" > hotfix.txt
git add hotfix.txt; git commit -q -m "hotfix work in detached HEAD"
DETACHED_TIP=$(git rev-parse HEAD)
git switch main -q                            # => switching branches while detached: the hotfix commit
                                              #    has NO branch pointing at it anymore
git log --oneline | { grep -c "hotfix work" || true; }   # => BUG: 0 -- the hotfix commit is unreachable
                                              #    from main; it only survives via reflog, and only for a while
```

<details>
<summary>Model fix and real output</summary>

**Fix section**

```bash
git branch rescued "$DETACHED_TIP"            # => recreates a real, permanent pointer at that commit,
                                              #    using the hash noted before switching away (co-11)
git log --oneline rescued | { grep -c "hotfix work" || true; }   # => FIXED: 1 -- reachable again, permanently, via
                                              #    a real branch instead of a soon-to-expire reflog entry
```

**Root cause**: Git commits made while `HEAD` is detached are perfectly real objects, but with no branch
pointer keeping them reachable, they become effectively invisible (and eventually garbage-collectible)
the moment `HEAD` moves elsewhere. Noting the tip hash BEFORE switching away, then creating a real branch
at that hash, is the fix -- the same principle Example 63's deleted-branch recovery relies on.

**Output** (real, captured):

```text
=== BUGGY: checking out a commit hash directly, not a branch ===
HEAD detached at 9fb8998
nothing to commit, working tree clean
0
=== FIX: create a branch BEFORE committing in detached HEAD, or immediately after ===
1
```

</details>

### Kata 3 -- `reset --hard` loses UNCOMMITTED work permanently

**Task.** A muscle-memory `git reset --hard` to "clean up" discards whatever is uncommitted in the working
tree -- and unlike a discarded COMMIT, reflog has nothing to recover, because the edit was never committed
in the first place.

**`drilling/code/kata-03-reset-hard-loses-uncommitted-work/setup.sh`** (buggy section)

```bash
echo "hours of uncommitted work" > file.txt   # => never staged, never committed
git reset --hard HEAD -q                       # => --hard discards ALL uncommitted changes in the working
                                               #    tree AND index -- there was no commit to "undo" here,
                                               #    so this was never in the reflog to begin with
cat file.txt                                    # => BUG: "hours of uncommitted work" is GENUINELY gone --
                                               #    unlike Example 62's recoverable case, reflog only ever
                                               #    remembers commits, never uncommitted working-tree edits
git reflog | head -3                             # => confirms: no entry mentions the lost edit at all
```

<details>
<summary>Model fix and real output</summary>

**Fix section**

```bash
echo "hours of uncommitted work, take two" > file.txt
git stash push -q -m "safety stash before risky reset"   # => co-21: now genuinely recoverable
git reset --hard HEAD -q                                   # => safe now -- nothing uncommitted to lose
git stash pop -q                                             # => FIXED: the work returns, because it was
                                                              #    shelved onto the stash stack BEFORE the
                                                              #    reset, not left exposed as a plain edit
cat file.txt
```

**Root cause**: `git reflog` records `HEAD`'s history of COMMITS -- it has nothing to say about content
that was never committed at all. The only real defenses against `reset --hard` before uncommitted work is
safe are: commit it (even to a throwaway branch), or `git stash` it first, so it lives somewhere the reset
cannot reach.

**Output** (real, captured):

```text
=== BUGGY: muscle-memory reset --hard when meaning to just discard ONE edit ===
base
dec4f53 HEAD@{0}: reset: moving to HEAD
dec4f53 HEAD@{1}: commit (initial): initial
=== FIX: commit or stash BEFORE any --hard operation, as a safety habit ===
hours of uncommitted work, take two
```

</details>

### Kata 4 -- rebasing (or amending) an already-shared commit

**Task.** A commit that has already been pushed AND pulled by a teammate gets rewritten (here, via
`--amend`, which is really a one-commit rebase) -- the next push is rejected, because the remote's history
no longer matches.

**`drilling/code/kata-04-rebase-shared-branch/setup.sh`** (buggy section)

```bash
git commit --amend -q -m "shared: work everyone will pull (reworded, same effect as a rebase)"
                                                    # => co-17: amend (like rebase) gives this commit a
                                                    #    BRAND NEW hash -- the exact danger co-17 warns
                                                    #    about, applied to the simplest possible case
git push origin main || true                         # => BUG: rejected -- ws1's rewritten history no
                                                    #    longer contains the ORIGINAL hash the remote
                                                    #    (and ws2) still has; a normal push cannot reconcile
                                                    #    two DIFFERENT hashes claiming to be the same commit
```

<details>
<summary>Model fix and real output</summary>

**Fix section**

```bash
git reset --soft HEAD~1 -q                            # => co-18: undo the risky amend, keep the edit staged
git commit -q -m "shared: work everyone will pull"     # => restore the ORIGINAL message/content as a
                                                        #    fresh commit on top -- do NOT reuse --amend here
echo "additional fix, as a NEW commit" >> file.txt
git commit -aq -m "fix: address feedback in a new commit, not a rewrite"
git push origin main                                     # => FIXED: succeeds -- history only ever grew
                                                        #    forward, nothing shared was ever rewritten
```

**Root cause**: this is co-17's central discipline, made concrete: rewriting (amend, rebase, or a
history-rewriting filter) is only safe on commits nobody else has pulled yet. Once shared, the fix for
"I need to change this" is always a NEW commit on top, never a rewrite of the old one.

**Output** (real, captured -- the scratch-directory path below is this run's actual `mktemp -d` result
and, like the commit hashes, differs on a different run):

```text
=== BUGGY: rebasing the ALREADY-PUSHED, already-shared commit anyway ===
To /var/folders/fr/jg3jv_4d39b48cyqlqz18mgr0000gn/T/tmp.SGjH1j3x57/remote.git
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to '/var/folders/fr/jg3jv_4d39b48cyqlqz18mgr0000gn/T/tmp.SGjH1j3x57/remote.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
=== FIX: never rewrite a commit that has already been pushed and pulled -- add a NEW commit instead ===
To /var/folders/fr/jg3jv_4d39b48cyqlqz18mgr0000gn/T/tmp.SGjH1j3x57/remote.git
   f83d7c1..86e9989  main -> main
```

</details>

### Kata 5 -- conflict markers accidentally committed

**Task.** `git add` on a "resolved" conflicted file does not verify the markers were actually removed --
staging a file that still literally contains `<<<<<<<`/`=======`/`>>>>>>>` commits those markers as real,
permanent content.

**`drilling/code/kata-05-conflict-markers-committed/setup.sh`** (buggy section)

```bash
grep -c "<<<<<<<" file.txt || true                 # => confirms markers are still literally in the file
git add file.txt                                     # => co-14: staging alone does NOT check content --
                                                       #    Git trusts that add means "this is resolved"
git commit --no-edit -q
grep -c "<<<<<<<" file.txt || true                    # => BUG: the merge commit's tree now permanently
                                                       #    contains literal <<<<<<< markers as real content
```

<details>
<summary>Model fix and real output</summary>

**Fix section**

```bash
cat > file.txt <<'RESOLVED'
combined: main version + feature version
RESOLVED
git add file.txt
git commit --amend --no-edit -q                       # => co-08: amend the just-made bad merge commit --
                                                       #    only safe because it has not been pushed yet
grep -c "<<<<<<<" file.txt || true                     # => FIXED: no markers anywhere in the resolved file
```

**Root cause**: `git add` is a pure "stage this content" operation -- it has no idea what a conflict marker
looks like and will happily stage one. The discipline is to always search the file for leftover markers
(or use a diff/editor view) BEFORE staging a conflict resolution, never just trust that resolving "felt"
complete.

**Output** (real, captured):

```text
=== BUGGY: git add the conflicted file WITHOUT actually editing out the markers ===
1
1
=== FIX: always search for leftover markers BEFORE staging a conflict resolution ===
0
```

</details>

### Kata 6 -- `stash pop` conflicting with a newer edit

**Task.** Popping an old stash after making an unrelated, forgotten-about edit to the same lines produces
a real conflict -- `stash pop` uses the same merge machinery as `git merge`, markers and all.

**`drilling/code/kata-06-stash-pop-conflict/setup.sh`** (buggy section)

```bash
echo "a different, newer edit" >> file.txt           # => a genuinely new edit, made without remembering
                                                       #    the earlier stash existed
git stash pop || true                                  # => BUG: CONFLICT -- both the stash's shelved
                                                       #    line and the new edit try to occupy the same spot
```

<details>
<summary>Model fix and real output</summary>

**Fix section**

```bash
sed -i.bak '/<<<<<<<\|=======\|>>>>>>>/d' file.txt && rm -f file.txt.bak  # => remove markers, keep both real lines
git add file.txt
git stash drop -q                                          # => FIXED: conflict resolved by hand, exactly
                                                             #    like a merge conflict; the stash entry
                                                             #    itself (already merged in) is now redundant
git stash list                                                # => empty -- nothing left shelved
```

**Root cause**: `git stash pop` internally performs a merge between the stashed state and the current
working tree -- if both touch the same content, it conflicts exactly like `git merge` would (co-14), right
down to the same conflict-marker resolution loop. A habit of `git stash list` before editing (to remember
what is shelved) avoids the surprise; when it does happen, resolving is identical to any other conflict.

**Output** (real, captured):

```text
=== BUGGY: forgetting a stash exists, making an UNRELATED edit to the same file, then popping ===
error: Your local changes to the following files would be overwritten by merge:
 file.txt
Please commit your changes or stash them before you merge.
Aborting
The stash entry is kept in case you need it again.
=== FIX: git stash list BEFORE editing, or resolve the conflict like any other (co-14) ===
base
a different, newer edit
```

</details>

### Kata 7 -- forgetting `--tags` on push

**Task.** Tagging a release locally and pushing `main` does not upload the tag -- a plain push never
includes tags; the remote (and every teammate) sees the release commit but not the tag naming it.

**`drilling/code/kata-07-forgot-push-tags/setup.sh`** (buggy section)

```bash
git tag -a v1.0 -m "release"
git push -q origin main                              # => a plain push NEVER includes tags (co-25)
git -C ../remote.git tag                              # => BUG: empty -- the remote has no tags at all,
                                                       #    even though main itself is fully up to date
```

<details>
<summary>Model fix and real output</summary>

**Fix section**

```bash
git push origin --tags                                 # => FIXED: uploads every local tag the remote lacks
git -C ../remote.git tag                                 # => v1.0 now genuinely exists on the remote
```

**Root cause**: commits and tags are pushed independently -- `git push` alone only ever moves branch refs.
`--tags` (or naming the specific tag) is a required, separate upload step, easy to forget the first time a
release is cut.

**Output** (real, captured):

```text
=== BUGGY: tag the release, push main, but forget --tags ===
=== FIX: git push --tags (or push the specific tag by name) ===
To ../remote.git
 * [new tag]         v1.0 -> v1.0
v1.0
```

</details>

### Kata 8 -- cherry-pick, then merge, duplicates the change in history

**Task.** Cherry-picking an urgent fix onto `main` immediately, then later merging its source branch
normally, leaves the fix's content recorded under two DIFFERENT commit hashes in permanent history --
harmless to the resulting tree, but worth recognizing on sight in `git log --graph`.

**`drilling/code/kata-08-cherry-pick-then-merge-duplicate/setup.sh`** (the "risky" section)

```bash
git cherry-pick "$FIX_HASH" >/dev/null                    # => main gets the fix NOW, without waiting for
                                                         #    the rest of feature's (unrelated) work
git merge --no-ff feature -m "Merge branch 'feature'" -q
git log --oneline --graph                                 # => "urgent bugfix" now appears TWICE in
                                                         #    history -- once as the cherry-picked commit
                                                         #    (a DIFFERENT hash, replayed onto main's later
                                                         #    tip), once again as feature's own original
                                                         #    commit, reachable through the merge's second parent
```

<details>
<summary>Why this is safe, and the real output</summary>

**Verification section**

```bash
git diff main~1 main -- fix.txt                            # => empty -- the merge itself introduces NO
                                                         #    further change to fix.txt; its content was
                                                         #    already identical on both sides, so the merged
                                                         #    tree is correct either way, just with two
                                                         #    commit objects recording the same change instead of one
```

**Root cause / why it is not a real bug**: `git cherry-pick` (co-29) always creates a NEW commit -- it
never removes or rewrites the original one still sitting on its source branch. When that source branch is
later merged normally, both commits remain reachable, and `git merge`'s content-aware algorithm correctly
detects that the fix's content is already present, so the merged tree ends up correct with no conflict.
The only cost is a slightly noisier `git log --graph` -- the same fix genuinely appears twice, as two
different, permanent commit objects with identical diffs.

**Output** (real, captured):

```text
=== RISKY: cherry-pick the urgent fix onto main immediately (co-29) ===
cf7e15e urgent bugfix needed on main now
178227b main: unrelated progress
9eb1a65 initial
=== LATER: feature is fully done and gets merged normally ===
*   0a80439 Merge branch 'feature'
|\
| * 42d9fc7 unrelated feature work
| * db3c567 urgent bugfix needed on main now
* | cf7e15e urgent bugfix needed on main now
* | 178227b main: unrelated progress
|/
* 9eb1a65 initial
=== WHY THIS IS SAFE, NOT A CONFLICT: Git's merge machinery still gets it right ===
```

</details>

## Self-check checklist

Confirm each item without checking `git help` first. If you hesitate, that concept needs another pass.

- [ ] I can explain the difference between `git init` and `git clone` without hesitation. (co-01)
- [ ] I can name the three states a tracked file moves through and identify which one `git status` is
      reporting for any given file. (co-02)
- [ ] I can name all four Git object types and what each one stores. (co-03)
- [ ] I can explain "a branch is a named pointer" and what `HEAD` points at, including detached HEAD.
      (co-04)
- [ ] I can predict what `git status` reports after any combination of edit/add. (co-05)
- [ ] I can stage one hunk out of several unrelated edits in the same file with `git add -p`, including
      splitting a combined hunk with `s`. (co-06)
- [ ] I can write a commit message with a proper subject and body, in imperative mood. (co-07)
- [ ] I can amend a commit's message and/or content, and explain why the resulting hash always changes.
      (co-08)
- [ ] I can choose the right `git diff` form (plain, `--staged`, two-commit) for a described comparison.
      (co-09)
- [ ] I can read `git log --oneline`, `--graph --all`, and `git cat-file -p/-t` output fluently. (co-10)
- [ ] I can create, switch, rename, and delete a branch from memory, including the `switch -c` shortcut.
      (co-11)
- [ ] I can predict whether a given merge will fast-forward before running it. (co-12)
- [ ] I can explain what makes a merge commit "three-way" and confirm it via `cat-file`'s two parent
      lines. (co-13)
- [ ] I can resolve a merge conflict end to end: identify markers, edit, stage, commit (or abort). (co-14)
- [ ] I can explain what rebase replays and why replayed commits get new hashes. (co-15)
- [ ] I can perform reword, squash, reorder, and drop with `git rebase -i` from memory. (co-16)
- [ ] I can state the rebase-vs-merge discipline in one sentence and justify it. (co-17)
- [ ] I can choose correctly between `--soft`, `--mixed`, and `--hard` reset for a described need. (co-18)
- [ ] I can explain why `revert` is safe on shared history and `reset --hard` + force-push is not. (co-19)
- [ ] I can use `git restore` (with and without `--source`) to recover file content correctly. (co-20)
- [ ] I can stash, list, pop, and apply, and explain the difference between pop and apply. (co-21)
- [ ] I can read `git reflog` and use it to recover a commit a `reset --hard` just discarded. (co-22)
- [ ] I can explain what `fetch` does versus `push` versus `pull`, and why fetch alone never moves a local
      branch. (co-23)
- [ ] I can explain what a remote-tracking ref is and what `push -u` sets up. (co-24)
- [ ] I can create both a lightweight and an annotated tag, and explain the object-model difference.
      (co-25)
- [ ] I can write a `.gitignore` pattern and explain why it does nothing to an already-tracked file.
      (co-26)
- [ ] I can install a `pre-commit` hook that genuinely blocks a bad commit, and explain the exit-code
      contract. (co-27)
- [ ] I can describe the short-lived-branch, pull-request, frequent-merge shape of trunk-based
      development. (co-28)
- [ ] I can cherry-pick a single commit onto a different branch and explain how its hash differs from the
      original. (co-29)
- [ ] I can explain, in one sentence, how a branch-and-PR flow keeps unrelated changes apart while keeping
      related changes together in one reviewable commit. (`coupling-vs-cohesion`)
- [ ] I can explain, in one sentence, why "rebase local work, merge shared work" is the disciplined
      compromise between a clean history and a safe one. (`correctness-vs-pragmatism`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts, each tied to one of this topic's two Cross-Cutting Big-Idea tags. Answer each in
your own words before opening the model explanation.

**E1 (`coupling-vs-cohesion`).** Why does this topic teach hunk staging (co-06) as a core skill, rather
than treating "just commit the whole file" as good enough?

<details>
<summary>Model explanation</summary>

A commit is the unit of both history AND review -- one commit should represent one cohesive change, so a
reviewer (or a future `git log -- path`, or a `git revert`) can reason about it in isolation. When two
unrelated edits land in the same file during one sitting, committing the whole file couples them into one
commit whether they belong together or not. Hunk staging is what lets the commit boundary track the
LOGICAL boundary of the change instead of the accidental boundary of "what happened to be open in the
editor at the same time."

</details>

**E2 (`correctness-vs-pragmatism`).** Why does this topic teach BOTH merge and rebase, rather than picking
one as "the correct way" to integrate branches?

<details>
<summary>Model explanation</summary>

Merge is honest and safe -- it never rewrites existing commits, at the cost of a fork-and-rejoin shape in
history. Rebase produces a cleaner, linear history, at the cost of rewriting commit identity. Neither is
strictly "more correct" -- the disciplined compromise (co-17) is contextual: rebase local, still-private
work for a clean history before it is ever shared, then merge once it IS shared, because rewriting shared
history breaks other people's copies. Teaching only one would either sacrifice history clarity or safety
unnecessarily.

</details>

**E3 (`coupling-vs-cohesion`).** Kata 8 shows a cherry-picked commit's content appearing twice in history
after the source branch is later merged. Why does this topic call that "safe, not a bug", if two commits
now record the same content?

<details>
<summary>Model explanation</summary>

Coupling-vs-cohesion is about commit BOUNDARIES matching logical change boundaries, not about each unit of
content appearing exactly once in a graph. Each of the two commits is still individually cohesive (one
records "the urgent fix", replayed onto main; the other records the identical fix as part of feature's own
original history) -- what matters for correctness is that the resulting TREE is right, which Git's
merge algorithm verifies directly. The minor cost is graph noise, not incorrectness or coupling.

</details>

**E4 (`correctness-vs-pragmatism`).** Why does Git reject a non-fast-forward push (Example 71) instead of
silently overwriting the remote with whatever the pusher has locally?

<details>
<summary>Model explanation</summary>

Silently overwriting would be pragmatic in the narrow sense of "the push always succeeds", but it would
also silently discard another developer's already-shared commit with no warning -- a correctness failure
disguised as convenience. Git's rejection forces the pusher to explicitly reconcile (pull, merge or
rebase, then push again) before their view of history can become the shared one -- the safe default,
even though it occasionally means an extra step for the pusher.

</details>

**E5 (`coupling-vs-cohesion`).** Trunk-based development (co-28) favors branches that live for a very
short time, sometimes a single commit. How does branch lifetime relate to keeping related changes
together and unrelated changes apart?

<details>
<summary>Model explanation</summary>

A short-lived branch is naturally scoped to one focused change -- there is not enough time for unrelated
work to accumulate on it before it merges. A long-lived branch, by contrast, tends to accrete multiple
loosely related changes simply because it stays open, which is exactly the coupling this topic's big idea
warns against: a branch (and the PR reviewing it) should represent one cohesive unit of change, and branch
lifetime is one of the simplest practical levers for enforcing that.

</details>

**E6 (`correctness-vs-pragmatism`).** Kata 3 shows that `reflog` cannot recover UNCOMMITTED work lost to
`reset --hard`. Why does this topic still recommend committing/stashing often as a pragmatic habit, rather
than simply teaching "be careful with `--hard`"?

<details>
<summary>Model explanation</summary>

"Be careful" is not a reliable safety mechanism -- muscle memory and mistakes happen regardless of
intent, which is precisely what Kata 3 demonstrates. The pragmatic fix is structural, not attitudinal:
make the risky window as small as possible by committing or stashing frequently, so there is rarely
anything valuable sitting ONLY in the uncommitted working tree when a `--hard` operation (intentional or
not) runs. This trades a small amount of extra typing for removing an entire class of unrecoverable
mistakes.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md)
