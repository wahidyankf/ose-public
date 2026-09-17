using System.Reflection;
using FluentAssertions;
using OseId.Application.Foundation;
using OseId.Domain.Capabilities;
using OseId.Domain.Correlation;
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

    /// <summary>
    /// How many correlation values the refusal itself minted. Captured at the refusal rather
    /// than read at assertion time, so a later step that refuses again to prove freshness
    /// cannot move the number this scenario's no-write claim rests on.
    /// </summary>
    private int _portCallsDuringRefusal;

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
        _portCallsDuringRefusal = _correlationIds.CreatedCount;
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

    [Then("the refusal is uncacheable and carries a correlation value")]
    public void ThenTheRefusalIsUncacheableAndCarriesACorrelationValue()
    {
        _result.Should().NotBeNull(Feature);
        CorrelationId.TryAccept(_result.CorrelationId, out _).Should().BeTrue();

        // Uncacheable at this ring means the use case memoizes nothing: refusing again mints a
        // second correlation value instead of replaying the first refusal.
        int before = _correlationIds.CreatedCount;
        new RejectDisabledCapability(_correlationIds).Reject(suppliedCorrelationId: null);
        _correlationIds.CreatedCount.Should().Be(before + 1);
    }

    [Then("no redirect, token, cookie, identity resource, or tenant fact is returned")]
    public void ThenNoRedirectTokenCookieIdentityResourceOrTenantFactIsReturned()
    {
        _result.Should().NotBeNull(Feature);

        // Four fields, three of them fixed policy literals. There is no field a redirect
        // target, a token, a cookie, an identity resource, or a tenant fact could travel
        // through, and the one variable field is the opaque correlation value.
        typeof(CapabilityDisabledResult)
            .GetProperties()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("Status", "Code", "Title", "CorrelationId");

        // And the refusal is identical for every capability, so it states no fact about which
        // capability, provider, or tenant was addressed.
        CapabilityDisabledResult anyOther = new RejectDisabledCapability(_correlationIds).Reject(
            suppliedCorrelationId: null
        );
        (_result with { CorrelationId = string.Empty }).Should().Be(anyOther with { CorrelationId = string.Empty });
    }

    [Then("no identity or authorization record is created")]
    public void ThenNoIdentityOrAuthorizationRecordIsCreated()
    {
        // The only outbound call a rejection may make is minting a correlation value.
        _portCallsDuringRefusal.Should().Be(1);

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
