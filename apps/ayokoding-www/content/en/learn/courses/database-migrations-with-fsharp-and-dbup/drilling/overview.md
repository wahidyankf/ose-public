---
title: "Overview"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

Answer each question from memory before opening its answer block: say the answer aloud in one or two sentences, then check. The questions follow the course order — scripts and history first, data and safety next, teams and failure last — so a missed question points at the level worth reworking.

### Q1 (co-01): What three parts make a DbUp script, and which one orders history?

<details><summary>Answer</summary>

A name, a forward body, and its position in the registration order. The name carries version plus intent (`002_add_quantity`), the body carries the SQL that runs, and the registration order decides execution sequence. DbUp applies scripts in the order the builder received them and journals each name; the version inside the name is a human convention the team enforces, not a number the tool sorts by. History order therefore comes from registration, and registration order is what merge review checks.

**In short**: The name orders history only through registration sequence: DbUp walks scripts in builder order, so `001` before `002` runs first because it was registered first. Teams that register in version order get version-ordered history; the tool guarantees sequence, humans guarantee sense.

</details>

### Q2 (co-01): Why must version names be fixed strings instead of generated stamps?

<details><summary>Answer</summary>

Fixed names survive review, merge, and rerun; generated stamps encode wall-clock time that no reviewer can reason about. A stamp says when a file was created, which answers nothing about what it changes or where it belongs. Fixed sequential names place every migration in a shared, reviewable order that two developers can agree on without meeting. Stamps also break determinism: regenerating the history produces different names, so the journal can never match twice.

**In short**: Fixed names are reviewable, mergeable, and repeatable. Stamps answer when instead of what, and when is the one thing history must not depend on.

</details>

### Q3 (co-02): What belongs in a forward step, and what replaces the missing down step?

<details><summary>Answer</summary>

The forward step carries the change; a later compensating migration carries the reversal. DbUp scripts run forward only, so rolling back means writing a new script whose effect cancels an earlier one — dropping an added column, re-adding a dropped one. The journal stays append-only: the mistake and the fix both remain visible forever. Nothing is ever edited or deleted from applied history.

**In short**: Forward steps change; compensating steps reverse by changing again. Append-only history keeps both visible.

</details>

### Q4 (co-02): Why do compensating migrations beat history edits for recovery?

<details><summary>Answer</summary>

History edits rewrite what already ran everywhere else, forking every database that applied the old version. A compensating migration runs the same everywhere — on databases that saw the mistake and, as a no-op in effect, on ones that did not need it. The journal records the recovery as an event with its own moment instead of pretending the mistake never happened. Audits, incident reviews, and promotion pipelines all read the same truthful sequence.

**In short**: Compensations run everywhere identically; edits fork history per database. Truthful history beats convenient history.

</details>

### Q5 (co-03): What does the journal store, and who writes to it?

<details><summary>Answer</summary>

The journal — the `schemaversions` table — stores one row per applied script: the script name and the applied moment, keyed by its own id. DbUp itself writes the row after a script succeeds, in the same upgrade that ran it; no program code inserts journal rows by hand. Because the writer is the tool, readers can trust every row equally. Status calls, rerun skips, and every diagnosis in this course read this table.

**In short**: DbUp writes name-plus-moment per applied script; everything else reads. One writer keeps every row trustworthy.

</details>

### Q6 (co-03): How do applied and pending differ as diagnostics?

<details><summary>Answer</summary>

Applied names sit in the journal; pending names are registered but absent from it. Applied answers what this database already survived, pending answers what would run next. The difference between the registered set and the journaled set is the exact upgrade plan — no more, no less. Deploy gates branch on it: pending work means wait, empty pending means go.

**In short**: Applied is journaled history, pending is registered-minus-journaled future. Their difference is the plan.

</details>

### Q7 (co-04): What creates a fork in history, and what does it block?

<details><summary>Answer</summary>

Two scripts sharing one version number — or one name — fork history: the second cannot sequence after the first because its position is taken. The fork blocks clean merging until one side renumbers onto the shared head. DbUp itself never detects the fork; it applies whatever it is given in order. The team detects it by comparing branch sequences before merging.

**In short**: Duplicate numbers or names fork history. Renumbering one side onto head unblocks the merge.

</details>

### Q8 (co-04): How do you list pending versions, and what does the count mean?

<details><summary>Answer</summary>

`GetScriptsToExecute` returns the registered scripts missing from the journal, in run order; its length is the pending count. Zero means the database matches the plan and the upgrade would be a no-op. A nonzero count names exactly what a merge or deploy would run. Listing before acting turns merges and deploys into checklists instead of surprises.

**In short**: Pending is registered-minus-journaled in run order. Zero means converged; nonzero names the coming work.

</details>

### Q9 (co-05): What makes a migration rerunnable, and what breaks reruns?

<details><summary>Answer</summary>

Journal skipping plus guarded content makes reruns safe: applied names skip automatically, and WHERE-guarded fills change nothing on repeat. Reruns break when scripts assume empty tables, unguarded updates, or names that collide with different content. The double-run discipline — run, rerun, compare — proves rerunnability instead of assuming it. Every example in this course passes it.

**In short**: Skipped names plus guarded statements survive reruns. Assumptions about empty state break them.

</details>

### Q10 (co-06): Why must the backfill run after the schema change, and in its own script?

<details><summary>Answer</summary>

The fill needs the column to exist, so the schema script must journal first; sharing one script hides the data risk inside the schema review. Separate scripts give the fill its own review, its own journal row, and its own rollback story. The order also matches deploy reality: shape first, data second, constraint last. Combining them saves a file and loses all three properties.

**In short**: Shape before data, each in its own script, keeps reviews honest and rollbacks possible.

</details>

### Q11 (co-06): How do you verify a backfill worked?

<details><summary>Answer</summary>

Count rows before and after to prove none were lost, then assert business math with a golden query to prove the values are right. Counts catch silent row loss; the golden aggregation catches wrong-but-complete fills. Both checks print fixed, deterministic transcripts that rerun byte-identically. A backfill with both proofs is done; with one, it is hopeful.

**In short**: Row counts prove nothing was lost; golden queries prove the values are right. Ship both proofs.

</details>

### Q12 (co-07): What are the three expand-migrate-contract stops, and what runs between them?

<details><summary>Answer</summary>

Expand adds the new shape while the old serves; migrate copies values and moves readers; contract drops the old shape. Dual writes run between expand and migrate, reader moves run between migrate and contract. Each stop deploys independently with the application running throughout. Contract runs only when nothing reads the old shape anymore.

**In short**: Expand adds, migrate moves, contract removes — with dual writes and reader moves in between.

</details>

### Q13 (co-07): Why does the new column start nullable?

<details><summary>Answer</summary>

Nullable adds take brief locks and never fail on existing rows, so the expand step deploys onto any table at any size. Strictness arrives later — through backfills, defaults, and constraint steps — once every row qualifies. Starting strict fails the deploy on legacy data before the migration even begins. Nullable first, strict when earned.

**In short**: Nullable lands anywhere; strictness is earned row by row afterward.

</details>

### Q14 (co-08): What does a compensating migration undo, and what can it not restore?

<details><summary>Answer</summary>

It undoes the schema effect — the column, the table, the shape — by applying the reverse change going forward. It cannot restore dropped data: rows deleted by the original change are gone unless a backup or seed rebuilds them. Schema reverses, data does not, which is why destructive steps deserve their own review. The journal remembers both the wound and the bandage.

**In short**: Compensations reverse shape, never data. Dropped rows need backups, not migrations.

</details>

### Q15 (co-08): Which unrelated things survive a rollback, and why does that matter?

<details><summary>Answer</summary>

Every row the change did not touch, every neighboring table, and every concurrent session survive — because compensations touch only their own change. Proving survival with counts turns rollback from a brave act into a routine one. The blast radius is the rollback story: migrations that cannot name what they preserve do not run at 2 AM.

**In short**: Untouched rows, tables, and sessions survive. Naming the survivors is the rollback story.

</details>

### Q16 (co-09): What is schema drift, and which two comparisons reveal it?

<details><summary>Answer</summary>

Drift is schema without journal: out-of-band changes that the history never recorded. Journal-to-catalog comparison reveals it — journaled names against actual columns, expected tables against present ones. One journal row with three actual columns, or a catalog missing a journaled table, is the signature. Scheduled comparison turns silent divergence into a ticket with evidence.

**In short**: Drift is unjournaled schema. Journal-versus-catalog comparison reveals it; scheduled comparison tickets it.

</details>

### Q17 (co-09): A script is journaled but its table is missing: what happened, and how do you recover?

<details><summary>Answer</summary>

Something dropped the table out of band after the migration ran — a console, a cleanup job, a second tool. The journal says applied, the catalog says absent: that disagreement is the diagnosis. Recover by re-applying the intent as a new compensating migration, never by deleting the journal row. The journal stays truthful about the past while the new script fixes the present.

**In short**: Out-of-band drops cause journaled-but-missing. Recover forward with a new script, never by editing history.

</details>

### Q18 (co-10): When do you baseline instead of upgrading?

<details><summary>Answer</summary>

Baseline when the database predates migrations: hand-built tables with live data that no script ever created. Upgrading from zero would recreate what exists or fail on conflicts; baselining journals a starting marker over the untouched legacy shape. New work then builds on adopted history like any greenfield. Baselines adopt; upgrades extend.

**In short**: Baseline adopted legacy databases; upgrade everything after. Markers adopt, scripts extend.

</details>

### Q19 (co-10): Why does the baseline marker change nothing, and why is that the point?

<details><summary>Answer</summary>

The marker runs no DDL — `SELECT 1` changes nothing — so legacy rows and shapes survive adoption byte-identically. Changing nothing is the point: the baseline claims a starting position without rewriting the past it claims. Later migrations then diff against a known-good adopted state. Adoption without alteration keeps the promise that what exists is accepted as-is.

**In short**: Markers claim position without touching data. Untouched adoption keeps the starting promise.

</details>

### Q20 (co-11): DbUp journals names, not content: what breaks when an applied script is edited?

<details><summary>Answer</summary>

Nothing breaks loudly and everything breaks quietly: the rerun reports success while the edit never executes. Name-only journaling cannot see content changes, so edited scripts are silently skipped everywhere. The database stays stale while the deploy stays green. The pipeline must checksum content itself, because the tool never will.

**In short**: Edits to applied scripts are silently ignored. Checksum content in the pipeline or ship corrections as new scripts.

</details>

### Q21 (co-12): Which scripts must run inside a transaction, and which must not?

<details><summary>Answer</summary>

Multi-statement scripts whose steps form one unit must wrap in `WithTransaction` for all-or-nothing failure handling. Scripts carrying `CONCURRENTLY` — or any statement PostgreSQL forbids in a transaction block — must not wrap, or the server rejects them before doing any work. The default is no implicit transaction, so wrapping is an explicit per-script decision. One rule with one demonstrated exception covers every script.

**In short**: Wrap multi-statement units; never wrap what the server forbids in transactions. Explicit per script.

</details>

### Q22 (co-13): Why must every environment run identical scripts in identical order?

<details><summary>Answer</summary>

Identical scripts produce comparable journals, and comparable journals prove environments match. Different scripts per environment fork reality silently: staging passes while production fails on a step it never rehearsed. Promotion moves the scripts across environments; it never reinvents them per environment. Same scripts, same order, same rows — or the environments have diverged.

**In short**: Identical scripts keep environments comparable. Promote scripts, never reinvent them per environment.

</details>

### Q23 (co-14): Two branches share a version number: who moves, and what stays frozen?

<details><summary>Answer</summary>

The unmerged side moves: the branch that has not landed renumbers onto the shared head. Merged history stays frozen — applied rows never change names, numbers, or content. The rule is one line: head wins, branches adapt. Renumbering rewrites only what no database has journaled yet.

**In short**: Unmerged branches renumber onto head; merged history never moves. Head wins, branches adapt.

</details>

### Q24 (co-15): What lock does DDL take, and how do you shrink its blast radius?

<details><summary>Answer</summary>

DDL takes `AccessExclusiveLock` for the whole transaction — the strictest lock, conflicting with everything including reads. Shrink it with short transactions, single-statement scripts, batched fills, `CONCURRENTLY` builds, timeouts, and advisory serialization. Measure with `pg_locks` before and after: the lock you can see is the lock you can shrink. Every example in the locking cluster demonstrates one shrink.

**In short**: DDL takes AccessExclusiveLock. Short transactions, batches, CONCURRENTLY, timeouts, and measurement shrink it.

</details>

### Q25 (co-16): What does migration testing assert that example outputs do not?

<details><summary>Answer</summary>

Migration testing asserts properties across runs and states: idempotence on repeat, lock modes held, golden business math, gate booleans before and after. Example outputs prove one run matched; migration tests prove the migration is safe to run, rerun, and promote. The double run, the status gate, and the golden query are tests wearing example clothes. Every backfill, rename, and deploy in this course carries at least one.

**In short**: Migration tests assert rerun safety, locks, business math, and gates — properties, not transcripts.

</details>

## Applied problems

Work each on paper before touching a terminal: name the files, their versions, and the verification query. Then build the files and run them — the terminal is the grader, not the draft.

### Problem 1: Split the rename

The `members` table has `handle TEXT NOT NULL` with 40,000 rows, and the application must read `username` by Friday with zero downtime. Name the four scripts (fixed names), state what application code ships between each pair, and write the verification query proving every username equals its old handle.

### Problem 2: Harden the column

`orders.email` is nullable with 2 million rows, 3 percent null. New policy: every order has an email. Name the migrations that end with a `NOT NULL` constraint, decide the default-versus-backfill question for the null 3 percent, and state which migration is safe to compensate and which step is one-way.

### Problem 3: Widen without locking

`events.seq` is `INTEGER` approaching 2 billion and must become `BIGINT` while ingestion continues. Sketch the expand-migrate-contract stops for a type change, name the lock each stop avoids, and explain why the naive single `ALTER COLUMN` is the wrong answer under load.

### Problem 4: Merge the branches

You added `002` (an index on `orders.status`); Priya added `002` (a `shipped_at` column). Both branched from `001`. Write the renumbering, and state the exact apply-plus-verification sequence that proves both changes present and history linear.

### Problem 5: Guard the hot table

`checkouts` takes 8,000 writes per second and needs a new `coupon` column plus an index. Choose single-statement scripts versus one combined script, place the `CONCURRENTLY` build and the `lock_timeout`, and explain what breaks if the index builds inside a migration transaction.

### Problem 6: Diagnose the partial run

Deploy stopped mid-history: the journal shows two applied scripts, but `orders.total` is missing. Reconstruct the two possible causes (failed statement inside the third script versus the third script never running), and give the ordered queries that distinguish them and recover safely.

### Problem 7: Diagnose the silent skip

The deploy is green but the new column is missing. The journal holds the script name. Reconstruct how an edited-and-rerun script produces exactly this state, and give the checksum procedure that would have caught it plus the compensating migration that fixes it now.

### Problem 8: Baseline the acquisition

You inherit a database with 40 hand-built tables and live data, and no migration history. Plan the adoption: what the baseline marker contains, what the first three real migrations verify, and which drift check runs on a schedule afterward.

## Code katas

Each kata ships a `before/` starter to fix and an `after/` reference solution that runs green. Work the starter first, then compare against the reference line by line.

### Kata 1: Write a Migration and Its Compensation

Task: create k1_posts with a title, add a subtitle column, then compensate by dropping it; prove cols and history.

**`drilling/code/kata-01-write-a-migration-and-its-compensation/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 1: create k1_posts with a title, add a subtitle column, then compensate by dropping it; prove cols and history.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-01-write-a-migration-and-its-compensation/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k1_" [ "k1_posts" ] // => leftovers of a killed run vanish

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "k1_001_create_posts.sql",
                "CREATE TABLE k1_posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k1_002_add_subtitle.sql", "ALTER TABLE k1_posts ADD COLUMN subtitle TEXT NOT NULL DEFAULT '';") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true

    let upgrader3 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k1_003_drop_subtitle.sql", "ALTER TABLE k1_posts DROP COLUMN subtitle;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader3 = upgrader3.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader3.Successful // => Output: upgrade=true

    printfn
        "cols=%s"
        (System.String.Join(
            ",",
            column
                conn
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'k1_posts' ORDER BY ordinal_position"
        )) // => Output: cols=id,title

    printfn "history=%d" (scalar conn "SELECT count(*) FROM schemaversions WHERE scriptname LIKE 'k1\_%'") // => Output: history=3
    reset conn "k1_" [ "k1_posts" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-01-write-a-migration-and-its-compensation/expected/main.stdout.txt`):

```text
upgrade=true
upgrade=true
upgrade=true
cols=id,title
history=3
```

### Kata 2: Add a Backfill Step to an Existing Migration

Task: add a nullable handle column to seeded k2_users, then backfill it from name; prove handles and completeness.

**`drilling/code/kata-02-add-a-backfill-step-to-an-existing-migration/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 2: add a nullable handle column to seeded k2_users, then backfill it from name; prove handles and completeness.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-02-add-a-backfill-step-to-an-existing-migration/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k2_" [ "k2_users" ] // => leftovers of a killed run vanish

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k2_001_create_users.sql", "CREATE TABLE k2_users (id SERIAL PRIMARY KEY, name TEXT NOT NULL);") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true
    exec conn "INSERT INTO k2_users (name) VALUES ('ada'), ('grace'), ('lin')" // => rows the backfill must cover

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k2_002_add_handle.sql", "ALTER TABLE k2_users ADD COLUMN handle TEXT;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true

    let upgrader3 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k2_003_fill_handle.sql", "UPDATE k2_users SET handle = lower(name) WHERE handle IS NULL;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader3 = upgrader3.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader3.Successful // => Output: upgrade=true
    printfn "handles=%s" (System.String.Join(",", column conn "SELECT handle FROM k2_users ORDER BY id")) // => Output: handles=ada,grace,lin
    printfn "complete=%d" (scalar conn "SELECT count(*) FROM k2_users WHERE handle IS NOT NULL") // => Output: complete=3
    reset conn "k2_" [ "k2_users" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-02-add-a-backfill-step-to-an-existing-migration/expected/main.stdout.txt`):

```text
upgrade=true
upgrade=true
upgrade=true
handles=ada,grace,lin
complete=3
```

### Kata 3: Baseline an Existing Database Without Losing Data

Task: adopt the hand-built k3_shop with its rows via a baseline marker, then extend with stock; prove items, stock, adoption.

**`drilling/code/kata-03-baseline-an-existing-database-without-losing-data/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 3: adopt the hand-built k3_shop with its rows via a baseline marker, then extend with stock; prove items, stock, adoption.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-03-baseline-an-existing-database-without-losing-data/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k3_" [ "k3_shop" ] // => leftovers of a killed run vanish
    exec conn "CREATE TABLE k3_shop (id SERIAL PRIMARY KEY, item TEXT NOT NULL, price INTEGER NOT NULL)" // => legacy shop, built by hand
    exec conn "INSERT INTO k3_shop (item, price) VALUES ('book', 12), ('pen', 2)" // => real legacy content to preserve

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k3_001_baseline_shop.sql", "SELECT 1;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k3_002_add_stock.sql", "ALTER TABLE k3_shop ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true
    printfn "items=%s" (System.String.Join(",", column conn "SELECT item FROM k3_shop ORDER BY id")) // => Output: items=book,pen
    printfn "stocked=%d" (scalar conn "SELECT count(*) FROM k3_shop WHERE stock = 0") // => Output: stocked=2
    printfn "adopted=%d" (scalar conn "SELECT count(*) FROM schemaversions WHERE scriptname LIKE 'k3\_%'") // => Output: adopted=2
    reset conn "k3_" [ "k3_shop" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-03-baseline-an-existing-database-without-losing-data/expected/main.stdout.txt`):

```text
upgrade=true
upgrade=true
items=book,pen
stocked=2
adopted=2
```

### Kata 4: Forward Fix for a Bad Deploy

Task: ship the wrong broken column, then recover with a forward fix that drops it and adds fixed; prove cols and history.

**`drilling/code/kata-04-forward-fix-for-a-bad-deploy/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 4: ship the wrong broken column, then recover with a forward fix that drops it and adds fixed; prove cols and history.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-04-forward-fix-for-a-bad-deploy/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k4_" [ "k4_deploy" ] // => leftovers of a killed run vanish

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k4_001_base.sql", "CREATE TABLE k4_deploy (id SERIAL PRIMARY KEY, v TEXT NOT NULL);") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k4_002_bad.sql", "ALTER TABLE k4_deploy ADD COLUMN broken INTEGER NOT NULL;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true

    let upgrader3 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "k4_003_fix.sql",
                "ALTER TABLE k4_deploy DROP COLUMN broken; ALTER TABLE k4_deploy ADD COLUMN fixed INTEGER NOT NULL DEFAULT 7;"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader3 = upgrader3.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader3.Successful // => Output: upgrade=true

    printfn
        "cols=%s"
        (System.String.Join(
            ",",
            column
                conn
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'k4_deploy' ORDER BY ordinal_position"
        )) // => Output: cols=id,v,fixed

    printfn "history=%d" (scalar conn "SELECT count(*) FROM schemaversions WHERE scriptname LIKE 'k4\_%'") // => Output: history=3
    reset conn "k4_" [ "k4_deploy" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-04-forward-fix-for-a-bad-deploy/expected/main.stdout.txt`):

```text
upgrade=true
upgrade=true
upgrade=true
cols=id,v,fixed
history=3
```

### Kata 5: Expand Migrate Contract a Rename

Task: rename handle to username across four scripts without downtime; prove names and final columns.

**`drilling/code/kata-05-expand-migrate-contract-a-rename/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 5: rename handle to username across four scripts without downtime; prove names and final columns.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-05-expand-migrate-contract-a-rename/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k5_" [ "k5_members" ] // => leftovers of a killed run vanish

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "k5_001_create_members.sql",
                "CREATE TABLE k5_members (id SERIAL PRIMARY KEY, handle TEXT NOT NULL);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true
    exec conn "INSERT INTO k5_members (handle) VALUES ('ada'), ('grace')" // => rows the rename must carry

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k5_002_expand.sql", "ALTER TABLE k5_members ADD COLUMN username TEXT;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true

    let upgrader3 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k5_003_migrate.sql", "UPDATE k5_members SET username = handle WHERE username IS NULL;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader3 = upgrader3.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader3.Successful // => Output: upgrade=true

    let upgrader4 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k5_004_contract.sql", "ALTER TABLE k5_members DROP COLUMN handle;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader4 = upgrader4.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader4.Successful // => Output: upgrade=true
    printfn "names=%s" (System.String.Join(",", column conn "SELECT username FROM k5_members ORDER BY id")) // => Output: names=ada,grace

    printfn
        "cols=%s"
        (System.String.Join(
            ",",
            column
                conn
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'k5_members' ORDER BY ordinal_position"
        )) // => Output: cols=id,username

    reset conn "k5_" [ "k5_members" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-05-expand-migrate-contract-a-rename/expected/main.stdout.txt`):

```text
upgrade=true
upgrade=true
upgrade=true
upgrade=true
names=ada,grace
cols=id,username
```

### Kata 6: Merge Two Branches Without Losing Work

Task: land Alice and Priya on the same base with distinct columns; prove merged columns and history.

**`drilling/code/kata-06-merge-two-branches-without-losing-work/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 6: land Alice and Priya on the same base with distinct columns; prove merged columns and history.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-06-merge-two-branches-without-losing-work/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k6_" [ "k6_merge" ] // => leftovers of a killed run vanish

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k6_001_base.sql", "CREATE TABLE k6_merge (id SERIAL PRIMARY KEY, a TEXT NOT NULL);") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k6_002_alice.sql", "ALTER TABLE k6_merge ADD COLUMN alice_col TEXT NOT NULL DEFAULT 'a';") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true

    let upgrader3 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k6_003_priya.sql", "ALTER TABLE k6_merge ADD COLUMN priya_col INTEGER NOT NULL DEFAULT 0;") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader3 = upgrader3.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader3.Successful // => Output: upgrade=true

    printfn
        "merged=%s"
        (System.String.Join(
            ",",
            column
                conn
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'k6_merge' ORDER BY ordinal_position"
        )) // => Output: merged=id,a,alice_col,priya_col

    printfn "history=%d" (scalar conn "SELECT count(*) FROM schemaversions WHERE scriptname LIKE 'k6\_%'") // => Output: history=3
    reset conn "k6_" [ "k6_merge" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-06-merge-two-branches-without-losing-work/expected/main.stdout.txt`):

```text
upgrade=true
upgrade=true
upgrade=true
merged=id,a,alice_col,priya_col
history=3
```

### Kata 7: Guard a Hot Table Index Build

Task: build the index concurrently under a lock timeout on ten rows; prove index and rows.

**`drilling/code/kata-07-guard-a-hot-table-index-build/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 7: build the index concurrently under a lock timeout on ten rows; prove index and rows.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-07-guard-a-hot-table-index-build/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k7_" [ "k7_hot" ] // => leftovers of a killed run vanish

    let upgrader = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k7_001_create_hot.sql", "CREATE TABLE k7_hot (id SERIAL PRIMARY KEY, v TEXT NOT NULL);") // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader = upgrader.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader.Successful // => Output: upgrade=true
    exec conn "INSERT INTO k7_hot (v) SELECT 'v' FROM generate_series(1, 10)" // => ten rows for the guarded build

    let upgrader2 = // => DbUp plans the upgrade from these scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript(
                "k7_002_guarded_idx.sql",
                "SET lock_timeout = '2s'; CREATE INDEX CONCURRENTLY k7_hot_v_idx ON k7_hot (v);"
            ) // => one ordered script per change
            .Build() // => freeze the plan before running

    let resultupgrader2 = upgrader2.PerformUpgrade() // => apply what the journal lacks
    printfn "upgrade=%b" resultupgrader2.Successful // => Output: upgrade=true

    printfn
        "guarded=%d"
        (scalar conn "SELECT count(*) FROM pg_indexes WHERE tablename = 'k7_hot' AND indexname = 'k7_hot_v_idx'") // => Output: guarded=1

    printfn "rows=%d" (scalar conn "SELECT count(*) FROM k7_hot") // => Output: rows=10
    reset conn "k7_" [ "k7_hot" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-07-guard-a-hot-table-index-build/expected/main.stdout.txt`):

```text
upgrade=true
upgrade=true
guarded=1
rows=10
```

### Kata 8: Status Gate Before Deploy

Task: check pending, upgrade, recheck cleanliness, verify columns; prove pending, ran, clean, cols.

**`drilling/code/kata-08-status-gate-before-deploy/before/Program.fs`**:

```fsharp
module App // => starter: the kata to complete lives here

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// KATA 8: check pending, upgrade, recheck cleanliness, verify columns; prove pending, ran, clean, cols.
// Run the after/ solution to see one answer, then write your own version here.
[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => replace this stub with your answer
    failwith "TODO: write the kata migrations" // => the harness never runs the starter
    0 // => unreachable: failwith raises before this line
```

**`drilling/code/kata-08-status-gate-before-deploy/after/Program.fs`**:

```fsharp
module App // => one module owns the whole unit

open DbUp // => DeployChanges entry point lives here
open Npgsql // => Npgsql verifies the migrated schema

// => The database address comes from the harness, with local-run defaults.
let connStr () = // => one builder owns every address default
    let host = // => service hostname in the unit network
        match System.Environment.GetEnvironmentVariable("PGHOST") with // => harness sets the service host
        | null
        | "" -> "localhost" // => local runs fall back to localhost
        | h -> h // => the harness value wins when present

    let port = // => service port, almost always the default
        match System.Environment.GetEnvironmentVariable("PGPORT") with // => harness sets the service port
        | null
        | "" -> "5432" // => PostgreSQL listens on 5432
        | p -> p // => the harness value wins when present

    let user = // => trust-auth role, no password needed
        match System.Environment.GetEnvironmentVariable("PGUSER") with // => harness sets the service user
        | null
        | "" -> "postgres" // => local runs use the superuser
        | u -> u // => the harness value wins when present

    let db = // => fresh database for every unit run
        match System.Environment.GetEnvironmentVariable("PGDATABASE") with // => harness sets the service database
        | null
        | "" -> "postgres" // => local runs use the default database
        | d -> d // => the harness value wins when present

    let baseStr = $"Host=%s{host};Port=%s{port};Username=%s{user};Database=%s{db}" // => trust auth needs no password

    match System.Environment.GetEnvironmentVariable("PGPASSWORD") with // => only local runs set a password
    | null
    | "" -> baseStr // => the harness uses trust auth
    | pw -> baseStr + $";Password=%s{pw}" // => local runs authenticate with it

// => One helper runs a write and ignores the count; reads print their own proof.
let exec (conn: NpgsqlConnection) (sql: string) = // => every write flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per statement
    cmd.ExecuteNonQuery() |> ignore // => row counts never reach output

// => One helper answers a single int64; counts and ids print through it.
let scalar (conn: NpgsqlConnection) (sql: string) = // => every count flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    cmd.ExecuteScalar() :?> int64 // => counts come back as int64

// => One helper lists one text column in order; histories print through it.
let column (conn: NpgsqlConnection) (sql: string) = // => every history flows through here
    use cmd = new NpgsqlCommand(sql, conn) // => fresh command per query
    use reader = cmd.ExecuteReader() // => forward-only reads stay simple

    [ while reader.Read() do
          reader.GetString(0) ] // => one string per row, in query order

// => DbUp journals under this table; units reset only their own rows.
let journalExists (conn: NpgsqlConnection) = // => first runs have no journal yet
    scalar conn "SELECT count(*) FROM information_schema.tables WHERE table_name = 'schemaversions'" = 1L // => one row means DbUp ran here before

// => Every unit starts clean and ends clean, so reruns print alike.
let reset (conn: NpgsqlConnection) (prefix: string) (tables: string list) = // => one reset owns every leftover
    for t in tables do
        exec conn $"DROP TABLE IF EXISTS %s{t} CASCADE" // => a killed run never poisons the rerun

    if journalExists conn then // => the journal may not exist on the first run
        exec conn $"DELETE FROM schemaversions WHERE scriptname LIKE '%s{prefix}%%'" // => only this unit's rows vanish

[<EntryPoint>] // => the harness runs the compiled assembly
let main _ = // => every unit answers zero on success
    use conn = new NpgsqlConnection(connStr ()) // => one session per unit run
    conn.Open() // => fail fast when the service is unreachable
    reset conn "k8_" [ "k8_gate" ] // => leftovers of a killed run vanish

    let plan = // => the status gate around two scripts
        DeployChanges.To // => the fluent entry point
            .PostgresqlDatabase(connStr ()) // => the harness database, trust auth
            .WithScript("k8_001_gate.sql", "CREATE TABLE k8_gate (id SERIAL PRIMARY KEY, a TEXT NOT NULL);") // => base
            .WithScript("k8_002_gate.sql", "ALTER TABLE k8_gate ADD COLUMN b TEXT NOT NULL DEFAULT 'g';") // => follow-up
            .Build() // => freeze the gated plan

    printfn "pending=%d" (plan.GetScriptsToExecute() |> Seq.length) // => Output: pending=2
    printfn "ran=%b" (plan.PerformUpgrade().Successful) // => Output: ran=true
    printfn "clean=%b" (not (plan.IsUpgradeRequired())) // => Output: clean=true
    printfn "cols=%d" (scalar conn "SELECT count(*) FROM information_schema.columns WHERE table_name = 'k8_gate'") // => Output: cols=3
    reset conn "k8_" [ "k8_gate" ] // => leftovers of a killed run vanish
    0 // => zero exit means the transcript matched
```

**Output** (`drilling/code/kata-08-status-gate-before-deploy/expected/main.stdout.txt`):

```text
pending=2
ran=true
clean=true
cols=3
```

## Self-check checklist

- [ ] (co-01) I can write a versioned DbUp script whose name carries version plus intent.
- [ ] (co-01) I can order scripts so registration sequence matches dependency order.
- [ ] (co-02) I can write a forward step and its compensating migration.
- [ ] (co-02) I can recover a bad deploy by shipping the fix forward.
- [ ] (co-03) I can read schemaversions and report a database position from it.
- [ ] (co-03) I can list pending scripts with GetScriptsToExecute before upgrading.
- [ ] (co-04) I can keep history linear across parallel branches.
- [ ] (co-04) I can renumber a branch onto head after a version collision.
- [ ] (co-05) I can make any script safe to rerun with journal skips and guards.
- [ ] (co-06) I can split a schema change from its backfill into separate scripts.
- [ ] (co-06) I can verify a backfill with counts plus a golden query.
- [ ] (co-07) I can expand, migrate, and contract a rename across deploys.
- [ ] (co-08) I can compensate a shipped change without touching unrelated data.
- [ ] (co-08) I can state what a compensation restores and what needs a backup.
- [ ] (co-09) I can detect drift by comparing journal to catalog.
- [ ] (co-09) I can converge drift with a compensating migration.
- [ ] (co-10) I can baseline a legacy database without losing a row.
- [ ] (co-10) I can extend adopted history with normal migrations.
- [ ] (co-11) I can explain why applied scripts must never be edited.
- [ ] (co-12) I can choose per script whether WithTransaction applies.
- [ ] (co-13) I can promote identical scripts across environments and verify.
- [ ] (co-14) I can resolve a branch collision by renumbering.
- [ ] (co-15) I can measure and shrink a migration lock with pg_locks.
- [ ] (co-16) I can gate a deploy with status checks before and after.

## Elaborative interrogation & self-explanation

Each prompt names a design choice and a rejected alternative. Argue both sides in writing before reading the model answer; the answer you cannot steelman is the concept you have not learned.

### Prompt 1: Why forward-only history instead of down migrations?

<details><summary>Answer</summary>

Rejected alternative: symmetric up/down steps like older tools carry. Down steps rot because they are written optimistically and tested never — production never runs the exact downgrade path the author imagined. Forward-only history admits this: every recovery is a new migration, reviewed and tested like any other. The journal stays append-only, audits stay simple, and recoveries work because they use the same machinery as deploys.

**In short**: Down migrations promise reversibility and deliver untested scripts. Compensations promise nothing and deliver reviewed, tested, journaled recovery.

</details>

### Prompt 2: Why name-based journaling instead of content hashing in the tool?

<details><summary>Answer</summary>

Rejected alternative: the runner hashes every script and refuses edited content. Hashing inside the tool would conflate two jobs — ordering work and policing edits — and force every legitimate workflow through its checksum policy. Name journaling keeps the runner small and predictable; pipelines add checksums where their policy lives. The course demonstrates both layers so the boundary is explicit rather than surprising.

**In short**: Tool-level hashing would bloat the runner and fight legitimate workflows. Names order, pipelines police.

</details>

### Prompt 3: Why separate scripts instead of one migration per deploy?

<details><summary>Answer</summary>

Rejected alternative: bundling a deploy's changes into one script for tidiness. Bundles fail atomically or not at all, hide the risky step inside the safe ones, and cannot be partially rolled back when step three of five goes wrong. Separate scripts journal separately, review separately, and compensate separately. The deploy groups them; the history keeps them distinct.

**In short**: Bundles hide risk and block partial recovery. Separate scripts keep every step reviewable and reversible.

</details>

### Prompt 4: Why baseline markers that change nothing instead of generated base migrations?

<details><summary>Answer</summary>

Rejected alternative: generating a create-everything script from the legacy schema. Generated bases drift from reality the moment they are written — defaults, extensions, and ownership rarely round-trip — and applying them to the legacy database itself fails on conflicts. A no-op marker adopts reality instead of redescribing it. The database is the base; the marker only says where history starts.

**In short**: Generated bases redescribe reality badly and conflict on apply. Markers adopt reality untouched.

</details>

### Prompt 5: Why short transactions instead of one transaction per deploy?

<details><summary>Answer</summary>

Rejected alternative: wrapping the whole deploy for all-or-nothing safety. Long transactions hold locks across every step, block traffic for the deploy's full duration, and roll back good work with the bad. Short per-script transactions fail small, release fast, and journal honestly. Atomicity belongs at the step level, where the blast radius fits in one review.

**In short**: Deploy-wide transactions lock long and roll back good with bad. Step transactions fail small and release fast.

</details>

### Prompt 6: Why verify with queries instead of trusting green runs?

<details><summary>Answer</summary>

Rejected alternative: treating a successful upgrade as proof the database is right. Green means the tool finished, not that the schema matches, the data filled, or the right scripts ran — silent skips and out-of-band drift both report success. Queries read reality back: counts, columns, journals, locks. Trust the transcript only when it names what it verified.

**In short**: Green means the tool finished, not that the database is right. Queries verify; exit codes merely report.

</details>
