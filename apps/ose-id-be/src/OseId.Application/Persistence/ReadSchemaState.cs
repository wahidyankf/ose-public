using OseId.Application.Persistence.Ports;
using OseId.Domain.Persistence;

namespace OseId.Application.Persistence;

/// <summary>
/// The readiness use case: ask the granted read for active migration history, then let the domain
/// decide compatibility.
///
/// The use case holds no cache and writes no readiness row. Two instances asking the same database
/// at the same moment therefore reach the same answer, which is what makes the process instances
/// interchangeable rather than merely similar.
/// </summary>
public sealed class ReadSchemaState(IMigrationHistoryReader reader)
{
    private readonly IMigrationHistoryReader _reader = reader ?? throw new ArgumentNullException(nameof(reader));

    public async Task<SchemaState> ExecuteAsync(CancellationToken cancellationToken)
    {
        MigrationHistoryReadResult result = await _reader.ReadActiveAsync(cancellationToken).ConfigureAwait(false);

        return result.Readable ? SchemaCompatibility.Evaluate(result.Records) : SchemaState.DatabaseUnavailable;
    }
}
