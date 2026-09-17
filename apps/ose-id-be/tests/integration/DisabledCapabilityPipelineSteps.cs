using System.Net;
using System.Text.Json;
using FluentAssertions;
using OseId.Domain.Capabilities;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for
/// specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature. It sends a
/// real request through the delivered ASP.NET Core pipeline and reads the real status,
/// headers, and serialized body, so a mapping mistake cannot pass by returning the right
/// object through the wrong transport.
/// </summary>
[Binding]
public sealed class DisabledCapabilityPipelineSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature";
    private const string CorrelationHeader = "X-Correlation-ID";

    private TestHostFixture? _host;
    private DisabledCapability? _expected;
    private HttpResponseMessage? _response;
    private string _body = string.Empty;

    [Given("OSE ID is ready with OIDC authorization disabled")]
    public void GivenOidcAuthorizationIsDisabled() => StartWith("OIDC authorization");

    [Given("OSE ID is ready with OAuth token issuance disabled")]
    public void GivenOauthTokenIssuanceIsDisabled() => StartWith("OAuth token issuance");

    [Given("OSE ID is ready with external-provider sign-in disabled")]
    public void GivenExternalProviderSignInIsDisabled() => StartWith("external-provider sign-in");

    [Given("OSE ID is ready with SCIM user provisioning disabled")]
    public void GivenScimUserProvisioningIsDisabled() => StartWith("SCIM user provisioning");

    [Given("OSE ID is ready with platform administration disabled")]
    public void GivenPlatformAdministrationIsDisabled() => StartWith("platform administration");

    [When("a client requests {word} {word}")]
    public async Task WhenAClientRequestsAsync(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);

        _response = await _host!.Client.SendAsync(request).ConfigureAwait(false);
        _body = await _response.Content.ReadAsStringAsync().ConfigureAwait(false);
    }

    [Then("the response status is {int} with the stable capability-disabled problem code")]
    public void ThenTheResponseStatusIsWithTheStableCapabilityDisabledProblemCode(int status)
    {
        _response.Should().NotBeNull(Feature);
        ((int)_response.StatusCode).Should().Be(status);
        _response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        _response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        _response.Headers.CacheControl!.NoStore.Should().BeTrue();
        _response.Headers.GetValues(CorrelationHeader).Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(_body);
        JsonElement problem = document.RootElement;

        problem
            .EnumerateObject()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("status", "code", "title", "correlationId");
        problem.GetProperty("status").GetInt32().Should().Be(status);
        problem.GetProperty("code").GetString().Should().Be(DisabledCapabilityPolicy.ProblemCode);
        problem.GetProperty("title").GetString().Should().Be(DisabledCapabilityPolicy.ProblemTitle);
        problem
            .GetProperty("correlationId")
            .GetString()
            .Should()
            .Be(_response.Headers.GetValues(CorrelationHeader).Single());
    }

    [Then("no identity or authorization record is created")]
    public async Task ThenNoIdentityOrAuthorizationRecordIsCreatedAsync()
    {
        // Nothing was handed back that a caller could hold on to, redeem, or replay.
        _response!.Headers.Contains("Set-Cookie").Should().BeFalse();
        _response.Headers.Location.Should().BeNull();
        _body.Should().NotContainAny("access_token", "id_token", "Bearer");

        // And the same request repeats identically, so no first call created state a
        // second call could observe.
        using var repeat = new HttpRequestMessage(new HttpMethod(_expected!.Method), _expected.Path);
        using HttpResponseMessage second = await _host!.Client.SendAsync(repeat).ConfigureAwait(false);
        string repeatedBody = await second.Content.ReadAsStringAsync().ConfigureAwait(false);

        second.StatusCode.Should().Be(_response.StatusCode);
        repeatedBody.Length.Should().Be(_body.Length);
    }

    public void Dispose()
    {
        _response?.Dispose();
        _host?.Dispose();
    }

    private void StartWith(string capability)
    {
        _expected = DisabledCapabilityCatalog.ByCapability(capability);
        _host = TestHostFixture.Start();
    }
}
