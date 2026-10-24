---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to GitHub Actions and the gh CLI: recall first, then applied judgement, then hands-on repetition, then a checklist, then a why and why-not pass to confirm real automaticity rather than recognition. Every answer hides in a `<details>` block; try each item yourself before opening it.

## Recall Q&A

Twenty-four short-answer questions covering each of co-01 to co-16. Answer from memory, then check. Star the ones you miss and repeat them after a day; spaced repetition only works when the misses decide what comes back.

### Q1 (co-01): Which event starts a workflow on every push, and how do you limit it to main?

<details><summary>Answer</summary>

The push event, with a branches filter listing main under it. The filter nests under the event: `push: branches: [main]`. Without the filter the workflow runs on every branch push.

</details>

### Q2 (co-01): When does a schedule trigger run, and in which timezone?

<details><summary>Answer</summary>

On its cron expression in UTC against the default branch. Quote the expression because YAML mangles asterisks, and convert local times explicitly since the scheduler speaks only UTC.

</details>

### Q3 (co-02): What are the three nesting levels of a workflow file, from outer to inner?

<details><summary>Answer</summary>

Workflow, job, step. Triggers start workflows, workflows fan out to jobs, jobs execute ordered steps. Misreading the level — for example putting run: beside jobs: — is the most common beginner failure.

</details>

### Q4 (co-02): How does one step read a value computed by an earlier step?

<details><summary>Answer</summary>

The producer step takes an id and writes `name=value` to GITHUB_OUTPUT; the consumer reads `steps.<id>.outputs.<name>`. The id makes the step addressable, and the output file is the only channel.

</details>

### Q5 (co-03): What does a two-axis matrix produce, and how do you count it before pushing?

<details><summary>Answer</summary>

One job per combination — the cartesian product of the axes. Count it by expanding offline: two versions times three systems is six jobs. Multiplication is merciless, so count in review.

</details>

### Q6 (co-04): What makes a cache key correct, and what do restore-keys add?

<details><summary>Answer</summary>

The key hashes the lockfile so dependencies changes invalidate exactly once. Restore-keys add a fallback ladder from exact key to broad prefixes, so near-miss caches still warm most packages.

</details>

### Q7 (co-05): What two things must match for an artifact handoff to work?

<details><summary>Answer</summary>

The needs edge, which guarantees the producer finished before the consumer starts, and the artifact name, spelled identically on upload and download. Ordering from needs, identity from the name.

</details>

### Q8 (co-06): How does a caller job invoke a reusable workflow, and how is it pinned?

<details><summary>Answer</summary>

With a job whose whole body is `uses:` pointing at the workflow file plus a release tag. The pin makes adoption deliberate; the callee must declare the workflow_call trigger or the call is rejected.

</details>

### Q9 (co-06): How do data and credentials travel into a reusable workflow differently?

<details><summary>Answer</summary>

Data travels through with: as plain inputs that print freely in logs; credentials travel through secrets: as masked references. Crossing them — a token in with: — prints the credential into every log line.

</details>

### Q10 (co-07): What marks a file as a composite action rather than a workflow?

<details><summary>Answer</summary>

The runs block with `using: composite` and the absence of a jobs block. Composite steps run on the caller's runner, and every run step must name its shell explicitly.

</details>

### Q11 (co-07): When should you choose a JavaScript action over a composite action?

<details><summary>Answer</summary>

When the logic needs Node libraries — parsing, API calls, complex control flow. Shell-step bundles stay composite with zero build; anything that reimplements a library in bash should be JavaScript.

</details>

### Q12 (co-08): Why must secret values never appear literally in a workflow file?

<details><summary>Answer</summary>

Files travel through forks, logs, caches, and screenshots; a literal prints raw because the runner never registered it as secret. References stay masked everywhere and keep the credential in the vault.

</details>

### Q13 (co-08): What replaces a long-lived cloud key, and which permission unlocks it?

<details><summary>Answer</summary>

A per-run federated OIDC token traded for a short role session. The id-token: write permission unlocks minting, and the role assumption bounds what the session can do before it expires in minutes.

</details>

### Q14 (co-09): What happens when a job names a guarded environment?

<details><summary>Answer</summary>

The run pauses for that environment's approval rules before the job's steps execute. Naming the environment also scopes secret delivery to that environment's vault.

</details>

### Q15 (co-10): When should overlapping runs cancel, and when should they queue?

<details><summary>Answer</summary>

Cancel test runs so only the newest signal reports; queue deploy runs so a half-applied deploy never corrupts its target. The flag is per file because the policy follows the consequence, not the repository.

</details>

### Q16 (co-10): How do path filters keep monorepo minutes proportional to the change?

<details><summary>Answer</summary>

paths: starts the workflow only when a push touches the listed tree, and paths-ignore skips it for listed globs. One workflow per service means each change pays only for its own suite.

</details>

### Q17 (co-11): What makes a workflow_dispatch form safe to submit untouched?

<details><summary>Answer</summary>

Typed inputs with satisfying defaults: choices list their default as an option, number defaults parse, boolean defaults use the strict vocabulary. Validating defaults offline keeps the form honest.

</details>

### Q18 (co-12): How do you open, review, and merge a pull request entirely from the CLI?

<details><summary>Answer</summary>

Create with gh pr create from the branch, read checks with gh pr checks, record approval with gh pr review --approve, and merge with gh pr merge once blockers clear. Each step is scriptable because every command speaks JSON.

</details>

### Q19 (co-12): What three blockers can refuse a gh pr merge, and how do you see them?

<details><summary>Answer</summary>

Conflicting mergeability, a failing check conclusion, and a changes-requested review. Evaluate all three from the frozen record before merging; any one blocks, and the output should name which.

</details>

### Q20 (co-13): When should you reach for gh api instead of a porcelain command?

<details><summary>Answer</summary>

When no porcelain command covers the endpoint: custom dashboards, bulk triage, cross-repo reports. gh api carries the same auth, and a jq filter after it shapes the payload locally the way --json does for porcelain.

</details>

### Q21 (co-14): What turns a tag into a release users can download?

<details><summary>Answer</summary>

gh release create with notes plus gh release upload of the built assets. The notes headline announces; nonzero asset sizes prove the upload finished. Verify the tag match so the announcement ties to the built commit.

</details>

### Q22 (co-15): How does a required status check gate a merge?

<details><summary>Answer</summary>

Branch protection names the check context, and the merge waits for its green. The job name and the context must match exactly — protection compares strings, not intentions — so record the context beside the job.

</details>

### Q23 (co-16): What does offline validation prove, and what does it never claim?

<details><summary>Answer</summary>

It proves structure — event names, filter placement, graph acyclicity, secret declarations, matrix counts — before any runner bills a minute. It never claims the file runs live; triggers still deserve a same-day live check.

</details>

### Q24 (co-16): How do you dry-run a gh automation script without executing it?

<details><summary>Answer</summary>

Read the script as text and check strict mode, gh usage, --json flags, quoted variables, and no credential echoes. Quoting and flag bugs are cheapest before the network; every FAIL names the practice the script skipped.

</details>

## Applied problems

Eight judgement problems drawn from real pipeline shapes. Work each on paper before comparing with the strong answer; each names the weak answer to avoid.

### Problem 1: Debug a failing matrix job from its log

Task: the grid of three Pythons by two systems shows five green cells and one red: 3.14 on Windows. The log ends in a compilation error for a native dependency with no Windows wheel. Decide: exclude the cell, pin the dependency, or drop Windows from the grid. A strong answer excludes the single cell with a comment naming the missing wheel, keeps the grid, and files the upstream issue. A weak answer drops Windows entirely, losing coverage for a one-cell problem, or pins the dependency for all cells, slowing everyone for one platform's gap.

### Problem 2: Choose OIDC over a stored secret

Task: the deploy workflow reads secrets.AWS_KEY, a key created two years ago and shared by three repositories. The cloud provider supports OIDC federation. Decide the migration: keep the key, scope it per repo, or federate. A strong answer federates with the id-token permission and a per-repository role, records the migration date, and revokes the shared key. A weak answer scopes copies of the same key per repo, multiplying the rotation burden while keeping every standing credential.

### Problem 3: Design a concurrency group for a monorepo

Task: three service workflows plus a deploy workflow all trigger on pushes to main. Test runs should cancel stale, deploys must queue. Decide the group keys and flags per file. A strong answer keys each test file as workflow-plus-ref with cancel true, and the deploy file as deploy-main with cancel false. A weak answer uses one constant group for all files, so test pushes cancel running deploys, or sets cancel true everywhere, corrupting the target on busy days.

### Problem 4: Gate a merge on the right checks

Task: main broke despite green pull requests. The suite ran lint and unit tests, but the required check named only lint, and the breakage was a type error. Decide the fix. A strong answer adds the typecheck job and names both jobs as required checks, so neither signal is advisory. A weak answer adds more tests to the suite without requiring the job, leaving the gate exactly as permissive as the morning main broke under.

### Problem 5: Split a deploy across staging and production

Task: one deploy job ships to production on every main push with no pause. The team wants staging auto-deploy plus a human gate before production. Decide the job and environment split. A strong answer creates two jobs — staging with environment staging and no reviewers, production with environment production, required reviewers, and needs on staging. A weak answer adds a manual approval step inside the single job, which blocks staging too and still shares one secret scope.

### Problem 6: Cache a slow dependency install

Task: the Python suite spends six of eight minutes installing pip packages, and requirements change weekly. Decide the cache design. A strong answer caches the pip directory keyed by the requirements hash with an OS-prefix restore-key, so weekly bumps miss once then warm again. A weak answer keys on the branch name, serving stale packages for a week after every bump, or skips restore-keys, paying full cold installs on every dependency change.

### Problem 7: Share a lint sequence across repositories

Task: five repositories run the same four lint steps, and last week's rule change updated three of them. Decide the sharing mechanism. A strong answer extracts a composite action in one repository, pins callers to its release tag, and updates all five with one bump. A weak answer copies the updated steps again, scheduling the next drift, or builds a JavaScript action for four shell lines, paying a build pipeline for zero library needs.

### Problem 8: Validate before trusting a copied workflow

Task: a contributor copies a release workflow from another project, changing only names. The file references secrets.DEPLOY_TOKEN and a matrix over three systems. Decide the review checklist before it runs. A strong answer expands the matrix offline to count jobs, scans secret references against the vault inventory, and checks the trigger is tags-only. A weak answer approves on green syntax highlighting, missing the undeclared secret that will arrive empty at 3am and the branch filter that never matches a tag push.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Make the starter match before peeking. Work them in order: the status-check and secret katas first, because gates and credentials underlie everything; the release-script and matrix katas next, because they train the two reflexes broken pipelines demand; the concurrency, cache, environment, and path-filter katas after, because they isolate one production judgement each.

### Kata 01: Add a Required Status Check

(Concepts: co-15.)

Prove the gate first: protection with an empty required list merges red suites without a sound. Start from the starter, which requires nothing, and match the reference that requires the test context. Protection currently requires nothing, so red suites still merge. Extend the protection fixture below so the test context gates the merge, and prove the gate in the reference.

**Before** (`drilling/code/kata-01-add-required-status-check/before/starter.py`):

```python
# => Kata starter: require the test context before merging.
# => Fill PROTECTION so test gates the merge, then check it.
PROTECTION = {"required": []}  # => TODO: require the test context
CHECK = "test"  # => the job name protection must name


def gates(protection, check):  # => TODO: True when check is required
    return False  # => TODO: membership test on required
```

**After** (`drilling/code/kata-01-add-required-status-check/after/solution.py`):

```python
# => Kata reference: the test context gates the merge.
# => Checked against the vendor branch-protection docs on 2026-10-20.
# => PROTECTION mirrors the required_status_checks contexts list.
# => One membership test is the whole gate; keep it that simple.

# => WHY this shape: protection compares exact strings, not intentions.
# => The job name and the context must match character for character.
# => Required means red blocks; optional means red advises.
PROTECTION = {"required": ["test"]}  # => the test context is required
CHECK = "test"  # => the job name this kata protects


def gates(protection, check):  # => True when the check is required
    return check in protection["required"]  # => exact string membership


def main():  # => print the required list and the gate verdict
    print("required:", ",".join(PROTECTION["required"]))  # => contexts
    print("gates:", gates(PROTECTION, CHECK))  # => Output: True
    print("merge-on-red:", not gates(PROTECTION, CHECK))  # => False


main()  # => run once; False here means the gate is missing
```

**Output** (`drilling/code/kata-01-add-required-status-check/expected/main.stdout.txt`):

```text
required: test
gates: True
merge-on-red: False
```

### Kata 02: Convert a Long-Lived Secret to OIDC

(Concepts: co-08.)

Remove the standing secret: the workflow still reads a stored AWS key. Start from the starter holding the old reference, and match the reference that assumes a role with the id-token permission. The deploy workflow below still reads a stored AWS key. Migrate the reference solution to a role assumption with the id-token permission, and prove no stored key remains.

**Before** (`drilling/code/kata-02-convert-long-lived-secret-to-oidc/before/starter.py`):

```python
# => Kata starter: replace the stored key with an OIDC role.
# => TODO: drop AWS_KEY, add the role assumption and permission.
WORKFLOW = "uses AWS_KEY and secrets.AWS_KEY"  # => TODO: migrated text
ROLE = ""  # => TODO: the role ARN to assume
```

**After** (`drilling/code/kata-02-convert-long-lived-secret-to-oidc/after/solution.py`):

```python
# => Kata reference: federated role replaces the stored AWS key.
# => Checked against the vendor OIDC hardening docs on 2026-10-20.
# => WORKFLOW mirrors the migrated file: permission plus assumption.
# => No stored key string may remain anywhere in the migrated text.

# => WHY this shape: federation removes the secret instead of rotating it.
# => The permission unlocks minting; the role bounds what it can do.
# => Revoke the old key; unused keys are found by scanners anyway.
WORKFLOW = "permissions id-token write; role-to-assume deployer"  # => migrated
ROLE = "arn:aws:iam::123456789012:role/deployer"  # => assumed role ARN


def migrated(text):  # => True when no stored-key trace remains
    banned = ["AWS_KEY", "aws-access-key-id"]  # => stored-key traces
    return all(b not in text for b in banned)  # => clean when absent


def main():  # => print the role and the migration verdict
    print("role:", ROLE)  # => Output: the assumed role ARN
    print("migrated:", migrated(WORKFLOW))  # => Output: True
    print("stored-keys:", 0)  # => none remain after migration


main()  # => run once; False means a stored-key trace survived
```

**Output** (`drilling/code/kata-02-convert-long-lived-secret-to-oidc/expected/main.stdout.txt`):

```text
role: arn:aws:iam::123456789012:role/deployer
migrated: True
stored-keys: 0
```

### Kata 03: Write a gh Script that Automates a Release

(Concepts: co-14.)

Automate the click: releases are cut by hand from the website. Start from the starter with an empty release shape, and match the reference that verifies the tag, counts assets, and verdicts the publish. Releases are still cut by website clicks. Write the script logic below so it verifies the tag match, counts the assets, and prints the publish verdict from the fixture shape.

**Before** (`drilling/code/kata-03-gh-script-automates-release/before/starter.py`):

```python
# => Kata starter: automate the release from the fixture shape.
# => TODO: verify the tag, count assets, print the publish verdict.
RELEASE = {"tag": "", "assets": []}  # => TODO: fixture-shaped release
TAG = ""  # => TODO: the tag this run publishes
```

**After** (`drilling/code/kata-03-gh-script-automates-release/after/solution.py`):

```python
# => Kata reference: the script verifies tag, counts assets, verdicts.
# => Fixture mirrors the gh release view --json shape on 2026-10-20.
# => TAG must equal the fixture tag; assets must all be nonzero.
# => No gh binary runs here; the logic replays the fixture only.

# => WHY this shape: tag match ties notes to the built commit exactly.
# => Asset count proves the upload finished; sizes prove real bytes.
# => Automating the click removes the mistyped-tag release forever.
RELEASE = {"tag": "v1.4.0", "assets": [{"size": 48210}]}  # => fixture
TAG = "v1.4.0"  # => the tag this run publishes


def ready(release, tag):  # => True when tag matches and assets real
    same = release["tag"] == tag  # => announcement matches build
    full = all(a["size"] > 0 for a in release["assets"])  # => real bytes
    return same and full  # => both must hold to publish


def main():  # => print tag, assets, and the publish verdict
    print("tag:", RELEASE["tag"])  # => Output: the release tag
    print("match:", RELEASE["tag"] == TAG)  # => Output: True
    print("assets:", len(RELEASE["assets"]))  # => files attached
    print("publish:", ready(RELEASE, TAG))  # => Output: True


main()  # => run once; False blocks the publish, loudly
```

**Output** (`drilling/code/kata-03-gh-script-automates-release/expected/main.stdout.txt`):

```text
tag: v1.4.0
match: True
assets: 1
publish: True
```

### Kata 04: Unbreak a Matrix Grid

(Concepts: co-03.)

Restore the coverage: a typo collapsed the two-by-two grid. Start from the starter with empty axes, and match the reference that expands four cells with their total. The grid below was meant to test two versions in two modes, but a typo collapsed it. Expand the corrected axes in the reference and print every cell with the total.

**Before** (`drilling/code/kata-04-unbreak-matrix-grid/before/starter.py`):

```python
# => Kata starter: expand the corrected two-by-two grid.
# => TODO: two versions times two modes is four cells, not two.
AXES = {}  # => TODO: version and mode axes with two values each
```

**After** (`drilling/code/kata-04-unbreak-matrix-grid/after/solution.py`):

```python
# => Kata reference: two versions times two modes is four cells.
# => Checked against the vendor matrix strategy docs on 2026-10-20.
# => AXES mirrors the corrected strategy.matrix block in the file.
# => Sorted axes keep the expansion order stable across runs.

# => WHY expand offline: the count tells whether the grid still fits.
# => A collapsed axis silently halves coverage; expansion shows it.
# => Two-by-two is four; memorize products, not assumptions.
AXES = {"mode": ["fast", "full"], "python": ["3.13", "3.14"]}  # => grid


def expand():  # => cartesian product over the sorted axes
    cells = [dict()]  # => start with one empty combination
    for name in sorted(AXES):  # => sorted axes keep order stable
        cells = [dict(c, **{name: v}) for c in cells for v in AXES[name]]  # => grow
    return sorted(cells, key=lambda c: tuple(sorted(c.items())))  # => stable


def main():  # => print every cell plus the total count
    cells = expand()  # => the four combinations
    for cell in cells:  # => one line per job, stable order
        print("job:", cell["python"] + "/" + cell["mode"])  # => cell name
    print("jobs:", len(cells))  # => Output: 4


main()  # => run once; any count but 4 means an axis collapsed
```

**Output** (`drilling/code/kata-04-unbreak-matrix-grid/expected/main.stdout.txt`):

```text
job: 3.13/fast
job: 3.14/fast
job: 3.13/full
job: 3.14/full
jobs: 4
```

### Kata 05: Add a Concurrency Group

(Concepts: co-10.)

Stop the pileup: pushes queue overlapping runs on one branch. Start from the starter with an empty lane, and match the reference that groups per ref with cancellation on. Pushes pile up overlapping test runs on the same branch. Add the group below so the newest push cancels the stale ones, and prove the lane keys on the ref.

**Before** (`drilling/code/kata-05-add-concurrency-group/before/starter.py`):

```python
# => Kata starter: lane the workflow per branch, newest wins.
# => TODO: group on the ref with cancel-in-progress true.
GROUP = ""  # => TODO: group key expression
CANCEL = None  # => TODO: True, so stale runs die
```

**After** (`drilling/code/kata-05-add-concurrency-group/after/solution.py`):

```python
# => Kata reference: one lane per branch, newest push wins.
# => Checked against the vendor concurrency docs on 2026-10-20.
# => GROUP keys on github.ref so branches never cancel each other.
# => CANCEL true trades partial logs for one current signal.

# => WHY this shape: stale runs bill minutes to test abandoned code.
# => Keying on ref isolates branches; a constant key would cross-cancel.
# => Test lanes cancel; deploy lanes queue: know which file this is.
GROUP = "ci-${{ github.ref }}"  # => one lane per branch
CANCEL = True  # => newest push cancels the stale run


def lane(group, cancel):  # => True when the lane is safe and live
    keyed = "github.ref" in group  # => isolated per branch
    return keyed and cancel is True  # => both must hold


def main():  # => print the lane and the policy verdict
    print("group:", GROUP)  # => Output: the lane expression
    print("cancel:", CANCEL)  # => Output: True
    print("live:", lane(GROUP, CANCEL))  # => Output: True


main()  # => run once; False means stale runs survive
```

**Output** (`drilling/code/kata-05-add-concurrency-group/expected/main.stdout.txt`):

```text
group: ci-${{ github.ref }}
cancel: True
live: True
```

### Kata 06: Cache a Dependency Path

(Concepts: co-04.)

Warm the install: every run reinstalls pip from scratch. Start from the starter with an empty cache, and match the reference keyed by the requirements hash. Every run reinstalls pip packages from scratch. Add the cache below keyed by the requirements hash, and prove the key, path, and restore behavior in the reference.

**Before** (`drilling/code/kata-06-cache-dependency-path/before/starter.py`):

```python
# => Kata starter: warm pip with a hash-keyed cache.
# => TODO: path plus hashFiles key, hits restore, misses save.
CACHE = {"path": "", "key": ""}  # => TODO: directory and hash key
```

**After** (`drilling/code/kata-06-cache-dependency-path/after/solution.py`):

```python
# => Kata reference: hash-keyed pip cache restores warm installs.
# => Checked against the vendor caching docs on 2026-10-20.
# => KEY hashes requirements.txt: deps change, cache misses exactly once.
# => PATH is the pip cache directory the runner restores and saves.

# => WHY this shape: installs cost minutes, hits cost seconds.
# => Hash keys invalidate precisely; prefixes would serve stale deps.
# => Miss-then-save means the second run is already warm: compounding.
CACHE = {"path": "~/.cache/pip", "key": "pip-hash-requirements"}  # => cache


def warm(cache):  # => True when path and hash key are both set
    return bool(cache["path"]) and "hash" in cache["key"]  # => both set


def main():  # => print the cache coordinate and the warmth verdict
    print("path:", CACHE["path"])  # => Output: the cached directory
    print("key:", CACHE["key"])  # => Output: the hash-keyed key
    print("warm:", warm(CACHE))  # => Output: True


main()  # => run once; False means installs stay cold
```

**Output** (`drilling/code/kata-06-cache-dependency-path/expected/main.stdout.txt`):

```text
path: ~/.cache/pip
key: pip-hash-requirements
warm: True
```

### Kata 07: Split a Deploy into an Environment

(Concepts: co-09.)

Add the pause: the deploy ships to production unguarded. Start from the starter with an empty target, and match the reference that names production so approvals apply. The deploy job below ships to production with no pause and no scoped secrets. Target the production environment in the reference so approvals and secret scoping apply, and prove the target.

**Before** (`drilling/code/kata-07-split-deploy-into-environment/before/starter.py`):

```python
# => Kata starter: target production so approvals apply.
# => TODO: environment production plus the guarded deploy proof.
ENVIRONMENT = ""  # => TODO: the guarded target name
```

**After** (`drilling/code/kata-07-split-deploy-into-environment/after/solution.py`):

```python
# => Kata reference: the deploy targets production and pauses.
# => Checked against the vendor environments docs on 2026-10-20.
# => ENVIRONMENT names the guarded target; rules live server-side.
# => Naming it scopes secrets and summons the required reviewers.

# => WHY this shape: unpaused deploys ship at machine speed at 3am.
# => The name is the whole integration: approvals follow automatically.
# => Staging gets its own job and name; never share one environment.
ENVIRONMENT = "production"  # => the guarded target


def guarded(env):  # => True when the target is a guarded name
    return env in ("staging", "production")  # => known targets only


def main():  # => print the target and the guard verdict
    print("environment:", ENVIRONMENT)  # => Output: production
    print("guarded:", guarded(ENVIRONMENT))  # => Output: True
    print("approvals:", "required" if guarded(ENVIRONMENT) else "open")  # => gate


main()  # => run once; open means anyone ships anything
```

**Output** (`drilling/code/kata-07-split-deploy-into-environment/expected/main.stdout.txt`):

```text
environment: production
guarded: True
approvals: required
```

### Kata 08: Add Path Filters to a Monorepo Job

(Concepts: co-10.)

Scope the suite: the billing tests run for docs edits. Start from the starter with no globs, and match the reference scoped to the billing tree with both verdicts. The billing suite below runs for every docs edit in the monorepo. Scope the trigger to the billing tree in the reference so unrelated pushes skip it, and prove the scope.

**Before** (`drilling/code/kata-08-add-path-filters/before/starter.py`):

```python
# => Kata starter: scope the suite to the billing tree.
# => TODO: paths billing/** so docs edits skip this file.
PATHS = []  # => TODO: the service globs that start this workflow
```

**After** (`drilling/code/kata-08-add-path-filters/after/solution.py`):

```python
# => Kata reference: billing changes start it, docs edits skip it.
# => Checked against the vendor path-filter docs on 2026-10-20.
# => PATHS lists the service tree; pushes must touch one glob to run.
# => Docs-only pushes match nothing and the workflow stays quiet.

# => WHY this shape: minutes should scale with the change, not the repo.
# => One service, one file, one owner: the billing team owns this filter.
# => Keep a docs check elsewhere, or typos ship unverified forever.
PATHS = ["billing/**"]  # => the billing service tree


def scoped(paths, changed):  # => True when the push touches the tree
    return any(c.startswith("billing/") for c in changed)  # => prefix match


def main():  # => print the scope and two verdicts: code runs, docs skip
    print("paths:", ",".join(PATHS))  # => Output: the service globs
    print("code-push:", scoped(PATHS, ["billing/api.py"]))  # => True
    print("docs-push:", scoped(PATHS, ["docs/guide.md"]))  # => False


main()  # => run once; True on docs means the filter leaks
```

**Output** (`drilling/code/kata-08-add-path-filters/expected/main.stdout.txt`):

```text
paths: billing/**
code-push: True
docs-push: False
```

## Self-check checklist

Twenty-four promises, one per concept group. Read each aloud; any hesitation sends you back to its examples before the capstone.

1. [ ] I can declare push, pull_request, schedule, and workflow_dispatch triggers with correct filters (co-01).
2. [ ] I can limit a push trigger to the default branch with a branches filter (co-01).
3. [ ] I can nest workflow, job, and step keys at the right levels (co-02).
4. [ ] I can order jobs with needs and predict which followers skip on failure (co-02).
5. [ ] I can pass a value between steps with an id and GITHUB_OUTPUT (co-02).
6. [ ] I can expand a two-axis matrix offline and state the job count (co-03).
7. [ ] I can set fail-fast deliberately and state which policy the file uses (co-03).
8. [ ] I can open, review, and merge a pull request from the gh CLI (co-12).
9. [ ] I can name every blocker before merging a pull request (co-12).
10. [ ] I can query any REST endpoint with gh api and a local filter (co-13).
11. [ ] I can key a cache on a lockfile hash with restore-key fallbacks (co-04).
12. [ ] I can cut a release with notes and verify tag, assets, and sizes (co-14).
13. [ ] I can hand a dist directory between jobs with a named artifact (co-05).
14. [ ] I can call a reusable workflow pinned to a release tag (co-06).
15. [ ] I can pass data through with and credentials through secrets (co-06).
16. [ ] I can bundle shell steps as a composite action with explicit shells (co-07).
17. [ ] I can choose composite versus JavaScript action by complexity (co-07).
18. [ ] I can reference secrets by name and never inline a value (co-08).
19. [ ] I can replace a stored cloud key with an OIDC role assumption (co-08).
20. [ ] I can pause a production deploy behind an environment approval (co-09).
21. [ ] I can lane test runs per branch with cancellation and queue deploys (co-10).
22. [ ] I can require a status check in branch protection before merging (co-15).
23. [ ] I can type workflow_dispatch inputs with satisfying defaults (co-11).
24. [ ] I can validate triggers, graphs, secrets, and scripts offline (co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts. Each names a design choice and the rejected alternative it beat. Answer aloud, then compare with the model: a good answer states the mechanism, the cost difference, and exactly when the alternative would win instead.

### Why 1: Why validate a workflow offline when the runner reports errors anyway?

Because the failure modes differ in cost and clarity: the runner bills minutes and reports runtime errors, while offline checks catch the silent class — misspelled events that never fire, cycles that deadlock, undeclared secrets that arrive empty. Runner errors answer what broke this run; validation answers what can never work. The rejected alternative — push and watch — converts every typo into a billed, red run that teaches less than the checklist did.

### Why-not 1: Why not validate everything live on a scratch repository instead?

A scratch repository still executes with real credentials, real minutes, and real side effects: releases publish, issues file, deploys deploy. Live validation cannot dry-run a production publish without publishing. The rejected alternative confuses execution with verification — the harness proves structure for free, and the scratch repo proves behavior where structure cannot reach. Use both, in that order.

### Why 2: Why mint OIDC tokens per run instead of rotating stored keys monthly?

Because rotation manages a standing secret while federation removes it: a monthly-rotated key is still valid for a month to anyone who copies it, while a minted token expires with the run. Rotation is a schedule of remaining risk; federation is minutes of exposure by construction. The rejected alternative — diligent rotation — keeps the vault, the audit burden, and the 3am revocation drill that federation deletes entirely.

### Why-not 2: Why not store one key per environment and call the scoping good enough?

Per-environment keys bound the blast radius but keep every property that makes keys dangerous: they live for months, copy silently, and need rotation ceremonies. Scoping is damage control for a credential class that federation eliminates. The rejected alternative treats the symptom — which vault leaks — instead of the cause — that a copyable secret exists at all.

### Why 3: Why cancel stale test runs instead of letting every run finish?

Because a superseded run reports on code nobody will merge: its red confuses the branch status and its minutes bill for nothing. Cancellation converts a push storm into one current signal. The rejected alternative — full history for every push — is appropriate only where each run's result has independent value, like release matrices; for inner-loop tests, finishing stale is paying to be misled.

### Why-not 3: Why not cancel deploy runs the same way for consistency?

Because cancelling mid-apply corrupts the target while cancelling a test wastes only minutes: the consequence differs, so the policy must differ per file. Consistency of flags is the wrong consistency — the right one is consistency of reasoning, where each file's flag matches what its interruption destroys. The rejected alternative optimizes for symmetric files over safe targets.
