namespace OseId.Domain.Runtime;

/// <summary>
/// The runtime modes OSE ID is finished for. The set is deliberately small: a mode
/// exists here only once the service can serve it safely, so adding a member is a
/// security decision rather than a configuration one.
/// </summary>
public enum RuntimeMode
{
    /// <summary>A developer workstation running the local stack.</summary>
    Local = 1,

    /// <summary>An automated test run.</summary>
    Test = 2,
}
