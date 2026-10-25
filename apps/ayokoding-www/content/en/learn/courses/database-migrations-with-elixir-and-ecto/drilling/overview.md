---
title: "Overview"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

Answer each question from memory before opening its detail block: say the answer aloud in one or two sentences, then check. The questions follow the course order — files and history first, data and safety next, teams and failure last — so a missed question points at the level worth reworking.

### Q1 (co-01)

What three parts make a migration file, and which one orders history?

<details><summary>Answer</summary>

Module name, version from the filename, and the `change` (or `up`/`down`) functions. Ordering comes from the version number in the filename: `Ecto.Migrator` sorts versions and runs them in that order, so the number — not the module name or the file's position — decides what runs after what.

</details>

### Q2 (co-01)

Why must versions be fixed numbers instead of generated values?

<details><summary>Answer</summary>

Generated values differ on every run, so the history can never be byte-stable and two checkouts of the same migration disagree about what ran. Fixed numbers like `202601000124` make the file, the version table, and every transcript reproducible across machines and reruns.

</details>

### Q3 (co-02)

What runs on the way up, and what runs on the way down?

<details><summary>Answer</summary>

Up runs the forward change — create, add, backfill — the deploy needs. Down runs the exact reverse — drop, remove, loosen — the rollback needs. Schema steps reverse structurally; data steps often cannot, so their down direction says so explicitly instead of pretending.

</details>

### Q4 (co-02)

Why do data fixes get no-op downgrades instead of reverse updates?

<details><summary>Answer</summary>

A fix overwrites whatever was there, and the previous values are gone the moment it commits — there is no reverse update that restores unknown history. A no-op down states the one-way policy in the file so the rollback plan accounts for it instead of discovering it mid-incident.

</details>

### Q5 (co-03)

What does the history table store, and who writes to it?

<details><summary>Answer</summary>

One row per applied version: the version the database has reached, plus when it got there. Ecto writes it inside the same transaction as the migration, so the receipt and the change commit atomically — the table never claims a migration that did not fully apply.

</details>

### Q6 (co-03)

How do `migrations` and the history table differ as diagnostics?

<details><summary>Answer</summary>

`Ecto.Migrator.migrations` reads the files against the receipts — where each known file stands. The history table reads the database — which versions it has recorded. When the two disagree, the gap between them is the diagnosis: an unrecorded migration, a missing file, or a mark that lied.

</details>

### Q7 (co-04)

What creates a second line of history, and what does it block?

<details><summary>Answer</summary>

Two files with no common ordering constraint — usually two developers generating the same timestamp — create a version collision that blocks the run until it is repaired. It blocks nothing structurally once renamed, but the next deploy cannot pick an order until the versions are distinct again.

</details>

### Q8 (co-04)

How do you list pending files, and what does an empty pending list prove?

<details><summary>Answer</summary>

`Ecto.Migrator.migrations` with `:up`/`:down` status shows exactly which files ran and which are pending. An empty pending list proves the database and the files agree — the replay any environment runs is a no-op, which is the daily proof that staging and production tell the same story.

</details>

### Q9 (co-05)

What makes a migration rerunnable, and what breaks reruns?

<details><summary>Answer</summary>

Rerunnable means the second run reproduces the first byte for byte: guarded statements, fixed versions, cleanup that restores the starting state. Generated values, timestamps in output, shared tables, and version tables that survive cleanup break reruns by leaking state between runs.

</details>

### Q10 (co-06)

Why must the backfill run after the schema change, not inside it?

<details><summary>Answer</summary>

The column must exist before any row can fill it, and separating the steps means each deploys, fails, and rolls back independently. A combined migration couples the DDL lock to the data volume: slow rows hold the schema lock, and a fill failure rolls back structure that was fine.

</details>

### Q11 (co-06)

How do you verify a backfill worked?

<details><summary>Answer</summary>

Count the rows the fill should have touched and count the rows that actually changed — `WHERE new_col IS NULL` must return zero, and a checksum like `SUM` must match the expected value. The verification query is part of the migration story, not an afterthought, because silent partial fills are the failure mode.

</details>

### Q12 (co-07)

What are the three expand-migrate-contract stops, and what runs between them?

<details><summary>Answer</summary>

Expand adds the new shape beside the old; migrate copies data and moves reads; contract drops the old shape. Application deploys run between the stops: dual-write code between expand and migrate, new-read code between migrate and contract — the steps are deploy windows, not just files.

</details>

### Q13 (co-07)

Why does the new column start nullable?

<details><summary>Answer</summary>

Existing rows have no value for it yet, and a `NOT NULL` without a default refuses to land on an inhabited table. Nullable first, fill second, tighten third: each stop is deployable on its own, and the constraint arrives only when every row already complies.

</details>

### Q14 (co-08)

What does rolling back to a version undo, and what can it not restore?

<details><summary>Answer</summary>

It runs every reverse step newer than the named version — newest-first — and keeps the named version itself. It restores structure the files know how to reverse, but it cannot restore dropped data, overwritten values, or anything outside the versioned history. Structure roundtrips; data does not.

</details>

### Q15 (co-08)

Which unrelated things survive a rollback, and why?

<details><summary>Answer</summary>

Tables, rows, and migrations the rolled-back file never touched: down runs only its own reverse steps, so sibling tables keep every row. Survival is scoped by design — the blast radius of a rollback is exactly one migration's change, which is why small migrations make safe rollbacks.

</details>

### Q16 (co-09)

What is schema drift, and which two comparisons reveal it?

<details><summary>Answer</summary>

Drift is the live database differing from what the history claims: a manual tweak, a hotfix, a forgotten file. File history versus recorded versions reveals unrecorded runs; declared schema versus reflected tables reveals unrecorded changes. Both comparisons must pass before a deploy means what it says.

</details>

### Q17 (co-09)

Marked but different: what does it mean when history and database disagree?

<details><summary>Answer</summary>

Someone declared a past that never happened — a mark pointing at versions whose DDL does not match the tables, or an upgrade from files that were edited after applying. The version table is a claim, not a proof; reflection is the audit that checks the claim against the metal.

</details>

### Q18 (co-10)

When do you mark instead of running up?

<details><summary>Answer</summary>

When the database already has the schema the files describe: adopting a legacy database, or recording a baseline the team agrees on. Running up would replay changes onto tables that already exist; marking declares agreement instead. Marking the wrong version is a lie the database cannot detect, so the mark must name exactly the schema that is really there.

</details>

### Q19 (co-11)

What breaks when you edit an already-applied migration file?

<details><summary>Answer</summary>

Every database that already ran it: their history tables record a version whose content no longer matches, so future diagnoses compare against a file that never ran anywhere. History is append-only — fix forward with a new migration, never rewrite the recorded past.

</details>

### Q20 (co-12)

Why does each migration run in its own transaction?

<details><summary>Answer</summary>

So a failed statement undoes the whole file instead of leaving half a schema: the lock window equals the migration, and the failure window is one file's change. Short transactions are the physical reason small migrations are safer — the blast radius is bounded by the file.

</details>

### Q21 (co-13)

Why must every environment run the same files in the same order?

<details><summary>Answer</summary>

Because the history table only records versions, not effects: if staging ran a file production never saw, the two databases diverge while both claim to be current. Same files, same order, every environment — drift becomes structurally impossible instead of merely forbidden.

</details>

### Q22 (co-14)

Two developers, one timestamp: what is the repair workflow?

<details><summary>Answer</summary>

Rename one file to the next free version, rerun, and verify both versions applied in order with one linear history. The rename fully determines the new order — no content edits, no coordination beyond picking the next number — and the verification proves both lines survived the repair.

</details>

### Q23 (co-15)

Which operations need exclusive locks, and how do you shrink the window?

<details><summary>Answer</summary>

DDL that rewrites or validates: adding validated constraints, widening types, full-table backfills under one statement. Shrink with `NOT VALID` plus separate `VALIDATE`, batched fills with `IS NULL` guards, one statement per migration, and statement timeouts that fail fast instead of queueing behind traffic.

</details>

### Q24 (co-16)

How do you test a migration twice?

<details><summary>Answer</summary>

Run up to head and assert the golden schema and data, then roll back to base and assert the starting shape, then run up again and assert the golden output is byte-identical. The roundtrip proves reversibility; the repeated run proves determinism. Three gates — linearity, currency, fidelity — before any deploy ships.

</details>

## Applied problems

Work each on paper before touching a terminal: name the migrations, their versions, their order, and the verification query. Then build the files and run them — the terminal is the grader, not the draft.

### Problem 1: Split the rename

The `users` table has `username TEXT NOT NULL` with 40,000 rows, and the application must read `handle` by Friday with zero downtime. Name the three migrations (fixed versions, expand-migrate-contract order), state what application code ships between each pair, and write the verification query proving every handle equals its old username.

Approach sketch: expand adds a nullable `handle`, the application dual-writes both names, migrate copies `username` to `handle` and moves readers, contract drops `username`. Between expand and migrate ships dual-write code; between migrate and contract ships new-read code. Verify with `SELECT COUNT(*) FROM users WHERE handle IS NULL OR handle != username` expecting zero.

### Problem 2: Harden the column

`orders.email` is nullable with 2 million rows, 3 percent null. New policy: every order has an email. Name the migrations that end with a `NOT NULL` constraint, decide the default-versus-backfill question for the null 3 percent, and state which migration is safe to roll back and which is one-way.

Approach sketch: backfill the null 3 percent with a sensible default or researched values first, then add the default for new rows, then set `NOT NULL`. The backfill migration rolls back by dropping its column; the constraint migration rolls back by loosening. Never combine the fill and the constraint in one file, or a fill failure rolls back structure that was fine.

### Problem 3: Widen without locking

`events.seq` is `INTEGER` approaching 2 billion and must become `BIGINT` while ingestion continues. Sketch the expand-migrate-contract stops for a type change, name the lock each stop avoids, and explain why the naive single `ALTER COLUMN` is the wrong answer under load.

Approach sketch: expand adds `seq_bigint`, dual writes feed both columns, migrate copies and moves readers, contract drops `seq`. Each stop avoids the rewrite lock the naive `ALTER COLUMN` takes; the copy runs as a batched backfill. Verify counts match at every stop and the catalog reports `bigint` only after contract.

### Problem 4: Resolve the collision

You generated `202603010154` for an index on `orders.status`; Priya generated `202603010154` for a `shipped_at` column. Both branched from the same base. Name the repair, the exact rerun plus verification sequence, and the status output that proves both changes present and the history linear.

Approach sketch: rename one file to the next free version, rerun to head, then read status. Expect both versions `up` in sorted order and the catalog holding both the index and the column. The repair is a version edit only — no content changes — because versions alone determine the run order.

### Problem 5: Rebase the private branch

Your three-migration branch sat unmerged for a week while `main` advanced two versions. Nobody else has your files. Decide merge versus rebase, rewrite the versions accordingly, and explain what breaks if you choose wrong — and who pays for it.

Approach sketch: rebase, because nobody else holds the files. Renumber the three versions above the current tip in their original relative order, rerun, and verify linearity. Merging would spend a marker joining a line nobody shared; choosing merge orphans no data but litters shared history with private scaffolding.

### Problem 6: Diagnose the partial run

Deploy stopped mid-history: the history table holds versions through `m-14`, but `orders.total_cents` is missing. Reconstruct the two possible causes (failed statement inside `m-14` versus `m-14` never ran and the receipt lied), and give the ordered commands that distinguish them and recover safely.

Approach sketch: first read status — if `m-14` shows down, it never ran and the receipt check confirms zero rows; if it shows up, the second statement inside failed and rolled back. Distinguish with the reflected columns, then either run up to complete or fix the file and rerun. Never mark past a file whose effects are unverified.

### Problem 7: Diagnose the phantom table

Status shows one linear history and the receipts match it, yet a fresh staging database errors that `shipments` already exists when migrating from base. Reconstruct how a table can exist that no migration creates, and give the reflection query plus the mark-or-drop decision for each possible answer.

Approach sketch: reflect the tables and diff against the migration files. If a migration was edited after applying, the file on disk names objects the history never created — fix forward with a catch-up migration. If a human created the table by hand, either drop it and migrate cleanly or adopt it with a mark plus a verification query, then record which decision and why.

### Problem 8: Diagnose the empty backfill

The backfill migration ran green, but `SELECT COUNT(*) FROM orders WHERE total_cents IS NULL` returns every row. List the three candidate causes (wrong predicate, map missing a status, default masking the null), and give one query per cause that confirms or eliminates it.

Approach sketch: query one — `SELECT COUNT(*) FROM orders WHERE status NOT IN (...)` tests the predicate's coverage. Query two — group by status and compare against the map's keys to find the missing tier. Query three — check the column default: a default that filled every row before the backfill ran masks the null the verification counts on.

## Concepts recap

Sixteen concepts carry the course. Read each as a contract: if you cannot explain it in your own words, rework its mapped examples before continuing.

### co-01: Migration files

A migration is a versioned file: module name, a numeric version in the filename, and a `change` function — or explicit `up`/`down` when `change` cannot reverse the steps. Files are the unit of review, the unit of deploy, and the unit of rollback. Everything the course does rests on reading these files precisely.

### co-02: Up and down

Up runs forward steps in version order; down runs reverse steps newest-first. Up-to-a-version and down-to-a-version make both directions addressable, and stepping moves one file at a time. Direction honesty — knowing which way each file goes and what each direction undoes — underlies every other concept.

### co-03: History receipts

The history table records one row per applied version inside the same transaction as the change. Status reads files against receipts; the table reads the database. Receipts are claims the database makes about itself, and every diagnosis in this course starts by checking them.

### co-04: Version ordering

Versions sort; filenames do not matter. Linear history means one version has exactly one place in line, so any two environments with the same versions share a schema. Ordering disputes — collisions, late files, renames — are all resolved by editing version numbers, never by editing content.

### co-05: Idempotent reruns

A rerun must reproduce the first run byte for byte: fixed versions, guarded statements, cleanup that restores the starting state. Up-after-down, resumed upgrades, and guarded teardowns all prove the same property from different angles. Deploys get retried; only deterministic files survive retries.

### co-06: Data backfills

New columns start empty on inhabited tables, and fills give them values after the schema lands. Batch with guards at scale, verify with counts always, and keep fills in their own steps so data volume never holds a schema lock hostage. Silent partial fills are the failure mode to fear.

### co-07: Expand-migrate-contract

Breaking changes ship in three deployable stops: expand adds beside the old, migrate copies and moves readers, contract drops the old. Application deploys run between the stops. The shape works for renames, type swaps, and any change where the database and the application must never disagree.

### co-08: Rollback scope

Down runs only its file's reverse steps, so unrelated tables survive by design. Rollbacks can stop at a version, step one file at a time, or retreat to zero — each with a precise boundary. Small files make small blast radii; the scoping is the argument for keeping migrations small.

### co-09: Baselines and marks

Legacy databases predate their history, so marks adopt existing schemas without running DDL. New migrations stack on the mark, and marks stay idempotent so adoption scripts can rerun. A mark is a handshake between the old world and the new — exact, reviewable, and never a shortcut for real work.

### co-10: Drift detection

Drift is the database disagreeing with history: manual tweaks, hotfixes, forgotten files. Compare versions against receipts and declared schema against reflected tables; adopt found drift as real migrations. Undetected drift turns the next migration into a surprise, so audit before deploying.

### co-11: Version conflicts

Two files may never share a version; the runner fails fast rather than guess. Renaming resolves collisions because versions alone determine order. History is append-only afterward: fix forward with new files and never rewrite what already ran anywhere.

### co-12: Transactional safety

Each migration runs in its own transaction, so a failed statement undoes the whole file — DDL and rows together. Files that opt out of the transaction opt out of the rollback and must plan their residue. Atomicity per file is what makes failures recoverable instead of archaeological.

### co-13: Deploy sequencing

Migrations land in an order the application depends on: fills after writers, readers after fills, guards after compliance. Status gates block deploys on pending work, and trial runs rehearse risky files. Same files, same order, every environment — sequencing is a deploy discipline, not a file property.

### co-14: Team workflows

Parallel branches produce parallel versions that join through renames, rebases, or markers. Private lines rebase; shared lines merge. Late files run on arrival in version order. The workflow keeps one linear history through concurrent work, and every repair is a version edit, not a content rewrite.

### co-15: Locks and concurrency

DDL takes locks and duration is the window, so small files, timeouts, batched fills, and concurrent builds outside transactions all shrink the blast radius. Advisory locks serialize runners and sessions scope the holding. Every migration is a locking decision whether its author knows it or not.

### co-16: Failure diagnosis

Status names the failed file and history counts the applied; together they fully describe any aftermath. No receipt means it never ran; partial files roll back whole; rehearsals prove both directions. Diagnose by comparing plan against receipt, then fix the named file and rerun.

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: file and rollback first, because honesty about direction underlies everything; data steps next, because fills follow schema; teams, locks, and baselines last, because each isolates one production judgement. Run the reference in the harness after diffing: your version and the reference must both exit green, and any output difference is a behavior difference to explain, not a formatting quirk to ignore.

### Kata 01: Write a Revision and Its Rollback

(Concepts: co-01, co-02.)

Replace ad-hoc DDL with a versioned migration: run the starter and watch a table appear with no receipt, then match the reference that writes the migration file, runs it up, proves both the table and the version row, and rolls it back.

**`drilling/code/kata-01-write-a-revision-and-its-rollback/before/starter.exs`**:

```elixir
# => Example 1: Write a Revision and Its Rollback
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata01.Repo, migration_source: "kata01_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata01.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata01.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata01.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata01")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000110_make_widgets.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata01.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata01_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata01.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata01.Repo, "DROP TABLE IF EXISTS kata01_widgets", [])

    # => the starter runs the forward change only
    Ecto.Migrator.run(Kata01.Repo, scratch, :up, all: true, log: false)
    # => the table exists, but nothing reverses it yet
    sql = "SELECT to_regclass('public.kata01_widgets')"
    # => one call proves the table landed
    [[landed]] = Ecto.Adapters.SQL.query!(Kata01.Repo, sql, []).rows
    # => Output: present: true
    IO.puts("present: #{landed != nil}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata01.Main.run()
```

**`drilling/code/kata-01-write-a-revision-and-its-rollback/after/solution.exs`**:

```elixir
# => Example 1: Write a Revision and Its Rollback
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata01.Repo, migration_source: "kata01_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata01.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata01.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata01.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata01")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000110_make_widgets.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata01.Repo.Migrations.MakeWidgets do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata01_widgets) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeWidgets: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata01.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata01.Repo, "DROP TABLE IF EXISTS kata01_widgets", [])

    # => the solution runs the full cycle
    Ecto.Migrator.run(Kata01.Repo, scratch, :up, all: true, log: false)
    # => down reverses the change the up made
    Ecto.Migrator.run(Kata01.Repo, scratch, :down, to: 0, log: false)
    # => the reversed table is really gone
    sql = "SELECT to_regclass('public.kata01_widgets')"
    # => one call proves the rollback worked
    [[gone]] = Ecto.Adapters.SQL.query!(Kata01.Repo, sql, []).rows
    # => Output: rolled back: true
    IO.puts("rolled back: #{gone == nil}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata01.Main.run()
```

**Output** (`drilling/code/kata-01-write-a-revision-and-its-rollback/expected/main.stdout.txt`):

```text
rolled back: true
```

### Kata 02: Link Two Revisions in Order

(Concepts: co-04.)

Order is a number, not a name: run the starter and watch two same-versioned files collide, then match the reference that renames one version, links the chain, and proves both applied in order.

**`drilling/code/kata-02-link-two-revisions-in-order/before/starter.exs`**:

```elixir
# => Example 2: Link Two Revisions in Order
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata02.Repo, migration_source: "kata02_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata02.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata02.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata02.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata02")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000120_make_first.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata02.Repo.Migrations.MakeFirst do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata02_first) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeFirst: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000121_make_second.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata02.Repo.Migrations.MakeSecond do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata02_second) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeSecond: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata02.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata02.Repo, "DROP TABLE IF EXISTS kata02_first", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata02.Repo, "DROP TABLE IF EXISTS kata02_second", [])

    # => the starter runs only the first of two files
    Ecto.Migrator.run(Kata02.Repo, scratch, :up, to: 202_602_000_120, log: false)
    # => the second file waits, pending
    pending = Ecto.Migrator.migrations(Kata02.Repo, scratch)
    # => foreign rows belong to other units, never this transcript
    pending = Enum.reject(pending, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => one line names the pending file
    IO.puts(Enum.map_join(pending, "\n", fn {s, v, n} -> "#{s} #{v} #{n}" end))

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata02.Main.run()
```

**`drilling/code/kata-02-link-two-revisions-in-order/after/solution.exs`**:

```elixir
# => Example 2: Link Two Revisions in Order
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata02.Repo, migration_source: "kata02_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata02.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata02.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata02.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata02")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000120_make_first.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata02.Repo.Migrations.MakeFirst do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata02_first) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeFirst: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000121_make_second.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata02.Repo.Migrations.MakeSecond do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata02_second) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeSecond: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata02.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata02.Repo, "DROP TABLE IF EXISTS kata02_first", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata02.Repo, "DROP TABLE IF EXISTS kata02_second", [])

    # => the solution runs the whole line in order
    Ecto.Migrator.run(Kata02.Repo, scratch, :up, all: true, log: false)
    # => both receipts land in version order
    sql =
      "SELECT version FROM kata02_history WHERE version IN (202602000120, 202602000121) ORDER BY version"

    # => one call reads both receipts
    versions = Ecto.Adapters.SQL.query!(Kata02.Repo, sql, []).rows
    # => Output: linked: 202602000120, 202602000121
    IO.puts("linked: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => the linked line rolls back together
    Ecto.Migrator.run(Kata02.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata02.Main.run()
```

**Output** (`drilling/code/kata-02-link-two-revisions-in-order/expected/main.stdout.txt`):

```text
linked: 202602000120, 202602000121
cleaned: yes
```

### Kata 03: Add a Backfill Step

(Concepts: co-06.)

New columns start empty: run the starter and watch the null count, then match the reference that adds the column, fills every row, verifies the count, and rolls the fill back with the file.

**`drilling/code/kata-03-add-a-backfill-step/before/starter.exs`**:

```elixir
# => Example 3: Add a Backfill Step
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata03.Repo, migration_source: "kata03_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata03.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata03.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata03.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata03")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000130_add_email.exs"), ~S"""
    # => the schema half without its backfill
    defmodule Kata03.Repo.Migrations.AddEmail do
    # => the starter stops here, rows stay empty
    use Ecto.Migration

    # => nullable email beside the seeded names
    def change do
    # => the roster every reader queries
    create table(:kata03_members) do
    # => the display name every row carries
      add :name, :string
    # => the contact column nobody fills yet
      add :email, :string
    # => end create: schema without data
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO kata03_members (name) VALUES ('ada'), ('grace')", "DELETE FROM kata03_members"
    # => end change: shape plus seed, no backfill
    end
    # => end AddEmail: the incomplete starter
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata03.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata03.Repo, "DROP TABLE IF EXISTS kata03_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Kata03.Repo, scratch, :up, all: true, log: false)
    # => nobody filled the new column yet
    sql = "SELECT count(*) FROM kata03_members WHERE email IS NOT NULL"
    # => one call counts the empty fill
    [[filled]] = Ecto.Adapters.SQL.query!(Kata03.Repo, sql, []).rows
    # => Output: filled: 0
    IO.puts("filled: #{filled}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata03.Main.run()
```

**`drilling/code/kata-03-add-a-backfill-step/after/solution.exs`**:

```elixir
# => Example 3: Add a Backfill Step
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata03.Repo, migration_source: "kata03_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata03.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata03.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata03.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata03")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000130_add_email.exs"), ~S"""
    # => the schema half without its backfill
    defmodule Kata03.Repo.Migrations.AddEmail do
    # => the starter stops here, rows stay empty
    use Ecto.Migration

    # => nullable email beside the seeded names
    def change do
    # => the roster every reader queries
    create table(:kata03_members) do
    # => the display name every row carries
      add :name, :string
    # => the contact column nobody fills yet
      add :email, :string
    # => end create: schema without data
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO kata03_members (name) VALUES ('ada'), ('grace')", "DELETE FROM kata03_members"
    # => end change: shape plus seed, no backfill
    end
    # => end AddEmail: the incomplete starter
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000131_fill_email.exs"), ~S"""
    # => the backfill completes the starter schema
    defmodule Kata03.Repo.Migrations.FillEmail do
    # => explicit up and down for the data step
    use Ecto.Migration

    # => derive every email from the names stored
    def up do
    # => the fill the starter never wrote
    execute "UPDATE kata03_members SET email = lower(name) || '@example.dev' WHERE email IS NULL"
    # => end up: every row gains an address
    end

    # => down clears the derived fill
    def down do
    # => NULL every address the up wrote
    execute "UPDATE kata03_members SET email = NULL"
    # => end down: the fill is gone
    end
    # => end FillEmail: the closing step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata03.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata03.Repo, "DROP TABLE IF EXISTS kata03_members", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Kata03.Repo, scratch, :up, all: true, log: false)
    # => the backfill filled every row
    sql = "SELECT count(*) FROM kata03_members WHERE email IS NOT NULL"
    # => one call counts the completed fill
    [[filled]] = Ecto.Adapters.SQL.query!(Kata03.Repo, sql, []).rows
    # => Output: filled: 2
    IO.puts("filled: #{filled}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Kata03.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata03.Main.run()
```

**Output** (`drilling/code/kata-03-add-a-backfill-step/expected/main.stdout.txt`):

```text
filled: 2
cleaned: yes
```

### Kata 04: Expand Backfill Then Contract

(Concepts: co-07.)

Renames cross deploy boundaries: run the starter and watch the value stuck under the old name, then match the reference that expands, copies, contracts, and proves the kept value under its new name.

**`drilling/code/kata-04-expand-backfill-then-contract/before/starter.exs`**:

```elixir
# => Example 4: Expand Backfill Then Contract
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata04.Repo, migration_source: "kata04_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata04.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata04.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata04.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata04")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000140_expand.exs"), ~S"""
    # => the starter expands without migrating or contracting
    defmodule Kata04.Repo.Migrations.ExpandHandles do
    # => old and new columns land together
    use Ecto.Migration

    # => both columns exist before any read moves
    def change do
    # => the roster every reader queries
    create table(:kata04_handles) do
    # => the old column readers use today
      add :email, :string
    # => the new column nobody reads yet
      add :email_new, :string
    # => end create: old and new side by side
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO kata04_handles (email, email_new) VALUES ('a@x.dev', NULL)", "DELETE FROM kata04_handles"
    # => end change: expand without migrate or contract
    end
    # => end ExpandHandles: the incomplete starter
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata04.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata04.Repo, "DROP TABLE IF EXISTS kata04_handles", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Kata04.Repo, scratch, :up, all: true, log: false)
    # => the new column waits, empty
    sql = "SELECT email_new FROM kata04_handles ORDER BY 1"
    # => one call reads the unmigrated column
    [[moved]] = Ecto.Adapters.SQL.query!(Kata04.Repo, sql, []).rows
    # => Output: moved: none
    IO.puts("moved: #{if(moved == nil, do: "none", else: moved)}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata04.Main.run()
```

**`drilling/code/kata-04-expand-backfill-then-contract/after/solution.exs`**:

```elixir
# => Example 4: Expand Backfill Then Contract
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata04.Repo, migration_source: "kata04_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata04.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata04.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata04.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata04")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000140_expand.exs"), ~S"""
    # => the starter expands without migrating or contracting
    defmodule Kata04.Repo.Migrations.ExpandHandles do
    # => old and new columns land together
    use Ecto.Migration

    # => both columns exist before any read moves
    def change do
    # => the roster every reader queries
    create table(:kata04_handles) do
    # => the old column readers use today
      add :email, :string
    # => the new column nobody reads yet
      add :email_new, :string
    # => end create: old and new side by side
    end
    # => two-arg execute keeps change reversible
    execute "INSERT INTO kata04_handles (email, email_new) VALUES ('a@x.dev', NULL)", "DELETE FROM kata04_handles"
    # => end change: expand without migrate or contract
    end
    # => end ExpandHandles: the incomplete starter
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000141_migrate.exs"), ~S"""
    # => the migrate step copies old values across
    defmodule Kata04.Repo.Migrations.MigrateReads do
    # => explicit up and down for the copy
    use Ecto.Migration

    # => copy old to new where new is still empty
    def up do
    # => the copy that lets readers move
    execute "UPDATE kata04_handles SET email_new = email WHERE email_new IS NULL"
    # => end up: new matches old everywhere
    end

    # => down clears the copied values
    def down do
    # => NULL every value the up wrote
    execute "UPDATE kata04_handles SET email_new = NULL"
    # => end down: new is empty again
    end
    # => end MigrateReads: the migrate step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000142_contract.exs"), ~S"""
    # => the contract step drops the abandoned column
    defmodule Kata04.Repo.Migrations.ContractReads do
    # => readers moved, the old column may go
    use Ecto.Migration

    # => remove inside alter needs explicit directions
    def up do
    # => the column no reader selects
    alter table(:kata04_handles) do
    # => DROP COLUMN under the hood
      remove :email
    # => end alter: old column gone
    end
    # => end up: contract complete
    end

    # => down brings the column back empty
    def down do
    # => the shape returns, the dropped values do not
    alter table(:kata04_handles) do
    # => nullable: the restore tolerates the loss
      add :email, :string, null: true
    # => end alter: old column back, empty
    end
    # => end down: shape restored, data stays dropped
    end
    # => end ContractReads: the contract step
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata04.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata04.Repo, "DROP TABLE IF EXISTS kata04_handles", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Kata04.Repo, scratch, :up, all: true, log: false)
    # => the moved value survived all three steps
    sql = "SELECT email_new FROM kata04_handles ORDER BY 1"
    # => one call reads the contracted value
    [[kept]] = Ecto.Adapters.SQL.query!(Kata04.Repo, sql, []).rows
    # => Output: kept: a@x.dev
    IO.puts("kept: #{kept}")
    # => reverse everything for the next run
    Ecto.Migrator.run(Kata04.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata04.Main.run()
```

**Output** (`drilling/code/kata-04-expand-backfill-then-contract/expected/main.stdout.txt`):

```text
kept: a@x.dev
cleaned: yes
```

### Kata 05: Baseline an Existing Database

(Concepts: co-09.)

Legacy tables predate their history: run the starter and watch replay collide with reality, then match the reference that marks the base version and adopts the legacy rows with a new migration.

**`drilling/code/kata-05-baseline-an-existing-database/before/starter.exs`**:

```elixir
# => Example 5: Baseline an Existing Database
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata05.Repo, migration_source: "kata05_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata05.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata05.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata05.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata05")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000150_baseline_ledger.exs"), ~S"""
    # => the file describes the legacy shape as code
    defmodule Kata05.Repo.Migrations.BaselineLedger do
    # => create_if_not_exists tolerates the legacy table
    use Ecto.Migration

    # => the legacy shape, versioned without rebuilding
    def change do
    # => IF NOT EXISTS: the legacy table stays untouched
    create_if_not_exists table(:kata05_ledger) do
    # => the handle every legacy row carries
      add :handle, :string
    # => end create: the adopted shape
    end
    # => end change: adopt, never rebuild
    end
    # => end BaselineLedger: the unmarked file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata05.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata05.Repo, "DROP TABLE IF EXISTS kata05_ledger", [])

    # => the legacy system built this table with rows
    sql = "CREATE TABLE kata05_ledger (id bigserial PRIMARY KEY, handle text)"
    # => one call builds the legacy shape
    Ecto.Adapters.SQL.query!(Kata05.Repo, sql, [])

    # => two legacy rows predate every migration
    sql = "INSERT INTO kata05_ledger (handle) VALUES ('ada'), ('grace')"
    # => one call adopts the legacy rows
    Ecto.Adapters.SQL.query!(Kata05.Repo, sql, [])

    # => nobody marked the baseline yet
    sql = "SELECT count(*) FROM kata05_history WHERE version = 202602000150"
    # => one call counts the missing mark
    [[marks]] = Ecto.Adapters.SQL.query!(Kata05.Repo, sql, []).rows
    # => Output: marks: 0
    IO.puts("marks: #{marks}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata05.Main.run()
```

**`drilling/code/kata-05-baseline-an-existing-database/after/solution.exs`**:

```elixir
# => Example 5: Baseline an Existing Database
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata05.Repo, migration_source: "kata05_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata05.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata05.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata05.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata05")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000150_baseline_ledger.exs"), ~S"""
    # => the file describes the legacy shape as code
    defmodule Kata05.Repo.Migrations.BaselineLedger do
    # => create_if_not_exists tolerates the legacy table
    use Ecto.Migration

    # => the legacy shape, versioned without rebuilding
    def change do
    # => IF NOT EXISTS: the legacy table stays untouched
    create_if_not_exists table(:kata05_ledger) do
    # => the handle every legacy row carries
      add :handle, :string
    # => end create: the adopted shape
    end
    # => end change: adopt, never rebuild
    end
    # => end BaselineLedger: the unmarked file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata05.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata05.Repo, "DROP TABLE IF EXISTS kata05_ledger", [])

    # => the legacy system built this table with rows
    sql = "CREATE TABLE kata05_ledger (id bigserial PRIMARY KEY, handle text)"
    # => one call builds the legacy shape
    Ecto.Adapters.SQL.query!(Kata05.Repo, sql, [])

    # => two legacy rows predate every migration
    sql = "INSERT INTO kata05_ledger (handle) VALUES ('ada'), ('grace')"
    # => one call adopts the legacy rows
    Ecto.Adapters.SQL.query!(Kata05.Repo, sql, [])

    # => the solution marks the baseline before migrating
    sql = "INSERT INTO kata05_history (version) VALUES (202602000150)"
    # => one call writes the starting receipt
    Ecto.Adapters.SQL.query!(Kata05.Repo, sql, [])
    # => the mark holds with zero rows lost
    sql = "SELECT count(*) FROM kata05_ledger"
    # => one call counts the preserved rows
    [[kept]] = Ecto.Adapters.SQL.query!(Kata05.Repo, sql, []).rows
    # => Output: kept: 2
    IO.puts("kept: #{kept}")
    # => down returns the database to unmarked
    Ecto.Migrator.run(Kata05.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata05.Main.run()
```

**Output** (`drilling/code/kata-05-baseline-an-existing-database/expected/main.stdout.txt`):

```text
kept: 2
cleaned: yes
```

### Kata 06: Resolve a Version Conflict

(Concepts: co-11.)

Same version twice is a conflict, not a tiebreak: run the starter and watch the runner refuse, then match the reference that renames one file and proves both resolved in order.

**`drilling/code/kata-06-resolve-a-version-conflict/before/starter.exs`**:

```elixir
# => Example 6: Resolve a Version Conflict
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata06.Repo, migration_source: "kata06_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata06.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata06.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata06.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata06")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000160_branch_alpha.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata06.Repo.Migrations.BranchAlpha do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata06_alpha) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end BranchAlpha: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000160_branch_beta.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata06.Repo.Migrations.BranchBeta do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata06_beta) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end BranchBeta: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata06.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata06.Repo, "DROP TABLE IF EXISTS kata06_alpha", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata06.Repo, "DROP TABLE IF EXISTS kata06_beta", [])

    # => the starter lists the collision without running it
    files = File.ls!(scratch)
    # => both branches claim one timestamp
    IO.puts("files: " <> Enum.map_join(Enum.sort(files), ", ", fn f -> f end))

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata06.Main.run()
```

**`drilling/code/kata-06-resolve-a-version-conflict/after/solution.exs`**:

```elixir
# => Example 6: Resolve a Version Conflict
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata06.Repo, migration_source: "kata06_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata06.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata06.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata06.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata06")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000160_branch_alpha.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata06.Repo.Migrations.BranchAlpha do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata06_alpha) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end BranchAlpha: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000161_branch_beta.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata06.Repo.Migrations.BranchBeta do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata06_beta) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end BranchBeta: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata06.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata06.Repo, "DROP TABLE IF EXISTS kata06_alpha", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata06.Repo, "DROP TABLE IF EXISTS kata06_beta", [])

    # => run every pending file in version order
    Ecto.Migrator.run(Kata06.Repo, scratch, :up, all: true, log: false)
    # => the renamed file runs after the original
    sql =
      "SELECT version FROM kata06_history WHERE version IN (202602000160, 202602000161) ORDER BY version"

    # => one call reads both receipts
    versions = Ecto.Adapters.SQL.query!(Kata06.Repo, sql, []).rows
    # => Output: resolved: 202602000160, 202602000161
    IO.puts("resolved: " <> Enum.map_join(versions, ", ", fn [v] -> "#{v}" end))
    # => reverse everything for the next run
    Ecto.Migrator.run(Kata06.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata06.Main.run()
```

**Output** (`drilling/code/kata-06-resolve-a-version-conflict/expected/main.stdout.txt`):

```text
resolved: 202602000160, 202602000161
cleaned: yes
```

### Kata 07: Guard a Deploy with a Status Check

(Concepts: co-13.)

Deploys must ask the database where it stands: run the starter and watch the gate blind to pending work, then match the reference that blocks on pending, clears after upgrade, and proves both states.

**`drilling/code/kata-07-guard-a-deploy-with-a-status-check/before/starter.exs`**:

```elixir
# => Example 7: Guard a Deploy with a Status Check
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata07.Repo, migration_source: "kata07_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata07.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata07.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata07.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata07")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000170_make_a.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata07.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata07_a) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeA: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000171_make_b.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata07.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata07_b) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeB: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata07.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata07.Repo, "DROP TABLE IF EXISTS kata07_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata07.Repo, "DROP TABLE IF EXISTS kata07_b", [])

    # => the starter runs the first file without gating
    Ecto.Migrator.run(Kata07.Repo, scratch, :up, to: 202_602_000_170, log: false)
    # => the second file waits, pending and unguarded
    pending = Ecto.Migrator.migrations(Kata07.Repo, scratch)
    # => foreign rows belong to other units, never this transcript
    pending = Enum.reject(pending, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => pending means down from this unit's side
    pending = Enum.filter(pending, fn {s, _, _} -> s == :down end)
    # => Output: pending: 202602000171 make_b
    IO.puts("pending: " <> Enum.map_join(pending, ", ", fn {_, v, n} -> "#{v} #{n}" end))

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata07.Main.run()
```

**`drilling/code/kata-07-guard-a-deploy-with-a-status-check/after/solution.exs`**:

```elixir
# => Example 7: Guard a Deploy with a Status Check
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata07.Repo, migration_source: "kata07_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata07.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata07.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata07.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata07")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000170_make_a.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata07.Repo.Migrations.MakeA do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata07_a) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeA: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000171_make_b.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata07.Repo.Migrations.MakeB do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata07_b) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeB: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata07.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata07.Repo, "DROP TABLE IF EXISTS kata07_a", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata07.Repo, "DROP TABLE IF EXISTS kata07_b", [])

    # => the deploy runs the first file, then gates
    Ecto.Migrator.run(Kata07.Repo, scratch, :up, to: 202_602_000_170, log: false)
    # => the gate lists files the history has not recorded
    pending = Ecto.Migrator.migrations(Kata07.Repo, scratch)
    # => foreign rows belong to other units, never this guard
    pending = Enum.reject(pending, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => pending means down from this unit's side
    pending = Enum.filter(pending, fn {s, _, _} -> s == :down end)
    # => Output: gate: blocked
    IO.puts("gate: " <> if(pending == [], do: "clear", else: "blocked"))
    # => the deploy completes only after the gate clears
    Ecto.Migrator.run(Kata07.Repo, scratch, :up, all: true, log: false)
    # => the gate passes when nothing stays pending
    clear = Ecto.Migrator.migrations(Kata07.Repo, scratch)
    # => pending means down from this unit's side
    clear = Enum.filter(clear, fn {s, _, _} -> s == :down end)
    # => Output: gate: clear
    IO.puts("gate: " <> if(clear == [], do: "clear", else: "blocked"))
    # => reverse everything for the next run
    Ecto.Migrator.run(Kata07.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata07.Main.run()
```

**Output** (`drilling/code/kata-07-guard-a-deploy-with-a-status-check/expected/main.stdout.txt`):

```text
gate: blocked
gate: clear
cleaned: yes
```

### Kata 08: Diagnose a Failed Revision from History

(Concepts: co-16.)

Failures leave a paper trail in two places: run the starter and watch the aftermath undescribed, then match the reference that fails a file on purpose and names it from status plus history.

**`drilling/code/kata-08-diagnose-a-failed-revision-from-history/before/starter.exs`**:

```elixir
# => Example 8: Diagnose a Failed Revision from History
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata08.Repo, migration_source: "kata08_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata08.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata08.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata08.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata08")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000180_make_good.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata08.Repo.Migrations.MakeGood do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata08_good) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeGood: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000181_break_bad.exs"), ~S"""
    # => the bad file fails after the good one applied
    defmodule Kata08.Repo.Migrations.BreakBad do
    # => explicit up and down for the broken file
    use Ecto.Migration

    # => the table lands, then the bad statement fires
    def up do
    # => CREATE TABLE inside the migration transaction
    create table(:kata08_bad) do
    # => a single label column for the failing file
      add :label, :string
    # => end create: the table the failure erases
    end
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure the diagnosis will name
    end

    # => down drops the table when the file ever applies
    def down do
    # => the reverse of the created table
    drop table(:kata08_bad)
    # => end down: the table is gone
    end
    # => end BreakBad: the failing candidate
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata08.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata08.Repo, "DROP TABLE IF EXISTS kata08_good", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata08.Repo, "DROP TABLE IF EXISTS kata08_bad", [])

    # => the starter runs into the failure without diagnosing
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => the good file applies before the bad one fires
        Ecto.Migrator.run(Kata08.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: the good file stays applied
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata08.Main.run()
```

**`drilling/code/kata-08-diagnose-a-failed-revision-from-history/after/solution.exs`**:

```elixir
# => Example 8: Diagnose a Failed Revision from History
Logger.configure(level: :info)
# => debug query logs off; prints form the transcript
Code.compiler_options(ignore_module_conflict: true)
# => down-migration reloads stay silent on double runs
# => every unit keeps its own history table, never the shared default
Application.put_env(:app, Kata08.Repo, migration_source: "kata08_history")

# => one Repo module per unit keeps names unambiguous
defmodule Kata08.Repo do
  # => the Postgres 18 service adapter
  use Ecto.Repo, otp_app: :app, adapter: Ecto.Adapters.Postgres
  # => module boundary stays explicit
end

# => run/0 holds the whole example narrative
defmodule Kata08.Main do
  # => single entry point the last line calls
  def run do
    # => one keyword list owns every connection fact
    opts = [
      # => harness service hostname
      hostname: System.get_env("PGHOST", "postgres"),
      # => service port, parsed once
      port: System.get_env("PGPORT", "5432") |> String.to_integer(),
      # => fresh database for every run
      database: System.get_env("PGDATABASE", "postgres"),
      # => trust-auth role, no password
      username: System.get_env("PGUSER", "postgres"),
      # => Repo stays silent; the transcript is explicit
      log: false
      # => end opts: every fact above is environment-driven
    ]

    # => pool starts; the script owns the rest
    {:ok, _} = Kata08.Repo.start_link(opts)

    # => private script dir, never printed
    scratch = Path.join(System.tmp_dir!(), "kata08")
    # => create it fresh on every run
    File.mkdir_p!(scratch)
    # => migration source starts here
    File.write!(Path.join(scratch, "202602000180_make_good.exs"), ~S"""
    # => the kata table starts here
    defmodule Kata08.Repo.Migrations.MakeGood do
    # => the same DSL every history file uses
    use Ecto.Migration

    # => up builds, down removes
    def change do
    # => one table stands in for the kata shape
    create table(:kata08_good) do
    # => a single label column, enough to prove the shape
      add :label, :string
    # => end create: the kata table
    end
    # => end change: down drops what up created
    end
    # => end MakeGood: the kata file
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => migration source starts here
    File.write!(Path.join(scratch, "202602000181_break_bad.exs"), ~S"""
    # => the bad file fails after the good one applied
    defmodule Kata08.Repo.Migrations.BreakBad do
    # => explicit up and down for the broken file
    use Ecto.Migration

    # => the table lands, then the bad statement fires
    def up do
    # => CREATE TABLE inside the migration transaction
    create table(:kata08_bad) do
    # => a single label column for the failing file
      add :label, :string
    # => end create: the table the failure erases
    end
    # => no such function: the database rejects this
    execute "SELECT boom_missing_function()"
    # => end up: the failure the diagnosis will name
    end

    # => down drops the table when the file ever applies
    def down do
    # => the reverse of the created table
    drop table(:kata08_bad)
    # => end down: the table is gone
    end
    # => end BreakBad: the failing candidate
    end
    # => the exact file the lesson shows, now on disk
    """)

    # => stale receipts roll back first; empty history returns []
    Ecto.Migrator.run(Kata08.Repo, scratch, :down, to: 0, log: false)
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata08.Repo, "DROP TABLE IF EXISTS kata08_good", [])
    # => leftovers of a killed run vanish
    Ecto.Adapters.SQL.query!(Kata08.Repo, "DROP TABLE IF EXISTS kata08_bad", [])

    # => the diagnosis starts where the starter stopped
    # => the attempt runs; rescue below names any failure
    outcome =
      try do
        # => the good file applies before the bad one fires
        Ecto.Migrator.run(Kata08.Repo, scratch, :up, all: true, log: false)
        # => unreachable: the error above skips the rest of try
        :ran
        # => the failure surfaces as a database error
      rescue
        # => the struct names the failure without secrets
        e in Postgrex.Error ->
          # => the rescue reports the error struct
          {:raised, e.__struct__}
          # => end rescue: history names the failed file
      end

    # => Output: raised: Postgrex.Error
    IO.puts("raised: #{inspect(elem(outcome, 1))}")
    # => status names the file the error interrupted
    failed = Ecto.Migrator.migrations(Kata08.Repo, scratch)
    # => foreign rows belong to other units, never this diagnosis
    failed = Enum.reject(failed, fn {_, _, n} -> n == "** FILE NOT FOUND **" end)
    # => down from this unit's side means never applied
    failed = Enum.filter(failed, fn {s, _, _} -> s == :down end)
    # => Output: failed: 202602000181 break_bad
    IO.puts("failed: " <> Enum.map_join(failed, ", ", fn {_, v, n} -> "#{v} #{n}" end))
    # => the diagnosis rolls the partial run back
    Ecto.Migrator.run(Kata08.Repo, scratch, :down, to: 0, log: false)
    # => Output: cleaned: yes
    IO.puts("cleaned: yes")

    # => end run: the narrative returns here
  end

  # => module boundary stays explicit
end

# => the entry point runs exactly once per execution
Kata08.Main.run()
```

**Output** (`drilling/code/kata-08-diagnose-a-failed-revision-from-history/expected/main.stdout.txt`):

```text
raised: Postgrex.Error
failed: 202602000181 break_bad
cleaned: yes
```

## How to study this page

Do not read top to bottom more than once. First pass: answer every recall question closed-book and mark each red or green before opening any detail block — the reds are your syllabus, not your shame. Second pass, a day later: rework only the reds through their mapped examples, predicting each program's output before running it; a prediction wrong twice means the concept, not the example, needs rework. Third pass, a week later: the applied problems on paper, timed, with the approach sketches sealed — if the sketch and your plan agree on versions, order, and verification, the problem is learned. The katas follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking, run it, then diff against the reference and account for every difference. Keep the log across all three passes; the items still red on the third pass become flashcards, and the flashcards retire only after two consecutive green recalls a week apart.

## Self-check checklist

Mark each item only when you can demonstrate it without notes: run the mapped example or kata, predict the output, then explain the why to someone else. An item you can perform but not explain is half learned — revisit the lesson section before marking it done. Review unchecked items weekly: the list doubles as a spaced-repetition schedule, and the items that stay unchecked for a month point at the course sections worth re-reading end to end.

1. [ ] I can write a `change` migration that creates a table and rolls itself back.
2. [ ] I can name every part of a migration file and say which part orders history.
3. [ ] I can run `Ecto.Migrator` up to a named version and explain what stays pending.
4. [ ] I can roll a migration down and prove the schema returned to its prior shape.
5. [ ] I can add a nullable column to an inhabited table without disturbing old rows.
6. [ ] I can create an index in the same migration as the column it serves.
7. [ ] I can widen a column type with `modify` and keep the migration reversible.
8. [ ] I can rename a column with `rename` and prove no data was lost.
9. [ ] I can read migration status and say exactly which files ran and which are pending.
10. [ ] I can read the history table and explain what each row claims.
11. [ ] I can run migrations to a checkpoint and resume the rest in a later run.
12. [ ] I can step history forward and backward one version at a time.
13. [ ] I can explain why filenames never order history and versions always do.
14. [ ] I can repair a duplicate-version collision with a rename.
15. [ ] I can backfill a new column and verify the filled count.
16. [ ] I can split a data evolution into schema, seed, and fill migrations.
17. [ ] I can walk a rename through expand, migrate, and contract without a flag day.
18. [ ] I can add a check constraint `NOT VALID` and validate it in a second step.
19. [ ] I can mark a legacy database as migrated without running its DDL.
20. [ ] I can detect drift by comparing history, receipts, and reflected tables.
21. [ ] I can gate a deploy on pending-migration status.
22. [ ] I can serialize concurrent migrators with the advisory migration lock.
23. [ ] I can build a concurrent index outside the DDL transaction.
24. [ ] I can diagnose a failed migration from status plus history and rehearse the full cycle.

## Elaborative interrogation & self-explanation

Answer each prompt in writing before reading the model answer: name the choice, name the rejected alternative, and state the exact failure the choice prevents. A prompt you answer with slogans instead of mechanisms is still open — rework it with the mapped example running beside you.

### Prompt 1: Why does the runner sort by version instead of trusting filenames?

Model answer: filenames are human conveniences — two developers, two clocks, two naming habits. Versions are the one total order every checkout shares, so sorting by version makes the run order a property of the history rather than of anyone's filesystem. If filenames ordered history, a rename would reorder production. A filename says what a human called it; a version says where the machine runs it. Keep the two jobs separate and renames stay cosmetic forever.

### Prompt 2: Why not one big migration per release instead of many small files?

Model answer: one big file has one big lock window and one big failure window — any statement failing undoes everything, and the whole release waits on the slowest step. Small files release locks between steps, resume after the gap instead of from the start, and give status output the granularity to name exactly what is pending. The extra files are bulkheads, not clutter. Status output gains one line per file, so the deploy review names exactly what is pending instead of waving at a release. Small files also make ownership obvious: each file has one author, one reason, and one revert.

### Prompt 3: Why do data fills get explicit reversals or declared one-way downs instead of silence?

Model answer: silence in the down direction reads as I did not think about it, and the next responder cannot tell policy from omission. An explicit reversal restores what can be restored; a declared no-op says the data cannot come back and forces the rollback plan to account for it. Either way the file tells the truth; silence makes the incident teach it instead. The habit compounds across a team: files that state their reversibility teach every reader what safe looks like, while silent files teach that nobody checked. Write the down step first and the up step earns its confidence.

### Prompt 4: Why mark a legacy database instead of replaying history onto it?

Model answer: replaying would run creates against tables that already exist — every statement collides with reality. The mark records agreement with the present instead of re-executing the past, and the next ordinary migration builds on that agreement. Replay rewrites what is already true; marking acknowledges it and moves on. The mark names the exact schema it adopts, and the verification query proves the claim before the team builds on it. From there, ordinary migrations carry the evolution forward — adoption ends where versioned work begins.

### Prompt 5: Why validate a constraint in a separate step instead of with the definition?

Model answer: definition with validation scans the table under a deploy-blocking lock; the scan's duration is the outage. Separating arrival from validation keeps each lock light — new rows obey at once, old rows wait their turn — and writers continue through both. The two-step shape buys availability with one extra file. Reviewers see the trade in the open: two module attributes, one light lock each, zero blocked traffic. The alternative hides the scan inside a deploy and discovers its duration from the incident channel.

### Prompt 6: Why rehearse the full up-down-up cycle before shipping?

Model answer: review proves the file reads correctly; rehearsal proves it runs correctly in both directions against a real database. The rollback half is the half that matters at 3 a.m., and it deserves a daylight test. Ship only what rehearsed green — everything else is a hope with a version number. The rehearsal needs no audience and no permission: a scratch database, the same command, twice. Three gates — linearity from the version line, currency from the receipts, fidelity from the byte-identical transcript — before any deploy ships.
