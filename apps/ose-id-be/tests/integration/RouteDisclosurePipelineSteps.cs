using FluentAssertions;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for
/// specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature. It sends the
/// unanswered method and the same method against a path OSE ID never registered through
/// the delivered ASP.NET Core pipeline, then compares the two answers field by field.
/// Comparing against a live baseline is what makes "indistinguishable" an assertion
/// rather than a restatement of the expected status.
/// </summary>
[Binding]
public sealed class RouteDisclosurePipelineSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature";
    private const string AllowHeader = "Allow";

    // A path no route table entry names, and none ever will: it is the baseline every
    // answer under this feature is required to be identical to.
    private const string UnregisteredPath = "/ose-id-registers-no-such-path";

    private TestHostFixture? _host;
    private HttpResponseMessage? _answer;
    private HttpResponseMessage? _baseline;
    private string _answerBody = string.Empty;
    private string _baselineBody = string.Empty;

    [Given("OSE ID is serving its whole route table")]
    public void GivenOseIdIsServingItsWholeRouteTable() => _host = TestHostFixture.Start();

    [When("a caller addresses {word} with the unanswered method {word}")]
    public async Task WhenACallerAddressesWithTheUnansweredMethodAsync(string path, string method)
    {
        (_answer, _answerBody) = await SendAsync(method, path).ConfigureAwait(false);
        (_baseline, _baselineBody) = await SendAsync(method, UnregisteredPath).ConfigureAwait(false);
    }

    [Then("OSE ID answers exactly as it answers an unregistered path")]
    public void ThenOseIdAnswersExactlyAsItAnswersAnUnregisteredPath()
    {
        _answer.Should().NotBeNull(Feature);
        _baseline.Should().NotBeNull(Feature);

        ((int)_answer.StatusCode).Should().Be(404);
        _answer.StatusCode.Should().Be(_baseline.StatusCode);

        // Byte-for-byte: an empty body on both sides, and the same header set with the
        // same values, so nothing survives that a caller could compare.
        _answerBody.Should().BeEmpty();
        _answerBody.Should().Be(_baselineBody);
        ResponseShape.Headers(_answer).Should().Equal(ResponseShape.Headers(_baseline));
    }

    [Then("the answer names no method that path would have answered")]
    public void ThenTheAnswerNamesNoMethodThatPathWouldHaveAnswered()
    {
        ResponseShape.Names(_answer!, AllowHeader).Should().BeFalse(Feature);
        _answer!.Content.Headers.ContentType.Should().BeNull(Feature);
    }

    public void Dispose()
    {
        _answer?.Dispose();
        _baseline?.Dispose();
        _host?.Dispose();
    }

    private async Task<(HttpResponseMessage Response, string Body)> SendAsync(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);

        HttpResponseMessage response = await _host!.Client.SendAsync(request).ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        return (response, body);
    }
}
