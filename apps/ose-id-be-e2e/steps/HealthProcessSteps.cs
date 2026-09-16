using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using FluentAssertions;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for specs/apps/ose/id-be/behaviours/foundation/health.feature. It runs the
/// real published host against a dedicated, scenario-owned PostgreSQL container and a
/// dedicated port — never <see cref="OseIdDatabase" />'s shared database or
/// <see cref="RunningBackend" />'s shared instance. This scenario must literally stop its
/// dependency mid-run, and every other PostgreSQL-backed scenario needs its own instance to
/// stay up for the whole assembly, so sharing either would make one scenario's action break
/// another's evidence.
/// </summary>
[Binding]
public sealed class HealthProcessSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/health.feature";
    private const string CorrelationHeader = "X-Correlation-ID";

    private static readonly HttpClient Client = new() { Timeout = TimeSpan.FromSeconds(30) };

    private PostgresResource? _database;
    private BackendProcess? _backend;
    private Uri? _baseAddress;
    private string _readinessBody = string.Empty;

    [Given("the local backend is live and ready")]
    public async Task GivenTheLocalBackendIsLiveAndReadyAsync()
    {
        _database = PostgresResource.Start(TimeSpan.FromMinutes(2));

        (int migrationExitCode, string migrationOutput) = MigrationRunner.Run(_database.MigratorConnectionString);
        if (migrationExitCode != 0)
        {
            throw new InvalidOperationException($"the migration stage failed: {_database.Sanitize(migrationOutput)}");
        }

        int port = AllocateEphemeralPort();
        _baseAddress = new Uri($"http://127.0.0.1:{port.ToString(CultureInfo.InvariantCulture)}");
        _backend = BackendProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_RUNTIME_MODE"] = "Test",
                ["OSE_ID_BE_PORT"] = port.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_CONNECTION"] = _database.ApplicationConnectionString,
            }
        );

        if (!_backend.WaitForListener(port, TimeSpan.FromSeconds(60)))
        {
            string diagnostics = _database.Sanitize(_backend.StandardError + _backend.StandardOutput);
            throw new InvalidOperationException(
                $"ose-id-be did not bind 127.0.0.1:{port.ToString(CultureInfo.InvariantCulture)} within its startup budget: {diagnostics}"
            );
        }

        using HttpResponseMessage response = await Client
            .GetAsync(new Uri(_baseAddress, "/health/ready"))
            .ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.OK, Feature);
    }

    [When("its owned PostgreSQL dependency is stopped")]
    public void WhenItsOwnedPostgreSqlDependencyIsStopped() => _database!.Stop();

    [Then("liveness remains successful")]
    public async Task ThenLivenessRemainsSuccessfulAsync()
    {
        using HttpResponseMessage response = await Client
            .GetAsync(new Uri(_baseAddress!, "/health/live"))
            .ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.OK, Feature);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/json");
        response.Headers.CacheControl!.NoStore.Should().BeTrue();
        response.Headers.GetValues(CorrelationHeader).Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(body);
        document.RootElement.GetProperty("status").GetString().Should().Be("live");
        document.RootElement.GetProperty("service").GetString().Should().Be("ose-id-be");
    }

    [Then("readiness becomes unsuccessful with a stable database component code")]
    public async Task ThenReadinessBecomesUnsuccessfulWithAStableDatabaseComponentCodeAsync()
    {
        using HttpResponseMessage response = await Client
            .GetAsync(new Uri(_baseAddress!, "/health/ready"))
            .ConfigureAwait(false);
        _readinessBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable, Feature);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        response.Headers.CacheControl!.NoStore.Should().BeTrue();
        response.Headers.GetValues(CorrelationHeader).Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(_readinessBody);
        JsonElement problem = document.RootElement;

        problem.GetProperty("status").GetInt32().Should().Be(503);
        problem.GetProperty("code").GetString().Should().Be("database_unavailable");
    }

    [Then("no secret or connection detail is returned")]
    public void ThenNoSecretOrConnectionDetailIsReturned()
    {
        // The run's own generated passwords are the ground truth for "a secret leaked": if
        // sanitizing them changes nothing, none of them were present to begin with.
        _database!.Sanitize(_readinessBody).Should().Be(_readinessBody, Feature);
        _readinessBody.Should().NotContainAny("Host=", "Password=", "Username=", "Port=", "127.0.0.1", "localhost");
    }

    public void Dispose()
    {
        _backend?.Dispose();
        _database?.Dispose();
    }

    private static int AllocateEphemeralPort()
    {
        using var probe = new TcpListener(IPAddress.Loopback, 0);
        probe.Start();
        int port = ((IPEndPoint)probe.LocalEndpoint).Port;
        probe.Stop();
        return port;
    }
}
