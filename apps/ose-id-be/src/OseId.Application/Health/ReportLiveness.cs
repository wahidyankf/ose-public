using OseId.Application.Foundation.Ports;
using OseId.Domain.Correlation;
using OseId.Domain.Health;

namespace OseId.Application.Health;

/// <summary>
/// The liveness use case. It reads no port and calls no dependency beyond minting a
/// correlation value, which is what makes liveness independent from readiness by
/// construction rather than by an adapter choosing not to call one.
/// </summary>
public sealed class ReportLiveness(ICorrelationIdFactory correlationIds)
{
    private readonly ICorrelationIdFactory _correlationIds =
        correlationIds ?? throw new ArgumentNullException(nameof(correlationIds));

    /// <summary>
    /// Produces the one liveness outcome. A supplied correlation value is reused when the
    /// contract admits it and replaced with a generated one when it does not, matching the
    /// same rule every other OSE ID response follows.
    /// </summary>
    /// <param name="suppliedCorrelationId">The caller-supplied correlation value, if any.</param>
    public LivenessResult Execute(string? suppliedCorrelationId)
    {
        CorrelationId correlationId = CorrelationId.TryAccept(suppliedCorrelationId, out CorrelationId? supplied)
            ? supplied
            : _correlationIds.Create();

        return new LivenessResult(LivenessPolicy.Status, LivenessPolicy.ServiceName, correlationId.Value);
    }
}
