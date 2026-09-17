namespace OseId.Domain.Runtime;

/// <summary>
/// Why a runtime mode was refused. The distinction exists for the operator reading a
/// diagnostic, not for the caller: both denials produce the same stable code and the
/// same non-zero exit, so no configuration probe can tell them apart from outside.
/// </summary>
public enum RuntimeModeDenial
{
    /// <summary>The mode was admitted; nothing was denied.</summary>
    None = 0,

    /// <summary>No runtime mode was declared at all.</summary>
    Missing = 1,

    /// <summary>A mode was declared, and OSE ID is not finished for it.</summary>
    Unsupported = 2,
}
