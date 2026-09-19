using OseId.Domain.Runtime;

namespace OseId.Application.Foundation;

/// <summary>
/// The startup use case that decides whether OSE ID may serve. It runs before anything
/// else exists — before a listener, a database connection, or a route table — so a
/// refused mode cannot be reached over any transport, present or future.
/// </summary>
public static class RuntimeModeStartupGuard
{
    /// <summary>The exit code a refused start returns to its runner.</summary>
    public const int RefusedExitCode = 1;

    /// <summary>
    /// Decides the fate of a start from the declared runtime mode alone. There is no
    /// second input and no bypass: a test cannot make a refused mode start by supplying
    /// anything else.
    /// </summary>
    /// <param name="declaredMode">The runtime mode as configuration declared it, if at all.</param>
    public static StartupDecision Evaluate(string? declaredMode)
    {
        RuntimeModeResolution resolution = RuntimeModePolicy.Resolve(declaredMode);

        return resolution.IsServable
            ? new StartupDecision(
                resolution.Mode,
                RuntimeModeDenial.None,
                ExitCode: 0,
                DiagnosticCode: null,
                DiagnosticMessage: null
            )
            : new StartupDecision(
                Mode: null,
                resolution.Denial,
                RefusedExitCode,
                RuntimeModePolicy.DiagnosticCode,
                RuntimeModePolicy.DiagnosticMessageFor(resolution.Denial)
            );
    }
}
