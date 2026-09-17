using OseId.Domain.Runtime;

namespace OseId.Application.Foundation;

/// <summary>
/// Whether the process may build a serving pipeline, and what it must report if not. The
/// decision is transport-neutral and process-neutral: it carries an exit code and a stable
/// diagnostic, and the composition root decides how to emit them.
/// </summary>
/// <param name="Mode">The admitted mode, or <see langword="null" /> when refused.</param>
/// <param name="Denial">Why the start was refused, or <see cref="RuntimeModeDenial.None" />.</param>
/// <param name="ExitCode">The process exit code; zero only when serving is admitted.</param>
/// <param name="DiagnosticCode">The stable refusal code, or null when admitted.</param>
/// <param name="DiagnosticMessage">The sanitized refusal message, or null when admitted.</param>
public sealed record StartupDecision(
    RuntimeMode? Mode,
    RuntimeModeDenial Denial,
    int ExitCode,
    string? DiagnosticCode,
    string? DiagnosticMessage
)
{
    /// <summary>Whether the composition root may build and start the serving pipeline.</summary>
    public bool MayServe => Mode is not null;
}
