using OseId.Application.Persistence.Ports;
using OseId.Domain.Persistence;

namespace OseId.Be.Integration;

/// <summary>
/// In-process double for the one outbound read readiness makes, registered in place of
/// the real Npgsql adapter so the delivered HTTP pipeline can be proven against every
/// dependency state without a database. Real outage/recovery against an owned
/// PostgreSQL is the E2E adapter's obligation, not this one's.
/// </summary>
public sealed class FakeMigrationHistoryReader : IMigrationHistoryReader
{
    private MigrationHistoryReadResult _result;
    private int _readCount;

    private FakeMigrationHistoryReader(MigrationHistoryReadResult result) => _result = result;

    /// <summary>
    /// How many times the pipeline actually reached this port. A liveness scenario asserts it
    /// stayed at zero; a readiness scenario asserts every request produced a fresh read rather
    /// than replaying a cached answer.
    /// </summary>
    public int ReadCount => Volatile.Read(ref _readCount);

    /// <summary>Behaves as an unreachable database: every read reports unreadable.</summary>
    public static FakeMigrationHistoryReader Unavailable() => new(MigrationHistoryReadResult.Unavailable());

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

    /// <summary>
    /// Transitions this double from reachable to unreachable, in place. Models a
    /// dependency that stops mid-scenario, the same way a real owned PostgreSQL
    /// container stops without the process holding a reference to it changing.
    /// </summary>
    public void Stop() => _result = MigrationHistoryReadResult.Unavailable();

    public Task<MigrationHistoryReadResult> ReadActiveAsync(CancellationToken cancellationToken)
    {
        Interlocked.Increment(ref _readCount);
        return Task.FromResult(_result);
    }
}
