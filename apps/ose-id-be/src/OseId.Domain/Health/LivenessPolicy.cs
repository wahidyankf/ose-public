namespace OseId.Domain.Health;

/// <summary>
/// The one answer liveness ever gives. Liveness proves the process event loop
/// responds and nothing else, so its two fields are fixed literals rather than
/// anything a dependency read could vary.
/// </summary>
public static class LivenessPolicy
{
    /// <summary>The one liveness status this build ever reports.</summary>
    public const string Status = "live";

    /// <summary>The service name every liveness response carries.</summary>
    public const string ServiceName = "ose-id-be";
}
