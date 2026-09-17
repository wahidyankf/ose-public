namespace OseId.Application.Foundation;

/// <summary>
/// The transport-neutral outcome of refusing a disabled capability. It carries a status,
/// three strings, and nothing else, so an inbound adapter has nothing else it could
/// serialize even if it wanted to.
/// </summary>
/// <param name="Status">The status the refusal carries.</param>
/// <param name="Code">The stable machine-readable reason.</param>
/// <param name="Title">The summary, which names no capability and no caller input.</param>
/// <param name="CorrelationId">The accepted or generated correlation value.</param>
public sealed record CapabilityDisabledResult(int Status, string Code, string Title, string CorrelationId);
