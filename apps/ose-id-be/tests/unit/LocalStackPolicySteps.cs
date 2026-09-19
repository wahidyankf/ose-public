using FluentAssertions;
using OseId.Domain.LocalStack;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for specs/apps/ose/id-be/behaviours/foundation/local-stack.feature. It proves the
/// order/cleanup state machine <see cref="LifecyclePlan" /> declares: the dependency order every
/// resource starts in, and that stopping undoes exactly and only what actually started, in reverse.
/// Owning real processes, containers, networks, volumes, and ports is the E2E adapter's obligation;
/// this binding proves the ordering contract those resources are started and stopped under.
/// </summary>
[Binding]
public static class LocalStackPolicySteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/local-stack.feature";

    [Given("the documented local prerequisites are available and no OSE ID resources are running")]
    public static void GivenTheDocumentedLocalPrerequisitesAreAvailableAndNoOseIdResourcesAreRunning()
    {
        // Nothing to arrange: the property under test is the runner's declared order
        // contract, true regardless of the host's current resource state.
    }

    [When("the developer starts OSE ID locally")]
    public static void WhenTheDeveloperStartsOseIdLocally()
    {
        // The action under test is the ordering the runner is specified to follow, not
        // a sequence of calls this step needs to perform; Integration and E2E drive the
        // real startup this step name describes.
    }

    [Then("PostgreSQL, the migrated backend, and the web shell become ready in dependency order")]
    public static void ThenPostgreSqlTheMigratedBackendAndTheWebShellBecomeReadyInDependencyOrder() =>
        LifecyclePlan.StoppableStages.Should().Equal(["postgres", "backend", "web"], Feature);

    [Then("stopping the runner leaves no owned process, container, network, volume, or port reservation")]
    public static void ThenStoppingTheRunnerLeavesNoOwnedProcessContainerNetworkVolumeOrPortReservation()
    {
        // A full run stops every stage, in exactly the reverse of the order it started them.
        LifecyclePlan
            .CleanupOrder(LifecyclePlan.StoppableStages.Count)
            .Should()
            .Equal(["web", "backend", "postgres"], Feature);

        // Earliest-failure preservation: cleanup only ever reaches back through stages that
        // actually started, never forward into ones that never ran.
        LifecyclePlan.CleanupOrder(0).Should().BeEmpty(Feature);
        LifecyclePlan.CleanupOrder(1).Should().Equal(["postgres"], Feature);
        LifecyclePlan.CleanupOrder(2).Should().Equal(["backend", "postgres"], Feature);

        Action outOfRangeBelow = () => LifecyclePlan.CleanupOrder(-1);
        Action outOfRangeAbove = () => LifecyclePlan.CleanupOrder(LifecyclePlan.StoppableStages.Count + 1);
        outOfRangeBelow.Should().Throw<ArgumentOutOfRangeException>(Feature);
        outOfRangeAbove.Should().Throw<ArgumentOutOfRangeException>(Feature);
    }
}
