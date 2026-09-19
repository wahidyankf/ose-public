namespace OseId.Domain.Runtime;

/// <summary>
/// What the declared runtime mode resolved to. Either a mode OSE ID is finished for, or
/// the reason it refused; never both and never neither.
/// </summary>
/// <param name="Mode">The admitted mode, or <see langword="null" /> when refused.</param>
/// <param name="Denial">Why the mode was refused, or <see cref="RuntimeModeDenial.None" />.</param>
public sealed record RuntimeModeResolution(RuntimeMode? Mode, RuntimeModeDenial Denial)
{
    /// <summary>Whether the resolved mode permits the serving pipeline to be built.</summary>
    public bool IsServable => Mode is not null;

    internal static RuntimeModeResolution Admit(RuntimeMode mode) => new(mode, RuntimeModeDenial.None);

    internal static RuntimeModeResolution Refuse(RuntimeModeDenial denial) => new(Mode: null, denial);
}
