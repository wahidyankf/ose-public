module OrganicLeverBe.Tests.TestFixture

open System
open Microsoft.Data.Sqlite
open Microsoft.EntityFrameworkCore
open DbUp
open OrganicLeverBe.Infrastructure.AppDbContext

/// Returns true when a real PostgreSQL DATABASE_URL is present in the environment.
/// Integration tests (docker-compose) always set DATABASE_URL.
/// Unit/test:quick mode runs without DATABASE_URL and uses SQLite in-memory.
let private usePostgres =
    not (String.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL")))

/// Creates a fresh, isolated AppDbContext per scenario.
///
/// PostgreSQL mode (DATABASE_URL set): uses Npgsql with the supplied connection string.
/// Schema is managed by DbUp (EmbeddedResource SQL scripts). DbUp is idempotent — it
/// only runs scripts that have not yet been applied (tracked in the schemaversions table).
///
/// SQLite in-memory mode (no DATABASE_URL): creates a shared in-memory connection per call
/// and calls EnsureCreated so each scenario starts with a clean schema. DbUp does not
/// support SQLite, so EnsureCreated is retained for this path only.
let createDb () : AppDbContext * (unit -> unit) =
    if usePostgres then
        let connStr = Environment.GetEnvironmentVariable("DATABASE_URL")

        // Run DbUp migrations (idempotent — skips already-applied scripts).
        let result =
            DeployChanges.To
                .PostgresqlDatabase(connStr)
                .WithScriptsEmbeddedInAssembly(Reflection.Assembly.GetAssembly(typeof<OrganicLeverBe.Program.Marker>))
                .LogToConsole()
                .Build()
                .PerformUpgrade()

        if not result.Successful then
            failwith (sprintf "Database migration failed: %s" result.Error.Message)

        let options =
            DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connStr).UseSnakeCaseNamingConvention().Options

        let db = new AppDbContext(options)

        // Cleanup: wipe all rows in reverse-dependency order after each scenario
        let cleanup () =
            db.Database.ExecuteSqlRaw("DELETE FROM refresh_tokens") |> ignore
            db.Database.ExecuteSqlRaw("DELETE FROM users") |> ignore
            db.Dispose()

        db, cleanup
    else
        // SQLite in-memory: each call gets its own connection → isolated schema.
        // DbUp does not support SQLite — EnsureCreated is intentionally retained here.
        let conn = new SqliteConnection("DataSource=:memory:")
        conn.Open()

        let options =
            DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).UseSnakeCaseNamingConvention().Options

        let db = new AppDbContext(options)
        db.Database.EnsureCreated() |> ignore

        let cleanup () =
            db.Dispose()
            conn.Dispose()

        db, cleanup
