namespace OrganicleverBe.Contexts.Db

open System.Diagnostics.CodeAnalysis
open System.Reflection
open DbUp

/// Infrastructure layer for the db bounded context: the on-boot migration
/// routine. DbUp applies the embedded db/migrations/*.sql scripts before the
/// HTTP server starts, so the schema is always up to date without manual
/// intervention.
module Infrastructure =

    /// Executes the migration orchestration through an injected upgrade
    /// adapter. Unit tests use a deterministic fake; production retains DbUp.
    let runMigrationsWith (performUpgrade: string -> Result<unit, string>) (connStr: string) : unit =
        match performUpgrade connStr with
        | Ok() -> ()
        | Error message -> failwith $"Database migration failed: %s{message}"

    /// Applies all pending embedded migrations to the given PostgreSQL connection
    /// string. The migration scripts live as embedded resources in the
    /// OrganicleverBe assembly. Fails fast if any script cannot be applied.
    [<ExcludeFromCodeCoverage(Justification =
        "Integration-tested against real PostgreSQL — see tests/integration/DatabaseBootTests.fs")>]
    let runMigrations (connStr: string) : unit =
        runMigrationsWith
            (fun connectionString ->
                let result =
                    DeployChanges.To
                        .PostgresqlDatabase(connectionString)
                        .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
                        .LogToConsole()
                        .Build()
                        .PerformUpgrade()

                if result.Successful then
                    Ok()
                else
                    Error result.Error.Message)
            connStr
