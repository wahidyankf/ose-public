using Microsoft.EntityFrameworkCore;

namespace OseId.Infrastructure.Persistence;

/// <summary>
/// Migration-time only. Entity Framework exists here to author and apply schema evolution; it is
/// never registered by serving code and owns no runtime read or write.
///
/// The context declares no entity type on purpose. This slice's only table is Entity Framework's own
/// migration history, so inventing a placeholder entity would create a table that a later plan would
/// have to undo — and would quietly hand the serving role a second thing to read.
/// </summary>
public sealed class OseIdMigrationDbContext(DbContextOptions<OseIdMigrationDbContext> options) : DbContext(options)
{
    /// <summary>The schema every OSE ID object lives in, owned by the migration role.</summary>
    public const string Schema = MigrationHistoryQuery.SchemaName;

    /// <summary>Entity Framework's conventional history table name, kept so EF's own insert works.</summary>
    public const string HistoryTable = MigrationHistoryQuery.TableName;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.HasDefaultSchema(Schema);

        base.OnModelCreating(modelBuilder);
    }
}
