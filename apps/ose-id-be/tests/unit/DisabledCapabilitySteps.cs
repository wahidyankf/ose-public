using System.Reflection;
using FluentAssertions;
using OseId.Application.Foundation;
using OseId.Domain.Capabilities;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature.
/// It validates the disabled-capability inventory and the no-write policy without an
/// ASP.NET pipeline: the transport mapping is the Integration adapter's obligation.
/// </summary>
[Binding]
public sealed class DisabledCapabilitySteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature";

    private readonly RecordingCorrelationIdFactory _correlationIds = new();
    private DisabledCapability? _expected;
    private DisabledCapability? _matched;
    private CapabilityDisabledResult? _result;

    [Given("OSE ID is ready with OIDC authorization disabled")]
    public void GivenOidcAuthorizationIsDisabled() => ExpectDisabled("OIDC authorization");

    [Given("OSE ID is ready with OAuth token issuance disabled")]
    public void GivenOauthTokenIssuanceIsDisabled() => ExpectDisabled("OAuth token issuance");

    [Given("OSE ID is ready with external-provider sign-in disabled")]
    public void GivenExternalProviderSignInIsDisabled() => ExpectDisabled("external-provider sign-in");

    [Given("OSE ID is ready with SCIM user provisioning disabled")]
    public void GivenScimUserProvisioningIsDisabled() => ExpectDisabled("SCIM user provisioning");

    [Given("OSE ID is ready with platform administration disabled")]
    public void GivenPlatformAdministrationIsDisabled() => ExpectDisabled("platform administration");

    [When("a client requests {word} {word}")]
    public void WhenAClientRequests(string method, string path)
    {
        _matched = DisabledCapabilityCatalog.Find(method, path);
        _result = new RejectDisabledCapability(_correlationIds).Reject(suppliedCorrelationId: null);
    }

    [Then("the response status is {int} with the stable capability-disabled problem code")]
    public void ThenTheResponseStatusIsWithTheStableCapabilityDisabledProblemCode(int status)
    {
        _matched.Should().NotBeNull(Feature);
        _matched.Should().Be(_expected);

        _result.Should().NotBeNull();
        _result.Status.Should().Be(status);
        _result.Code.Should().Be("capability_disabled");
        _result.Title.Should().Be("Capability is not available");
        _result.CorrelationId.Should().NotBeNullOrWhiteSpace();
    }

    [Then("no identity or authorization record is created")]
    public void ThenNoIdentityOrAuthorizationRecordIsCreated()
    {
        // The only outbound call a rejection may make is minting a correlation value.
        _correlationIds.CreatedCount.Should().Be(1);

        // And every port the application boundary declares is read-only, so there is nothing
        // through which an identity or authorization record could be created. A phase that adds a
        // port adds it to this surface deliberately.
        PortOperationsBeyondTheDeclaredSurface().Should().BeEmpty();
    }

    private void ExpectDisabled(string capability) => _expected = DisabledCapabilityCatalog.ByCapability(capability);

    private static List<string> PortOperationsBeyondTheDeclaredSurface()
    {
        string[] declaredSurface =
        [
            "OseId.Application.Foundation.Ports.ICorrelationIdFactory.Create",
            // Reads active migration history for readiness. It returns a projection and exposes no
            // write, so admitting it here cannot admit a way to create a record.
            "OseId.Application.Persistence.Ports.IMigrationHistoryReader.ReadActiveAsync",
        ];

        return typeof(RejectDisabledCapability)
            .Assembly.GetTypes()
            .Where(type => type.IsInterface)
            .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance))
            .Select(method => $"{method.DeclaringType?.FullName}.{method.Name}")
            .Where(operation => !declaredSurface.Contains(operation, StringComparer.Ordinal))
            .ToList();
    }
}
