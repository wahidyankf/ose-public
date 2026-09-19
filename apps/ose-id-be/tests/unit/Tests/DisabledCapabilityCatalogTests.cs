using FluentAssertions;
using OseId.Application.Foundation;
using OseId.Domain.Capabilities;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// The closed route inventory and the closed problem body. The corpus proves that each
/// listed capability fails closed; these cases prove that the list itself is exhaustive
/// and that an unlisted method or path is never claimed by it.
/// </summary>
public sealed class DisabledCapabilityCatalogTests
{
    [Fact]
    public void Catalog_ContainsExactlyTheFiveDisabledCapabilities()
    {
        DisabledCapabilityCatalog
            .All.Select(capability => $"{capability.Method} {capability.Path}")
            .Should()
            .Equal(
                "GET /connect/authorize",
                "POST /connect/token",
                "GET /external/google/challenge",
                "POST /scim/v2/Users",
                "GET /platform/admin/companies"
            );
    }

    [Theory]
    [InlineData("POST", "/connect/authorize")]
    [InlineData("GET", "/connect/token")]
    [InlineData("GET", "/api/account")]
    [InlineData("GET", "/api/company")]
    [InlineData("GET", "/admin")]
    [InlineData("GET", "/connect")]
    [InlineData("GET", "/health/ready")]
    public void Find_MethodAndPathOutsideTheInventory_MatchesNothing(string method, string path)
    {
        DisabledCapabilityCatalog.Find(method, path).Should().BeNull();
    }

    [Fact]
    public void ByCapability_UnknownName_Throws()
    {
        Action act = () => DisabledCapabilityCatalog.ByCapability("account recovery");

        act.Should().Throw<KeyNotFoundException>();
    }

    [Fact]
    public void Reject_SuppliedCorrelationIdIsAcceptedWhenValid()
    {
        var factory = new RecordingCorrelationIdFactory();

        CapabilityDisabledResult result = new RejectDisabledCapability(factory).Reject("corr-supplied-01");

        result.CorrelationId.Should().Be("corr-supplied-01");
        factory.CreatedCount.Should().Be(0);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("has space")]
    public void Reject_SuppliedCorrelationIdIsReplacedWhenUnusable(string? supplied)
    {
        var factory = new RecordingCorrelationIdFactory();

        CapabilityDisabledResult result = new RejectDisabledCapability(factory).Reject(supplied);

        result.CorrelationId.Should().Be(RecordingCorrelationIdFactory.FixedValue);
        factory.CreatedCount.Should().Be(1);
    }

    [Fact]
    public void Reject_CorrelationIdLongerThanTheContractLimitIsReplaced()
    {
        var factory = new RecordingCorrelationIdFactory();

        CapabilityDisabledResult result = new RejectDisabledCapability(factory).Reject(new string('c', 129));

        result.CorrelationId.Should().Be(RecordingCorrelationIdFactory.FixedValue);
    }

    [Fact]
    public void Reject_CorrelationIdAtTheContractLimitIsAccepted()
    {
        var factory = new RecordingCorrelationIdFactory();
        string supplied = new('c', 128);

        CapabilityDisabledResult result = new RejectDisabledCapability(factory).Reject(supplied);

        result.CorrelationId.Should().Be(supplied);
    }

    [Fact]
    public void Reject_AlwaysReturnsTheSameClosedProblemBody()
    {
        CapabilityDisabledResult result = new RejectDisabledCapability(new RecordingCorrelationIdFactory()).Reject(
            suppliedCorrelationId: null
        );

        result.Status.Should().Be(DisabledCapabilityPolicy.ProblemStatus);
        result.Code.Should().Be(DisabledCapabilityPolicy.ProblemCode);
        result.Title.Should().Be(DisabledCapabilityPolicy.ProblemTitle);
    }
}
