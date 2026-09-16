namespace OseId.Host;

/// <summary>
/// The configuration surface the composition root reads before anything else exists.
/// Every name is spelled once, here, so a test and the deployable read the same key.
/// </summary>
public static class RuntimeModeConfiguration
{
    /// <summary>The key declaring which runtime OSE ID was started for.</summary>
    public const string Key = "OSE_RUNTIME_MODE";

    /// <summary>The key declaring the loopback listener port.</summary>
    public const string PortKey = "OSE_ID_BE_PORT";

    /// <summary>The port reserved for ose-id-be in docs/reference/web-sites.md.</summary>
    public const int ReservedPort = 8501;
}
