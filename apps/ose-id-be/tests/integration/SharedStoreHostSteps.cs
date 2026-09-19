using System.Net;
using FluentAssertions;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for
/// specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature. Two real,
/// independently built ASP.NET Core pipelines share one controlled persistence double, so
/// the proof is about the delivered composition rather than a single shared use-case
/// instance answering twice.
/// </summary>
[Binding]
public sealed class SharedStoreHostSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature";

    private readonly List<(HttpStatusCode Status, string Body)> _responses = [];

    private FakeMigrationHistoryReader? _sharedReader;
    private TestHostFixture? _instanceA;
    private TestHostFixture? _instanceB;

    [Given("two backend instances share the same PostgreSQL schema and immutable configuration")]
    public void GivenTwoBackendInstancesShareTheSamePostgreSqlSchemaAndImmutableConfiguration()
    {
        _sharedReader = FakeMigrationHistoryReader.WithActiveRecords("20260916060219_CreateIdentityFoundation");
        _instanceA = TestHostFixture.Start(migrationHistoryReader: _sharedReader);
        _instanceB = TestHostFixture.Start(migrationHistoryReader: _sharedReader);
    }

    [When("health and database-backed diagnostic requests alternate between the instances")]
    public async Task WhenHealthAndDatabaseBackedDiagnosticRequestsAlternateBetweenTheInstancesAsync()
    {
        await RecordReadinessAsync(_instanceA!).ConfigureAwait(false);
        await RecordReadinessAsync(_instanceB!).ConfigureAwait(false);
        await RecordReadinessAsync(_instanceA!).ConfigureAwait(false);
        await RecordReadinessAsync(_instanceB!).ConfigureAwait(false);
    }

    [Then("every response is consistent with the shared dependency state")]
    public void ThenEveryResponseIsConsistentWithTheSharedDependencyState()
    {
        _responses.Should().HaveCount(4, Feature);
        _responses.Should().OnlyContain(response => response.Status == HttpStatusCode.OK, Feature);

        // Every instance read the same underlying state, so every body is identical
        // regardless of which instance, or which alternation, produced it.
        _responses.Select(response => response.Body).Should().OnlyContain(body => body == _responses[0].Body);
    }

    [Then("stopping either instance does not change the surviving instance's correctness")]
    public async Task ThenStoppingEitherInstanceDoesNotChangeTheSurvivingInstancesCorrectnessAsync()
    {
        _instanceA!.Dispose();
        _instanceA = null;

        using HttpResponseMessage stillReady = await _instanceB!.Client.GetAsync("/health/ready").ConfigureAwait(false);
        stillReady.StatusCode.Should().Be(HttpStatusCode.OK, Feature);

        // The surviving instance's correctness still tracks the one shared dependency,
        // not anything the stopped instance held: stopping it changes nothing here.
        _sharedReader!.Stop();

        using HttpResponseMessage afterDependencyStopped = await _instanceB
            .Client.GetAsync("/health/ready")
            .ConfigureAwait(false);
        afterDependencyStopped.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable, Feature);
    }

    public void Dispose()
    {
        _instanceA?.Dispose();
        _instanceB?.Dispose();
    }

    private async Task RecordReadinessAsync(TestHostFixture instance)
    {
        using HttpResponseMessage response = await instance.Client.GetAsync("/health/ready").ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        _responses.Add((response.StatusCode, body));
    }
}
