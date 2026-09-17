using System.Globalization;

namespace OseId.Be.Integration;

/// <summary>
/// One comparable projection of an HTTP answer. <c>HttpClient</c> splits an answer's
/// headers between the message and its content — <c>Allow</c> lives on the content, so
/// asking the message for it throws rather than answering false — which makes every
/// per-header assertion a chance to look in the wrong half. Reading both halves into one
/// ordered list removes that chance and lets two answers be compared whole.
/// </summary>
internal static class ResponseShape
{
    /// <summary>Every header of <paramref name="response" />, ordered, as comparable text.</summary>
    internal static List<string> Headers(HttpResponseMessage response) =>
        [
            .. response
                .Headers.Concat(response.Content.Headers)
                .Select(header =>
                    string.Create(
                        CultureInfo.InvariantCulture,
                        $"{header.Key.ToLowerInvariant()}: {string.Join(',', header.Value)}"
                    )
                )
                .Order(StringComparer.Ordinal),
        ];

    /// <summary>Whether <paramref name="response" /> carries <paramref name="header" /> at all.</summary>
    internal static bool Names(HttpResponseMessage response, string header) =>
        Headers(response)
            .Exists(entry =>
                entry.StartsWith(
                    string.Create(CultureInfo.InvariantCulture, $"{header.ToLowerInvariant()}:"),
                    StringComparison.Ordinal
                )
            );
}
