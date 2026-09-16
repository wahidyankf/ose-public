using OseId.Application.Foundation.Ports;
using OseId.Domain.Capabilities;
using OseId.Domain.Correlation;

namespace OseId.Application.Foundation;

/// <summary>
/// The use case every disabled identity capability runs. It reads nothing, writes
/// nothing, and branches on nothing the caller supplied except whether a correlation
/// value was usable — which is why every disabled capability answers identically.
/// </summary>
public sealed class RejectDisabledCapability
{
    private readonly ICorrelationIdFactory _correlationIds;

    /// <summary>Creates the use case over the one port a refusal may reach.</summary>
    public RejectDisabledCapability(ICorrelationIdFactory correlationIds)
    {
        ArgumentNullException.ThrowIfNull(correlationIds);
        _correlationIds = correlationIds;
    }

    /// <summary>
    /// Produces the one refusal. A supplied correlation value is reused when the contract
    /// admits it and replaced with a generated one when it does not, so an unusable value
    /// is never reflected into a header or a log line.
    /// </summary>
    /// <param name="suppliedCorrelationId">The caller-supplied correlation value, if any.</param>
    public CapabilityDisabledResult Reject(string? suppliedCorrelationId)
    {
        CorrelationId correlationId = CorrelationId.TryAccept(suppliedCorrelationId, out CorrelationId? supplied)
            ? supplied
            : _correlationIds.Create();

        return new CapabilityDisabledResult(
            DisabledCapabilityPolicy.ProblemStatus,
            DisabledCapabilityPolicy.ProblemCode,
            DisabledCapabilityPolicy.ProblemTitle,
            correlationId.Value
        );
    }
}
