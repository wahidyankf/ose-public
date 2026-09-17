namespace OseId.Domain.Runtime;

/// <summary>
/// The production-disabled invariant. This is not a release flag: nothing a browser, a
/// header, or a request body carries reaches it, and no "allow insecure production"
/// value exists for it to read. It stays until a separate production-readiness plan
/// supplies the infrastructure, the threat review, and an explicit removal step.
/// </summary>
public static class RuntimeModePolicy
{
    /// <summary>The stable machine-readable reason a refused start emits.</summary>
    public const string DiagnosticCode = "runtime_mode_disabled";

    /// <summary>The diagnostic emitted when no runtime mode was declared.</summary>
    public const string MissingDiagnosticMessage =
        "OSE ID refused to start: no runtime mode was declared, and only Local and Test are supported.";

    /// <summary>
    /// The diagnostic emitted when a declared mode is refused. It names the invariant and
    /// never the rejected value, so a refused start cannot echo configuration back out.
    /// </summary>
    public const string UnsupportedDiagnosticMessage =
        "OSE ID refused to start: the declared runtime mode is not supported, and only Local and Test are.";

    private static readonly RuntimeMode[] _servable = [RuntimeMode.Local, RuntimeMode.Test];

    /// <summary>The complete set of modes OSE ID may serve in.</summary>
    public static IReadOnlyList<RuntimeMode> ServableModes => _servable;

    /// <summary>
    /// Resolves a declared runtime mode. Matching is exact and ordinal: a value that
    /// differs by case or by surrounding whitespace is a different value, and an unknown
    /// value fails closed rather than falling back to a default.
    /// </summary>
    /// <param name="declaredMode">The mode as the operator declared it, if at all.</param>
    public static RuntimeModeResolution Resolve(string? declaredMode) =>
        declaredMode switch
        {
            null or "" => RuntimeModeResolution.Refuse(RuntimeModeDenial.Missing),
            "Local" => RuntimeModeResolution.Admit(RuntimeMode.Local),
            "Test" => RuntimeModeResolution.Admit(RuntimeMode.Test),
            _ => RuntimeModeResolution.Refuse(
                string.IsNullOrWhiteSpace(declaredMode) ? RuntimeModeDenial.Missing : RuntimeModeDenial.Unsupported
            ),
        };

    /// <summary>The diagnostic message a denial emits, or null when nothing was denied.</summary>
    public static string? DiagnosticMessageFor(RuntimeModeDenial denial) =>
        denial switch
        {
            RuntimeModeDenial.Missing => MissingDiagnosticMessage,
            RuntimeModeDenial.Unsupported => UnsupportedDiagnosticMessage,
            _ => null,
        };
}
