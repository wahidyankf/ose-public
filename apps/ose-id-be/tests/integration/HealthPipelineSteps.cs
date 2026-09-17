using System.Net;
using System.Text.Json;
using FluentAssertions;
using OseId.Domain.Correlation;
using OseId.Domain.Health;
using OseId.Domain.Persistence;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for specs/apps/ose/id-be/behaviours/foundation/health.feature. It
/// sends real requests through the delivered ASP.NET Core pipeline against a controllable
/// migration-history double, so the mapping from dependency state to the contracted
/// transport shape — headers, status, and JSON — is proven without a database. Real
/// outage/recovery against an owned PostgreSQL is the E2E adapter's obligation.
/// </summary>
[Binding]
public sealed class HealthPipelineSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/health.feature";
    private const string CorrelationHeader = "X-Correlation-ID";

    /// <summary>The one migration this build compiled against, named once for every step below.</summary>
    private static readonly string CompatibleMigrationId = SchemaCompatibility.CompatibleMigrationIds[0];

    private TestHostFixture? _host;
    private FakeMigrationHistoryReader? _reader;
    private HttpResponseMessage? _answer;
    private string _answerBody = string.Empty;
    private string _readinessBody = string.Empty;

    [Given("the local backend is live and ready")]
    public async Task GivenTheLocalBackendIsLiveAndReadyAsync()
    {
        StartWith(FakeMigrationHistoryReader.WithActiveRecords(CompatibleMigrationId));

        using HttpResponseMessage response = await _host!.Client.GetAsync("/health/ready").ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.OK, Feature);
    }

    [Given("the backend listener is running and PostgreSQL is unavailable")]
    public void GivenTheBackendListenerIsRunningAndPostgreSqlIsUnavailable() =>
        StartWith(FakeMigrationHistoryReader.Unavailable());

    [Given("the backend listener is running with PostgreSQL and schema ready")]
    public void GivenTheBackendListenerIsRunningWithPostgreSqlAndSchemaReady() =>
        StartWith(FakeMigrationHistoryReader.WithActiveRecords(CompatibleMigrationId));

    [Given("the backend listener is running with PostgreSQL unavailable")]
    public void GivenTheBackendListenerIsRunningWithPostgreSqlUnavailable() =>
        StartWith(FakeMigrationHistoryReader.Unavailable());

    [Given("the backend listener is running with schema version incompatible")]
    public void GivenTheBackendListenerIsRunningWithSchemaVersionIncompatible() =>
        // Readable, so the database answered; its active set simply does not carry the migration
        // this build compiled against, which is what separates incompatible from unavailable.
        StartWith(FakeMigrationHistoryReader.WithActiveRecords());

    [When("its owned PostgreSQL dependency is stopped")]
    public void WhenItsOwnedPostgreSqlDependencyIsStopped() => _reader!.Stop();

    [When("an anonymous caller asks whether the service is live")]
    public async Task WhenAnAnonymousCallerAsksWhetherTheServiceIsLiveAsync() =>
        await RequestAsync("/health/live").ConfigureAwait(false);

    [When("an anonymous caller asks whether the service is ready")]
    public async Task WhenAnAnonymousCallerAsksWhetherTheServiceIsReadyAsync() =>
        await RequestAsync("/health/ready").ConfigureAwait(false);

    [Then("liveness remains successful")]
    public async Task ThenLivenessRemainsSuccessfulAsync()
    {
        using HttpResponseMessage response = await _host!.Client.GetAsync("/health/live").ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.OK, Feature);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/json");
        response.Headers.CacheControl!.NoStore.Should().BeTrue();
        response.Headers.GetValues(CorrelationHeader).Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(body);
        JsonElement liveness = document.RootElement;

        liveness.EnumerateObject().Select(property => property.Name).Should().BeEquivalentTo("status", "service");
        liveness.GetProperty("status").GetString().Should().Be("live");
        liveness.GetProperty("service").GetString().Should().Be("ose-id-be");
    }

    [Then("liveness answers successfully with the fixed service identity")]
    public void ThenLivenessAnswersSuccessfullyWithTheFixedServiceIdentity()
    {
        _answer.Should().NotBeNull(Feature);
        _answer.StatusCode.Should().Be(HttpStatusCode.OK);
        _answer.Content.Headers.ContentType!.MediaType.Should().Be("application/json");

        using JsonDocument document = JsonDocument.Parse(_answerBody);
        JsonElement liveness = document.RootElement;

        liveness.EnumerateObject().Select(property => property.Name).Should().BeEquivalentTo("status", "service");
        liveness.GetProperty("status").GetString().Should().Be(LivenessPolicy.Status);
        liveness.GetProperty("service").GetString().Should().Be(LivenessPolicy.ServiceName);
    }

    [Then("the liveness answer is uncacheable and carries a correlation value")]
    public void ThenTheLivenessAnswerIsUncacheableAndCarriesACorrelationValue()
    {
        _answer.Should().NotBeNull(Feature);
        _answer.Headers.CacheControl!.NoStore.Should().BeTrue();

        string correlation = _answer.Headers.GetValues(CorrelationHeader).Should().ContainSingle().Subject;
        CorrelationId.TryAccept(correlation, out _).Should().BeTrue();

        // The value is minted per answer, not reused: a cache keyed on this route would hand a
        // second caller the first caller's correlation value.
        _answerBody.Should().NotContain(correlation);
    }

    [Then("no dependency is consulted and no state is changed")]
    public void ThenNoDependencyIsConsultedAndNoStateIsChanged()
    {
        // The registered reader reports unavailable, so a liveness path that consulted it could
        // not have answered 200 — and the delivered pipeline never reached it at all.
        _reader.Should().NotBeNull(Feature);
        _reader.ReadCount.Should().Be(0);

        // Nothing came back that a caller could carry into a next request either.
        _answer!.Headers.Contains("Set-Cookie").Should().BeFalse();
    }

    [Then("readiness becomes unsuccessful with a stable database component code")]
    public async Task ThenReadinessBecomesUnsuccessfulWithAStableDatabaseComponentCodeAsync()
    {
        using HttpResponseMessage response = await _host!.Client.GetAsync("/health/ready").ConfigureAwait(false);
        _readinessBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable, Feature);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        response.Headers.CacheControl!.NoStore.Should().BeTrue();
        response.Headers.GetValues(CorrelationHeader).Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(_readinessBody);
        JsonElement problem = document.RootElement;

        problem
            .EnumerateObject()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("status", "code", "title", "correlationId");
        problem.GetProperty("status").GetInt32().Should().Be(503);
        problem.GetProperty("code").GetString().Should().Be("database_unavailable");
    }

    [Then("the readiness status is {int}")]
    public void ThenTheReadinessStatusIs(int status)
    {
        _answer.Should().NotBeNull(Feature);
        ((int)_answer.StatusCode).Should().Be(status);
        _answer.Headers.CacheControl!.NoStore.Should().BeTrue();
        _answer.Headers.GetValues(CorrelationHeader).Should().ContainSingle();
    }

    [Then("readiness reports {word} through the closed health or problem schema")]
    public void ThenReadinessReportsThroughTheClosedHealthOrProblemSchema(string result)
    {
        using JsonDocument document = JsonDocument.Parse(_answerBody);
        JsonElement body = document.RootElement;

        if (result == ReadinessPolicy.ReadyStatus)
        {
            _answer!.Content.Headers.ContentType!.MediaType.Should().Be("application/json");
            body.EnumerateObject().Select(property => property.Name).Should().BeEquivalentTo("status", "components");
            body.GetProperty("status").GetString().Should().Be(ReadinessPolicy.ReadyStatus);

            JsonElement components = body.GetProperty("components");
            components
                .EnumerateObject()
                .Select(property => property.Name)
                .Should()
                .BeEquivalentTo("postgresql", "schema");
            components.GetProperty("postgresql").GetString().Should().Be(ReadinessPolicy.PostgresqlComponentReady);
            components.GetProperty("schema").GetString().Should().Be(ReadinessPolicy.SchemaComponentCompatible);
            return;
        }

        _answer!.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        body.EnumerateObject()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("status", "code", "title", "correlationId");
        body.GetProperty("code").GetString().Should().Be(result);
        body.GetProperty("status").GetInt32().Should().Be(ReadinessPolicy.ProblemStatus);
        body.GetProperty("correlationId")
            .GetString()
            .Should()
            .Be(_answer.Headers.GetValues(CorrelationHeader).Single());
    }

    [Then("a repeated request re-evaluates the current state without mutating it")]
    public async Task ThenARepeatedRequestReEvaluatesTheCurrentStateWithoutMutatingItAsync()
    {
        int readsBefore = _reader!.ReadCount;

        using HttpResponseMessage repeated = await _host!.Client.GetAsync("/health/ready").ConfigureAwait(false);
        string repeatedBody = await repeated.Content.ReadAsStringAsync().ConfigureAwait(false);

        // Re-evaluated rather than replayed: the second request reached the dependency again.
        _reader.ReadCount.Should().Be(readsBefore + 1);

        repeated.StatusCode.Should().Be(_answer!.StatusCode);
        WithoutCorrelation(repeatedBody).Should().Be(WithoutCorrelation(_answerBody));
    }

    [Then("no secret or connection detail is returned")]
    public void ThenNoSecretOrConnectionDetailIsReturned() =>
        _readinessBody.Should().NotContainAny("Host=", "Password=", "Username=", "Port=", "127.0.0.1", "localhost");

    [Then("no connection, schema, secret, stack trace, or absolute path is disclosed")]
    public void ThenNoConnectionSchemaSecretStackTraceOrAbsolutePathIsDisclosed() =>
        _answerBody
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

    public void Dispose()
    {
        _answer?.Dispose();
        _host?.Dispose();
    }

    private void StartWith(FakeMigrationHistoryReader reader)
    {
        _reader = reader;
        _host = TestHostFixture.Start(migrationHistoryReader: reader);
    }

    private async Task RequestAsync(string route)
    {
        _answer = await _host!.Client.GetAsync(route).ConfigureAwait(false);
        _answerBody = await _answer.Content.ReadAsStringAsync().ConfigureAwait(false);
    }

    /// <summary>
    /// The answer minus its per-request correlation value, so two evaluations of the same
    /// dependency state can be compared for the thing under test rather than for the one field
    /// that is required to differ.
    /// </summary>
    private static string WithoutCorrelation(string body)
    {
        using JsonDocument document = JsonDocument.Parse(body);

        return string.Join(
            ';',
            document
                .RootElement.EnumerateObject()
                .Where(property => property.Name != "correlationId")
                .Select(property => $"{property.Name}={property.Value.GetRawText()}")
                .Order(StringComparer.Ordinal)
        );
    }
}
