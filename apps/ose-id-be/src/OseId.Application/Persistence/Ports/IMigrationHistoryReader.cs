using OseId.Domain.Persistence;

namespace OseId.Application.Persistence.Ports;

/// <summary>
/// Outbound port for the one read the serving role is granted: the active migration history.
///
/// It returns a result rather than throwing a provider exception because the caller must map an
/// unreachable database to a stable readiness code, and an exception's message is exactly the kind
/// of text — host, port, credential, driver internals — the sanitization rule forbids surfacing.
/// </summary>
public interface IMigrationHistoryReader
{
    /// <summary>
    /// Reads every active migration-history row. An unreachable or refusing database yields
    /// <see cref="MigrationHistoryReadResult.Unavailable" />, never a thrown provider error.
    /// </summary>
    Task<MigrationHistoryReadResult> ReadActiveAsync(CancellationToken cancellationToken);
}

/// <summary>
/// The outcome of reading history. The unreadable case deliberately carries no reason: the reason
/// is the detail that must not travel outward.
/// </summary>
public sealed record MigrationHistoryReadResult
{
    private MigrationHistoryReadResult() { }

    public bool Readable { get; private init; }

    public IReadOnlyList<MigrationHistoryRecord> Records { get; private init; } = [];

    public static MigrationHistoryReadResult Read(IReadOnlyList<MigrationHistoryRecord> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        return new MigrationHistoryReadResult { Readable = true, Records = records };
    }

    public static MigrationHistoryReadResult Unavailable() => new() { Readable = false };
}
