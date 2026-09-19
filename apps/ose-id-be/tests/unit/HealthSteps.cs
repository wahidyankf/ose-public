using System.Globalization;
using FluentAssertions;
using OseId.Application.Health;
using OseId.Application.Persistence;
using OseId.Domain.Health;
using OseId.Domain.Persistence;
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

    /// <summary>The one migration this build compiled against, named once for every step below.</summary>
    private static readonly string CompatibleMigrationId = SchemaCompatibility.CompatibleMigrationIds[0];

    private readonly RecordingCorrelationIdFactory _correlationIds = new();
    private FakeMigrationHistoryReader? _reader;
    private LivenessResult? _liveness;
    private ReadinessResult? _readiness;

    [Given("the local backend is live and ready")]
    public async Task GivenTheLocalBackendIsLiveAndReadyAsync()
    {
        _reader = FakeMigrationHistoryReader.WithActiveRecords(CompatibleMigrationId);

        (await ReadReadinessAsync()).Should().BeOfType<ReadinessResult.Ready>(Feature);
    }

    [Given("the backend listener is running and PostgreSQL is unavailable")]
    public void GivenTheBackendListenerIsRunningAndPostgreSqlIsUnavailable() =>
        _reader = FakeMigrationHistoryReader.Unavailable();

    [Given("the backend listener is running with PostgreSQL and schema ready")]
    public void GivenTheBackendListenerIsRunningWithPostgreSqlAndSchemaReady() =>
        _reader = FakeMigrationHistoryReader.WithActiveRecords(CompatibleMigrationId);

    [Given("the backend listener is running with PostgreSQL unavailable")]
    public void GivenTheBackendListenerIsRunningWithPostgreSqlUnavailable() =>
        _reader = FakeMigrationHistoryReader.Unavailable();

    [Given("the backend listener is running with schema version incompatible")]
    public void GivenTheBackendListenerIsRunningWithSchemaVersionIncompatible() =>
        // Readable, so the database itself answered; its active set simply does not carry the
        // migration this build compiled against, which is exactly what makes it incompatible
        // rather than unavailable.
        _reader = FakeMigrationHistoryReader.WithActiveRecords();

    [When("its owned PostgreSQL dependency is stopped")]
    public async Task WhenItsOwnedPostgreSqlDependencyIsStoppedAsync()
    {
        _reader!.Stop();

        _liveness = new ReportLiveness(_correlationIds).Execute(suppliedCorrelationId: null);
        _readiness = await ReadReadinessAsync();
    }

    [When("an anonymous caller asks whether the service is live")]
    public void WhenAnAnonymousCallerAsksWhetherTheServiceIsLive() =>
        _liveness = new ReportLiveness(_correlationIds).Execute(suppliedCorrelationId: null);

    [When("an anonymous caller asks whether the service is ready")]
    public async Task WhenAnAnonymousCallerAsksWhetherTheServiceIsReadyAsync() =>
        _readiness = await ReadReadinessAsync();

    [Then("liveness remains successful")]
    public void ThenLivenessRemainsSuccessful()
    {
        _liveness.Should().NotBeNull(Feature);
        _liveness.Status.Should().Be(LivenessPolicy.Status);
        _liveness.Service.Should().Be(LivenessPolicy.ServiceName);
    }

    [Then("liveness answers successfully with the fixed service identity")]
    public void ThenLivenessAnswersSuccessfullyWithTheFixedServiceIdentity()
    {
        _liveness.Should().NotBeNull(Feature);
        _liveness.Status.Should().Be("live");
        _liveness.Service.Should().Be("ose-id-be");

        // "Fixed" is the claim under test: the only fields liveness has are these three, so
        // there is no field a dependency's state could have varied.
        typeof(LivenessResult)
            .GetProperties()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("Status", "Service", "CorrelationId");
    }

    [Then("the liveness answer is uncacheable and carries a correlation value")]
    public void ThenTheLivenessAnswerIsUncacheableAndCarriesACorrelationValue()
    {
        _liveness.Should().NotBeNull(Feature);
        _liveness.CorrelationId.Should().Be(RecordingCorrelationIdFactory.FixedValue);

        // Uncacheable at this ring means the use case memoizes nothing: a second ask mints a
        // second correlation value rather than replaying the first answer.
        _correlationIds.CreatedCount.Should().Be(1);
        new ReportLiveness(_correlationIds).Execute(suppliedCorrelationId: null);
        _correlationIds.CreatedCount.Should().Be(2);
    }

    [Then("no dependency is consulted and no state is changed")]
    public void ThenNoDependencyIsConsultedAndNoStateIsChanged()
    {
        // The reader is configured unavailable, so a liveness path that consulted it could not
        // have answered successfully — and it was never asked at all.
        _reader.Should().NotBeNull(Feature);
        _reader.ReadCount.Should().Be(0);

        // And it could not be asked: the liveness use case is constructed from the correlation
        // port alone, so no read or write port is reachable from it.
        typeof(ReportLiveness)
            .GetConstructors()
            .SelectMany(constructor => constructor.GetParameters())
            .Select(parameter => parameter.ParameterType.FullName)
            .Should()
            .BeEquivalentTo("OseId.Application.Foundation.Ports.ICorrelationIdFactory");
    }

    [Then("readiness becomes unsuccessful with a stable database component code")]
    public void ThenReadinessBecomesUnsuccessfulWithAStableDatabaseComponentCode()
    {
        var problem = _readiness.Should().BeOfType<ReadinessResult.Problem>(Feature).Subject;
        problem.Status.Should().Be(ReadinessPolicy.ProblemStatus);
        problem.Code.Should().Be(ReadinessPolicy.DatabaseUnavailableCode);
    }

    [Then("the readiness status is {int}")]
    public void ThenTheReadinessStatusIs(int status)
    {
        _readiness.Should().NotBeNull(Feature);

        if (status == 200)
        {
            _readiness.Should().BeOfType<ReadinessResult.Ready>(Feature);
            return;
        }

        var problem = _readiness.Should().BeOfType<ReadinessResult.Problem>(Feature).Subject;
        problem.Status.Should().Be(status);
        problem.Status.Should().Be(ReadinessPolicy.ProblemStatus);
    }

    [Then("readiness reports {word} through the closed health or problem schema")]
    public void ThenReadinessReportsThroughTheClosedHealthOrProblemSchema(string result)
    {
        if (result == ReadinessPolicy.ReadyStatus)
        {
            _readiness.Should().BeOfType<ReadinessResult.Ready>(Feature);

            // The success shape carries the correlation value and nothing else; the status and
            // component words a caller reads are fixed policy literals, never read-derived text.
            typeof(ReadinessResult.Ready)
                .GetProperties()
                .Select(property => property.Name)
                .Should()
                .BeEquivalentTo("CorrelationId");
            ReadinessPolicy.PostgresqlComponentReady.Should().Be("ready");
            ReadinessPolicy.SchemaComponentCompatible.Should().Be("compatible");
            return;
        }

        var problem = _readiness.Should().BeOfType<ReadinessResult.Problem>(Feature).Subject;
        problem.Code.Should().Be(result);
        problem.Title.Should().Be(TitleFor(result));

        // The failure shape is closed too: four fields, none of which could carry a host, a
        // migration name, or a provider message even if the read had produced one.
        typeof(ReadinessResult.Problem)
            .GetProperties()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("Status", "Code", "Title", "CorrelationId");
    }

    [Then("a repeated request re-evaluates the current state without mutating it")]
    public async Task ThenARepeatedRequestReEvaluatesTheCurrentStateWithoutMutatingItAsync()
    {
        _reader.Should().NotBeNull(Feature);
        int readsBefore = _reader.ReadCount;

        ReadinessResult repeated = await ReadReadinessAsync().ConfigureAwait(false);

        // Re-evaluated rather than replayed: the second ask reached the reader again.
        _reader.ReadCount.Should().Be(readsBefore + 1);

        // And unchanged: the same dependency state produces the same outcome, so the first ask
        // wrote nothing a second ask could observe.
        repeated.GetType().Should().Be(_readiness!.GetType());
        Describe(repeated).Should().Be(Describe(_readiness));
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

    [Then("no connection, schema, secret, stack trace, or absolute path is disclosed")]
    public void ThenNoConnectionSchemaSecretStackTraceOrAbsolutePathIsDisclosed()
    {
        // Whichever answer this scenario produced, read whole: a record's own text rendering
        // includes every field, so a field added later is covered without editing this step.
        string answer = _readiness is null ? Describe(_liveness!) : Describe(_readiness);

        answer
            .Should()
            .NotContainAny(
                "Host=",
                "Port=",
                "Password=",
                "Username=",
                "127.0.0.1",
                "localhost",
                CompatibleMigrationId,
                FoundationSchemaContract.HistoryTableName,
                "Exception",
                " at ",
                "/",
                "\\"
            );
    }

    /// <summary>The fixed title the policy pairs with a stable failure code.</summary>
    private static string TitleFor(string code) =>
        code == ReadinessPolicy.DatabaseUnavailableCode
            ? ReadinessPolicy.DatabaseUnavailableTitle
            : ReadinessPolicy.SchemaIncompatibleTitle;

    /// <summary>One comparable rendering of an answer, including every field it carries.</summary>
    private static string Describe(object answer) =>
        string.Create(CultureInfo.InvariantCulture, $"{answer.GetType().Name}: {answer}");

    private async Task<ReadinessResult> ReadReadinessAsync() =>
        await new ReportReadiness(new ReadSchemaState(_reader!), _correlationIds)
            .ExecuteAsync(suppliedCorrelationId: null, CancellationToken.None)
            .ConfigureAwait(false);
}
