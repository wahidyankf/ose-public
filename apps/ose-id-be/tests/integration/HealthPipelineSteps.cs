using System.Net;
using System.Text.Json;
using FluentAssertions;
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

    private TestHostFixture? _host;
    private FakeMigrationHistoryReader? _reader;
    private string _readinessBody = string.Empty;

    [Given("the local backend is live and ready")]
    public async Task GivenTheLocalBackendIsLiveAndReadyAsync()
    {
        _reader = FakeMigrationHistoryReader.WithActiveRecords("20260916060219_CreateIdentityFoundation");
        _host = TestHostFixture.Start(migrationHistoryReader: _reader);

        using HttpResponseMessage response = await _host.Client.GetAsync("/health/ready").ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.OK, Feature);
    }

    [When("its owned PostgreSQL dependency is stopped")]
    public void WhenItsOwnedPostgreSqlDependencyIsStopped() => _reader!.Stop();

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

    [Then("no secret or connection detail is returned")]
    public void ThenNoSecretOrConnectionDetailIsReturned() =>
        _readinessBody.Should().NotContainAny("Host=", "Password=", "Username=", "Port=", "127.0.0.1", "localhost");

    public void Dispose() => _host?.Dispose();
}
