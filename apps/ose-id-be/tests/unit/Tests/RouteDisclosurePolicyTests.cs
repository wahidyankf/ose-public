using FluentAssertions;
using OseId.Domain.Routing;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// Pins the decision the route-disclosure guard is built on. The guard rewrites exactly
/// one status and leaves every other answer alone, so a widening of this predicate would
/// silently turn a contracted response into a bare not-found.
/// </summary>
public sealed class RouteDisclosurePolicyTests
{
    [Theory]
    [InlineData(405, true)]
    [InlineData(404, false)]
    [InlineData(200, false)]
    [InlineData(503, false)]
    [InlineData(500, false)]
    public void DisclosesRegisteredPath_RecognizesOnlyTheMethodMismatchStatus(int status, bool discloses) =>
        RouteDisclosurePolicy.DisclosesRegisteredPath(status).Should().Be(discloses);

    [Fact]
    public void AbsentRoute_CarriesAStatusAndNothingElse()
    {
        AbsentRouteAnswer answer = RouteDisclosurePolicy.AbsentRoute;

        answer.Status.Should().Be(404);
        answer.ContentType.Should().BeNull();
        answer.ContentLength.Should().BeNull();
    }

    [Fact]
    public void DisclosingHeaders_NamesTheHeaderThatWouldRevealTheRegisteredMethods() =>
        RouteDisclosurePolicy.DisclosingHeaders.Should().Equal("Allow");

    [Fact]
    public void Statuses_AreTheTwoTheDispatcherActuallyProduces()
    {
        RouteDisclosurePolicy.AbsentRouteStatus.Should().Be(404);
        RouteDisclosurePolicy.MethodMismatchStatus.Should().Be(405);
    }
}
