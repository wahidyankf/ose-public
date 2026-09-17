using System.Net;
using System.Text.Json;
using FluentAssertions;
using OseId.Domain.Capabilities;
using OseId.Domain.Correlation;
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

    /// <summary>The only routes OSE ID answers besides the disabled inventory.</summary>
    private static readonly string[] HealthRoutes = ["GET /health/live", "GET /health/ready"];

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
        // Bounded input the endpoint must never read: a query value and, where the method
        // admits one, a body. Neither may reach the answer, the headers, or a record.
        using var request = new HttpRequestMessage(new HttpMethod(method), $"{path}?probe=ose-id-bounded-probe");
        if (!string.Equals(method, "GET", StringComparison.Ordinal))
        {
            request.Content = new StringContent("{\"probe\":\"ose-id-bounded-probe\"}");
        }

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
    }

    [Then("the refusal is uncacheable and carries a correlation value")]
    public void ThenTheRefusalIsUncacheableAndCarriesACorrelationValue()
    {
        _response.Should().NotBeNull(Feature);
        _response.Headers.CacheControl!.NoStore.Should().BeTrue();

        string correlation = _response.Headers.GetValues(CorrelationHeader).Should().ContainSingle().Subject;
        CorrelationId.TryAccept(correlation, out _).Should().BeTrue();

        using JsonDocument document = JsonDocument.Parse(_body);
        document.RootElement.GetProperty("correlationId").GetString().Should().Be(correlation);
    }

    [Then("no redirect, token, cookie, identity resource, or tenant fact is returned")]
    public void ThenNoRedirectTokenCookieIdentityResourceOrTenantFactIsReturned()
    {
        // Nothing was handed back that a caller could hold on to, redeem, or replay.
        _response!.Headers.Contains("Set-Cookie").Should().BeFalse();
        _response.Headers.Location.Should().BeNull();
        _response.Headers.WwwAuthenticate.Should().BeEmpty();
        _body.Should().NotContainAny("access_token", "id_token", "Bearer", "tenant", "company");

        // And the caller's own bounded input never came back either, so the refusal states no
        // fact about what was asked for.
        _body.Should().NotContain("ose-id-bounded-probe");
        ResponseShape.Headers(_response).Should().NotContain(header => header.Contains("ose-id-bounded-probe"));
    }

    [Then("no identity or authorization record is created")]
    public async Task ThenNoIdentityOrAuthorizationRecordIsCreatedAsync()
    {
        // Repeated and concurrent refusals are the same closed answer with nothing accumulated
        // between them: if a first call had created state, a later call could observe it.
        string[] repeated = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => RefuseAgainAsync()))
            .ConfigureAwait(false);

        repeated.Should().AllBe(WithoutCorrelation(_body), Feature);

        // The delivered host offers no other way in: its whole route table is the closed health
        // pair plus the disabled inventory, so no registered endpoint could write a record.
        _host!
            .RouteTable.Should()
            .BeEquivalentTo(
                HealthRoutes.Concat(
                    DisabledCapabilityCatalog.All.Select(capability => $"{capability.Method} {capability.Path}")
                )
            );
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

    private async Task<string> RefuseAgainAsync()
    {
        using var request = new HttpRequestMessage(new HttpMethod(_expected!.Method), _expected.Path);
        using HttpResponseMessage response = await _host!.Client.SendAsync(request).ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        response.StatusCode.Should().Be(_response!.StatusCode);
        return WithoutCorrelation(body);
    }

    /// <summary>
    /// The refusal minus its per-request correlation value, so two refusals can be compared for
    /// the thing under test rather than for the one field that is required to differ.
    /// </summary>
    private static string WithoutCorrelation(string body)
    {
        using JsonDocument document = JsonDocument.Parse(body);

        return string.Join(
            ';',
            document
                .RootElement.EnumerateObject()
                .Where(property => property.Name != "correlationId")
                .Select(property => $"{property.Name}={property.Value.GetRawText()}")
                .Order(StringComparer.Ordinal)
        );
    }
}
