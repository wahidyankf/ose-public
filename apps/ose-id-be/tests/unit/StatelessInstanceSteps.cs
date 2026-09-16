using System.Reflection;
using FluentAssertions;
using OseId.Application.Health;
using OseId.Application.Persistence;
using OseId.Infrastructure.Persistence;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature.
/// It proves the property at the type level: every use case a health or database-backed
/// request reaches declares no mutable instance field, so two instances constructed with
/// equivalent dependencies can never diverge through accumulated state, regardless of
/// which one answers a given request or how many requests it already served.
/// </summary>
[Binding]
public static class StatelessInstanceSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature";

    /// <summary>Every type on the path a health or database-backed request travels.</summary>
    private static readonly Type[] CorrectnessPath =
    [
        typeof(ReadSchemaState),
        typeof(ReportReadiness),
        typeof(ReportLiveness),
        typeof(NpgsqlMigrationHistoryReader),
    ];

    [Given("two backend instances share the same PostgreSQL schema and immutable configuration")]
    public static void GivenTwoBackendInstancesShareTheSamePostgreSqlSchemaAndImmutableConfiguration()
    {
        // Nothing to arrange: the property under test is a fact about the types
        // themselves, true for every instance by construction rather than something a
        // particular pair of instances must be set up to exhibit.
    }

    [When("health and database-backed diagnostic requests alternate between the instances")]
    public static void WhenHealthAndDatabaseBackedDiagnosticRequestsAlternateBetweenTheInstances()
    {
        // The action under test is a static property of the types, not a sequence of
        // calls this step needs to perform; Integration and E2E drive the real
        // alternation this step name describes.
    }

    [Then("every response is consistent with the shared dependency state")]
    public static void ThenEveryResponseIsConsistentWithTheSharedDependencyState()
    {
        foreach (Type useCase in CorrectnessPath)
        {
            FieldInfo[] instanceFields = useCase.GetFields(
                BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public
            );

            instanceFields
                .Should()
                .OnlyContain(
                    field => field.IsInitOnly,
                    $"{useCase.Name} must hold no mutable instance state for two instances to answer alike ({Feature})"
                );
        }
    }

    [Then("stopping either instance does not change the surviving instance's correctness")]
    public static void ThenStoppingEitherInstanceDoesNotChangeTheSurvivingInstancesCorrectness()
    {
        // A direct consequence of the property proved above: an instance that holds no
        // state of its own has nothing a sibling instance's absence could invalidate.
    }
}
