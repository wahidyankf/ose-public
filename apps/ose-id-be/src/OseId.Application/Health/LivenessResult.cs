namespace OseId.Application.Health;

/// <summary>
/// The transport-neutral liveness outcome. There is exactly one outcome — liveness
/// consults no dependency and cannot fail while the process can answer at all — so an
/// inbound adapter has nothing else it could serialize even if it wanted to.
/// </summary>
/// <param name="Status">The one liveness status this build ever reports.</param>
/// <param name="Service">The service name every liveness response carries.</param>
/// <param name="CorrelationId">The accepted or generated correlation value.</param>
public sealed record LivenessResult(string Status, string Service, string CorrelationId);
