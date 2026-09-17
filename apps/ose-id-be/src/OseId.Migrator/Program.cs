using Microsoft.EntityFrameworkCore;
using Npgsql;
using OseId.Infrastructure.Persistence;

namespace OseId.Migrator;

/// <summary>
/// Applies the OSE ID forward migrations with the migration role, then exits.
///
/// The serving host never does this. An application that could migrate itself would need a role that
/// can alter the schema, and several instances starting at once would race to do it; both are
/// exactly what the privilege separation in this slice exists to prevent.
/// </summary>
public static class Program
{
    private const int _success = 0;
    private const int _configurationError = 2;
    private const int _migrationError = 3;

    public static async Task<int> Main()
    {
        string? connectionString = Environment.GetEnvironmentVariable(
            OseIdMigrationDbContextFactory.ConnectionStringVariable
        );

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            // The name is safe to print; the value never is.
            await Console
                .Error.WriteLineAsync(
                    $"migration_configuration_missing: {OseIdMigrationDbContextFactory.ConnectionStringVariable} is not set"
                )
                .ConfigureAwait(false);
            return _configurationError;
        }

        try
        {
            await EnsureSchemaAsync(connectionString).ConfigureAwait(false);

            DbContextOptions<OseIdMigrationDbContext> options = new DbContextOptionsBuilder<OseIdMigrationDbContext>()
                .UseNpgsql(
                    connectionString,
                    npgsql =>
                        npgsql
                            .MigrationsHistoryTable(
                                OseIdMigrationDbContext.HistoryTable,
                                OseIdMigrationDbContext.Schema
                            )
                            // Migration commands get a longer budget than runtime queries, because
                            // a DDL statement legitimately takes longer than a request may.
                            .CommandTimeout(60)
                )
                .Options;

            await using var context = new OseIdMigrationDbContext(options);

            // Applying an already-current database is a no-op rather than an error, which is what
            // lets the runner invoke this unconditionally and what the idempotence proof relies on.
            await context.Database.MigrateAsync().ConfigureAwait(false);

            Console.WriteLine("migration_applied");
            return _success;
        }
        catch (NpgsqlException error)
        {
            await Console
                .Error.WriteLineAsync($"migration_failed: {error.SqlState ?? "unknown"}")
                .ConfigureAwait(false);
            return _migrationError;
        }
        catch (InvalidOperationException error)
        {
            await Console.Error.WriteLineAsync($"migration_failed: {error.GetType().Name}").ConfigureAwait(false);
            return _migrationError;
        }
    }

    /// <summary>
    /// Creates the owned schema before Entity Framework looks for its history table in it. The
    /// migration role does this itself, so the schema's owner is the role that maintains it.
    /// </summary>
    private static async Task EnsureSchemaAsync(string connectionString)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using NpgsqlCommand command = connection.CreateCommand();
        command.CommandText = $"CREATE SCHEMA IF NOT EXISTS {OseIdMigrationDbContext.Schema};";
        command.CommandTimeout = 60;
        await command.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
}
