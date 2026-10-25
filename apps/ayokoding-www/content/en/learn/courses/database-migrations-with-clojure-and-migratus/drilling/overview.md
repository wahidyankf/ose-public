---
title: "Overview"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

Answer each question from memory before opening its answer block: say the answer aloud in one or two sentences, then check. The questions follow the course order — files and history first, data and safety next, teams and failure last — so a missed question points at the level worth reworking.

### Q1 (co-01): What three parts make a migration file pair, and which one orders history?

<details><summary>Answer</summary>

A numeric id, a human name, and the up/down SQL bodies. The id fixes the position in history while the name tells reviewers what the change does: `20260101000101-create-books.up.sql` runs on the way up and the matching `.down.sql` runs on the way down. Migratus sorts pending files by id and journals each applied id, so history order comes from ids and the tool refuses nothing that ids already order.

**In short**: The id orders history, the name explains it, and the bodies execute it. Review the name, trust the id, test both bodies.

</details>

### Q2 (co-01): Why must migration ids be fixed strings instead of clock stamps?

<details><summary>Answer</summary>

Fixed ids survive review, merge, and rerun; generated stamps encode wall-clock time that no reviewer can reason about. A stamp says when a file was created, which answers nothing about what it changes or where it belongs. Fixed sequential ids place every migration in a shared, reviewable order that two developers can agree on without meeting. Stamps also break determinism: regenerating the history produces different names, so transcripts can never match twice.

**In short**: Fixed ids are reviewable, mergeable, and repeatable. Stamps answer when instead of what, and when is the one thing history must not depend on.

</details>

### Q3 (co-02): What belongs in an up file, and what must the down file mirror?

<details><summary>Answer</summary>

The up file carries the change; the down file carries its reversal in reverse order. Multi-statement files separate statements with a `--;;` line, because Migratus sends each statement to the driver separately. The down file mirrors the up file step for step in reverse: indexes drop before the tables they belong to, dependents clear before parents, so each step undoes exactly one forward step inside the same per-migration transaction the up file enjoyed.

**In short**: Up states the change, down undoes it backwards. Mirror every step, reverse the order, and test the reversal before the deploy needs it.

</details>

### Q4 (co-02): Why do forward fixes beat history edits for recovery?

<details><summary>Answer</summary>

Edits to applied files never rerun: the journal already holds the id, so the runner skips the file silently and the fix never reaches the database. A forward fix is a new migration with a new id, which the runner applies, journals, and verifies like any other change. History stays append-only, audits stay simple, and recoveries work because they use the same machinery as deploys instead of fighting it.

**In short**: Applied files are frozen by the journal. Ship recovery forward as a new migration, never backward as an edit.

</details>

### Q5 (co-03): What does the journal store, and who writes it?

<details><summary>Answer</summary>

One row per applied migration: the numeric id, the applied timestamp, the description name, and a checksum column that stays empty for regular files. Migratus writes the row itself when a migration commits, and reserves id `-1` for its own locking. Nobody hand-edits the journal in normal operation: the runner owns it, readers query it, and the reserve row serializes concurrent runners.

**In short**: The journal is the database remembering itself. Migratus writes id, time, name, and an empty checksum; readers trust rows, never rumors.

</details>

### Q6 (co-03): How do applied and pending differ as diagnostics?

<details><summary>Answer</summary>

Applied names say where the database stands; pending names say what the next run will do. Read applied from history in id order and pending from the directory minus history, and the pair positions every investigation: an empty pending list means clean, a growing one means the merge or the deploy is behind. Status first, action second — diagnose from the journal before touching the files.

**In short**: Applied is position, pending is intention. Read both before every deploy, and gate on pending being empty.

</details>

### Q7 (co-04): What creates a fork in history, and what does it block?

<details><summary>Answer</summary>

Two files sharing one id: two branches that each minted the next number without seeing each other. Discovery finds the duplicate and the run refuses before applying anything, which freezes the deploy instead of guessing. The freeze is the feature: a guessed order would journal one branch's work under the other's number and lie forever.

**In short**: Shared ids fork history and freeze the run. Renumber the newcomer onto head; never force the order.

</details>

### Q8 (co-05): What makes a migration rerunnable, and what breaks reruns?

<details><summary>Answer</summary>

Guards make reruns safe: `IF NOT EXISTS` on creates, `WHERE` clauses on updates, `ON CONFLICT DO NOTHING` on seeds. Bare `CREATE TABLE` breaks on the second run, and unguarded inserts duplicate rows. The journal skips applied ids, but reruns still happen — killed runs, retried deploys, rebuilt environments — so every migration earns its guards before it ships.

**In short**: Guards make reruns boring. The journal skips what ran; guards survive what did not finish.

</details>

### Q9 (co-06): Why must the backfill run after the schema change, in its own migration?

<details><summary>Answer</summary>

The column must exist before rows can fill it, and the fill must be reviewable apart from the shape change. Bundling them hides the data step inside the schema step: a failed fill then blocks the shape, and a shape rollback destroys the fill's work. Separate migrations let the schema land, the data follow, and each be verified and reversed on its own terms.

**In short**: Shape first, data second, one migration each. Separation keeps failures small and reversals honest.

</details>

### Q10 (co-06): How do you verify a backfill worked?

<details><summary>Answer</summary>

Count both sides and read the rows: the migrated count must equal the source count, and a golden query must show the filled values beside their keys. Counts catch missing rows, value queries catch wrong fills, and ordering by id keeps the transcript stable. A backfill without a verification query is a rumor; the query is the receipt.

**In short**: Counts prove completeness, value queries prove correctness. Keep both in the transcript.

</details>

### Q11 (co-07): What are the expand, migrate, and contract stops, and what runs between them?

<details><summary>Answer</summary>

Expand adds the new shape beside the old (nullable column, spare table); migrate moves reads and writes onto the new shape across deploys; contract drops the old shape once nothing references it. Application code ships between each pair: expand ships with old code, migrate ships the cutover, contract ships after the old readers are gone. Each stop is its own migration, each deploy is green, and no flag day ever arrives.

**In short**: Add beside, move across, drop behind. Ship code between stops so every deploy stays green.

</details>

### Q12 (co-07): Why does the new column start nullable?

<details><summary>Answer</summary>

Because existing rows have no value for it yet, and a `NOT NULL` column with no default would fail the deploy on the first old row. Nullable lands without disturbing traffic; the backfill fills values; the constraint lands later once data complies. Strictness is a destination, not a departure: each stop stays deployable because it asks only what the data can already give.

**In short**: Nullable lands, backfill fills, constraints follow. Strictness arrives last, never first.

</details>

### Q13 (co-08): What does a rollback undo, and what can it not restore?

<details><summary>Answer</summary>

Rollback runs the down file: it reverses schema steps and compensates data steps exactly as written. It cannot restore what the down file does not recreate — dropped columns lose their values, deleted rows stay deleted, contracted renames forget the old shape. Irreversible steps need backups taken before the deploy, not regrets after it.

**In short**: Rollback undoes steps, not time. The down file restores shapes; only a backup restores data.

</details>

### Q14 (co-08): Which unrelated things survive a rollback, and why does that matter?

<details><summary>Answer</summary>

Everything outside the down file: sibling tables, other migrations' rows, later history entries rolled back first in order. Survival is the point — a rollback is surgery, not amnesia. State what the reversal touches and prove the neighbors intact, because the deploy after the rollback inherits whatever the rollback left behind.

**In short**: Rollbacks are scoped, not global. Verify the neighbors survived before shipping the next change.

</details>

### Q15 (co-09): What is schema drift, and which two comparisons reveal it?

<details><summary>Answer</summary>

Drift is the database disagreeing with its history: objects changed outside migrations. Compare history to the directory (journaled but file missing, or file present but never applied) and history to the catalog (journaled table dropped, unjournaled table created). The first comparison catches file drift, the second catches database drift; together they leave nowhere for silent change to hide.

**In short**: Drift is history disagreeing with reality. Diff journal against files and catalog on a schedule.

</details>

### Q16 (co-09): History names a migration but its table is missing: what happened, and how do you recover?

<details><summary>Answer</summary>

Something dropped the table outside migrations — manual cleanup, a failed deploy, or a down file run by hand. The journal still claims the id, so rerunning skips it and the table stays missing. Recover forward: a new migration recreates the table (guarded with `IF NOT EXISTS`), the journal records the fix, and the drift report goes quiet. Never delete the journal row to fix a missing object.

**In short**: Missing object, present journal row means out-of-band change. Recreate forward, never erase history.

</details>

### Q17 (co-10): When do you baseline instead of migrating from zero?

<details><summary>Answer</summary>

When the database already exists with live data: acquisitions, legacy systems, teams adopting Migratus mid-life. Migrating from zero would replay creates against existing tables and fail on the first clash — or worse, drop and recreate and destroy data. Baselining claims the matching ids as applied without running their SQL, so the first real migration lands on top of production as it is.

**In short**: Baseline living databases, migrate empty ones. The claim must match reality row for row.

</details>

### Q18 (co-10): Why does the baseline claim change nothing, and why is that the point?

<details><summary>Answer</summary>

The tables and data already exist, so running their SQL would clash or destroy. The claim only inserts journal rows, changing history without touching the database — and that restraint is the whole job. A baseline that changed data would be a migration wearing a disguise; an honest claim lets verification prove the data survived untouched.

**In short**: Claims change history, never data. The untouched rows are the proof the baseline worked.

</details>

### Q19 (co-11): Migratus never checksums regular rows: what breaks when an applied file is edited?

<details><summary>Answer</summary>

Nothing visibly: the journal already holds the id, so the rerun skips the edited file silently and the database keeps the old shape. The deploy is green, the column is missing, and nobody is paged. Repeatable files opt into checksums per file and fail loudly on edits, but regular files trade detection for simplicity — so the discipline is procedural: never edit applied files, route every fix through a new migration.

**In short**: Edited regular files rerun as silence. Checksums are opt-in per file; discipline covers the rest.

</details>

### Q20 (co-12): Which migrations must run inside a transaction, and which must not?

<details><summary>Answer</summary>

Ordinary DDL runs wrapped: one migration, one transaction, all-or-nothing per file. Concurrent index builds must not: PostgreSQL refuses `CONCURRENTLY` inside a transaction block, so those files open with `-- :disable-transaction` and accept statement-level atomicity instead. Statement timeouts and lock timeouts bound the unwrapped work, because outside a transaction every statement commits on its own.

**In short**: Wrap by default, unwrap for CONCURRENTLY. The directive names the exception; timeouts bound it.

</details>

### Q21 (co-13): Why must every environment run identical files in identical order?

<details><summary>Answer</summary>

Because history is positional: the journal records ids, and an id means the same change everywhere only if the files match. A hotfixed production file or a skipped staging file forks the meaning of every later id. Promote the directory as a unit — dev, staging, and production run the same files in the same order, and the completed lists match id for id.

**In short**: Same files, same order, every environment. The directory promotes as a unit or not at all.

</details>

### Q22 (co-14): Two branches share one id: who moves, and what stays frozen?

<details><summary>Answer</summary>

The newcomer moves and applied history stays frozen. Renumber the unapplied branch file onto head, keep its content identical, and let pending name the arrivals in order. Never renumber applied files: the journal already recorded the old id, and editing history rewrites every audit that trusted it.

**In short**: Newcomers renumber, history never does. Pending previews the merge; ids sort the work.

</details>

### Q23 (co-15): What lock does DDL take, and how do you shrink its blast radius?

<details><summary>Answer</summary>

Most DDL takes `AccessExclusiveLock`, which blocks reads and writes for the statement's duration. Shrink the window: single-statement migrations, indexes built `CONCURRENTLY`, `lock_timeout` that fails fast instead of queueing, and heavy backfills batched with pauses. Measure with `pg_locks` before optimizing, because the lock you assume is rarely the lock you hold.

**In short**: DDL locks everything briefly. Short statements, concurrent builds, and timeouts keep briefly true.

</details>

### Q24 (co-16): What does migration testing assert that example outputs do not?

<details><summary>Answer</summary>

Policy, not just effect: gates that read pending before the deploy and counts after it, checks that fail the pipeline rather than printing a transcript. Example outputs prove one run on one database; migration tests prove every run on every database by asserting position, completeness, and shape as conditions. Verification queries graduate from illustration to enforcement when they run in the pipeline with a non-zero exit on red.

**In short**: Examples show, tests enforce. Gate on pending, assert on catalog, fail the pipeline on red.

</details>

## Applied problems

Work each on paper before touching a terminal: name the files, their versions, and the verification query. Then build the files and run them — the terminal is the grader, not the draft.

### Problem 1: Split the rename

The `members` table has `handle TEXT NOT NULL` with 40,000 rows, and the application must read `username` by Friday with zero downtime. Name the three migrations (fixed ids), state what application code ships between each pair, and write the verification query proving every username equals its old handle.

### Problem 2: Harden the column

`orders.email` is nullable with 2 million rows, 3 percent null. New policy: every order has an email. Name the migrations that end with a `NOT NULL` constraint, decide the default-versus-backfill question for the null 3 percent, and state which migration is safe to roll back and which step is one-way.

### Problem 3: Widen without locking

`events.seq` is `INTEGER` approaching 2 billion and must become `BIGINT` while ingestion continues. Sketch the expand-migrate-contract stops for a type change, name the lock each stop avoids, and explain why the naive single `ALTER COLUMN` is the wrong answer under load.

### Problem 4: Merge the branches

You added id `...602` (an index on `orders.status`); a teammate added `...602` (a `shipped_at` column). Both branched from `...601`. Write the renumbering, and state the exact apply-plus-verification sequence that proves both changes present and history linear.

### Problem 5: Guard the hot table

`checkouts` takes 8,000 writes per second and needs a new `coupon` column plus an index. Choose single-purpose migrations versus one combined file, place the `CONCURRENTLY` build and the `lock_timeout`, and explain what breaks if the index builds inside a migration transaction.

### Problem 6: Diagnose the partial run

Deploy stopped mid-history: the journal shows two applied migrations, but `orders.total` is missing. Reconstruct the two possible causes (failed statement inside the third migration versus the third migration never running), and give the ordered queries that distinguish them and recover safely.

### Problem 7: Diagnose the silent skip

The deploy is green but the new column is missing. The journal holds the migration name. Reconstruct how an edited-and-rerun file produces exactly this state, and give the repeatable-file checksum procedure that would have caught it plus the compensating migration that fixes it now.

### Problem 8: Baseline the acquisition

You inherit a database with 40 hand-built tables and live data, and no migration history. Plan the adoption: what the baseline claim contains, what the first three real migrations verify, and which drift check runs on a schedule afterward.

## Code katas

Each kata ships a `before/` starter to fix and an `after/` reference solution that runs green. Work the starter first, then compare against the reference line by line.

### Kata 1: Write a Migration and Its Rollback

Task: Task: create k01_posts with a title, add a subtitle column, then compensate by dropping it; prove cols and history.

**`drilling/code/kata-01-write-a-migration-and-its-rollback/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 1.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-01-write-a-migration-and-its-rollback/after/main.clj`**:

```clojure
;; => Kata: Write a Migration and Its Rollback.
;; => Create a table, extend it, then compensate: the down file proves itself.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k01_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k01_migrations" ["k01_posts"] []) ;; => leftovers of a killed run vanish first
(write-migration "mig" "20260202000101" "create-posts" ;; => posts start with a title
  "CREATE TABLE k01_posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL);\n" ;; => forward change creates the table
  "DROP TABLE k01_posts;\n") ;; => reverse drops the table again
(write-migration "mig" "20260202000102" "add-subtitle" ;; => subtitle arrives second
  "ALTER TABLE k01_posts ADD COLUMN subtitle TEXT;\n" ;; => forward change adds the column
  "ALTER TABLE k01_posts DROP COLUMN subtitle;\n") ;; => reverse drops the column
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k01_migrations"))) ;; => id order straight from history
(println "columns:" (pr-str (table-columns ds "k01_posts"))) ;; => catalog proves both columns
(println "rollback:" (pr-str (migratus/rollback cfg))) ;; => one step back removes the subtitle
(println "completed:" (pr-str (applied-names ds "k01_migrations"))) ;; => id order straight from history
(println "columns:" (pr-str (table-columns ds "k01_posts"))) ;; => catalog proves the subtitle is gone
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k01_migrations" ["k01_posts"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-01-write-a-migration-and-its-rollback/expected/main.stdout.txt`):

```text
migrate: nil
completed: ["create-posts" "add-subtitle"]
columns: ["id" "title" "subtitle"]
rollback: nil
completed: ["create-posts"]
columns: ["id" "title"]
```

### Kata 2: Add a Backfill Step to an Existing Migration

Task: Task: add a nullable age column to seeded k02_users, then backfill it from known values; prove ages and completeness.

**`drilling/code/kata-02-add-a-backfill-step-to-an-existing-migration/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 2.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-02-add-a-backfill-step-to-an-existing-migration/after/main.clj`**:

```clojure
;; => Kata: Add a Backfill Step to an Existing Migration.
;; => Seeded rows predate the new column: a data migration fills the gap.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k02_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k02_migrations" ["k02_users"] []) ;; => leftovers of a killed run vanish first
(write-migration "mig" "20260202000201" "create-users" ;; => users start with a name
  "CREATE TABLE k02_users (id SERIAL PRIMARY KEY, name TEXT NOT NULL);\n" ;; => forward change creates the table
  "DROP TABLE k02_users;\n") ;; => reverse drops the table again
(write-migration "mig" "20260202000202" "seed-users" ;; => two rows predate the new column
  "INSERT INTO k02_users (name) VALUES ('ana'), ('budi');\n" ;; => seed rows land without ages
  "DELETE FROM k02_users;\n") ;; => reverse clears every seeded row
(write-migration "mig" "20260202000203" "add-age" ;; => the new column arrives nullable
  "ALTER TABLE k02_users ADD COLUMN age INTEGER;\n" ;; => forward change adds the column
  "ALTER TABLE k02_users DROP COLUMN age;\n") ;; => reverse drops the column
(write-migration "mig" "20260202000204" "backfill-ages" ;; => existing rows gain ages
  (str "UPDATE k02_users SET age = 30 WHERE name = 'ana';\n" ;; => ana gets thirty
       "--;;\n" ;; => separator splits the two statements
       "UPDATE k02_users SET age = 25 WHERE name = 'budi';\n") ;; => budi gets twenty-five
  "UPDATE k02_users SET age = NULL;\n") ;; => reverse clears every age
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k02_migrations"))) ;; => id order straight from history
(println "ages:" (pr-str (mapv (juxt :name :age) ;; => name and age pair per row
  (jdbc/execute! ds ["SELECT name, age FROM k02_users ORDER BY name"] ;; => ordered names keep the pairs stable (part 1)
                   {:builder-fn rs/as-unqualified-lower-maps})))) ;; => ordered names keep the pairs stable (part 2)
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k02_migrations" ["k02_users"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-02-add-a-backfill-step-to-an-existing-migration/expected/main.stdout.txt`):

```text
migrate: nil
completed: ["create-users" "seed-users" "add-age" "backfill-ages"]
ages: [["ana" 30] ["budi" 25]]
```

### Kata 3: Baseline an Existing Database Without Losing Data

Task: Task: adopt a pre-existing k03_legacy table with its WIDGET row intact by baselining; prove the data and the history.

**`drilling/code/kata-03-baseline-an-existing-database-without-losing-data/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 3.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-03-baseline-an-existing-database-without-losing-data/after/main.clj`**:

```clojure
;; => Kata: Baseline an Existing Database Without Losing Data.
;; => Production predates Migratus: claim its state, then migrate on top.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k03_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k03_migrations" ["k03_legacy"] []) ;; => leftovers of a killed run vanish first
(jdbc/execute! ds ["CREATE TABLE k03_legacy (id SERIAL PRIMARY KEY, code TEXT NOT NULL)"]) ;; => production table predates Migratus
(jdbc/execute! ds ["INSERT INTO k03_legacy (code) VALUES ('WIDGET')"]) ;; => one legacy row lives there
(write-migration "mig" "20260202000301" "create-legacy" ;; => the matching migration describes that table
  "CREATE TABLE k03_legacy (id SERIAL PRIMARY KEY, code TEXT NOT NULL);\n" ;; => plain create would clash now
  "DROP TABLE IF EXISTS k03_legacy;\n") ;; => reverse drops the legacy table
(println "claim:" (pr-str (try (migratus/migrate cfg) ;; => the clash proves production came first
  (catch Exception e (str "threw: " (.getMessage e)))))) ;; => the driver names the existing table
(jdbc/execute! ds ["INSERT INTO k03_migrations (id, applied, description) VALUES (20260202000301, CURRENT_TIMESTAMP, 'create-legacy')"]) ;; => baseline claims the id as applied
(write-migration "mig" "20260202000302" "add-note" ;; => the first real migration lands on top
  "ALTER TABLE k03_legacy ADD COLUMN note TEXT;\n" ;; => forward change adds the column
  "ALTER TABLE k03_legacy DROP COLUMN note;\n") ;; => reverse drops the column
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k03_migrations"))) ;; => id order straight from history
(println "codes:" (pr-str (mapv (juxt :code) ;; => the legacy row survives the claim
  (jdbc/execute! ds ["SELECT code FROM k03_legacy ORDER BY id"] ;; => ordered ids keep the survivor stable (part 1)
                   {:builder-fn rs/as-unqualified-lower-maps})))) ;; => ordered ids keep the survivor stable (part 2)
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k03_migrations" ["k03_legacy"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-03-baseline-an-existing-database-without-losing-data/expected/main.stdout.txt`):

```text
claim: "threw: ERROR: current transaction is aborted, commands ignored until end of transaction block"
migrate: nil
completed: ["create-legacy" "add-note"]
codes: [["WIDGET"]]
```

### Kata 4: Forward Fix for a Bad Deploy

Task: Task: repair a wrongly deployed k04_accounts balance with a forward-fix migration; prove the damage and the repair.

**`drilling/code/kata-04-forward-fix-for-a-bad-deploy/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 4.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-04-forward-fix-for-a-bad-deploy/after/main.clj`**:

```clojure
;; => Kata: Forward Fix for a Bad Deploy.
;; => A deployed value is wrong: repair it with a new migration, never an edit.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k04_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k04_migrations" ["k04_accounts"] []) ;; => leftovers of a killed run vanish first
(write-migration "mig" "20260202000401" "create-accounts" ;; => accounts start with an owner
  "CREATE TABLE k04_accounts (id SERIAL PRIMARY KEY, owner TEXT NOT NULL, balance INTEGER NOT NULL DEFAULT 0);\n" ;; => forward change creates the table
  "DROP TABLE k04_accounts;\n") ;; => reverse drops the table again
(write-migration "mig" "20260202000402" "seed-accounts" ;; => two balances open the ledger
  "INSERT INTO k04_accounts (owner, balance) VALUES ('sari', 100), ('tono', 50);\n" ;; => seed rows land funded
  "DELETE FROM k04_accounts;\n") ;; => reverse clears every seeded row
(write-migration "mig" "20260202000403" "grant-bonus" ;; => the bonus ships with a wrong amount
  "UPDATE k04_accounts SET balance = 9999 WHERE owner = 'sari';\n" ;; => sari gains far too much
  "UPDATE k04_accounts SET balance = 100 WHERE owner = 'sari';\n") ;; => reverse restores the old balance
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k04_migrations"))) ;; => id order straight from history
(println "balances:" (pr-str (mapv (juxt :owner :balance) ;; => the bad deploy shows in the data
  (jdbc/execute! ds ["SELECT owner, balance FROM k04_accounts ORDER BY owner"] ;; => ordered owners keep the damage stable (part 1)
                   {:builder-fn rs/as-unqualified-lower-maps})))) ;; => ordered owners keep the damage stable (part 2)
(write-migration "mig" "20260202000404" "fix-bonus" ;; => a new migration repairs the value
  "UPDATE k04_accounts SET balance = 100 WHERE owner = 'sari' AND balance = 9999;\n" ;; => the fix targets only the damage
  "UPDATE k04_accounts SET balance = 9999 WHERE owner = 'sari';\n") ;; => reverse would reapply the damage
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k04_migrations"))) ;; => id order straight from history
(println "balances:" (pr-str (mapv (juxt :owner :balance) ;; => the fix converges on funded
  (jdbc/execute! ds ["SELECT owner, balance FROM k04_accounts ORDER BY owner"] ;; => ordered owners keep the repair stable (part 1)
                   {:builder-fn rs/as-unqualified-lower-maps})))) ;; => ordered owners keep the repair stable (part 2)
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k04_migrations" ["k04_accounts"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-04-forward-fix-for-a-bad-deploy/expected/main.stdout.txt`):

```text
migrate: nil
completed: ["create-accounts" "seed-accounts" "grant-bonus"]
balances: [["sari" 9999] ["tono" 50]]
migrate: nil
completed: ["create-accounts" "seed-accounts" "grant-bonus" "fix-bonus"]
balances: [["sari" 100] ["tono" 50]]
```

### Kata 5: Expand Migrate Contract a Rename

Task: Task: rename handle to username on k05_members in three zero-downtime steps; prove columns and surviving values.

**`drilling/code/kata-05-expand-migrate-contract-a-rename/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 5.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-05-expand-migrate-contract-a-rename/after/main.clj`**:

```clojure
;; => Kata: Expand Migrate Contract a Rename.
;; => Rename without downtime: add, backfill, then drop the old name.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k05_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k05_migrations" ["k05_members"] []) ;; => leftovers of a killed run vanish first
(write-migration "mig" "20260202000501" "create-members" ;; => members start with a handle
  (str "CREATE TABLE k05_members (id SERIAL PRIMARY KEY, handle TEXT NOT NULL);\n" ;; => forward change creates the table
       "--;;\n" ;; => separator splits create from seed
       "INSERT INTO k05_members (handle) VALUES ('agus'), ('rina');\n") ;; => two handles seed the rename
  "DELETE FROM k05_members;\n") ;; => reverse clears every seeded row
(write-migration "mig" "20260202000502" "expand-add-username" ;; => expand keeps both names live
  (str "ALTER TABLE k05_members ADD COLUMN username TEXT;\n" ;; => new column arrives nullable
       "--;;\n" ;; => separator splits the two statements
       "UPDATE k05_members SET username = handle WHERE username IS NULL;\n") ;; => old values copy across
  "ALTER TABLE k05_members DROP COLUMN username;\n") ;; => reverse drops the new column
(write-migration "mig" "20260202000503" "contract-drop-handle" ;; => contract retires the old name
  "ALTER TABLE k05_members DROP COLUMN handle;\n" ;; => forward change drops the old column
  "ALTER TABLE k05_members ADD COLUMN handle TEXT;\n") ;; => reverse re-adds the old name
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k05_migrations"))) ;; => id order straight from history
(println "columns:" (pr-str (table-columns ds "k05_members"))) ;; => catalog proves the rename landed
(println "usernames:" (pr-str (mapv (juxt :username) ;; => every handle survived the rename
  (jdbc/execute! ds ["SELECT username FROM k05_members ORDER BY id"] ;; => ordered ids keep the survivors stable (part 1)
                   {:builder-fn rs/as-unqualified-lower-maps})))) ;; => ordered ids keep the survivors stable (part 2)
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k05_migrations" ["k05_members"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-05-expand-migrate-contract-a-rename/expected/main.stdout.txt`):

```text
migrate: nil
completed: ["create-members" "expand-add-username" "contract-drop-handle"]
columns: ["id" "username"]
usernames: [["agus"] ["rina"]]
```

### Kata 6: Merge Two Branches Without Losing Work

Task: Task: deploy k06_alpha, then merge a branch adding two tables; prove pending names the arrivals and history absorbs them.

**`drilling/code/kata-06-merge-two-branches-without-losing-work/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 6.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-06-merge-two-branches-without-losing-work/after/main.clj`**:

```clojure
;; => Kata: Merge Two Branches Without Losing Work.
;; => A branch merges after a deploy: ids sort the late arrival into place.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k06_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k06_migrations" ["k06_alpha" "k06_beta" "k06_gamma"] []) ;; => leftovers of a killed run vanish first
(write-migration "mig" "20260202000601" "create-alpha" ;; => alpha deploys first alone
  "CREATE TABLE k06_alpha (id SERIAL PRIMARY KEY);\n" ;; => forward change creates the first table
  "DROP TABLE k06_alpha;\n") ;; => reverse drops the first table
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k06_migrations"))) ;; => id order straight from history
(write-migration "mig" "20260202000602" "create-beta" ;; => the merged branch arrives second
  "CREATE TABLE k06_beta (id SERIAL PRIMARY KEY);\n" ;; => forward change creates the second table
  "DROP TABLE k06_beta;\n") ;; => reverse drops the second table
(write-migration "mig" "20260202000603" "create-gamma" ;; => the merged branch keeps going
  "CREATE TABLE k06_gamma (id SERIAL PRIMARY KEY);\n" ;; => forward change creates the third table
  "DROP TABLE k06_gamma;\n") ;; => reverse drops the third table
(println "pending:" (pr-str (sort (migratus/pending-list cfg)))) ;; => pending names what remains
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k06_migrations"))) ;; => id order straight from history
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k06_migrations" ["k06_alpha" "k06_beta" "k06_gamma"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-06-merge-two-branches-without-losing-work/expected/main.stdout.txt`):

```text
migrate: nil
completed: ["create-alpha"]
pending: ("create-beta" "create-gamma")
migrate: nil
completed: ["create-alpha" "create-beta" "create-gamma"]
```

### Kata 7: Guard a Hot Table Index Build

Task: Task: index k07_events without locking writers by building concurrently; prove the index exists and stays valid.

**`drilling/code/kata-07-guard-a-hot-table-index-build/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 7.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-07-guard-a-hot-table-index-build/after/main.clj`**:

```clojure
;; => Kata: Guard a Hot Table Index Build.
;; => Lookups need an index, but the table stays hot: build concurrently.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k07_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k07_migrations" ["k07_events"] []) ;; => leftovers of a killed run vanish first
(write-migration "mig" "20260202000701" "create-events" ;; => events start with a kind
  (str "CREATE TABLE k07_events (id SERIAL PRIMARY KEY, kind TEXT NOT NULL);\n" ;; => forward change creates the table
       "--;;\n" ;; => separator splits create from seed
       "INSERT INTO k07_events (kind) VALUES ('click'), ('view');\n") ;; => two events keep the table warm
  "DELETE FROM k07_events;\n") ;; => reverse clears every seeded row
(write-migration "mig" "20260202000702" "index-kind" ;; => the hot table gets a light index
  (str "-- :disable-transaction\n" ;; => concurrent builds refuse transactions
       "CREATE INDEX CONCURRENTLY k07_events_kind_idx ON k07_events (kind);\n") ;; => build takes a light lock
  (str "-- :disable-transaction\n" ;; => down runs outside a transaction too
       "DROP INDEX CONCURRENTLY IF EXISTS k07_events_kind_idx;\n")) ;; => reverse drops the index
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k07_migrations"))) ;; => id order straight from history
(println "indexes:" (pr-str (mapv :indexname ;; => index present and queryable
  (jdbc/execute! ds ["SELECT indexname AS indexname FROM pg_indexes WHERE tablename = 'k07_events' AND indexname = 'k07_events_kind_idx'"] ;; => concurrent build finished (part 1)
                   {:builder-fn rs/as-unqualified-lower-maps})))) ;; => one index proves the guard (part 2)
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k07_migrations" ["k07_events"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-07-guard-a-hot-table-index-build/expected/main.stdout.txt`):

```text
migrate: nil
completed: ["create-events" "index-kind"]
indexes: ["k07_events_kind_idx"]
```

### Kata 8: Status Gate Before Deploy

Task: Task: gate deploys on k08_flags with a pending-list check; prove ready, blocked, then ready again.

**`drilling/code/kata-08-status-gate-before-deploy/before/main.clj`**:

```clojure
;; => KATA STARTER: Kata 8.
;; => Complete this starter; the harness never runs it.
(require '[migratus.core :as migratus]) ;; => migrate and rollback move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
;; => Run the after/ solution to see one answer first.
(throw (ex-info "TODO: write the kata migrations" {})) ;; => replace this stub with your answer
```

**`drilling/code/kata-08-status-gate-before-deploy/after/main.clj`**:

```clojure
;; => Kata: Status Gate Before Deploy.
;; => Deploys wait for a clean journal: a gate function reads pending first.
(require '[migratus.core :as migratus]) ;; => migrate, rollback, up, and down move history
(require '[next.jdbc :as jdbc]) ;; => verification reads prove each migration landed
(require '[next.jdbc.result-set :as rs]) ;; => unqualified rows print without table prefixes
(require '[clojure.java.io :as io]) ;; => migration files are staged, then removed
;; => The database address comes from the harness, with local-run defaults.
(defn db-spec [] ;; => one builder owns every address default
  {:dbtype "postgresql" ;; => pgjdbc speaks the PostgreSQL wire protocol
   :host (or (System/getenv "PGHOST") "localhost") ;; => harness sets the service host
   :port (Integer/parseInt (or (System/getenv "PGPORT") "5432")) ;; => service port default
   :dbname (or (System/getenv "PGDATABASE") "postgres") ;; => fresh database per unit run
   :user (or (System/getenv "PGUSER") "postgres")}) ;; => trust auth needs no password
;; => One config carries the store, the relative migration dir, and the history table.
(defn config [dir table] ;; => every example owns its dir and history table
  {:store :database ;; => the SQL store journals history in a table
   :migration-dir dir ;; => relative to the unit folder, staged at runtime
   :migration-table-name table ;; => per-example history isolates every rerun
   :db (db-spec)}) ;; => next.jdbc connects from this spec
;; => Staging writes one up/down pair per call into the relative dir.
(defn write-migration [dir id name up down] ;; => one helper stages every migration
  (spit (str dir "/" id "-" name ".up.sql") up) ;; => forward change runs on migrate
  (when down ;; => up-only examples skip the down file on purpose
    (spit (str dir "/" id "-" name ".down.sql") down))) ;; => reverse runs on rollback
;; => Reset clears leftovers of a killed run so reruns print alike.
(defn reset-unit! [ds dir table tables views] ;; => one reset owns every leftover
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => stale views vanish first
  (let [d (io/file dir)] ;; => the relative staging dir of this unit
    (when (.exists d) ;; => a killed run may leave files behind
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)) ;; => the empty staging dir goes too
    (.mkdirs d)) ;; => a fresh dir for this run
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => killed runs vanish
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)])) ;; => stale history vanishes too
;; => Reads print their own proof; ids sort so output never depends on disk order.
(defn applied-names [ds table] ;; => applied migration names in id order
  (mapv :description ;; => description stores the migration name
    (jdbc/execute! ds [(str "SELECT description FROM " table " WHERE id > 0 ORDER BY id")] ;; => id order, reserve row excluded
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
;; => Column lists read the catalog, so the schema proves itself.
(defn table-columns [ds table] ;; => column names in position order
  (mapv :column_name ;; => one name per row, nothing else
    (jdbc/execute! ds [(str "SELECT column_name FROM information_schema.columns WHERE table_name = '" table "' ORDER BY ordinal_position")] ;; => catalog order is stable
                     {:builder-fn rs/as-unqualified-lower-maps}))) ;; => short keys print cleanly
(def ds (jdbc/get-datasource (db-spec))) ;; => one shared datasource per unit run
(def cfg (config "mig" "k08_migrations")) ;; => store plus history table for this kata
(reset-unit! ds "mig" "k08_migrations" ["k08_flags"] []) ;; => leftovers of a killed run vanish first
(defn gate [] ;; => one gate owns the deploy question
  (let [p (sort (migratus/pending-list cfg))] ;; => pending names decide the answer
    (if (empty? p) "ready" (str "blocked: " (count p) " pending")))) ;; => counts name the backlog
(write-migration "mig" "20260202000801" "create-flags" ;; => flags start with a name
  "CREATE TABLE k08_flags (id SERIAL PRIMARY KEY, name TEXT NOT NULL);\n" ;; => forward change creates the table
  "DROP TABLE k08_flags;\n") ;; => reverse drops the table again
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k08_migrations"))) ;; => id order straight from history
(println "gate:" (gate)) ;; => nothing pending means ready
(write-migration "mig" "20260202000802" "add-color" ;; => one more migration waits backstage
  "ALTER TABLE k08_flags ADD COLUMN color TEXT;\n" ;; => forward change adds the column
  "ALTER TABLE k08_flags DROP COLUMN color;\n") ;; => reverse drops the column
(println "gate:" (gate)) ;; => one pending migration blocks the deploy
(println "pending:" (pr-str (sort (migratus/pending-list cfg)))) ;; => pending names what remains
(println "migrate:" (pr-str (migratus/migrate cfg))) ;; => nil means every pending migration applied
(println "completed:" (pr-str (applied-names ds "k08_migrations"))) ;; => id order straight from history
(println "gate:" (gate)) ;; => the journal is clean again
;; => Cleanup drops every object this example made, leaving no residue.
(defn cleanup-unit! [ds dir table tables views] ;; => one cleanup owns every created object
  (doseq [v views] ;; => views drop before the tables they read
    (jdbc/execute! ds [(str "DROP VIEW IF EXISTS " v)])) ;; => view residue vanishes
  (doseq [t tables] ;; => every table this example owns
    (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " t " CASCADE")])) ;; => tables vanish with dependents
  (jdbc/execute! ds [(str "DROP TABLE IF EXISTS " table)]) ;; => history table vanishes too
  (let [d (io/file dir)] ;; => the staging dir from this run
    (when (.exists d) ;; => files were staged above
      (doseq [f (.listFiles d)] ;; => every staged file goes first
        (.delete ^java.io.File f)) ;; => delete each staged migration
      (.delete d)))) ;; => the empty staging dir goes too
(cleanup-unit! ds "mig" "k08_migrations" ["k08_flags"] []) ;; => drop every object this kata created
```

**Output** (`drilling/code/kata-08-status-gate-before-deploy/expected/main.stdout.txt`):

```text
migrate: nil
completed: ["create-flags"]
gate: ready
gate: blocked: 1 pending
pending: ("add-color")
migrate: nil
completed: ["create-flags" "add-color"]
gate: ready
```

## Self-check checklist

- [ ] (co-01) I can write a versioned Migratus file pair whose name carries version plus intent.
- [ ] (co-01) I can stage migration files so id order matches dependency order.
- [ ] (co-02) I can write a forward step and its mirroring down file.
- [ ] (co-02) I can recover a bad deploy by shipping the fix forward.
- [ ] (co-03) I can read the journal and report a database position from it.
- [ ] (co-03) I can list pending migrations before running them.
- [ ] (co-04) I can keep history linear across parallel branches.
- [ ] (co-04) I can name the pending arrivals when a branch merges late.
- [ ] (co-05) I can make any migration safe to rerun with guards.
- [ ] (co-06) I can split a schema change from its backfill into separate migrations.
- [ ] (co-06) I can verify a backfill with counts plus a golden query.
- [ ] (co-07) I can expand, migrate, and contract a rename across deploys.
- [ ] (co-08) I can roll back a shipped change without touching unrelated data.
- [ ] (co-08) I can state what a rollback restores and what needs a backup.
- [ ] (co-09) I can detect drift by comparing journal to catalog.
- [ ] (co-09) I can converge drift with a forward migration.
- [ ] (co-10) I can baseline a legacy database without losing a row.
- [ ] (co-10) I can extend adopted history with normal migrations.
- [ ] (co-11) I can explain why applied files must never be edited.
- [ ] (co-12) I can choose per migration whether it runs in a transaction.
- [ ] (co-13) I can promote identical files across environments and verify.
- [ ] (co-14) I can resolve a branch collision by renumbering the newcomer.
- [ ] (co-15) I can measure and shrink a migration lock window.
- [ ] (co-16) I can gate a deploy with status checks before and after.

## Elaborative interrogation & self-explanation

Each prompt names a design choice and a rejected alternative. Argue both sides in writing before reading the model answer; the answer you cannot steelman is the concept you have not learned.

### Prompt 1: Why forward fixes instead of history edits?

<details><summary>Answer</summary>

Rejected alternative: rewrite the applied file in place and rerun, like editing a script and pressing run again. Reruns refuse the edited file because the journal already holds its id — the tool remembers runs, not file contents. In-place edits also fork every environment that already applied the old bytes: production keeps the old shape while the directory claims the new one, and no journal row records the difference. Forward fixes keep one rule for every change: new bytes, new id, new journal row.

**In short**: Edits fight the journal and fork environments. New migrations reuse the deploy machinery that already works.

</details>

### Prompt 2: Why id-based journaling instead of content hashing for regular files?

<details><summary>Answer</summary>

Rejected alternative: the runner hashes every applied file and refuses edited content automatically. Hashing inside the tool would conflate two jobs — ordering work and policing edits — and force every legitimate workflow through its checksum policy. Id journaling keeps the runner small and predictable: identity decides what runs, and repeatable files opt into hashes where a team wants them. The course demonstrates both layers so the boundary is explicit rather than surprising.

**In short**: Tool-level hashing would bloat the runner and fight legitimate workflows. Ids order, hashes opt in, discipline covers the rest.

</details>

### Prompt 3: Why separate migrations instead of one file per deploy?

<details><summary>Answer</summary>

Rejected alternative: bundle the deploy's changes into one file so history has one row per release. Bundles fuse unrelated failures: one bad statement aborts the whole batch, rollback reverses innocent changes beside guilty ones, and review cannot approve half a bundle. Separate migrations keep failures small, reversals scoped, and reviews honest. Deploys group migrations by time; history groups them by meaning.

**In short**: Bundles fuse failures and reversals. Small migrations fail small and roll back scoped.

</details>

### Prompt 4: Why baselines that change nothing instead of generated base migrations?

<details><summary>Answer</summary>

Rejected alternative: dump the legacy schema into one giant initial migration and run it everywhere. Generated dumps encode one database's accidents — default names, storage settings, owner quirks — and rerunning them against the living original clashes or destroys. A claim-only baseline admits the truth: the database already exists, so history should record position without replaying creation. Dumps describe; claims position.

**In short**: Generated base migrations replay accidents. Claims record position and leave live data untouched.

</details>

### Prompt 5: Why short per-migration transactions instead of one transaction per deploy?

<details><summary>Answer</summary>

Rejected alternative: wrap the whole deploy in one transaction so partial deploys never exist. Long transactions hold locks across unrelated changes, and some steps — concurrent index builds — refuse transactional wrapping entirely. Per-migration transactions bound every failure to one file: the journal records the good prefix, diagnosis reads it, and recovery reruns the suffix. Partial deploys still happen, but they happen legibly.

**In short**: Deploy-wide transactions lock wide and break on CONCURRENTLY. Per-file transactions fail legibly and recover by suffix.

</details>

### Prompt 6: Why verify with catalog queries instead of trusting green runs?

<details><summary>Answer</summary>

Rejected alternative: the runner exited zero, so the schema is correct — check the exit code and move on. Green runs prove the runner finished, not that the database changed correctly: silent skips, edited files, and out-of-band drift all exit zero while the schema lies. Catalog queries read the database independently of the runner, so two witnesses must agree before the deploy counts. Trust the runner to run; trust the catalog to tell the truth.

**In short**: Exit codes prove finishing, catalog reads prove effect. Two witnesses or it did not happen.

</details>
