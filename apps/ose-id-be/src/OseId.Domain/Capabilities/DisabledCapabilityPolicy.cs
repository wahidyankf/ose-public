namespace OseId.Domain.Capabilities;

/// <summary>
/// The one answer every disabled capability gives. Each refusal is identical, so a caller
/// cannot tell one unbuilt capability from another, cannot learn which one exists, and
/// cannot distinguish a disabled capability from an unregistered path by its body.
/// </summary>
public static class DisabledCapabilityPolicy
{
    /// <summary>The HTTP status every disabled capability answers with.</summary>
    public const int ProblemStatus = 404;

    /// <summary>The stable machine-readable reason a caller may branch on.</summary>
    public const string ProblemCode = "capability_disabled";

    /// <summary>The human-readable summary, which names no capability and no caller input.</summary>
    public const string ProblemTitle = "Capability is not available";
}
