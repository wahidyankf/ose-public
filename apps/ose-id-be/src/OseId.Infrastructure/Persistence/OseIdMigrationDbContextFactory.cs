using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OseId.Infrastructure.Persistence;

/// <summary>
/// Lets the Entity Framework command-line tooling construct the migration context without starting
/// the application.
///
/// The connection string comes from the migration environment and is never defaulted to a real
/// target: authoring a migration must not be able to touch a database nobody named. The placeholder
/// below is syntactically valid and points nowhere, which is what `migrations add` needs — it reads
/// the model, not the server.
/// </summary>
public sealed class OseIdMigrationDbContextFactory : IDesignTimeDbContextFactory<OseIdMigrationDbContext>
{
    /// <summary>The variable the migration stage supplies; absent when only authoring a migration.</summary>
    public const string ConnectionStringVariable = "OSE_ID_MIGRATION_CONNECTION";

    public OseIdMigrationDbContext CreateDbContext(string[] args)
    {
        string connectionString =
            Environment.GetEnvironmentVariable(ConnectionStringVariable)
            ?? "Host=127.0.0.1;Port=5438;Database=ose_id;Username=design_time_only";

        DbContextOptions<OseIdMigrationDbContext> options = new DbContextOptionsBuilder<OseIdMigrationDbContext>()
            .UseNpgsql(
                connectionString,
                npgsql =>
                    npgsql.MigrationsHistoryTable(OseIdMigrationDbContext.HistoryTable, OseIdMigrationDbContext.Schema)
            )
            .Options;

        return new OseIdMigrationDbContext(options);
    }
}
