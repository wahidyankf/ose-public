using OseId.Application.Persistence.Ports;
using OseId.Domain.Persistence;

namespace OseId.Be.Unit;

/// <summary>
/// In-process double for the one outbound read readiness makes. It returns a fixed,
/// configured result rather than touching a database, so a Unit test can drive every
/// <see cref="OseId.Domain.Persistence.SchemaState" /> outcome without a network call.
/// </summary>
public sealed class FakeMigrationHistoryReader : IMigrationHistoryReader
{
    private MigrationHistoryReadResult _result;

    private FakeMigrationHistoryReader(MigrationHistoryReadResult result) => _result = result;

    public int ReadCount { get; private set; }

    /// <summary>Behaves as an unreachable database: every read reports unreadable.</summary>
    public static FakeMigrationHistoryReader Unavailable() => new(MigrationHistoryReadResult.Unavailable());

    /// <summary>
    /// Transitions this double from reachable to unreachable, in place. Models a
    /// dependency that stops mid-scenario, the same way a real owned PostgreSQL
    /// container stops without the process holding a reference to it changing.
    /// </summary>
    public void Stop() => _result = MigrationHistoryReadResult.Unavailable();

    /// <summary>Behaves as a reachable database that answers with exactly these active rows.</summary>
    public static FakeMigrationHistoryReader WithActiveRecords(params IReadOnlyList<string> migrationIds) =>
        new(
            MigrationHistoryReadResult.Read([
                .. migrationIds.Select(migrationId => new MigrationHistoryRecord
                {
                    MigrationId = migrationId,
                    ProductVersion = "10.0.0",
                    CreatedAt = DateTimeOffset.UnixEpoch,
                    CreatedBy = "ose_id_migrator",
                    UpdatedAt = DateTimeOffset.UnixEpoch,
                    UpdatedBy = "ose_id_migrator",
                }),
            ])
        );

    public Task<MigrationHistoryReadResult> ReadActiveAsync(CancellationToken cancellationToken)
    {
        ReadCount++;
        return Task.FromResult(_result);
    }
}
