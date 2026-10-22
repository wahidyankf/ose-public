---
title: "Overview"
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, nine hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

Answer each question from memory before opening its detail block: say the answer aloud in one or two sentences, then check. The questions follow the course order — files and history first, data and safety next, teams and failure last — so a missed question points at the level worth reworking.

### Q1 (co-01): What three parts make a revision file, and which one orders history?

<details><summary>Answer</summary>

Identity (`revision`), parent link (`down_revision`), and the two functions (`upgrade`, `downgrade`). The parent link orders history: Alembic follows `down_revision` chains to sequence files, so the link — not filenames or timestamps — decides what runs after what.

</details>

### Q2 (co-01): Why must revision ids be fixed strings instead of generated hex?

<details><summary>Answer</summary>

Generated ids differ on every run, so the history can never be byte-stable and two checkouts of the same migration disagree about what ran. Fixed ids like `ex27a1` make the file, the version table, and every transcript reproducible across machines and reruns.

</details>

### Q3 (co-02): What belongs in upgrade, and what belongs in downgrade?

<details><summary>Answer</summary>

Upgrade carries the forward change — create, add, backfill — the deploy needs. Downgrade carries the exact reverse — drop, remove, loosen — the rollback needs. Schema steps reverse structurally; data steps usually cannot, so their downgrades say `pass` explicitly instead of pretending.

</details>

### Q4 (co-02): Why do data fills get `pass` downgrades instead of reverse updates?

<details><summary>Answer</summary>

A fill overwrites whatever was there, and the previous values are gone the moment it commits — there is no reverse update that restores unknown history. `pass` states the one-way policy in the file so the rollback plan accounts for it instead of discovering it mid-incident.

</details>

### Q5 (co-03): What does the version table store, and who writes to it?

<details><summary>Answer</summary>

One row per applied head: the revision id the database has reached. Alembic writes it inside the same transaction as the migration, so the receipt and the change commit atomically — the table never claims a migration that did not fully apply.

</details>

### Q6 (co-03): How do `current` and `history` differ as diagnostics?

<details><summary>Answer</summary>

`current` reads the database — where this database stands. `history` reads the files — which revisions exist and how they link. When the two disagree, the gap between them is the diagnosis: an unrecorded migration, a missing file, or a stamp that lied.

</details>

### Q7 (co-04): What creates a second head, and what does it block?

<details><summary>Answer</summary>

Two files with no common descendant — usually two developers branching from the same parent — create two heads. It blocks nothing immediately, but the next deploy cannot pick a tip, so every upgrade target becomes ambiguous until a merge or rebase joins them.

</details>

### Q8 (co-04): How do you list heads, and how many merges do N tips need?

<details><summary>Answer</summary>

`script.get_heads()` lists every tip of the file history. N tips need N-1 merges: each merge joins two lines into one, so three heads cost two merges and the arithmetic tells you the size of the debt before you start paying it.

</details>

### Q9 (co-05): What makes a migration rerunnable, and what breaks reruns?

<details><summary>Answer</summary>

Rerunnable means the second run is a no-op or reproduces the first byte for byte: guarded drops, conditional adds, and cleanup that restores the starting state. Shared tables, generated ids, timestamps in output, and version tables that survive cleanup break reruns by leaking state between runs.

</details>

### Q10 (co-06): Why must the backfill run after the schema change, not inside it?

<details><summary>Answer</summary>

The column must exist before any row can fill it, and separating the steps means each deploys, fails, and rolls back independently. A combined revision couples the DDL lock to the data volume: slow rows hold the schema lock, and a fill failure rolls back structure that was fine.

</details>

### Q11 (co-06): How do you verify a backfill worked?

<details><summary>Answer</summary>

Count the rows the fill should have touched and count the rows that actually changed — `WHERE new_col IS NULL` must return zero, and a checksum like `SUM` must match the expected value. The verification query is part of the migration story, not an afterthought, because silent partial fills are the failure mode.

</details>

### Q12 (co-07): What are the three expand-migrate-contract stops, and what runs between them?

<details><summary>Answer</summary>

Expand adds the new shape beside the old; migrate copies data and moves reads; contract drops the old shape. Application deploys run between the stops: dual-write code between expand and migrate, new-read code between migrate and contract — the steps are deploy windows, not just files.

</details>

### Q13 (co-07): Why does the new column start nullable?

<details><summary>Answer</summary>

Existing rows have no value for it yet, and a `NOT NULL` without a default refuses to land on an inhabited table. Nullable first, fill second, tighten third: each stop is deployable on its own, and the constraint arrives only when every row already complies.

</details>

### Q14 (co-08): What does downgrade minus one undo, and what can it not restore?

<details><summary>Answer</summary>

It runs the current head's `downgrade` — one step back in the recorded chain. It restores structure the file knows how to reverse, but it cannot restore dropped data, overwritten values, or anything outside the versioned history. Structure roundtrips; data does not.

</details>

### Q15 (co-08): Which unrelated things survive a rollback, and why?

<details><summary>Answer</summary>

Tables, rows, and revisions the downgraded file never touched: downgrade runs only its own reverse steps, so sibling tables keep every row. Survival is scoped by design — the blast radius of a rollback is exactly one revision's change, which is why small revisions make safe rollbacks.

</details>

### Q16 (co-09): What is schema drift, and which two comparisons reveal it?

<details><summary>Answer</summary>

Drift is the live database differing from what the history claims: a manual tweak, a hotfix, a forgotten file. File history versus `current` reveals unrecorded runs; declared schema versus reflected schema reveals unrecorded changes. Both comparisons must pass before a deploy means what it says.

</details>

### Q17 (co-09): Stamped but different: what does it mean when history and database disagree?

<details><summary>Answer</summary>

Someone declared a past that never happened — a stamp pointing at revisions whose DDL does not match the tables, or an upgrade from files that were edited after applying. The version table is a claim, not a proof; reflection is the audit that checks the claim against the metal.

</details>

### Q18 (co-10): When do you stamp instead of upgrade?

<details><summary>Answer</summary>

When the database already has the schema the files describe: adopting a legacy database, or marking a baseline the team agrees on. Upgrade replays change; stamp declares agreement. Stamping the wrong revision is a lie the database cannot detect, so the stamp must name exactly the schema that is really there.

</details>

### Q19 (co-11): What breaks when you edit an already-applied migration file?

<details><summary>Answer</summary>

Every database that already ran it: their version tables claim a revision whose content no longer matches, so future diagnoses compare against a file that never ran anywhere. History is append-only — fix forward with a new revision, never rewrite the recorded past.

</details>

### Q20 (co-12): Why does each migration run in its own transaction?

<details><summary>Answer</summary>

So a failed statement undoes the whole revision instead of leaving half a schema: the lock window equals the revision, and the failure window is one revision's change. Short transactions are the physical reason small revisions are safer — the blast radius is bounded by the file.

</details>

### Q21 (co-13): Why must every environment run the same files in the same order?

<details><summary>Answer</summary>

Because the version table only records ids, not effects: if staging ran a file prod never saw, the two databases diverge while both claim to be current. Same files, same order, every environment — drift becomes structurally impossible instead of merely forbidden.

</details>

### Q22 (co-14): Two developers, two heads: what is the merge workflow?

<details><summary>Answer</summary>

List the heads, write one merge revision with both tips as parents, upgrade through it, and verify a single head with both branches' tables present. The merge file carries no DDL — it joins histories, and the verification proves both lines survived the join.

</details>

### Q23 (co-15): Which operations need exclusive locks, and how do you shrink the window?

<details><summary>Answer</summary>

DDL that rewrites or validates: adding validated constraints, widening types, full-table backfills under one statement. Shrink with `NOT VALID` plus separate `VALIDATE`, batched fills with `IS NULL` guards, one statement per revision, and statement timeouts that fail fast instead of queueing behind traffic.

</details>

### Q24 (co-16): How do you test a migration twice?

<details><summary>Answer</summary>

Upgrade to head and assert the golden schema and data, then downgrade to base and assert the starting shape, then upgrade again and assert the golden output is byte-identical. The roundtrip proves reversibility; the repeated upgrade proves determinism. Three gates — linearity, currency, fidelity — before any deploy ships.

</details>

## Applied problems

Work each on paper before touching a terminal: name the revisions, their ids, their order, and the verification query. Then build the files and run them — the terminal is the grader, not the draft.

### Problem 1: Split the rename

The `users` table has `username TEXT NOT NULL` with 40,000 rows, and the application must read `handle` by Friday with zero downtime. Name the three revisions (fixed ids, parent links), state what application code ships between each pair, and write the verification query proving every handle equals its old username.

### Problem 2: Harden the column

`orders.email` is nullable with 2 million rows, 3 percent null. New policy: every order has an email. Name the revisions that end with a `NOT NULL` constraint, decide the default-versus-backfill question for the null 3 percent, and state which revision is safe to roll back and which is one-way.

### Problem 3: Widen without locking

`events.seq` is `INTEGER` approaching 2 billion and must become `BIGINT` while ingestion continues. Sketch the expand-migrate-contract stops for a type change, name the lock each stop avoids, and explain why the naive single `ALTER COLUMN` is the wrong answer under load.

### Problem 4: Merge the branches

You added `k-alex-1` (an index on `orders.status`); Priya added `k-priya-1` (a `shipped_at` column). Both branched from `main-9`. List the heads, write the merge revision, and state the exact upgrade plus verification sequence that proves both changes present and one head remaining.

### Problem 5: Rebase the private branch

Your three-revision branch sat unmerged for a week while `main` advanced two revisions. Nobody else has your files. Decide merge versus rebase, rewrite the parent links accordingly, and explain what breaks if you choose wrong — and who pays for it.

### Problem 6: Diagnose the partial run

Deploy stopped mid-history: the version table says `m-14`, but `orders.total_cents` is missing. Reconstruct the two possible causes (failed statement inside `m-14` versus `m-14` never ran and the receipt lied), and give the ordered commands that distinguish them and recover safely.

### Problem 7: Diagnose the phantom table

History shows one head and `current` matches it, yet the application errors that `shipments` already exists when a fresh staging database migrates from base. Reconstruct how a table can exist that no revision creates, and give the reflection query plus the stamp-or-drop decision for each possible answer.

### Problem 8: Diagnose the empty backfill

The backfill revision ran green, but `SELECT COUNT(*) FROM orders WHERE total_cents IS NULL` returns every row. List the three candidate causes (wrong predicate, statuses outside the map, column default masking), and give one query per cause that confirms or eliminates it.

## Code katas

Nine hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: file and rollback first, because honesty about direction underlies everything; data steps next, because fills follow schema; teams, locks, and baselines last, because each isolates one production judgement. Run the reference in the harness after diffing: your version and the reference must both exit green, and any output difference is a behavior difference to explain, not a formatting quirk to ignore.

### Kata 01: Write Your First Revision from Scratch

(Concepts: co-01, co-02.)

Replace ad-hoc DDL with a versioned revision: run the starter and watch a table appear with no receipt, then match the reference that writes the revision file, upgrades for real, and proves both the table and the version row.

**`drilling/code/kata-01-first-revision-from-scratch/before/starter.py`**:

```python
# => Kata 1 starter: ad-hoc DDL nobody can replay.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => creates the table with no record of the act
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: DDL commits
        conn.execute(text("DROP TABLE IF EXISTS kata01_widgets"))  # => start clean
        conn.execute(
            text(
                "CREATE TABLE kata01_widgets (id SERIAL PRIMARY KEY, name TEXT NOT NULL)"
            )
        )  # => ad-hoc DDL
    print("created: True")  # => the table exists now
    print("recorded: False")  # => no revision, no receipt, no replay


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-01-first-revision-from-scratch/after/solution.py`**:

```python
# => Kata 1 solution: the table arrives with a receipt.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrade
from alembic.config import Config  # => WHY Config: no ini file
from alembic.migration import MigrationContext  # => WHY MigrationContext: read receipts
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => write one revision, upgrade, prove both halves
    sdir = tempfile.mkdtemp(prefix="kata01-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata01_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    with open(
        os.path.join(vdir, "k01a1_widgets.py"), "w"
    ) as handle:  # => fixed id file
        handle.write('"""create kata01 widgets."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k01a1'\n")  # => WHY fixed: stable reruns
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    op.create_table('kata01_widgets',\n")  # => the versioned DDL
        handle.write(
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
        )  # => key
        handle.write(
            "        sa.Column('name', sa.Text(), nullable=False))\n"
        )  # => named widgets
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    op.drop_table('kata01_widgets')\n")  # => clean reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata01_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata01_widgets"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata01_version")
        )  # => then the receipts
    command.upgrade(cfg, "head")  # => the revision runs for real
    with engine.connect() as conn:  # => one connection for checks
        ctx = MigrationContext.configure(
            conn, opts={"version_table": "kata01_version"}
        )  # => own receipts
        current = ctx.get_current_heads()  # => where the database stands
    tables = sorted(
        t
        for t in sa_inspect(engine).get_table_names()
        if t.startswith("kata01_") and t != "kata01_version"
    )  # => data tables only
    print(f"tables: {tables}")  # => Output line: the table exists
    print(f"version: {current[0]}")  # => Output line: the receipt names the revision
    print("kata ok")  # => Output line: versioned, not ad-hoc
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-01-first-revision-from-scratch/expected/main.stdout.txt`):

```text
tables: ['kata01_widgets']
version: k01a1
kata ok
```

### Kata 02: Add the Downgrade

(Concepts: co-02, co-08.)

Prove both directions: run the starter and see the dead-end `pass`, then match the reference whose real downgrade drops the table and whose transcript shows the roundtrip.

**`drilling/code/kata-02-add-the-downgrade/before/starter.py`**:

```python
# => Kata 2 starter: a revision with no way back.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrade
from alembic.config import Config  # => WHY Config: no ini file
from sqlalchemy import create_engine  # => WHY engine: direct checks


def main():  # => upgrades fine, then rollback is a dead end
    sdir = tempfile.mkdtemp(prefix="kata02-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(
        os.path.join(vdir, "k02a1_up.py"), "w"
    ) as handle:  # => one lonely revision
        handle.write('"""kata02 gadgets."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k02a1'\n")  # => fixed id
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step exists
        handle.write("    op.create_table('kata02_gadgets',\n")  # => creates the table
        handle.write(
            "        sa.Column('id', sa.Integer(), primary_key=True))\n"
        )  # => bare key
        handle.write("def downgrade():\n")  # => reverse step missing
        handle.write(
            "    pass  # => NOTHING to run: rollback is a dead end\n"
        )  # => the smell
    print("upgraded: True")  # => forward works
    print("downgrade: pass  # nothing to run")  # => backward is a lie
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-02-add-the-downgrade/after/solution.py`**:

```python
# => Kata 2 solution: the way back is written first.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: upgrade plus downgrade
from alembic.config import Config  # => WHY Config: no ini file
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => upgrade proves forward, downgrade proves back
    sdir = tempfile.mkdtemp(prefix="kata02-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata02_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    with open(
        os.path.join(vdir, "k02a1_gadgets.py"), "w"
    ) as handle:  # => fixed id file
        handle.write('"""create kata02 gadgets."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k02a1'\n")  # => WHY fixed: stable reruns
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    op.create_table('kata02_gadgets',\n")  # => creates the table
        handle.write(
            "        sa.Column('id', sa.Integer(), primary_key=True))\n"
        )  # => bare key
        handle.write("def downgrade():\n")  # => reverse step, real this time
        handle.write(
            "    op.drop_table('kata02_gadgets')\n"
        )  # => WHY real: rollback must work
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata02_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata02_gadgets"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata02_version")
        )  # => then the receipts
    insp = sa_inspect(engine)  # => inspector proves shape
    command.upgrade(cfg, "head")  # => forward runs
    up = insp.has_table("kata02_gadgets")  # => table present after upgrade
    command.downgrade(cfg, "-1")  # => back runs too
    down = sa_inspect(engine).has_table(
        "kata02_gadgets"
    )  # => WHY fresh: inspectors cache shape
    print(f"after upgrade: {up}")  # => Output line: forward works
    print(f"after downgrade: {down}")  # => Output line: backward works
    print("kata ok")  # => Output line: both directions proven
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-02-add-the-downgrade/expected/main.stdout.txt`):

```text
after upgrade: True
after downgrade: False
kata ok
```

### Kata 03: Link the Chain

(Concepts: co-04.)

Turn two roots into one history without touching a database: run the starter and count two heads, then match the reference whose single parent-link edit restores the chain.

**`drilling/code/kata-03-link-the-chain/before/starter.py`**:

```python
# => Kata 3 starter: two roots, nobody linked them.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev):  # => both files claim to be first
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata03 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(
            "down_revision = None  # => SMELL: two roots, no chain\n"
        )  # => nobody linked them
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    pass\n")  # => history shape is the lesson here
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def main():  # => the fork, printed plainly
    sdir = tempfile.mkdtemp(prefix="kata03-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    write_rev(vdir, "k03a1")  # => first root
    write_rev(vdir, "k03b1")  # => second root, unlinked
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    script = ScriptDirectory.from_config(cfg)  # => read the file history
    print(f"heads: {len(script.get_heads())}")  # => TWO tips: the fork made visible
    print("linked: False")  # => no down_revision points anywhere
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-03-link-the-chain/after/solution.py`**:

```python
# => Kata 3 solution: one edit turns two roots into a chain.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev, down):  # => down links the chain
    down_repr = (
        "None" if down is None else f"'{down}'"
    )  # => WHY repr: base is bare None
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata03 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(f"down_revision = {down_repr}\n")  # => the link under repair
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    pass\n")  # => history shape is the lesson here
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def count_heads(sdir):  # => fresh read every time
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    return len(ScriptDirectory.from_config(cfg).get_heads())  # => count the tips


def main():  # => fork first, then the one-line fix
    sdir = tempfile.mkdtemp(prefix="kata03-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    write_rev(vdir, "k03a1", None)  # => first root
    write_rev(vdir, "k03b1", None)  # => second root, unlinked
    before = count_heads(sdir)  # => TWO tips before the fix
    write_rev(vdir, "k03b1", "k03a1")  # => THE fix: point at the parent
    after = count_heads(sdir)  # => ONE tip after the fix
    print(f"before: {before}")  # => Output line: the fork, counted
    print(f"after: {after}")  # => Output line: the chain, restored
    print("kata ok")  # => Output line: one edit, one history
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-03-link-the-chain/expected/main.stdout.txt`):

```text
before: 2
after: 1
kata ok
```

### Kata 04: Backfill Before Not Null

(Concepts: co-06, co-07.)

Order the strictness after the data: run the starter and watch the strict column refused, then match the reference that lands nullable, fills, and tightens — verified by count and flag.

**`drilling/code/kata-04-backfill-before-not-null/before/starter.py`**:

```python
# => Kata 4 starter: strictness before data.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => the column the rows cannot satisfy
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata04_orders"))  # => start clean
        conn.execute(
            text(
                "CREATE TABLE kata04_orders (id SERIAL PRIMARY KEY, status TEXT NOT NULL)"
            )
        )  # => live table
        conn.execute(
            text("INSERT INTO kata04_orders (status) VALUES ('new'), ('paid')")
        )  # => rows predate the column
    print("rows: 2")  # => the table is already inhabited
    print(
        "next: ALTER TABLE kata04_orders ADD COLUMN priority TEXT NOT NULL"
    )  # => the strict step
    print(
        "result: FAILS  # existing rows have no value for it"
    )  # => Postgres refuses: no default


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-04-backfill-before-not-null/after/solution.py`**:

```python
# => Kata 4 solution: fill first, tighten second.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrades
from alembic.config import Config  # => WHY Config: no ini file
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => nullable, backfill, then strict
    sdir = tempfile.mkdtemp(prefix="kata04-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata04_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => three stops: land, fill, tighten
        (
            "k04a1",
            None,
            "    op.create_table('kata04_orders',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('status', sa.Text(), nullable=False))\n",
            "    op.drop_table('kata04_orders')\n",
        ),
        (
            "k04b1",
            "k04a1",
            "    op.add_column('kata04_orders',\n"
            "        sa.Column('priority', sa.Text(), nullable=True))\n",
            "    op.drop_column('kata04_orders', 'priority')\n",
        ),
        (
            "k04c1",
            "k04b1",
            "    op.execute(\"UPDATE kata04_orders SET priority = 'p1'\")\n"
            "    op.alter_column('kata04_orders', 'priority', nullable=False)\n",
            "    op.alter_column('kata04_orders', 'priority', nullable=True)\n",
        ),
    ]  # => data fills one way: no reverse fill
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_orders.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata04 orders."""\n')  # => human-readable doc
            handle.write("from alembic import op\n")  # => DDL verbs
            handle.write("import sqlalchemy as sa\n")  # => column types
            handle.write(f"revision = '{rev}'\n")  # => fixed id
            handle.write(f"down_revision = {down_repr}\n")  # => chain order
            handle.write("def upgrade():\n")  # => forward step
            handle.write(up)  # => caller-supplied DDL
            handle.write("def downgrade():\n")  # => reverse step
            handle.write(dn)  # => caller-supplied reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata04_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata04_orders"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata04_version")
        )  # => then the receipts
    command.upgrade(cfg, "k04a1")  # => schema lands first, alone
    with engine.begin() as conn:  # => seeds commit together
        conn.execute(
            text("INSERT INTO kata04_orders (status) VALUES ('new'), ('paid')")
        )  # => rows predate the column
    command.upgrade(cfg, "head")  # => fill plus tighten land after
    with engine.connect() as conn:  # => one connection for checks
        filled = conn.execute(
            text("SELECT COUNT(*) FROM kata04_orders WHERE priority IS NOT NULL")
        ).scalar()  # => fill proof
    cols = {
        c["name"]: c for c in sa_inspect(engine).get_columns("kata04_orders")
    }  # => columns by name
    print(f"filled: {filled}")  # => Output line: every row got a value
    print(
        f"nullable: {cols['priority']['nullable']}"
    )  # => Output line: strict after the fill
    print("kata ok")  # => Output line: order restored
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-04-backfill-before-not-null/expected/main.stdout.txt`):

```text
filled: 2
nullable: False
kata ok
```

### Kata 05: Expand-Migrate-Contract

(Concepts: co-07.)

Rename without a flag day: run the starter and name the missing deploy window, then match the reference whose three revisions add, copy, and drop — with the data surviving under the new name.

**`drilling/code/kata-05-expand-migrate-contract/before/starter.py`**:

```python
# => Kata 5 starter: the rename with no deploy window.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir


def main():  # => one revision, zero room for old code
    sdir = tempfile.mkdtemp(prefix="kata05-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(
        os.path.join(vdir, "k05a1_rename.py"), "w"
    ) as handle:  # => the single-step rename
        handle.write('"""kata05 rename."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write("revision = 'k05a1'\n")  # => fixed id
        handle.write("down_revision = None\n")  # => first in chain
        handle.write("def upgrade():\n")  # => forward step
        handle.write(
            "    op.alter_column('kata05_users', 'name', new_column_name='email')\n"
        )  # => SMELL: old code breaks now
        handle.write("def downgrade():\n")  # => reverse step
        handle.write(
            "    op.alter_column('kata05_users', 'email', new_column_name='name')\n"
        )  # => reverse renames back
    print("revisions: 1")  # => one step does everything
    print(
        "deploy window: none  # old and new code cannot coexist"
    )  # => the missing middle
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-05-expand-migrate-contract/after/solution.py`**:

```python
# => Kata 5 solution: three steps keep old and new code alive.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrades
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: count the heads
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => add, copy, drop: the rename in three deployable stops
    sdir = tempfile.mkdtemp(prefix="kata05-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata05_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => expand, migrate, contract
        (
            "k05a1",
            None,
            "    op.create_table('kata05_users',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('name', sa.Text(), nullable=False))\n",
            "    op.drop_table('kata05_users')\n",
        ),
        (
            "k05b1",
            "k05a1",
            "    op.add_column('kata05_users',\n"
            "        sa.Column('email', sa.Text(), nullable=True))\n",
            "    op.drop_column('kata05_users', 'email')\n",
        ),
        (
            "k05c1",
            "k05b1",
            "    op.execute('UPDATE kata05_users SET email = name')\n"
            "    op.drop_column('kata05_users', 'name')\n",
            "    pass\n",
        ),
    ]  # => data moves one way: no reverse copy
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_users.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata05 users."""\n')  # => human-readable doc
            handle.write("from alembic import op\n")  # => DDL verbs
            handle.write("import sqlalchemy as sa\n")  # => column types
            handle.write(f"revision = '{rev}'\n")  # => fixed id
            handle.write(f"down_revision = {down_repr}\n")  # => chain order
            handle.write("def upgrade():\n")  # => forward step
            handle.write(up)  # => caller-supplied DDL
            handle.write("def downgrade():\n")  # => reverse step
            handle.write(dn)  # => caller-supplied reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata05_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata05_users"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata05_version")
        )  # => then the receipts
    command.upgrade(cfg, "k05a1")  # => old column lands first, alone
    with engine.begin() as conn:  # => seeds commit together
        conn.execute(
            text("INSERT INTO kata05_users (name) VALUES ('ada')")
        )  # => data under the old name
    command.upgrade(cfg, "head")  # => add, copy, drop land after
    cols = sorted(
        c["name"] for c in sa_inspect(engine).get_columns("kata05_users")
    )  # => final shape, sorted
    heads = len(
        ScriptDirectory.from_config(cfg).get_heads()
    )  # => history stayed linear
    print(f"columns: {cols}")  # => Output line: email in, name out
    print(f"heads: {heads}")  # => Output line: no fork anywhere
    print("kata ok")  # => Output line: rename with a deploy window
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-05-expand-migrate-contract/expected/main.stdout.txt`):

```text
columns: ['email', 'id']
heads: 1
kata ok
```

### Kata 06: Merge Two Heads

(Concepts: co-04, co-14.)

Join the fork with a file that carries no DDL: run the starter and count the two tips, then match the reference whose merge revision names both parents and restores one history.

**`drilling/code/kata-06-merge-two-heads/before/starter.py`**:

```python
# => Kata 6 starter: the fork both authors shipped.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev):  # => two authors, two tips
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata06 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(
            "down_revision = 'k06a1'  # => both children claim the same parent\n"
        )  # => the fork
        handle.write("def upgrade():\n")  # => forward step
        handle.write("    pass\n")  # => history shape is the lesson here
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def main():  # => the fork, counted
    sdir = tempfile.mkdtemp(prefix="kata06-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(vdir, "k06a1_root.py"), "w") as handle:  # => shared root
        handle.write('"""kata06 root."""\n')  # => human-readable doc
        handle.write("revision = 'k06a1'\n")  # => fixed id
        handle.write("down_revision = None\n")  # => chain starts here
        handle.write("def upgrade():\n    pass\n")  # => root carries no DDL
        handle.write("def downgrade():\n    pass\n")  # => symmetric no-op
    write_rev(vdir, "k06b1")  # => first author's tip
    write_rev(vdir, "k06c1")  # => second author's tip
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    script = ScriptDirectory.from_config(cfg)  # => read the file history
    print(f"heads: {len(script.get_heads())}")  # => TWO tips: deploy cannot pick one
    print("merged: False")  # => no file joins them yet
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-06-merge-two-heads/after/solution.py`**:

```python
# => Kata 6 solution: a merge file joins the two tips.
import os  # => WHY os: tempdir paths
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic.config import Config  # => WHY Config: no ini file
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history


def write_rev(vdir, rev, down):  # => down may be a pair for merges
    if isinstance(down, tuple):  # => WHY tuple: two parents, one file
        down_repr = f"('{down[0]}', '{down[1]}')"  # => merge shape
    elif down is None:  # => chain root
        down_repr = "None"  # => bare None, not quoted
    else:  # => ordinary child
        down_repr = f"'{down}'"  # => single parent, quoted
    with open(
        os.path.join(vdir, f"{rev}_thing.py"), "w"
    ) as handle:  # => id-prefixed file
        handle.write('"""kata06 thing."""\n')  # => human-readable doc
        handle.write("from alembic import op\n")  # => DDL verbs
        handle.write("import sqlalchemy as sa\n")  # => column types
        handle.write(f"revision = '{rev}'\n")  # => fixed id
        handle.write(f"down_revision = {down_repr}\n")  # => the parentage under repair
        handle.write("def upgrade():\n")  # => forward step
        handle.write(
            "    pass  # => merges carry no DDL: history only\n"
        )  # => WHY empty: join, not change
        handle.write("def downgrade():\n")  # => reverse step
        handle.write("    pass\n")  # => symmetric no-op


def count_heads(sdir):  # => fresh read every time
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    return len(ScriptDirectory.from_config(cfg).get_heads())  # => count the tips


def main():  # => fork first, merge second
    sdir = tempfile.mkdtemp(prefix="kata06-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    write_rev(vdir, "k06a1", None)  # => shared root
    write_rev(vdir, "k06b1", "k06a1")  # => first author's tip
    write_rev(vdir, "k06c1", "k06a1")  # => second author's tip
    before = count_heads(sdir)  # => TWO tips before the merge
    write_rev(vdir, "k06m1", ("k06b1", "k06c1"))  # => THE fix: one file, two parents
    after = count_heads(sdir)  # => ONE tip after the merge
    print(f"before: {before}")  # => Output line: the fork, counted
    print(f"after: {after}")  # => Output line: the join, proven
    print("kata ok")  # => Output line: merge carries no DDL
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-06-merge-two-heads/expected/main.stdout.txt`):

```text
before: 2
after: 1
kata ok
```

### Kata 07: Guard with Not Valid

(Concepts: co-15.)

Constrain without scanning: run the starter and feel the full-table lock, then match the reference that adds the check `NOT VALID`, validates separately, and proves the guard plus the surviving rows.

**`drilling/code/kata-07-guard-with-not-valid/before/starter.py`**:

```python
# => Kata 7 starter: the guard that scans the world.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => a validated check on a live table
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata07_items"))  # => start clean
        conn.execute(
            text("CREATE TABLE kata07_items (id SERIAL PRIMARY KEY, qty INTEGER)")
        )  # => live table
        conn.execute(
            text("INSERT INTO kata07_items (qty) VALUES (1), (2), (3)")
        )  # => rows predate the guard
    print("rows: 3")  # => every row gets scanned
    print(
        "next: ALTER TABLE kata07_items ADD CONSTRAINT qty_nonneg CHECK (qty >= 0)"
    )  # => validated at once
    print(
        "lock: SHARE ROW EXCLUSIVE until the scan finishes"
    )  # => writes queue behind the guard


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-07-guard-with-not-valid/after/solution.py`**:

```python
# => Kata 7 solution: the guard lands without scanning.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrades
from alembic.config import Config  # => WHY Config: no ini file
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => not valid first, validate second
    sdir = tempfile.mkdtemp(prefix="kata07-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata07_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => two stops: table, then the cheap guard
        (
            "k07a1",
            None,
            "    op.create_table('kata07_items',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('qty', sa.Integer(), nullable=False))\n",
            "    op.drop_table('kata07_items')\n",
        ),
        (
            "k07b1",
            "k07a1",
            "    op.create_check_constraint('kata07_qty_nonneg', 'kata07_items',\n"
            "        'qty >= 0', postgresql_not_valid=True)\n"
            "    op.execute('ALTER TABLE kata07_items VALIDATE CONSTRAINT kata07_qty_nonneg')\n",
            "    op.drop_constraint('kata07_qty_nonneg', 'kata07_items')\n",
        ),
    ]  # => the guard arrives in two cheap locks
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_items.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata07 items."""\n')  # => human-readable doc
            handle.write("from alembic import op\n")  # => DDL verbs
            handle.write("import sqlalchemy as sa\n")  # => column types
            handle.write(f"revision = '{rev}'\n")  # => fixed id
            handle.write(f"down_revision = {down_repr}\n")  # => chain order
            handle.write("def upgrade():\n")  # => forward step
            handle.write(up)  # => caller-supplied DDL
            handle.write("def downgrade():\n")  # => reverse step
            handle.write(dn)  # => caller-supplied reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata07_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(text("DROP TABLE IF EXISTS kata07_items"))  # => table first
        conn.execute(
            text("DROP TABLE IF EXISTS kata07_version")
        )  # => then the receipts
    command.upgrade(cfg, "k07a1")  # => table lands first, alone
    with engine.begin() as conn:  # => seeds commit together
        conn.execute(
            text("INSERT INTO kata07_items (qty) VALUES (1), (2), (3)")
        )  # => rows predate the guard
    command.upgrade(cfg, "head")  # => guard lands without scanning
    with engine.connect() as conn:  # => one connection for checks
        rows = conn.execute(
            text("SELECT COUNT(*) FROM kata07_items")
        ).scalar()  # => row count proof
    checks = [
        c["name"] for c in sa_inspect(engine).get_check_constraints("kata07_items")
    ]  # => guard names
    print(
        f"check: {'kata07_qty_nonneg' in checks}"
    )  # => Output line: the guard is installed
    print(f"rows: {rows}")  # => Output line: all rows survived
    print("kata ok")  # => Output line: cheap locks, same guarantee
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-07-guard-with-not-valid/expected/main.stdout.txt`):

```text
check: True
rows: 3
kata ok
```

### Kata 08: Pre-Deploy Checklist

(Concepts: co-16, co-13.)

Gate the deploy on three checks instead of confidence: run the starter and count zero verifications, then match the reference that proves linearity, currency, and fidelity before printing the verdict.

**`drilling/code/kata-08-pre-deploy-checklist/before/starter.py`**:

```python
# => Kata 8 starter: the deploy nobody checked.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrade
from alembic.config import Config  # => WHY Config: no ini file


def main():  # => head-ward, eyes closed
    sdir = tempfile.mkdtemp(prefix="kata08-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    print("checks: 0")  # => no linearity check
    print("checks: 0  # no currency check")  # => no current-equals-head check
    print("checks: 0  # no fidelity check")  # => no schema-match check
    print("deployed: True  # unchecked")  # => the gamble, printed plainly
    shutil.rmtree(sdir, ignore_errors=True)  # => scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-08-pre-deploy-checklist/after/solution.py`**:

```python
# => Kata 8 solution: three checks gate the deploy.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: run the upgrades
from alembic.config import Config  # => WHY Config: no ini file
from alembic.migration import MigrationContext  # => WHY MigrationContext: read receipts
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: read history
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => migrate, then verify before declaring victory
    sdir = tempfile.mkdtemp(prefix="kata08-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata08_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => two stops: parent, then child
        (
            "k08a1",
            None,
            "    op.create_table('kata08_owners',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True))\n",
            "    op.drop_table('kata08_owners')\n",
        ),
        (
            "k08b1",
            "k08a1",
            "    op.create_table('kata08_pets',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('kata08_owners.id')))\n",
            "    op.drop_table('kata08_pets')\n",
        ),
    ]  # => small chain, three checks
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_chain.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata08 chain."""\n')  # => human-readable doc
            handle.write("from alembic import op\n")  # => DDL verbs
            handle.write("import sqlalchemy as sa\n")  # => column types
            handle.write(f"revision = '{rev}'\n")  # => fixed id
            handle.write(f"down_revision = {down_repr}\n")  # => chain order
            handle.write("def upgrade():\n")  # => forward step
            handle.write(up)  # => caller-supplied DDL
            handle.write("def downgrade():\n")  # => reverse step
            handle.write(dn)  # => caller-supplied reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata08_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => drops commit together
        conn.execute(
            text("DROP TABLE IF EXISTS kata08_pets")
        )  # => child first, FK rule
        conn.execute(text("DROP TABLE IF EXISTS kata08_owners"))  # => then the parent
        conn.execute(
            text("DROP TABLE IF EXISTS kata08_version")
        )  # => then the receipts
    command.upgrade(cfg, "head")  # => the deploy under test
    script = ScriptDirectory.from_config(cfg)  # => read the file history
    heads = script.get_heads()  # => file tips
    with engine.connect() as conn:  # => one connection for checks
        ctx = MigrationContext.configure(
            conn, opts={"version_table": "kata08_version"}
        )  # => own receipts
        current = ctx.get_current_heads()  # => where the database stands
    live = sorted(
        t
        for t in sa_inspect(engine).get_table_names()
        if t.startswith("kata08_") and t != "kata08_version"
    )  # => data tables only
    print(f"single head: {len(heads) == 1}")  # => Output line: check one, linearity
    print(
        f"at tip: {list(current) == sorted(heads)}"
    )  # => Output line: check two, currency
    print(
        f"tables match: {live == ['kata08_owners', 'kata08_pets']}"
    )  # => Output line: check three, fidelity
    print("kata ok")  # => Output line: checked, not gambled
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-08-pre-deploy-checklist/expected/main.stdout.txt`):

```text
single head: True
at tip: True
tables match: True
kata ok
```

### Kata 09: Baseline Without Losing Data

(Concepts: co-10, co-09.)

Adopt a legacy database instead of replaying it: run the starter and see tables with no history, then match the reference that writes matching files, stamps the past, migrates only the delta, and proves both rows survived.

**`drilling/code/kata-09-baseline-without-losing-data/before/starter.py`**:

```python
# => Kata 9 starter: a live database with no history at all.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => tables and rows exist; receipts do not
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: legacy setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata09_legacy"))  # => start clean
        conn.execute(
            text("DROP TABLE IF EXISTS kata09_version")
        )  # => no receipts either
        conn.execute(
            text(
                "CREATE TABLE kata09_legacy (id SERIAL PRIMARY KEY, name TEXT NOT NULL)"
            )
        )  # => legacy handiwork
        conn.execute(
            text("INSERT INTO kata09_legacy (name) VALUES ('ada'), ('grace')")
        )  # => real data, no revision
    print("tables: True")  # => the schema exists
    print("version table: False")  # => SMELL: nothing records how it got here
    print("rows: 2  # stamp must keep both")  # => the baseline constraint


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**`drilling/code/kata-09-baseline-without-losing-data/after/solution.py`**:

```python
# => Kata 9 solution: stamp the truth, then migrate forward.
import os  # => WHY os: tempdir plus pg vars
import shutil  # => WHY shutil: remove the scratch tree
import tempfile  # => WHY tempfile: isolated script dir
from alembic import command  # => WHY command: stamp plus upgrade
from alembic.config import Config  # => WHY Config: no ini file
from alembic.migration import MigrationContext  # => WHY MigrationContext: read receipts
from alembic.script import ScriptDirectory  # => WHY ScriptDirectory: count the heads
from sqlalchemy import (
    create_engine,
    inspect as sa_inspect,
    text,
)  # => WHY all: run plus prove


def main():  # => legacy tables adopted, data untouched, history honest
    sdir = tempfile.mkdtemp(prefix="kata09-")  # => WHY temp: scratch script dir
    vdir = os.path.join(sdir, "versions")  # => Alembic reads this subdir
    os.makedirs(vdir)  # => create before writing
    with open(os.path.join(sdir, "env.py"), "w") as handle:  # => Alembic needs env.py
        handle.write("from alembic import context\n")  # => migration hook
        handle.write("from sqlalchemy import create_engine\n")  # => connect here
        handle.write("import os\n")  # => read PGHOST
        handle.write(
            "host = os.environ.get('PGHOST', 'localhost')\n"
        )  # => service host
        handle.write("user = os.environ.get('PGUSER', 'postgres')\n")  # => trust user
        handle.write(
            "url = f'postgresql+psycopg://{user}@{host}:5432/postgres'\n"
        )  # => service url
        handle.write("engine = create_engine(url)\n")  # => one engine per run
        handle.write("with engine.connect() as c:\n")  # => context needs a connection
        handle.write(
            "    context.configure(connection=c, version_table='kata09_version')\n"
        )  # => own receipts
        handle.write("    with context.begin_transaction():\n")  # => revision transacts
        handle.write("        context.run_migrations()\n")  # => run the range
    revs = [  # => files describe the schema the database already has
        (
            "k09a1",
            None,
            "    op.create_table('kata09_legacy',\n"
            "        sa.Column('id', sa.Integer(), primary_key=True),\n"
            "        sa.Column('name', sa.Text(), nullable=False))\n",
            "    op.drop_table('kata09_legacy')\n",
        ),
        (
            "k09b1",
            "k09a1",
            "    op.add_column('kata09_legacy',\n"
            "        sa.Column('email', sa.Text(), nullable=True))\n",
            "    op.drop_column('kata09_legacy', 'email')\n",
        ),
    ]  # => k09a1 matches legacy; k09b1 moves it forward
    for rev, down, up, dn in revs:  # => write every file
        down_repr = "None" if down is None else f"'{down}'"  # => base is bare None
        with open(
            os.path.join(vdir, f"{rev}_legacy.py"), "w"
        ) as handle:  # => id-prefixed file
            handle.write('"""kata09 legacy."""\n')  # => human-readable doc
            handle.write("from alembic import op\n")  # => DDL verbs
            handle.write("import sqlalchemy as sa\n")  # => column types
            handle.write(f"revision = '{rev}'\n")  # => fixed id
            handle.write(f"down_revision = {down_repr}\n")  # => chain order
            handle.write("def upgrade():\n")  # => forward step
            handle.write(up)  # => caller-supplied DDL
            handle.write("def downgrade():\n")  # => reverse step
            handle.write(dn)  # => caller-supplied reverse
    cfg = Config()  # => drive Alembic without ini
    cfg.set_main_option("script_location", sdir)  # => scratch scripts
    cfg.set_main_option("version_table", "kata09_version")  # => own receipts
    host = os.environ.get("PGHOST", "localhost")  # => same host
    user = os.environ.get("PGUSER", "postgres")  # => same user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => direct engine
    with engine.begin() as conn:  # => legacy setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata09_legacy"))  # => start clean
        conn.execute(
            text("DROP TABLE IF EXISTS kata09_version")
        )  # => no receipts either
        conn.execute(
            text(
                "CREATE TABLE kata09_legacy (id SERIAL PRIMARY KEY, name TEXT NOT NULL)"
            )
        )  # => legacy handiwork
        conn.execute(
            text("INSERT INTO kata09_legacy (name) VALUES ('ada'), ('grace')")
        )  # => real data, no revision
    command.stamp(cfg, "k09a1")  # => THE act: declare the past without replaying it
    command.upgrade(cfg, "head")  # => only k09b1 runs: the honest delta
    with engine.connect() as conn:  # => one connection for checks
        ctx = MigrationContext.configure(
            conn, opts={"version_table": "kata09_version"}
        )  # => own receipts
        current = ctx.get_current_heads()  # => where the database stands
        rows = conn.execute(
            text("SELECT COUNT(*) FROM kata09_legacy")
        ).scalar()  # => legacy rows intact
    cols = sorted(
        c["name"] for c in sa_inspect(engine).get_columns("kata09_legacy")
    )  # => final shape, sorted
    print(f"current: {current[0]}")  # => Output line: stamped past, migrated present
    print(f"rows: {rows}")  # => Output line: both legacy rows survived
    print(f"columns: {cols}")  # => Output line: old shape plus the new column
    print("kata ok")  # => Output line: adopted, not replayed
    shutil.rmtree(sdir, ignore_errors=True)  # => WHY clean: scratch leaves no trace


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
```

**Output** (`drilling/code/kata-09-baseline-without-losing-data/expected/main.stdout.txt`):

```text
current: k09b1
rows: 2
columns: ['email', 'id', 'name']
kata ok
```

## Self-check checklist

Mark each item only when you can demonstrate it without notes: run the mapped kata or example, predict the output, then explain the why to someone else. An item you can perform but not explain is half learned — revisit the lesson section before marking it done. Review unchecked items weekly: the list doubles as a spaced-repetition schedule, and the items that stay unchecked for a month point at the course sections worth re-reading end to end.

1. [ ] I can write a revision file with identity, parent link, and both directions, and explain which part orders history. (co-01)
2. [ ] I can choose fixed revision ids and state why generated ids break reproducibility. (co-01)
3. [ ] I can upgrade to a named revision and downgrade one step, predicting the schema after each. (co-02)
4. [ ] I can write `pass` downgrades for data fills and defend the one-way policy. (co-02)
5. [ ] I can read the version table and state which revision the database has reached. (co-03)
6. [ ] I can contrast `current` against `history` output to locate a disagreement. (co-03)
7. [ ] I can list heads and compute how many merges N tips require. (co-04)
8. [ ] I can choose merge versus rebase for a shared versus private branch. (co-04)
9. [ ] I can make a migration rerunnable and name the three common rerun-breakers. (co-05)
10. [ ] I can place a backfill in its own revision after the schema change. (co-06)
11. [ ] I can verify a backfill with null-count and checksum queries. (co-06)
12. [ ] I can split a breaking change into expand, migrate, and contract stops. (co-07)
13. [ ] I can land a new column nullable and tighten it only after the fill. (co-07)
14. [ ] I can roll back one step and state exactly what the rollback cannot restore. (co-08)
15. [ ] I can predict which unrelated tables and rows survive a downgrade. (co-08)
16. [ ] I can detect schema drift by comparing history, receipts, and reflection. (co-09)
17. [ ] I can explain what a stamp-versus-reality mismatch implies about the past. (co-09)
18. [ ] I can baseline a legacy database with stamp without replaying or losing data. (co-10)
19. [ ] I can explain why editing an applied migration corrupts every downstream diagnosis. (co-11)
20. [ ] I can keep each migration in its own transaction and bound its lock window. (co-12)
21. [ ] I can migrate every environment with the same files in the same order. (co-13)
22. [ ] I can resolve a two-developer fork with a merge revision and verify the join. (co-14)
23. [ ] I can replace a locking migration with NOT VALID, batching, or a split step. (co-15)
24. [ ] I can test a migration twice — roundtrip plus byte-identical re-upgrade — before shipping. (co-16)

## Elaborative interrogation & self-explanation

Answer each prompt in writing before reading the model answer: name the choice, name the rejected alternative, and state the exact failure the choice prevents. A prompt you answer with slogans instead of mechanisms is still open — rework it with the mapped example running beside you.

### Prompt 1: Why separate revisions for schema and data — and why not combine them for fewer files?

The rejected alternative is the combined revision: add the column and fill it in one file, one deploy, one receipt. The model answer: combined revisions couple the DDL lock to the data volume, so slow rows hold the schema lock and a fill failure rolls back structure that was fine. Separate revisions deploy, fail, and roll back independently — Monday's schema ships in Monday's window, Tuesday's fill in Tuesday's, and either can be reasoned about alone.

### Prompt 2: Why stamp a legacy database — and why not replay history onto it from base?

The rejected alternative is replay: run every migration from the first revision and arrive at the present honestly. The model answer: replay destroys what it cannot recreate — years of accumulated data — and re-running years of DDL against a live schema risks collisions with objects that already exist under slightly different definitions. Stamp declares the verified present; only the delta migrates; the rows never move.

### Prompt 3: Why merge with an empty revision — and why not just point one branch at the other?

The rejected alternative is reparenting: rewrite one tip's `down_revision` to the other tip and call the line straight. The model answer: reparenting rewrites shared history — every checkout holding the old link now disagrees about the past, and the rewritten file's hash no longer matches any receipt. The empty merge preserves both lines exactly as their authors wrote them and records the join as its own fact.

### Prompt 4: Why NOT VALID plus VALIDATE — and why not add the constraint in one step?

The rejected alternative is the single validated `CHECK`: one statement, one lock, done. The model answer: the single statement scans every row while holding a lock that blocks writes — on a large table the deploy window becomes the scan duration, and any concurrent write queues behind it. `NOT VALID` installs the rule for new rows in a cheap lock; `VALIDATE` checks old rows in a second cheap lock; between them the table stays writable and each lock is bounded.

### Prompt 5: Why test downgrade as well as upgrade — and why isn't upgrade-green sufficient?

The rejected alternative is forward-only testing: the deploy only moves forward, so only forward needs proof. The model answer: deploys move forward until the night one must move back, and an untested downgrade is discovered exactly then — under pressure, against production data, with no rehearsal. The roundtrip test converts rollback from improvisation into procedure; upgrade-green proves the plan, downgrade-green proves the exit.

### Prompt 6: Why pin every dependency hash — and what is the cost of the discipline?

The rejected alternative is floating pins: `alembic>=1.20` and trust the resolver, reviewing nothing. The model answer: floating pins make two runs of the same migration potentially different programs — a new SQLAlchemy rendering, a new psycopg default — and a migration that behaves differently on rerun is not a record but a rumor. The cost is real: pin diffs to review, hashes to refresh, lockfiles to carry. The course pays it because migrations outlive the session that wrote them, and the receipt must mean the same bytes everywhere it is read.
