namespace OseId.Domain.Capabilities;

/// <summary>
/// One identity capability OSE ID names but has not built. It is addressed by exactly one
/// method and path pair so a caller can never reach it, and a reader of the inventory can
/// tell a deliberately disabled capability from a route that was never registered.
/// </summary>
/// <param name="Capability">The capability as the behaviour corpus names it.</param>
/// <param name="Method">The one HTTP method the disabled route answers.</param>
/// <param name="Path">The one path the disabled route answers.</param>
public sealed record DisabledCapability(string Capability, string Method, string Path);
