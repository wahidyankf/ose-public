using FluentAssertions;
using OseId.Domain.Capabilities;
using OseId.Domain.Routing;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature.
/// It proves the decision without a pipeline: the addressed pair is outside the
/// disabled-capability inventory, a dispatcher answer that discloses the path is
/// registered is recognized as one, and the answer that replaces it is the bare
/// not-found an unregistered path already gives. Proving the delivered pipeline applies
/// that decision to a real response is the Integration adapter's obligation.
/// </summary>
[Binding]
public sealed class RouteDisclosureSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/route-disclosure.feature";

    private string? _path;
    private string? _method;
    private bool _dispatcherDisclosedTheRoute;
    private AbsentRouteAnswer? _answer;

    [Given("OSE ID is serving its whole route table")]
    public void GivenOseIdIsServingItsWholeRouteTable()
    {
        _path = null;
        _method = null;
        _dispatcherDisclosedTheRoute = false;
        _answer = null;
    }

    [When("a caller addresses {word} with the unanswered method {word}")]
    public void WhenACallerAddressesWithTheUnansweredMethod(string path, string method)
    {
        _path = path;
        _method = method;

        // A dispatcher that matches by method and path answers an unanswered method with
        // the method-mismatch status. This is the point the policy is consulted.
        _dispatcherDisclosedTheRoute = RouteDisclosurePolicy.DisclosesRegisteredPath(
            RouteDisclosurePolicy.MethodMismatchStatus
        );
        _answer = RouteDisclosurePolicy.AbsentRoute;
    }

    [Then("OSE ID answers exactly as it answers an unregistered path")]
    public void ThenOseIdAnswersExactlyAsItAnswersAnUnregisteredPath()
    {
        // The addressed pair is not a capability: a method outside the inventory is
        // outside it whatever path it names, so no refusal shape applies here.
        DisabledCapabilityCatalog.Find(_method!, _path!).Should().BeNull(Feature);

        _dispatcherDisclosedTheRoute.Should().BeTrue(Feature);
        _answer.Should().NotBeNull(Feature);
        _answer.Status.Should().Be(404);
        _answer.Status.Should().Be(RouteDisclosurePolicy.AbsentRouteStatus);
        _answer.ContentType.Should().BeNull(Feature);
        _answer.ContentLength.Should().BeNull(Feature);

        // And the replacement is itself silent: answering it again would change nothing,
        // so the guard cannot loop and cannot rewrite an ordinary not-found.
        RouteDisclosurePolicy.DisclosesRegisteredPath(_answer.Status).Should().BeFalse(Feature);
    }

    [Then("the answer names no method that path would have answered")]
    public void ThenTheAnswerNamesNoMethodThatPathWouldHaveAnswered()
    {
        // The addressed path does answer some method — otherwise the dispatcher would
        // have produced the absent-route status by itself and nothing would need
        // replacing — and Allow is the header that would name it.
        _dispatcherDisclosedTheRoute.Should().BeTrue(Feature);
        RouteDisclosurePolicy.DisclosingHeaders.Should().ContainSingle(Feature).Which.Should().Be("Allow", Feature);
    }
}
