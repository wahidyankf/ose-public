using System.Net;
using System.Text.Json;
using FluentAssertions;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for
/// specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature. It talks to
/// the published host over a loopback socket exactly as an external caller would, so the
/// evidence covers the deployable output rather than an in-process composition of it.
/// </summary>
[Binding]
public sealed class DisabledCapabilityProcessSteps
{
    private const string _feature = "specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature";

    private string _capability = string.Empty;
    private HttpResponseMessage? _response;
    private string _body = string.Empty;

    [Given("OSE ID is ready with OIDC authorization disabled")]
    public void GivenOidcAuthorizationIsDisabled() => ReadyWith("OIDC authorization");

    [Given("OSE ID is ready with OAuth token issuance disabled")]
    public void GivenOauthTokenIssuanceIsDisabled() => ReadyWith("OAuth token issuance");

    [Given("OSE ID is ready with external-provider sign-in disabled")]
    public void GivenExternalProviderSignInIsDisabled() => ReadyWith("external-provider sign-in");

    [Given("OSE ID is ready with SCIM user provisioning disabled")]
    public void GivenScimUserProvisioningIsDisabled() => ReadyWith("SCIM user provisioning");

    [Given("OSE ID is ready with platform administration disabled")]
    public void GivenPlatformAdministrationIsDisabled() => ReadyWith("platform administration");

    [When("a client requests {word} {word}")]
    public void WhenAClientRequests(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), new Uri(RunningBackend.BaseAddress, path));

        _response = RunningBackend.Client.Send(request);
        _body = _response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
    }

    [Then("the response status is {int} with the stable capability-disabled problem code")]
    public void ThenTheResponseStatusIsWithTheStableCapabilityDisabledProblemCode(int status)
    {
        _capability.Should().NotBeEmpty(_feature);
        _response.Should().NotBeNull();
        _response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        ((int)_response.StatusCode).Should().Be(status);

        _response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        _response.Headers.CacheControl!.NoStore.Should().BeTrue();
        _response.Headers.GetValues("X-Correlation-ID").Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(_body);
        JsonElement problem = document.RootElement;

        problem
            .EnumerateObject()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("status", "code", "title", "correlationId");
        problem.GetProperty("status").GetInt32().Should().Be(status);
        problem.GetProperty("code").GetString().Should().Be("capability_disabled");
        problem.GetProperty("title").GetString().Should().Be("Capability is not available");
    }

    [Then("no identity or authorization record is created")]
    public void ThenNoIdentityOrAuthorizationRecordIsCreated()
    {
        _response!.Headers.Contains("Set-Cookie").Should().BeFalse();
        _response.Headers.Location.Should().BeNull();
        _body.Should().NotContainAny("access_token", "id_token", "Bearer");

        // The host keeps serving afterwards, so the rejection changed no process state
        // that a following caller could observe.
        using var probe = new HttpRequestMessage(
            HttpMethod.Get,
            new Uri(RunningBackend.BaseAddress, "/connect/authorize")
        );
        using HttpResponseMessage repeated = RunningBackend.Client.Send(probe);
        repeated.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private void ReadyWith(string capability)
    {
        _capability = capability;
        RunningBackend.EnsureServing();
    }
}
