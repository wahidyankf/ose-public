---
title: "Overview"
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Drilling turns recognition into recall: twenty-four questions covering all sixteen concepts, eight applied problems drawn from real maintenance work, eight hands-on katas with before-and-after solutions, a twenty-four-item self-check, and six design trade-off prompts with model answers. Work the questions closed-book, then check against the detail blocks; run every kata in the harness. The method is retrieval first and verification second: answer from memory, read the model answer, then close the gap by running the mapped example and predicting its output before looking. A question you answer correctly twice, a week apart, is learned; anything else is merely read. For the katas, follow the same loop every time: run the starter and name the smell in one sentence, write your version without peeking at the reference, run it, then diff against the committed solution and account for every difference — a difference you cannot explain is a habit you have not learned yet. Keep a personal log of which questions you miss; the second pass through this page should take half the time of the first, and the items still red on the third pass are the ones to turn into flashcards.

## Recall Q&A

### Q1 (co-01): What three parts does a migration version carry, and which one orders history?

<details>
<summary>Model answer</summary>

A version carries its ID (the timestamped name), its Up (the forward change), and its Down (the reverse). The ID orders history: `Migrate()` sorts versions by ID and applies them in that order, so naming is sequencing.

</details>

### Q2 (co-01): Why must version IDs be fixed, reviewable strings instead of generated stamps?

<details>
<summary>Model answer</summary>

Generated stamps differ per machine and per run, so two developers would sequence the same content differently. A fixed string in source control means every checkout, every environment, and every rerun agrees on the order before anything runs.

</details>

### Q3 (co-02): What belongs in Up, and what belongs in Down?

<details>
<summary>Model answer</summary>

Up carries the forward change that moves the schema toward its new shape; Down carries the exact reverse that restores the old shape. Both ship in the same version so every step forward declares its own way back.

</details>

### Q4 (co-03): What does the history table store, and who writes to it?

<details>
<summary>Model answer</summary>

One row per applied version: the `MigrationId` and the `ProductVersion` of the EF Core build that applied it. EF Core itself writes the row inside the same transaction as the version, so history and schema can never disagree about what ran.

</details>

### Q5 (co-03): How do applied and pending differ as diagnostics?

<details>
<summary>Model answer</summary>

Applied versions committed and recorded — they are the past. Pending versions ship in the assembly but have no history row — they are the future. After a failure, the first pending name is the patient and everything before it held.

</details>

### Q6 (co-04): How do you list pending versions, and what does the count mean?

<details>
<summary>Model answer</summary>

`GetPendingMigrations()` returns the shipped-but-unapplied versions in ID order. The count is the deploy's remaining work: zero means the database matches the assembly, nonzero names exactly what a migrate would still do.

</details>

### Q7 (co-04): What creates a fork in history, and what does it block?

<details>
<summary>Model answer</summary>

Two versions claiming the same ID — usually two branches numbering blind — create the fork. `Migrate()` refuses the whole assembly at discovery time, so the fork blocks every later version until someone renumbers, which is the protection working as designed.

</details>

### Q8 (co-05): What makes a backfill idempotent, and how do you prove it?

<details>
<summary>Model answer</summary>

A `WHERE <column> IS NULL` guard so filled rows never change, plus migration history so applied versions never re-run. Prove it by migrating twice and showing identical output: the second run must be a provable no-op.

</details>

### Q9 (co-06): When does a change need a backfill step versus a schema-only change?

<details>
<summary>Model answer</summary>

A backfill is needed when existing rows must gain values the old schema never held — a new column over a non-empty table, a derived name, a computed total. Pure shape changes with no old-row obligation (an empty table's column, an index) stay schema-only.

</details>

### Q10 (co-06): Why must the fill live in its own version instead of inside the schema change?

<details>
<summary>Model answer</summary>

Separate versions separate review, rollback, and retry: the schema step is DDL risk, the fill is data risk, and coupling them forces one decision about two different dangers. A fill in its own version can re-run, be tuned, or be reverted without touching the structure it fills.

</details>

### Q11 (co-07): What are the expand and contract steps of a zero-downtime rename?

<details>
<summary>Model answer</summary>

Expand adds the replacement column while the old one still serves; contract drops the old column after every reader moved. Between them sit dual writes, the copy, and the reader migration — each its own deployable step.

</details>

### Q12 (co-07): Why must readers move before the drop, and how do you prove they did?

<details>
<summary>Model answer</summary>

Any reader still naming the old column breaks the instant it vanishes, including forgotten cron jobs. Prove the move by running the full workload against the expanded schema and observing zero old-column reads before the drop version ships.

</details>

### Q13 (co-08): What is a forward fix, and when does it beat migrating back?

<details>
<summary>Model answer</summary>

A forward fix is a new version that repairs a bad deploy's effect — dropping the bad column, restoring the good shape — instead of rolling history backward. It beats migrate-back when later versions already built on the bad state, or when other environments already ran it and must converge forward too.

</details>

### Q14 (co-08): Why does rolling back keep unrelated data?

<details>
<summary>Model answer</summary>

Each Down reverses only its own version's change — dropping the column its Up added, recreating the table its Up dropped. Rows and tables other versions own are never in the statement's path, so unrelated data survives every rollback by construction.

</details>

### Q15 (co-09): What is drift, and how do you detect it?

<details>
<summary>Model answer</summary>

Drift is any live-schema difference no version describes: a hand-added column, a DBA's index, a script nobody committed. Detect it with a set difference — live columns minus modeled columns — run as a query on a schedule, not as an occasional feeling.

</details>

### Q16 (co-09): Why repair drift with a new version instead of editing the old migration?

<details>
<summary>Model answer</summary>

Editing history rewrites every environment's past and invalidates every audit that read the old bytes. A compensating version records that drift happened and what fixed it, keeping the timeline exactly as it occurred for the next investigation to read.

</details>

### Q17 (co-10): What does a baseline row assert, and what must it never do?

<details>
<summary>Model answer</summary>

It asserts that the legacy schema already satisfies the stamped version's outcome — the table exists as `M01` would have built it. It must never touch data or structure: the stamp is declarative, so adoption is reversible and auditable by inspection.

</details>

### Q18 (co-10): How do you prove a legacy table twins its baseline version?

<details>
<summary>Model answer</summary>

Compare column by column: the hand-built table's names, types, and nullability against the migration model's. The twin check fails on any missing or extra name, and only a passing twin earns the stamp.

</details>

### Q19 (co-11): Why do edited, already-applied migrations never re-apply, and what is the rule?

<details>
<summary>Model answer</summary>

EF Core keys re-application on version IDs, not on content: an applied ID means done, whatever the file now says. The rule is absolute — applied means frozen — so every correction ships as a new version and fresh databases are the only place edited content executes.

</details>

### Q20 (co-12): What does per-version atomicity guarantee when the third of three versions fails?

<details>
<summary>Model answer</summary>

Each version commits in its own transaction, so the first two stay applied and recorded while the third rolls back entirely. Recovery fixes one version forward; the chain never needs rebuilding and the history always describes states the database actually reached.

</details>

### Q21 (co-13): How do dev, test, and production histories relate at any moment?

<details>
<summary>Model answer</summary>

Each environment holds a prefix of the same linear history at a different cursor: dev furthest ahead, production furthest behind. Promotion moves cursors along one line — never a selection — so every stage validates exactly what the next stage will run.

</details>

### Q22 (co-14): How do you repair duplicate version IDs across branches?

<details>
<summary>Model answer</summary>

The losing branch renumbers onto the head: same content, next free stamp. Identity yields while content survives, and the merged history reads as one line again. Pulling before numbering prevents the next collision.

</details>

### Q23 (co-15): What lock does DDL take, and how do you bound the wait?

<details>
<summary>Model answer</summary>

Schema changes take `ACCESS EXCLUSIVE`, conflicting with everything including reads. Bound the wait with `lock_timeout` so contended DDL fails fast instead of queueing, then retry the identical statement once the lock clears — timing, not text, decides.

</details>

### Q24 (co-16): How do you verify a migration's effect with an automated check?

<details>
<summary>Model answer</summary>

Assert the outcome, not the process: a golden query aggregating the resulting rows into a recorded transcript, a post-migrate seal counting applied plus pending plus final shape, or a pending-list read naming the broken version. The program prints, the harness judges, humans review diffs.

</details>

## Applied problems

### AP1: Split the breaking rename

A `Name` column must become `FullName` on a table with ten thousand rows while the application serves traffic. Write the version plan — expand, dual-write window, copy, reader move, contract — naming what each version does, what each deploy runs, and what the rollback of each step is. (Maps to Examples 35–41.)

### AP2: Resolve the branch collision

Two branches both shipped `20260101000002` against the same table: ana's adds `Zone`, budi's adds `Color`. Neither has deployed. Write the repair sequence — who renumbers to what, what the merged history lists, and which query proves the merge converged. (Maps to Examples 54–61.)

### AP3: Diagnose the partial migration

A deploy log shows `Migrate()` threw after two of four versions, and the application now errors on a missing column. List the exact queries you run — history read, pending read, column diff — the order you run them, and what each answer tells you about which version broke and what it touched. (Maps to Examples 71–78.)

### AP4: Design the backfill

A new non-nullable `Status` column must land on an orders table with existing rows, and the fill derives each status from the order's total. Write the three versions — nullable add, guarded fill, constrain — with the `WHERE` guard, the golden verification query, and the rule the `NOT NULL` version asserts before it may ship. (Maps to Examples 26–34.)

### AP5: Adopt the legacy database

A production database built by hand has twelve tables and no history. Write the adoption plan: how you twin each table against a new `M01`, what the baseline `INSERT` stamps, which queries prove data neutrality, and where the first drift check runs. (Maps to Examples 45–53.)

### AP6: Guard the hot-table migration

An `ALTER TABLE` must run against a table taking two thousand writes per second. Write the lock plan: the timeout bound, the fail-fast behavior on `55P03`, the retry condition, and the evidence you collect that readers saw a stable snapshot throughout. (Maps to Examples 62–70.)

### AP7: Gate the promotion

Four versions are ready to move from test to production. Write the promotion gate: the seal query counting applied plus pending plus final shape, the decision rule for go versus hold, and the rollback cursor for each version if the next environment rejects it. (Maps to Examples 61, 77.)

### AP8: Answer the orphan row

The history table names a version the assembly no longer ships. Write the investigation: the membership query that proves the orphan, the questions you ask before deleting the row, and the version you add so the timeline records what happened. (Maps to Examples 72–73.)

## Code katas

Eight hands-on katas. Each starts from the `Before` starter, and the `After` reference shows one good solution with its recorded output. Write your version before peeking at the reference, then diff and account for every difference. Work them in order: migration and rollback first, because honesty about direction underlies everything; data steps next, because fills follow schema; baselines, forward fixes, and diagnosis after, because each isolates one production judgement. Run the reference in the harness after diffing: your version and the reference must both exit green, and any output difference is a behavior difference to explain, not a formatting quirk to ignore.

### Kata 01: Write Migration and Rollback

(Concepts: co-01, co-02.)

Write your first migration and its rollback from nothing: a new table with a forward create plus an alter, applied and rolled back in one program.

The starter below migrates but prints only the up count — no alter exists yet and nothing migrates back. Add `M02`, migrate up to print both counts, then migrate back to `M01` and prove one version remains.

**`drilling/code/kata-01-write-migration-and-rollback/before/Program.cs`**:

```csharp
// Kata 1 starter: write the migration and its rollback.
// Fix me: add M02 (an alter), migrate up, migrate back, print both counts.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas1Db( // => one context per program run
    new DbContextOptionsBuilder<Katas1Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => fix me: only M01 exists yet
Console.WriteLine($"up={ctx.Database.GetAppliedMigrations().Count()}"); // => fix me: print up=2 then migrate back and print back=1

public class Kata1Item // => the entity mapped to the Katas1 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Name { get; set; } = ""; // => required name column
} // => entity ends here

public class Katas1Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas1Db(DbContextOptions<Katas1Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata1Item> Katas1 => Set<Kata1Item>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-01-write-migration-and-rollback/before/Migrations.cs`**:

```csharp
// Kata 1 starter migrations: only M01 exists.
// Fix me: add M02 with an alter of your own.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas1Db))] // => bind this version to the Katas1Db context
[Migration("20260101000001_CreateKatas1")] // => first version: the create
public partial class CreateKatas1 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas1", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => kata name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas1", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas1"
        ); // => drop what Up created
    } // => reverse change ends
} // => migration class ends

// Fix me: add M02 here with [Migration("20260101000002_...")] and an alter.
```

**`drilling/code/kata-01-write-migration-and-rollback/after/Program.cs`**:

```csharp
// Kata 1 solution: M02 alters, the program verifies both directions.
// Migrate up applies two; migrate back to M01 leaves one.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas1Db( // => one context per program run
    new DbContextOptionsBuilder<Katas1Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => apply M01 then M02 in ID order
string up = ctx.Database.GetAppliedMigrations().Count().ToString(); // => two versions after the full migrate
ctx.Database.Migrate("20260101000001_CreateKatas1"); // => migrate back: M02.Down runs
Console.WriteLine($"up={up} back={ctx.Database.GetAppliedMigrations().Count()}"); // => Output: up=2 back=1

public class Kata1Item // => the entity mapped to the Katas1 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Name { get; set; } = ""; // => required name column
    public string? Note { get; set; } // => nullable note added by M02
} // => entity ends here

public class Katas1Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas1Db(DbContextOptions<Katas1Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata1Item> Katas1 => Set<Kata1Item>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-01-write-migration-and-rollback/after/Migrations.cs`**:

```csharp
// Kata 1 solution migrations: M01 creates, M02 alters.
// The program migrates up to M02, then back to M01.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas1Db))] // => bind this version to the Katas1Db context
[Migration("20260101000001_CreateKatas1")] // => first version: the create
public partial class CreateKatas1 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas1", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => kata name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas1", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas1"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas1Db))] // => bind this version to the Katas1Db context
[Migration("20260101000002_AddNoteK1")] // => second version: the alter to verify
public partial class AddNoteK1 : Migration // => the rollback target runs this Down
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Note", // => new column the program reads back
            table: "Katas1", // => the table M01 created
            type: "text", // => free-form note text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Note", // => the column Up added
            table: "Katas1"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
```

**Output** (`drilling/code/kata-01-write-migration-and-rollback/expected/main.stdout.txt`):

```text
up=2 back=1
```

### Kata 02: Add Backfill Step

(Concepts: co-06.)

Add the data step an existing schema change is missing: `M02` added `Points` but nothing fills it. Write the backfill version, migrate, and verify every row carries the fill.

The starter below leaves `Points` null on every row. Write `M03` with a guarded `UPDATE`, migrate, and let the count prove the fill reached all rows.

**`drilling/code/kata-02-add-backfill-step/before/Program.cs`**:

```csharp
// Kata 2 starter: add the backfill step.
// Fix me: write M03 with an UPDATE that fills Points, then migrate and verify.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas2Db( // => one context per program run
    new DbContextOptionsBuilder<Katas2Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => fix me: M03 is missing, so Points stays empty
Console.WriteLine("backfill=todo"); // => fix me: print backfill=2 after writing M03

public class Kata2Score // => the entity mapped to the Katas2 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Player { get; set; } = ""; // => required player column
    public int? Points { get; set; } // => nullable until the M03 backfill fills it
} // => entity ends here

public class Katas2Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas2Db(DbContextOptions<Katas2Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata2Score> Katas2 => Set<Kata2Score>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-02-add-backfill-step/before/Migrations.cs`**:

```csharp
// Kata 2 starter migrations: create and alter, no backfill yet.
// Fix me: add M03 with migrationBuilder.Sql filling every missing Points.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas2Db))] // => bind this version to the Katas2Db context
[Migration("20260101000001_CreateKatas2")] // => first version: the create
public partial class CreateKatas2 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas2", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Player = table.Column<string>(type: "text", nullable: false), // => kata player, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas2", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas2"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas2Db))] // => bind this version to the Katas2Db context
[Migration("20260101000002_AddPointsK2")] // => second version: only the schema step
public partial class AddPointsK2 : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<int>( // => grow the table by one column
            name: "Points", // => new column the missing backfill fills
            table: "Katas2", // => the table M01 created
            type: "integer", // => whole-unit point counts
            nullable: true
        ); // => nullable until the backfill fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Points", // => the column Up added
            table: "Katas2"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

// Fix me: add M03 here with an UPDATE filling every missing Points.
```

**`drilling/code/kata-02-add-backfill-step/after/Program.cs`**:

```csharp
// Kata 2 solution: M03 backfills every missing Points with fifty.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas2Db( // => one context per program run
    new DbContextOptionsBuilder<Katas2Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

void Exec(string sql) // => raw writes list only columns that exist now
{ // => exec block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => the seeding write
    cmd.ExecuteNonQuery(); // => run it, ignore the count
} // => exec helper ends here

string Scalar(string sql) // => one-row, one-column inspection queries
{ // => scalar block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => read-only inspection SQL
    object? value = cmd.ExecuteScalar(); // => the single answer
    return value?.ToString() ?? "null"; // => text for printing, null-safe
} // => scalar helper ends here

ctx.Database.Migrate("20260101000001_CreateKatas2"); // => apply only M01 first
Exec("DELETE FROM \"Katas2\""); // => start from zero rows so the double run prints alike
Exec("INSERT INTO \"Katas2\" (\"Player\") VALUES ('wati'), ('agus')"); // => two players, points missing
ctx.Database.Migrate(); // => M02 adds Points, M03 fills every row
Console.WriteLine($"backfill={Scalar("SELECT count(*) FROM \"Katas2\" WHERE \"Points\" = 50")}"); // => Output: backfill=2

public class Kata2Score // => the entity mapped to the Katas2 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Player { get; set; } = ""; // => required player column
    public int? Points { get; set; } // => nullable until the M03 backfill fills it
} // => entity ends here

public class Katas2Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas2Db(DbContextOptions<Katas2Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata2Score> Katas2 => Set<Kata2Score>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-02-add-backfill-step/after/Migrations.cs`**:

```csharp
// Kata 2 solution migrations: create, alter, backfill.
// M03 fills every missing Points with fifty.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas2Db))] // => bind this version to the Katas2Db context
[Migration("20260101000001_CreateKatas2")] // => first version: the create
public partial class CreateKatas2 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas2", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Player = table.Column<string>(type: "text", nullable: false), // => kata player, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas2", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas2"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas2Db))] // => bind this version to the Katas2Db context
[Migration("20260101000002_AddPointsK2")] // => second version: only the schema step
public partial class AddPointsK2 : Migration // => schema first, data second
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<int>( // => grow the table by one column
            name: "Points", // => new column the backfill fills
            table: "Katas2", // => the table M01 created
            type: "integer", // => whole-unit point counts
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Points", // => the column Up added
            table: "Katas2"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Katas2Db))] // => bind this version to the Katas2Db context
[Migration("20260101000003_FillPointsK2")] // => third version: the data step
public partial class FillPointsK2 : Migration // => data rides its own version
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Katas2\" SET \"Points\" = 50 WHERE \"Points\" IS NULL"); // => every missing score starts at fifty
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Katas2\" SET \"Points\" = NULL"); // => undo clears the filled scores
    } // => reverse change ends
} // => third migration ends here
```

**Output** (`drilling/code/kata-02-add-backfill-step/expected/main.stdout.txt`):

```text
backfill=2
```

### Kata 03: Baseline Existing Database

(Concepts: co-10.)

Baseline a hand-built legacy table without touching its rows: stamp the history so `M01` counts as applied, then migrate the extension over live data.

The starter below builds the legacy table but never stamps it, so `Migrate()` would replay the create onto existing tables. Write the history-row `INSERT`, migrate, and let the history count prove adoption.

**`drilling/code/kata-03-baseline-existing-database/before/Program.cs`**:

```csharp
// Kata 3 starter: baseline the existing database.
// Fix me: write the history-row INSERT for M01, then migrate and verify.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas3Db( // => one context per program run
    new DbContextOptionsBuilder<Katas3Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

void Exec(string sql) // => out-of-band writes simulate the legacy database
{ // => exec block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => the legacy write, no migration involved
    cmd.ExecuteNonQuery(); // => run it, ignore the count
} // => exec helper ends here

Exec("DROP TABLE IF EXISTS \"Katas3\""); // => reset the legacy table for the double run
Exec(
    "CREATE TABLE \"Katas3\" (\"Id\" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, \"Code\" text NOT NULL)"
); // => the legacy table, built by hand

// Fix me: create the history table shape, insert the M01 baseline row, migrate.
Console.WriteLine("baseline=todo"); // => fix me: print baseline=2 after the baseline row lands

public class Kata3Row // => the entity mapped to the Katas3 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Code { get; set; } = ""; // => legacy code column, required
    public string? Note { get; set; } // => nullable note added by M02
} // => entity ends here

public class Katas3Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas3Db(DbContextOptions<Katas3Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata3Row> Katas3 => Set<Kata3Row>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-03-baseline-existing-database/before/Migrations.cs`**:

```csharp
// Kata 3 starter migrations: M01 twins the legacy table, M02 extends it.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas3Db))] // => bind this version to the Katas3Db context
[Migration("20260101000001_CreateKatas3")] // => first version: matches the legacy table
public partial class CreateKatas3 : Migration // => M01 twins the out-of-band table
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the twin of the legacy CREATE TABLE
            name: "Katas3", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => legacy code column, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas3", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas3"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas3Db))] // => bind this version to the Katas3Db context
[Migration("20260101000002_AddNoteK3")] // => second version: the first versioned change
public partial class AddNoteK3 : Migration // => new work starts after the baseline
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Note", // => new column the program reads back
            table: "Katas3", // => the table the baseline adopted
            type: "text", // => free-form note text
            nullable: true
        ); // => nullable so legacy rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Note", // => the column Up added
            table: "Katas3"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
```

**`drilling/code/kata-03-baseline-existing-database/after/Program.cs`**:

```csharp
// Kata 3 solution: the history row baselines M01, Migrate applies M02.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas3Db( // => one context per program run
    new DbContextOptionsBuilder<Katas3Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

void Exec(string sql) // => out-of-band writes simulate the legacy database
{ // => exec block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => the legacy write, no migration involved
    cmd.ExecuteNonQuery(); // => run it, ignore the count
} // => exec helper ends here

string Scalar(string sql) // => one-row, one-column inspection queries
{ // => scalar block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => read-only inspection SQL
    object? value = cmd.ExecuteScalar(); // => the single answer
    return value?.ToString() ?? "null"; // => text for printing, null-safe
} // => scalar helper ends here

Exec("DROP TABLE IF EXISTS \"Katas3\""); // => reset the legacy table for the double run
Exec(
    "CREATE TABLE IF NOT EXISTS \"__EFMigrationsHistory\" (\"MigrationId\" character varying(150) NOT NULL CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY, \"ProductVersion\" character varying(32) NOT NULL)"
); // => EF history shape, created out of band
Exec("DELETE FROM \"__EFMigrationsHistory\""); // => clean slate for this program run
Exec(
    "CREATE TABLE \"Katas3\" (\"Id\" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, \"Code\" text NOT NULL)"
); // => the legacy table, built by hand
Exec(
    "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('20260101000001_CreateKatas3', '10.0.4')"
); // => the baseline: M01 counts as applied
ctx.Database.Migrate(); // => M01 skipped, M02 applied
Console.WriteLine($"baseline={Scalar("SELECT count(*) FROM \"__EFMigrationsHistory\"")}"); // => Output: baseline=2

public class Kata3Row // => the entity mapped to the Katas3 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Code { get; set; } = ""; // => legacy code column, required
    public string? Note { get; set; } // => nullable note added by M02
} // => entity ends here

public class Katas3Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas3Db(DbContextOptions<Katas3Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata3Row> Katas3 => Set<Kata3Row>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-03-baseline-existing-database/after/Migrations.cs`**:

```csharp
// Kata 3 starter migrations: M01 twins the legacy table, M02 extends it.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas3Db))] // => bind this version to the Katas3Db context
[Migration("20260101000001_CreateKatas3")] // => first version: matches the legacy table
public partial class CreateKatas3 : Migration // => M01 twins the out-of-band table
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the twin of the legacy CREATE TABLE
            name: "Katas3", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => legacy code column, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas3", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas3"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas3Db))] // => bind this version to the Katas3Db context
[Migration("20260101000002_AddNoteK3")] // => second version: the first versioned change
public partial class AddNoteK3 : Migration // => new work starts after the baseline
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Note", // => new column the program reads back
            table: "Katas3", // => the table the baseline adopted
            type: "text", // => free-form note text
            nullable: true
        ); // => nullable so legacy rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Note", // => the column Up added
            table: "Katas3"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here
```

**Output** (`drilling/code/kata-03-baseline-existing-database/expected/main.stdout.txt`):

```text
baseline=2
```

### Kata 04: Forward Fix for Bad Deploy

(Concepts: co-08.)

A deployed `M02` added a bad column; rolling history back is not an option. Ship the forward fix as a new version that drops the mistake, then migrate and prove the table matches the intended shape.

The starter below carries the bad column with no repair in sight. Write `M03` dropping it, migrate, and let the column check prove the fix converged.

**`drilling/code/kata-04-forward-fix-for-bad-deploy/before/Program.cs`**:

```csharp
// Kata 4 starter: ship the forward fix for the bad deploy.
// Fix me: M02 added a bad column; write M03 dropping it, then migrate and verify.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas4Db( // => one context per program run
    new DbContextOptionsBuilder<Katas4Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => fix me: M03 is missing, so the bad column stays
Console.WriteLine("fixed=todo"); // => fix me: print fixed=1 after the forward fix lands

public class Kata4Member // => the entity mapped to the Katas4 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Name { get; set; } = ""; // => required name column
} // => entity ends here

public class Katas4Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas4Db(DbContextOptions<Katas4Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata4Member> Katas4 => Set<Kata4Member>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-04-forward-fix-for-bad-deploy/before/Migrations.cs`**:

```csharp
// Kata 4 starter migrations: create plus the bad column.
// Fix me: add M03 dropping the BadFlag column M02 added by mistake.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas4Db))] // => bind this version to the Katas4Db context
[Migration("20260101000001_CreateKatas4")] // => first version: the create
public partial class CreateKatas4 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas4", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => kata name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas4", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas4"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas4Db))] // => bind this version to the Katas4Db context
[Migration("20260101000002_AddBadFlag")] // => second version: the bad deploy
public partial class AddBadFlag : Migration // => the mistake the fix removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => the mistaken column M03 drops
            name: "BadFlag", // => bad-deployer flag, removed by the fix
            table: "Katas4", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: false, // => every row gets a value
            defaultValue: false
        ); // => existing rows start calm
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "BadFlag", // => the column Up added
            table: "Katas4"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

// Fix me: add M03 here dropping the BadFlag column going forward.
```

**`drilling/code/kata-04-forward-fix-for-bad-deploy/after/Program.cs`**:

```csharp
// Kata 4 solution: M03 drops the bad column going forward.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas4Db( // => one context per program run
    new DbContextOptionsBuilder<Katas4Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

string Scalar(string sql) // => one-row, one-column inspection queries
{ // => scalar block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => read-only inspection SQL
    object? value = cmd.ExecuteScalar(); // => the single answer
    return value?.ToString() ?? "null"; // => text for printing, null-safe
} // => scalar helper ends here

ctx.Database.Migrate(); // => apply M01, M02, and the M03 forward fix
string bad = Scalar(
    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'Katas4' AND column_name = 'BadFlag'"
); // => bad column gone
Console.WriteLine(
    $"fixed={(bad == "0" ? 1 : 0)} history={Scalar("SELECT count(*) FROM \"__EFMigrationsHistory\"")}"
); // => Output: fixed=1 history=3

public class Kata4Member // => the entity mapped to the Katas4 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Name { get; set; } = ""; // => required name column
} // => entity ends here

public class Katas4Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas4Db(DbContextOptions<Katas4Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata4Member> Katas4 => Set<Kata4Member>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-04-forward-fix-for-bad-deploy/after/Migrations.cs`**:

```csharp
// Kata 4 solution migrations: create, mistake, forward fix.
// M03 drops the BadFlag column M02 added by mistake.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas4Db))] // => bind this version to the Katas4Db context
[Migration("20260101000001_CreateKatas4")] // => first version: the create
public partial class CreateKatas4 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas4", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => kata name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas4", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas4"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas4Db))] // => bind this version to the Katas4Db context
[Migration("20260101000002_AddBadFlag")] // => second version: the bad deploy
public partial class AddBadFlag : Migration // => the mistake the fix removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<bool>( // => the mistaken column M03 drops
            name: "BadFlag", // => bad-deployer flag, removed by the fix
            table: "Katas4", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: false, // => every row gets a value
            defaultValue: false
        ); // => existing rows start calm
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "BadFlag", // => the column Up added
            table: "Katas4"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Katas4Db))] // => bind this version to the Katas4Db context
[Migration("20260101000003_DropBadFlagFix")] // => third version: the forward fix
public partial class DropBadFlagFix : Migration // => rollback by moving forward
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the fix undoes M02 going forward
            name: "BadFlag", // => the mistaken column, now gone
            table: "Katas4"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<bool>( // => undo re-adds what Up dropped
            name: "BadFlag", // => the mistaken column, restored
            table: "Katas4", // => the table M01 created
            type: "boolean", // => true or false, no nulls
            nullable: false, // => every row gets a value
            defaultValue: false
        ); // => existing rows start calm
    } // => reverse change ends
} // => third migration ends here
```

**Output** (`drilling/code/kata-04-forward-fix-for-bad-deploy/expected/main.stdout.txt`):

```text
fixed=1 history=3
```

### Kata 05: Zero Downtime Rename

(Concepts: co-07.)

Finish a zero-downtime rename someone else started: `M01` created the table, `M02` expanded with `Label`, and the rest is up to you. Write the backfill and the contract, then prove both rows survived under the new name.

The starter below expands but never copies and never drops, so the old name still rules. Write `M03` copying `Title` into `Label` and `M04` dropping `Title`, migrate all four, and let the aggregate prove the rename.

**`drilling/code/kata-05-zero-downtime-rename/before/Program.cs`**:

```csharp
// Kata 5 starter: finish the zero-downtime rename.
// Fix me: M01 and M02 exist; write the M03 backfill and the M04 contract.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas5Db( // => one context per program run
    new DbContextOptionsBuilder<Katas5Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => fix me: M03 and M04 are missing, so Title stays
Console.WriteLine("renamed=todo"); // => fix me: print renamed=... with two rows after the contract

public class Kata5Title // => the entity mapped to the Katas5 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Title { get; set; } = ""; // => old title, dropped by the M04 contract
    public string? Label { get; set; } // => new label added by M02
} // => entity ends here

public class Katas5Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas5Db(DbContextOptions<Katas5Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata5Title> Katas5 => Set<Kata5Title>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-05-zero-downtime-rename/before/Migrations.cs`**:

```csharp
// Kata 5 starter migrations: create and expand, no backfill or contract yet.
// Fix me: add M03 copying Title into Label and M04 dropping Title.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000001_CreateKatas5")] // => first version: the create
public partial class CreateKatas5 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas5", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Title = table.Column<string>(type: "text", nullable: false), // => old title, dropped by M04
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas5", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas5"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000002_AddLabelK5")] // => second version: the expand step
public partial class AddLabelK5 : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new name beside the old
            name: "Label", // => new column the missing backfill fills
            table: "Katas5", // => the table M01 created
            type: "text", // => free-form label text
            nullable: true
        ); // => nullable until the backfill fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Label", // => the column Up added
            table: "Katas5"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

// Fix me: add M03 with UPDATE copying Title into Label, and M04 dropping Title.
```

**`drilling/code/kata-05-zero-downtime-rename/after/Program.cs`**:

```csharp
// Kata 5 solution: expand, backfill, contract — the rename lands live.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas5Db( // => one context per program run
    new DbContextOptionsBuilder<Katas5Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

void Exec(string sql) // => raw writes list only columns that exist now
{ // => exec block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => the seeding write
    cmd.ExecuteNonQuery(); // => run it, ignore the count
} // => exec helper ends here

string Scalar(string sql) // => one-row, one-column inspection queries
{ // => scalar block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => read-only inspection SQL
    object? value = cmd.ExecuteScalar(); // => the single answer
    return value?.ToString() ?? "null"; // => text for printing, null-safe
} // => scalar helper ends here

ctx.Database.Migrate("20260101000001_CreateKatas5"); // => apply only M01 first
Exec("DELETE FROM \"Katas5\""); // => start from zero rows so the double run prints alike
Exec("INSERT INTO \"Katas5\" (\"Title\") VALUES ('sabun'), ('sampo')"); // => two old titles under M01
ctx.Database.Migrate(); // => expand, backfill, contract in one release
Console.WriteLine(
    $"renamed={Scalar("SELECT string_agg(\"Label\", ',' ORDER BY \"Label\") FROM \"Katas5\"")} rows={Scalar("SELECT count(*) FROM \"Katas5\"")}"
); // => Output: renamed=sabun,sampo rows=2

public class Kata5Row // => the entity mapped to the Katas5 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string? Label { get; set; } // => post-rename label, filled by M03
} // => entity ends here

public class Katas5Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas5Db(DbContextOptions<Katas5Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata5Row> Katas5 => Set<Kata5Row>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-05-zero-downtime-rename/after/Migrations.cs`**:

```csharp
// Kata 5 solution migrations: expand, backfill, contract.
// Title becomes Label with no downtime: M03 copies, M04 drops.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000001_CreateKatas5")] // => first version: the create
public partial class CreateKatas5 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas5", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Title = table.Column<string>(type: "text", nullable: false), // => old title, dropped by M04
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas5", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas5"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000002_AddLabelK5")] // => second version: the expand step
public partial class AddLabelK5 : Migration // => expand adds, never removes
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => the new name beside the old
            name: "Label", // => new column the backfill fills
            table: "Katas5", // => the table M01 created
            type: "text", // => free-form label text
            nullable: true
        ); // => nullable until M03 fills it
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Label", // => the column Up added
            table: "Katas5"
        ); // => from the table Up altered
    } // => reverse change ends
} // => second migration ends here

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000003_FillLabelK5")] // => third version: the catch-up step
public partial class FillLabelK5 : Migration // => old titles join the new column
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.Sql("UPDATE \"Katas5\" SET \"Label\" = \"Title\" WHERE \"Label\" IS NULL"); // => copy every missing label
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("UPDATE \"Katas5\" SET \"Label\" = NULL"); // => undo clears the copied labels
    } // => reverse change ends
} // => third migration ends here

[DbContext(typeof(Katas5Db))] // => bind this version to the Katas5Db context
[Migration("20260101000004_DropTitleK5")] // => fourth version: the contract step
public partial class DropTitleK5 : Migration // => the old name leaves last
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.DropColumn( // => the rename completes: old name gone
            name: "Title", // => the column M03 replaced
            table: "Katas5"
        ); // => from the table M01 created
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.AddColumn<string>( // => undo restores the old column
            name: "Title", // => the dropped column, restored
            table: "Katas5", // => the table M01 created
            type: "text", // => free-form title text
            nullable: true
        ); // => nullable: dropped data cannot return
    } // => reverse change ends
} // => fourth migration ends here
```

**Output** (`drilling/code/kata-05-zero-downtime-rename/expected/main.stdout.txt`):

```text
renamed=sabun,sampo rows=2
```

### Kata 06: Diagnose Failed Migration

(Concepts: co-03, co-16.)

A migration throws mid-chain: catch it, then read the pending queue to name the broken version. The diagnosis is the deliverable — the fix comes after the evidence.

The starter below lets the throw escape and prints a `todo` placeholder. Wrap the call, print the pending ID, and let the transcript name the gap the next version must close.

**`drilling/code/kata-06-diagnose-failed-migration/before/Program.cs`**:

```csharp
// Kata 6 starter: diagnose the failed migration.
// Fix me: the Migrate call throws; catch it and print the pending gap.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas6Db( // => one context per program run
    new DbContextOptionsBuilder<Katas6Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => fix me: M02 throws; wrap this call
Console.WriteLine("failed-at=todo"); // => fix me: print the pending migration ID

public class Kata6Part // => the entity mapped to the Katas6 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Code { get; set; } = ""; // => required code column
} // => entity ends here

public class Katas6Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas6Db(DbContextOptions<Katas6Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata6Part> Katas6 => Set<Kata6Part>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-06-diagnose-failed-migration/before/Migrations.cs`**:

```csharp
// Kata 6 starter migrations: M01 is sound, M02 fails on the duplicate column.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas6Db))] // => bind this version to the Katas6Db context
[Migration("20260101000001_CreateKatas6")] // => first version: the create
public partial class CreateKatas6 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas6", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => kata code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas6", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas6"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas6Db))] // => bind this version to the Katas6Db context
[Migration("20260101000002_BrokenKata6")] // => second version: the broken alter
public partial class BrokenKata6 : Migration // => this migration always fails
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change fails on migrate
    { // => forward block opens
        migrationBuilder.Sql("ALTER TABLE \"Katas6\" ADD COLUMN \"Extra\" text"); // => the intended alter, valid SQL
        migrationBuilder.Sql("ALTER TABLE \"Katas6\" ADD COLUMN \"Extra\" text"); // => the same column twice: 42701
    } // => forward change ends in failure

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("ALTER TABLE \"Katas6\" DROP COLUMN IF EXISTS \"Extra\""); // => undo drops the partial column
    } // => reverse change ends
} // => second migration ends here
```

**`drilling/code/kata-06-diagnose-failed-migration/after/Program.cs`**:

```csharp
// Kata 6 solution: catch the failure, read the pending list, name the gap.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas6Db( // => one context per program run
    new DbContextOptionsBuilder<Katas6Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
try // => the broken M02 is expected to throw
{ // => try block opens
    ctx.Database.Migrate(); // => M01 commits, M02 rolls back
} // => try ends after the failing call
catch (Exception) // => any provider error counts: the kind is fixed by SQLSTATE
{ // => catch block opens
} // => catch ends here: the failure is the diagnosis input
Console.WriteLine($"failed-at={string.Join(",", ctx.Database.GetPendingMigrations())}"); // => Output: failed-at=20260101000002_BrokenKata6

public class Kata6Part // => the entity mapped to the Katas6 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Code { get; set; } = ""; // => required code column
} // => entity ends here

public class Katas6Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas6Db(DbContextOptions<Katas6Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata6Part> Katas6 => Set<Kata6Part>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-06-diagnose-failed-migration/after/Migrations.cs`**:

```csharp
// Kata 6 starter migrations: M01 is sound, M02 fails on the duplicate column.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas6Db))] // => bind this version to the Katas6Db context
[Migration("20260101000001_CreateKatas6")] // => first version: the create
public partial class CreateKatas6 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas6", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => kata code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas6", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas6"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas6Db))] // => bind this version to the Katas6Db context
[Migration("20260101000002_BrokenKata6")] // => second version: the broken alter
public partial class BrokenKata6 : Migration // => this migration always fails
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change fails on migrate
    { // => forward block opens
        migrationBuilder.Sql("ALTER TABLE \"Katas6\" ADD COLUMN \"Extra\" text"); // => the intended alter, valid SQL
        migrationBuilder.Sql("ALTER TABLE \"Katas6\" ADD COLUMN \"Extra\" text"); // => the same column twice: 42701
    } // => forward change ends in failure

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.Sql("ALTER TABLE \"Katas6\" DROP COLUMN IF EXISTS \"Extra\""); // => undo drops the partial column
    } // => reverse change ends
} // => second migration ends here
```

**Output** (`drilling/code/kata-06-diagnose-failed-migration/expected/main.stdout.txt`):

```text
failed-at=20260101000002_BrokenKata6
```

### Kata 07: Repair Conflicting Versions

(Concepts: co-14.)

Two branches both shipped `...002`: renumber the loser's version to `...003` and migrate the merged line. The repair is identity surgery — content stays, the stamp moves.

The starter below carries the duplicate stamp, so discovery refuses the assembly. Renumber the second branch's version, migrate, and let the applied count prove one linear history.

**`drilling/code/kata-07-repair-conflicting-versions/before/Program.cs`**:

```csharp
// Kata 7 starter: repair the conflicting versions.
// Fix me: both branches wrote ...002; renumber Ben's to ...003 and migrate.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas7Db( // => one context per program run
    new DbContextOptionsBuilder<Katas7Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => fix me: the duplicate ...002 throws here
Console.WriteLine("merged=todo"); // => fix me: print merged=3 after the renumber

public class Kata7Side // => the entity mapped to the Katas7 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Name { get; set; } = ""; // => required name column
} // => entity ends here

public class Katas7Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas7Db(DbContextOptions<Katas7Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata7Side> Katas7 => Set<Kata7Side>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-07-repair-conflicting-versions/before/Migrations.cs`**:

```csharp
// Kata 7 starter migrations: two branches, one stamp.
// Fix me: renumber the second ...002 to ...003 and keep both columns.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000001_CreateKatas7")] // => first version: the agreed create
public partial class CreateKatas7 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas7", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => kata name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas7", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas7"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000002_AddZoneK7")] // => Ana's version: same stamp as Ben's
public partial class AddZoneK7Ana : Migration // => Ana's branch wrote ...002 first
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Zone", // => Ana's column, collides with Ben's stamp
            table: "Katas7", // => the table M01 created
            type: "text", // => free-form zone text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Zone", // => the column Up added
            table: "Katas7"
        ); // => from the table Up altered
    } // => reverse change ends
} // => Ana's migration ends here

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000002_AddZoneK7")] // => Ben's version: the same stamp, the conflict
public partial class AddZoneK7Ben : Migration // => Ben's branch wrote ...002 too
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change never runs
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Color", // => Ben's column, same stamp as Ana's
            table: "Katas7", // => the table M01 created
            type: "text", // => free-form color text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Color", // => the column Up added
            table: "Katas7"
        ); // => from the table Up altered
    } // => reverse change ends
} // => Ben's migration ends here

// Fix me: renumber Ben's ID to 20260101000003_AddColorK7 and rename its class.
```

**`drilling/code/kata-07-repair-conflicting-versions/after/Program.cs`**:

```csharp
// Kata 7 solution: Ben renumbers to ...003; all three versions apply.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas7Db( // => one context per program run
    new DbContextOptionsBuilder<Katas7Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.Migrate(); // => apply M01, M02, renumbered M03 in ID order
Console.WriteLine($"merged={ctx.Database.GetAppliedMigrations().Count()}"); // => Output: merged=3

public class Kata7Side // => the entity mapped to the Katas7 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Name { get; set; } = ""; // => required name column
    public string? Zone { get; set; } // => winner column added by M02
    public string? Color { get; set; } // => loser column renumbered into M03
} // => entity ends here

public class Katas7Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas7Db(DbContextOptions<Katas7Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata7Side> Katas7 => Set<Kata7Side>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-07-repair-conflicting-versions/after/Migrations.cs`**:

```csharp
// Kata 7 solution migrations: the loser renumbers to ...003.
// Ana's ...002 lands first; Ben's change reapplies as ...003.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000001_CreateKatas7")] // => first version: the agreed create
public partial class CreateKatas7 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas7", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Name = table.Column<string>(type: "text", nullable: false), // => kata name, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas7", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas7"
        ); // => drop what Up created
    } // => reverse change ends
} // => first migration ends here

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000002_AddZoneK7")] // => second version: the winner's change
public partial class AddZoneK7Ana : Migration // => Ana's ...002 lands first
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Zone", // => winner column, keeps its stamp
            table: "Katas7", // => the table M01 created
            type: "text", // => free-form zone text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Zone", // => the column Up added
            table: "Katas7"
        ); // => from the table Up altered
    } // => reverse change ends
} // => winner's migration ends here

[DbContext(typeof(Katas7Db))] // => bind this version to the Katas7Db context
[Migration("20260101000003_AddColorK7")] // => third version: the renumbered loser
public partial class AddColorK7Ben : Migration // => Ben's change, renumbered from ...002
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.AddColumn<string>( // => grow the table by one column
            name: "Color", // => loser column, renumbered to ...003
            table: "Katas7", // => the table M01 created
            type: "text", // => free-form color text
            nullable: true
        ); // => nullable so existing rows survive
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropColumn( // => undo removes the added column
            name: "Color", // => the column Up added
            table: "Katas7"
        ); // => from the table Up altered
    } // => reverse change ends
} // => loser's migration ends here
```

**Output** (`drilling/code/kata-07-repair-conflicting-versions/expected/main.stdout.txt`):

```text
merged=3
```

### Kata 08: Lock Guard for Hot Table

(Concepts: co-15.)

A holder session locks the hot table while your DDL waits: bound the wait with a lock timeout, fail fast, release the holder, and retry the identical statement. Same text, different lock world.

The starter below issues the plain DDL with no bound, so it queues behind the holder. Add the timeout, catch the denial, retry clean, and let the transcript prove denied-then-ok.

**`drilling/code/kata-08-lock-guard-for-hot-table/before/Program.cs`**:

```csharp
// Kata 8 starter: guard the hot table with a lock timeout.
// Fix me: the plain DDL below queues behind the holder; bound it and retry.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas8Db( // => one context per program run
    new DbContextOptionsBuilder<Katas8Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

void Exec(string sql) // => raw statements run DDL outside any migration
{ // => exec block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => the statement to run
    cmd.ExecuteNonQuery(); // => run it, ignore the count
} // => exec helper ends here

ctx.Database.Migrate(); // => apply M01: the Katas8 table exists
Exec("ALTER TABLE \"Katas8\" ADD COLUMN IF NOT EXISTS \"Note\" text"); // => fix me: no guard, queues behind holders
Console.WriteLine("retry=todo"); // => fix me: print retry=denied-then-ok with the guard

public class Kata8Hot // => the entity mapped to the Katas8 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Code { get; set; } = ""; // => required code column
} // => entity ends here

public class Katas8Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas8Db(DbContextOptions<Katas8Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata8Hot> Katas8 => Set<Kata8Hot>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-08-lock-guard-for-hot-table/before/Migrations.cs`**:

```csharp
// Kata 8 starter migrations: one hot table to guard.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas8Db))] // => bind this version to the Katas8Db context
[Migration("20260101000001_CreateKatas8")] // => first version: the create
public partial class CreateKatas8 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas8", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => hot code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas8", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas8"
        ); // => drop what Up created
    } // => reverse change ends
} // => migration class ends
```

**`drilling/code/kata-08-lock-guard-for-hot-table/after/Program.cs`**:

```csharp
// Kata 8 solution: fail fast on the held lock, release, retry clean.
using Microsoft.EntityFrameworkCore; // => context, Migrate, and query entry points

string Host() // => one host lookup shared by every connection
{ // => host block opens
    return Environment.GetEnvironmentVariable("PGHOST") ?? "localhost"; // => service alias on the unit network
} // => host lookup ends here

string Port() // => one port lookup shared by every connection
{ // => port block opens
    return Environment.GetEnvironmentVariable("PGPORT") ?? "5432"; // => standard PostgreSQL port
} // => port lookup ends here

string Db() // => one database lookup shared by every connection
{ // => database block opens
    return Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres"; // => the service database name
} // => database lookup ends here

string DbUser() // => one user lookup shared by every connection
{ // => user block opens
    return Environment.GetEnvironmentVariable("PGUSER") ?? "postgres"; // => trust-auth superuser, no password
} // => user lookup ends here

string ConnectionString() // => one builder for the Npgsql connection string
{ // => string block opens
    return $"Host={Host()};Port={Port()};Database={Db()};Username={DbUser()}"; // => trust auth needs no password
} // => connection string ends here

using var ctx = new Katas8Db( // => one context per program run
    new DbContextOptionsBuilder<Katas8Db>().UseNpgsql(ConnectionString()).Options
); // => Npgsql provider with our string
ctx.Database.OpenConnection(); // => open once for every inspection query below

void Exec(string sql) // => raw statements run DDL outside any migration
{ // => exec block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => the statement to run
    cmd.ExecuteNonQuery(); // => run it, ignore the count
} // => exec helper ends here

void Exec2(Microsoft.EntityFrameworkCore.DbContext other, string sql) // => the second session runs the holder
{ // => holder block opens
    using var cmd = other.Database.GetDbConnection().CreateCommand(); // => command on the holder connection
    cmd.CommandText = sql; // => the statement to run
    cmd.ExecuteNonQuery(); // => run it, ignore the count
} // => holder helper ends here

string Scalar(string sql) // => one-row, one-column inspection queries
{ // => scalar block opens
    using var cmd = ctx.Database.GetDbConnection().CreateCommand(); // => command on the open connection
    cmd.CommandText = sql; // => read-only inspection SQL
    object? value = cmd.ExecuteScalar(); // => the single answer
    return value?.ToString() ?? "null"; // => text for printing, null-safe
} // => scalar helper ends here

ctx.Database.Migrate(); // => apply M01: the Katas8 table exists
Exec("ALTER TABLE \"Katas8\" DROP COLUMN IF EXISTS \"Note\""); // => reset the guard column for the double run
using var holder = new Katas8Db( // => the second session holds Katas8
    new DbContextOptionsBuilder<Katas8Db>().UseNpgsql(ConnectionString()).Options
); // => same database, own connection
holder.Database.OpenConnection(); // => open the holder connection
Exec2(holder, "BEGIN"); // => holder transaction starts
Exec2(holder, "LOCK TABLE \"Katas8\" IN ACCESS EXCLUSIVE MODE"); // => holder blocks the drill DDL
Exec("SET lock_timeout = '100ms'"); // => drill refuses to queue: fail fast
string first = "taken"; // => the first attempt outcome
try // => the held lock must time the attempt out
{ // => try block opens
    Exec("ALTER TABLE \"Katas8\" ADD COLUMN \"Note\" text"); // => 55P03: holder owns the lock
} // => try ends after the failing DDL
catch (Exception) // => any provider error counts: the kind is fixed by SQLSTATE
{ // => catch block opens
    first = "denied"; // => the drill failed fast, as rehearsed
} // => catch ends here
Exec2(holder, "ROLLBACK"); // => holder releases Katas8
Exec("SET lock_timeout = 0"); // => drill back to waiting for the retry
Exec("ALTER TABLE \"Katas8\" ADD COLUMN \"Note\" text"); // => retry with the lock free: clean
string cols = Scalar(
    "SELECT count(*) FROM information_schema.columns WHERE table_name = 'Katas8' AND column_name = 'Note'"
); // => guard column present
Console.WriteLine($"retry={first}-then-{(cols == "1" ? "ok" : "missing")}"); // => Output: retry=denied-then-ok

public class Kata8Hot // => the entity mapped to the Katas8 table
{ // => entity block opens
    public int Id { get; set; } // => identity key generated by PostgreSQL
    public string Code { get; set; } = ""; // => required code column
} // => entity ends here

public class Katas8Db : DbContext // => the context Migrate discovers migrations from
{ // => context block opens
    public Katas8Db(DbContextOptions<Katas8Db> options)
        : base(options) { } // => options carry the connection string

    public DbSet<Kata8Hot> Katas8 => Set<Kata8Hot>(); // => the one set this kata queries
} // => context ends here
```

**`drilling/code/kata-08-lock-guard-for-hot-table/after/Migrations.cs`**:

```csharp
// Kata 8 starter migrations: one hot table to guard.
using Microsoft.EntityFrameworkCore.Infrastructure; // => context attribute lives here
using Microsoft.EntityFrameworkCore.Migrations; // => migration base types live here
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata; // => identity strategy annotations live here

namespace App.Migrations; // => migrations live in their own namespace

[DbContext(typeof(Katas8Db))] // => bind this version to the Katas8Db context
[Migration("20260101000001_CreateKatas8")] // => first version: the create
public partial class CreateKatas8 : Migration // => one class per migration file
{ // => class block opens
    protected override void Up(MigrationBuilder migrationBuilder) // => forward change runs on migrate
    { // => forward block opens
        migrationBuilder.CreateTable( // => the create this migration owns
            name: "Katas8", // => table name the program queries back
            columns: table => new // => column map follows
            { // => column block opens
                Id = table
                    .Column<int>(type: "integer", nullable: false) // => surrogate key, never null
                    .Annotation(
                        "Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                    ), // => serial-style identity
                Code = table.Column<string>(type: "text", nullable: false), // => hot code, required
            }, // => column map ends
            constraints: table => // => key rules follow
            { // => constraint block opens
                table.PrimaryKey("PK_Katas8", x => x.Id); // => primary key on the identity column
            }
        ); // => create-table call ends
    } // => forward change ends

    protected override void Down(MigrationBuilder migrationBuilder) // => reverse change for migrate-back
    { // => reverse block opens
        migrationBuilder.DropTable( // => undo is the mirror image
            name: "Katas8"
        ); // => drop what Up created
    } // => reverse change ends
} // => migration class ends
```

**Output** (`drilling/code/kata-08-lock-guard-for-hot-table/expected/main.stdout.txt`):

```text
retry=denied-then-ok
```

## Self-check checklist

Mark each item only when you can demonstrate it EF Core's way without notes: run the mapped kata or example, predict the output, then explain the why to someone else. An item you can perform but not explain is half learned — revisit the lesson section before marking it done. Review unchecked items weekly: the list doubles as a spaced-repetition schedule, and the items that stay unchecked for a month point at the course sections worth re-reading end to end.

1. [ ] I can write a versioned migration class with a fixed timestamp ID, an Up, and a Down. (co-01)

2. [ ] I can reverse a schema change with Down and explain when a forward fix fits better. (co-02)

3. [ ] I can read the history table to list exactly which versions a database ran, in order. (co-03)

4. [ ] I can keep history linear and list pending versions before any migrate. (co-04)

5. [ ] I can write an idempotent backfill and prove it by migrating twice. (co-05)

6. [ ] I can decide whether a change needs a backfill step or is schema-only. (co-06)

7. [ ] I can split a breaking rename into expand, copy, and contract steps across deploys. (co-07)

8. [ ] I can roll back a bad deploy without losing unrelated data. (co-08)

9. [ ] I can detect schema drift with a have-minus-want column diff and converge it forward. (co-09)

10. [ ] I can baseline a legacy database without touching its data. (co-10)

11. [ ] I can explain why applied migrations never re-run after edits and verify edits fresh. (co-11)

12. [ ] I can rely on per-version atomicity and bound a failure to its version. (co-12)

13. [ ] I can promote the same version set across dev, test, and production in order. (co-13)

14. [ ] I can resolve a version-ID collision by renumbering the loser onto the head. (co-14)

15. [ ] I can bound DDL lock waits and retry against a hot table safely. (co-15)

16. [ ] I can verify a migration with a golden query and seal the pipe after migrating. (co-16)

17. [ ] I can fill a new column from existing rows with a guarded, reviewable UPDATE. (co-06)

18. [ ] I can keep old and new code working during a transition with dual writes. (co-07)

19. [ ] I can use the product stamp to tell which build applied each history row. (co-03)

20. [ ] I can attribute versions to authors and pull before numbering new work. (co-14)

21. [ ] I can serialize two migration runners with an advisory lock. (co-15)

22. [ ] I can prove a legacy table twins its baseline version column by column. (co-10)

23. [ ] I can schedule drift checks so out-of-band changes surface within hours. (co-09)

24. [ ] I can diagnose a partial migration from the pending queue alone. (co-16)

## Elaborative interrogation & self-explanation

Answer each prompt in writing before reading the model answer: name the choice, name the rejected alternative, and state the exact failure the choice prevents. A prompt you answer with slogans instead of mechanisms is still open — rework it with the mapped example running beside you.

### Prompt 1: Why separate versions for the schema step and the data fill — and why not combine them into one version?

The rejected alternative is a single version that adds the column and fills it in one Up. The model answer: combined versions couple DDL risk with data risk: a bad fill value forces a schema rollback, and a schema rework discards a good fill. Separate versions let each step be reviewed, retried, tuned, and reverted on its own schedule — which is exactly the granularity production incidents demand when the fill turns out wrong but the column is fine.

### Prompt 2: Why fail the whole assembly on duplicate version IDs — and why not apply in file order and let the database sort it out?

The rejected alternative is last-writer-wins by file timestamp. The model answer: file order differs per checkout, so arrival-order application would build a different schema on every machine — history would be a local accident, not a shared truth. Failing fast at discovery converts silent divergence into a coordination task with a mechanical fix (renumber the loser), keeping every environment's past identical.

### Prompt 3: Why baseline with a hand-written history row — and why not replay the baseline migration against the legacy database?

The rejected alternative is replay: run `M01`'s DDL and let it create what exists. The model answer: replaying DDL against existing tables fails on the first `CREATE` — or worse, succeeds partially and damages live data the team cannot reconstruct. The hand-written row asserts the outcome without executing it, making adoption declarative, reversible, and auditable: the data is byte-identical, only history's opinion changed.

### Prompt 4: Why serialize migration runners with an advisory lock — and why not rely on table locks?

The rejected alternative is letting both runners start and trusting DDL locks to order them. The model answer: table locks only exist once statements run — two runners can both pass discovery, interleave versions, and deadlock or half-apply before any table lock is ever taken. The advisory key orders runners before the first statement, which is the only point where serialization prevents damage rather than merely detecting it.

### Prompt 5: Why verify with a golden query — and why not trust exit code 0 from the migrate?

The rejected alternative is green exit means good schema. The model answer: exit codes report process success, not data success: a fill can update zero rows, transpose two values, or target the wrong table while every statement technically succeeds. The golden aggregate pins actual content in a deterministic order, so wrong values break the transcript instead of hiding in a dashboard nobody opens after a green deploy.

### Prompt 6: Why converge drift with a compensating version — and why not edit the old migration to include the drift?

The rejected alternative is rewriting the old version so history matches the database. The model answer: edited history rewrites every environment's past: databases that ran the old bytes now disagree with the file, audits that read the old history are invalidated, and the next fresh build creates a schema nobody ever tested. The compensating version records that drift happened and what fixed it, preserving the timeline exactly as it occurred for the next investigation to read.
