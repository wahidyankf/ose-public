using FluentAssertions;
using OseId.Application.Health;
using OseId.Application.Persistence;
using OseId.Domain.Health;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for specs/apps/ose/id-be/behaviours/foundation/health.feature. It drives
/// the liveness and readiness use cases directly against a fake migration-history reader,
/// so the mapping from dependency state to response shape is proven without an ASP.NET
/// pipeline: the transport mapping is the Integration adapter's obligation.
/// </summary>
[Binding]
public sealed class HealthSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/health.feature";

    private readonly RecordingCorrelationIdFactory _correlationIds = new();
    private FakeMigrationHistoryReader? _reader;
    private LivenessResult? _liveness;
    private ReadinessResult? _readiness;

    [Given("the local backend is live and ready")]
    public async Task GivenTheLocalBackendIsLiveAndReadyAsync()
    {
        _reader = FakeMigrationHistoryReader.WithActiveRecords("20260916060219_CreateIdentityFoundation");

        (await ReadReadinessAsync()).Should().BeOfType<ReadinessResult.Ready>(Feature);
    }

    [When("its owned PostgreSQL dependency is stopped")]
    public async Task WhenItsOwnedPostgreSqlDependencyIsStoppedAsync()
    {
        _reader!.Stop();

        _liveness = new ReportLiveness(_correlationIds).Execute(suppliedCorrelationId: null);
        _readiness = await ReadReadinessAsync();
    }

    [Then("liveness remains successful")]
    public void ThenLivenessRemainsSuccessful()
    {
        _liveness.Should().NotBeNull(Feature);
        _liveness.Status.Should().Be(LivenessPolicy.Status);
        _liveness.Service.Should().Be(LivenessPolicy.ServiceName);
    }

    [Then("readiness becomes unsuccessful with a stable database component code")]
    public void ThenReadinessBecomesUnsuccessfulWithAStableDatabaseComponentCode()
    {
        var problem = _readiness.Should().BeOfType<ReadinessResult.Problem>(Feature).Subject;
        problem.Status.Should().Be(ReadinessPolicy.ProblemStatus);
        problem.Code.Should().Be(ReadinessPolicy.DatabaseUnavailableCode);
    }

    [Then("no secret or connection detail is returned")]
    public void ThenNoSecretOrConnectionDetailIsReturned()
    {
        var problem = (ReadinessResult.Problem)_readiness!;

        // The title is the only free-text field a readiness problem carries; the closed
        // code/status pair above is the only other content. Neither type has a field a
        // connection string, password, or host could travel through.
        problem.Title.Should().NotContainAny("Host=", "Password=", "Username=", "127.0.0.1", "localhost");
    }

    private async Task<ReadinessResult> ReadReadinessAsync() =>
        await new ReportReadiness(new ReadSchemaState(_reader!), _correlationIds)
            .ExecuteAsync(suppliedCorrelationId: null, CancellationToken.None)
            .ConfigureAwait(false);
}
