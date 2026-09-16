using System.Diagnostics.CodeAnalysis;

namespace OseId.Domain.Correlation;

/// <summary>
/// The opaque value that ties one response to one log line. It is the only field in any
/// OSE ID response body a caller can influence, so what it accepts is a boundary: an
/// unusable supplied value is replaced with a generated one rather than reflected back.
/// </summary>
public sealed class CorrelationId : IEquatable<CorrelationId>
{
    /// <summary>The longest correlation value the API contract admits.</summary>
    public const int MaximumLength = 128;

    private CorrelationId(string value) => Value = value;

    /// <summary>The accepted value.</summary>
    public string Value { get; }

    /// <summary>Accepts a value the contract admits.</summary>
    /// <exception cref="ArgumentException">The value is outside what the contract admits.</exception>
    public static CorrelationId Accept(string value) =>
        IsAcceptable(value)
            ? new CorrelationId(value)
            : throw new ArgumentException("the correlation value is outside the API contract", nameof(value));

    /// <summary>
    /// Accepts a supplied value only when the contract admits it, and reports failure
    /// instead of throwing, because an unusable caller value is an ordinary outcome rather
    /// than an error.
    /// </summary>
    public static bool TryAccept(string? supplied, [NotNullWhen(true)] out CorrelationId? accepted)
    {
        accepted = IsAcceptable(supplied) ? new CorrelationId(supplied) : null;
        return accepted is not null;
    }

    /// <inheritdoc />
    public bool Equals(CorrelationId? other) =>
        other is not null && string.Equals(Value, other.Value, StringComparison.Ordinal);

    /// <inheritdoc />
    public override bool Equals(object? obj) => Equals(obj as CorrelationId);

    /// <inheritdoc />
    public override int GetHashCode() => StringComparer.Ordinal.GetHashCode(Value);

    /// <inheritdoc />
    public override string ToString() => Value;

    /// <summary>
    /// A usable value is non-empty, within the contract length, and made entirely of
    /// visible ASCII. Whitespace, control characters, and non-ASCII text are refused
    /// because an accepted value ends up in a response header and in a log line.
    /// </summary>
    private static bool IsAcceptable([NotNullWhen(true)] string? supplied) =>
        supplied is { Length: > 0 and <= MaximumLength } && supplied.All(character => character is >= '!' and <= '~');
}
