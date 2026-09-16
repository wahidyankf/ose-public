using System.Globalization;
using System.Net;
using FluentAssertions;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for
/// specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature. It addresses the
/// published host over a loopback socket exactly as a caller mapping the route table
/// would, and answers the same method against a path OSE ID never registers so the two
/// answers can be compared whole. Comparing against a live baseline taken from the same
/// served process is what makes "indistinguishable" an assertion against evidence rather
/// than a restatement of the expected status.
/// </summary>
[Binding]
public sealed class RouteDisclosureProcessSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature";
    private const string AllowHeader = "Allow";

    // A path no route table entry names, and none ever will: it is the baseline every
    // answer under this feature is required to be identical to.
    private const string UnregisteredPath = "/ose-id-registers-no-such-path";

    private HttpResponseMessage? _answer;
    private HttpResponseMessage? _baseline;
    private string _answerBody = string.Empty;
    private string _baselineBody = string.Empty;

    [Given("OSE ID is serving its whole route table")]
    public static void GivenOseIdIsServingItsWholeRouteTable() => RunningBackend.EnsureServing();

    [When("a caller addresses {word} with the unanswered method {word}")]
    public void WhenACallerAddressesWithTheUnansweredMethod(string path, string method)
    {
        (_answer, _answerBody) = Send(method, path);
        (_baseline, _baselineBody) = Send(method, UnregisteredPath);
    }

    [Then("OSE ID answers exactly as it answers an unregistered path")]
    public void ThenOseIdAnswersExactlyAsItAnswersAnUnregisteredPath()
    {
        _answer.Should().NotBeNull(Feature);
        _baseline.Should().NotBeNull(Feature);

        _answer.StatusCode.Should().Be(HttpStatusCode.NotFound, Feature);
        _answer.StatusCode.Should().Be(_baseline.StatusCode, Feature);

        // Byte-for-byte: an empty body on both sides, and the same header set with the
        // same values, so nothing survives that a caller could compare.
        _answerBody.Should().BeEmpty(Feature);
        _answerBody.Should().Be(_baselineBody, Feature);
        HeadersOf(_answer).Should().Equal(HeadersOf(_baseline), Feature);
    }

    [Then("the answer names no method that path would have answered")]
    public void ThenTheAnswerNamesNoMethodThatPathWouldHaveAnswered()
    {
        Names(_answer!, AllowHeader).Should().BeFalse(Feature);
        _answer!.Content.Headers.ContentType.Should().BeNull(Feature);
    }

    public void Dispose()
    {
        _answer?.Dispose();
        _baseline?.Dispose();
    }

    private static (HttpResponseMessage Response, string Body) Send(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), new Uri(RunningBackend.BaseAddress, path));

        HttpResponseMessage response = RunningBackend.Client.Send(request);
        string body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();

        return (response, body);
    }

    /// <summary>
    /// Every header of <paramref name="response" />, ordered, as comparable text.
    /// <c>HttpClient</c> splits an answer's headers between the message and its content —
    /// <c>Allow</c> lives on the content — which makes every per-header assertion a chance
    /// to look in the wrong half. Reading both halves into one ordered list removes that
    /// chance and lets two answers be compared whole.
    /// </summary>
    private static List<string> HeadersOf(HttpResponseMessage response) =>
        [
            .. response
                .Headers.Concat(response.Content.Headers)
                .Select(header => string.Create(CultureInfo.InvariantCulture, $"{Name(header.Key)}: {Value(header)}"))
                .Order(StringComparer.Ordinal),
        ];

    private static string Name(string header) => header.ToLowerInvariant();

    /// <summary>
    /// A header's value as evidence about the addressed path. The served host reaches the
    /// wire through Kestrel, which stamps every answer with <c>Date</c> at one-second
    /// resolution; two answers taken a moment apart therefore differ whenever the second
    /// turns over, and that difference says nothing about the route table. Standing in a
    /// fixed marker keeps the header itself compared — a <c>Date</c> present on one answer
    /// and absent from the other still fails — while removing the clock from the
    /// comparison. Every other header, <c>Allow</c> included, is compared by value.
    /// </summary>
    private static string Value(KeyValuePair<string, IEnumerable<string>> header) =>
        string.Equals(Name(header.Key), "date", StringComparison.Ordinal) ? "<clock>" : string.Join(',', header.Value);

    /// <summary>Whether <paramref name="response" /> carries <paramref name="header" /> at all.</summary>
    private static bool Names(HttpResponseMessage response, string header) =>
        HeadersOf(response)
            .Exists(entry =>
                entry.StartsWith(
                    string.Create(CultureInfo.InvariantCulture, $"{header.ToLowerInvariant()}:"),
                    StringComparison.Ordinal
                )
            );
}
