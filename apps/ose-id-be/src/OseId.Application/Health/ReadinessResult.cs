namespace OseId.Application.Health;

/// <summary>
/// The transport-neutral readiness outcome: either every component is ready, or the
/// read stopped short at one stable code/title pair. Only these two shapes exist, so
/// an inbound adapter cannot serialize a connection string, a migration name, or an
/// exception message even by mistake — there is no field to carry one.
/// </summary>
/// <param name="CorrelationId">The accepted or generated correlation value.</param>
public abstract record ReadinessResult(string CorrelationId)
{
    /// <summary>PostgreSQL is reachable and the applied schema is compiled-compatible.</summary>
    /// <param name="CorrelationId">The accepted or generated correlation value.</param>
    public sealed record Ready(string CorrelationId) : ReadinessResult(CorrelationId);

    /// <summary>A stable failure code/title pair with no connection or schema detail.</summary>
    /// <param name="Status">The HTTP status the failure answers with.</param>
    /// <param name="Code">The stable machine-readable reason.</param>
    /// <param name="Title">The summary, which names no host, migration, or credential.</param>
    /// <param name="CorrelationId">The accepted or generated correlation value.</param>
    public sealed record Problem(int Status, string Code, string Title, string CorrelationId)
        : ReadinessResult(CorrelationId);
}
