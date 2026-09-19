using System.Globalization;
using System.Net;
using System.Net.Sockets;
using FluentAssertions;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature.
/// It builds and runs two real ose-id-be processes on two dedicated ports against one
/// dedicated, scenario-owned PostgreSQL container — never <see cref="OseIdDatabase" />'s
/// shared instance or <see cref="RunningBackend" />'s single shared process, since proving
/// no affinity needs two independently running instances rather than one.
/// </summary>
[Binding]
public sealed class StatelessInstanceProcessSteps : IDisposable
{
    private const string _feature = "specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature";

    private static readonly HttpClient _client = new() { Timeout = TimeSpan.FromSeconds(30) };

    private readonly List<(HttpStatusCode Status, string Body)> _responses = [];

    private PostgresResource? _database;
    private BackendProcess? _instanceA;
    private BackendProcess? _instanceB;
    private Uri? _baseAddressA;
    private Uri? _baseAddressB;

    [Given("two backend instances share the same PostgreSQL schema and immutable configuration")]
    public async Task GivenTwoBackendInstancesShareTheSamePostgreSqlSchemaAndImmutableConfigurationAsync()
    {
        _database = PostgresResource.Start(TimeSpan.FromMinutes(2));

        (int migrationExitCode, string migrationOutput) = MigrationRunner.Run(_database.MigratorConnectionString);
        if (migrationExitCode != 0)
        {
            throw new InvalidOperationException($"the migration stage failed: {_database.Sanitize(migrationOutput)}");
        }

        (_instanceA, _baseAddressA) = await StartInstanceAsync().ConfigureAwait(false);
        (_instanceB, _baseAddressB) = await StartInstanceAsync().ConfigureAwait(false);
    }

    [When("health and database-backed diagnostic requests alternate between the instances")]
    public async Task WhenHealthAndDatabaseBackedDiagnosticRequestsAlternateBetweenTheInstancesAsync()
    {
        await RecordReadinessAsync(_baseAddressA!).ConfigureAwait(false);
        await RecordReadinessAsync(_baseAddressB!).ConfigureAwait(false);
        await RecordReadinessAsync(_baseAddressA!).ConfigureAwait(false);
        await RecordReadinessAsync(_baseAddressB!).ConfigureAwait(false);
    }

    [Then("every response is consistent with the shared dependency state")]
    public void ThenEveryResponseIsConsistentWithTheSharedDependencyState()
    {
        _responses.Should().HaveCount(4, _feature);
        _responses.Should().OnlyContain(response => response.Status == HttpStatusCode.OK, _feature);
        _responses.Select(response => response.Body).Should().OnlyContain(body => body == _responses[0].Body);
    }

    [Then("stopping either instance does not change the surviving instance's correctness")]
    public async Task ThenStoppingEitherInstanceDoesNotChangeTheSurvivingInstancesCorrectnessAsync()
    {
        _instanceA!.Dispose();
        _instanceA = null;

        using HttpResponseMessage stillReady = await _client
            .GetAsync(new Uri(_baseAddressB!, "/health/ready"))
            .ConfigureAwait(false);

        stillReady.StatusCode.Should().Be(HttpStatusCode.OK, _feature);
    }

    public void Dispose()
    {
        _instanceA?.Dispose();
        _instanceB?.Dispose();
        _database?.Dispose();
    }

    private async Task<(BackendProcess Backend, Uri BaseAddress)> StartInstanceAsync()
    {
        int port = AllocateEphemeralPort();
        var baseAddress = new Uri($"http://127.0.0.1:{port.ToString(CultureInfo.InvariantCulture)}");
        BackendProcess backend = BackendProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_RUNTIME_MODE"] = "Test",
                ["OSE_ID_BE_PORT"] = port.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_CONNECTION"] = _database!.ApplicationConnectionString,
            }
        );

        if (!backend.WaitForListener(port, TimeSpan.FromSeconds(60)))
        {
            string diagnostics = _database.Sanitize(backend.StandardError + backend.StandardOutput);
            backend.Dispose();
            throw new InvalidOperationException(
                $"ose-id-be did not bind 127.0.0.1:{port.ToString(CultureInfo.InvariantCulture)} within its startup budget: {diagnostics}"
            );
        }

        using HttpResponseMessage response = await _client
            .GetAsync(new Uri(baseAddress, "/health/ready"))
            .ConfigureAwait(false);
        response.StatusCode.Should().Be(HttpStatusCode.OK, _feature);

        return (backend, baseAddress);
    }

    private async Task RecordReadinessAsync(Uri baseAddress)
    {
        using HttpResponseMessage response = await _client
            .GetAsync(new Uri(baseAddress, "/health/ready"))
            .ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        _responses.Add((response.StatusCode, body));
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
