using System.Diagnostics;
using OseId.Application.Foundation.Ports;
using OseId.Application.Persistence;
using OseId.Domain.Correlation;
using OseId.Domain.Health;
using OseId.Domain.Persistence;

namespace OseId.Application.Health;

/// <summary>
/// The readiness use case: read the current schema state, then map it to the closed
/// outcome set. The use case holds no cache, so two instances asking at the same
/// moment reach the same answer — the same statelessness property
/// <see cref="ReadSchemaState" /> already guarantees for the read it wraps.
/// </summary>
public sealed class ReportReadiness(ReadSchemaState readSchemaState, ICorrelationIdFactory correlationIds)
{
    private readonly ReadSchemaState _readSchemaState =
        readSchemaState ?? throw new ArgumentNullException(nameof(readSchemaState));
    private readonly ICorrelationIdFactory _correlationIds =
        correlationIds ?? throw new ArgumentNullException(nameof(correlationIds));

    /// <param name="suppliedCorrelationId">The caller-supplied correlation value, if any.</param>
    /// <param name="cancellationToken">Propagated to the underlying read; never caught as an outage.</param>
    public async Task<ReadinessResult> ExecuteAsync(string? suppliedCorrelationId, CancellationToken cancellationToken)
    {
        CorrelationId correlationId = CorrelationId.TryAccept(suppliedCorrelationId, out CorrelationId? supplied)
            ? supplied
            : _correlationIds.Create();

        SchemaState state = await _readSchemaState.ExecuteAsync(cancellationToken).ConfigureAwait(false);

        return state switch
        {
            SchemaState.Ready => new ReadinessResult.Ready(correlationId.Value),
            SchemaState.SchemaIncompatible => new ReadinessResult.Problem(
                ReadinessPolicy.ProblemStatus,
                ReadinessPolicy.SchemaIncompatibleCode,
                ReadinessPolicy.SchemaIncompatibleTitle,
                correlationId.Value
            ),
            SchemaState.DatabaseUnavailable => new ReadinessResult.Problem(
                ReadinessPolicy.ProblemStatus,
                ReadinessPolicy.DatabaseUnavailableCode,
                ReadinessPolicy.DatabaseUnavailableTitle,
                correlationId.Value
            ),
            _ => throw new UnreachableException($"unmapped schema state {state}"),
        };
    }
}
