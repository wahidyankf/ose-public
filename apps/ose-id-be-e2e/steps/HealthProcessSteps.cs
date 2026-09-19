using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using FluentAssertions;
using Npgsql;
using OseId.Domain.Persistence;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for specs/apps/ose/id-be/behaviours/foundation/health.feature. It runs the
/// real published host over a loopback socket and reads the real answer.
///
/// A scenario that must break its dependency, or leave it in a state no other scenario may
/// see, starts its own PostgreSQL container and its own process on its own port rather than
/// using <see cref="OseIdDatabase" />'s shared database or <see cref="RunningBackend" />'s
/// shared instance: sharing either would make one scenario's action destroy another's
/// evidence. A scenario that only reads a healthy dependency uses the shared pair, because
/// starting a second container to read it would buy nothing.
/// </summary>
[Binding]
public sealed class HealthProcessSteps : IDisposable
{
    private const string _feature = "specs/apps/ose/id-be/behaviours/foundation/health.feature";
    private const string _correlationHeader = "X-Correlation-ID";

    /// <summary>
    /// Syntactically valid and deliberately unreachable, so a scenario about an unavailable
    /// dependency cannot pass by finding a real database on the developer's machine.
    /// </summary>
    private const string _unreachableConnectionString =
        "Host=127.0.0.1;Port=1;Database=ose_id;Username=ose_id_test;Password=ose_id_test;Timeout=2;Command Timeout=2";

    private static readonly HttpClient _client = new() { Timeout = TimeSpan.FromSeconds(30) };

    /// <summary>The one migration this build compiled against, named once for every step below.</summary>
    private static readonly string _compatibleMigrationId = SchemaCompatibility.CompatibleMigrationIds[0];

    private PostgresResource? _database;
    private BackendProcess? _backend;
    private Uri? _baseAddress;

    /// <summary>
    /// A connection string through which this scenario's database can be read directly, when it
    /// has one. The unavailable-dependency rows deliberately have none: there is no reachable
    /// database in those scenarios, which is the state under test.
    /// </summary>
    private string? _readableConnectionString;

    private HttpResponseMessage? _answer;
    private string _answerBody = string.Empty;
    private string _readinessBody = string.Empty;

    [Given("the local backend is live and ready")]
    public async Task GivenTheLocalBackendIsLiveAndReadyAsync()
    {
        StartOwnedDatabase();
        StartBackend(_database!.ApplicationConnectionString);

        using HttpResponseMessage response = await _client
            .GetAsync(new Uri(_baseAddress!, "/health/ready"))
            .ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.OK, _feature);
    }

    [Given("the backend listener is running and PostgreSQL is unavailable")]
    public void GivenTheBackendListenerIsRunningAndPostgreSqlIsUnavailable() =>
        StartBackend(_unreachableConnectionString);

    [Given("the backend listener is running with PostgreSQL and schema ready")]
    public void GivenTheBackendListenerIsRunningWithPostgreSqlAndSchemaReady()
    {
        // The shared migrated database and the shared served instance, read-only: nothing in
        // this row changes either, so owning a second container would prove nothing more.
        RunningBackend.EnsureServing();
        _baseAddress = RunningBackend.BaseAddress;
        _readableConnectionString = OseIdDatabase.Instance.MigratorConnectionString;
    }

    [Given("the backend listener is running with PostgreSQL unavailable")]
    public void GivenTheBackendListenerIsRunningWithPostgreSqlUnavailable() =>
        StartBackend(_unreachableConnectionString);

    [Given("the backend listener is running with schema version incompatible")]
    public void GivenTheBackendListenerIsRunningWithSchemaVersionIncompatible()
    {
        StartOwnedDatabase();

        // Tombstone the applied migration through the audit envelope the schema itself defines.
        // The row stays — a hard delete is refused by the guard trigger — so the database is
        // fully reachable and answers the readiness read; its active set simply no longer
        // carries the migration this build compiled against. That is the real difference
        // between "incompatible" and "unavailable", and this is the only way to produce it
        // without hand-writing a schema the migrator never made.
        _database!.Psql(
            PostgresResource.DatabaseName,
            $"""
            UPDATE {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}"
            SET deleted_at = CURRENT_TIMESTAMP, deleted_by = 'e2e_schema_incompatible'
            WHERE deleted_at IS NULL;
            """
        );

        ActiveHistoryRows(_database.MigratorConnectionString)
            .Should()
            .BeEmpty("the tombstoned migration must no longer be active");

        StartBackend(_database.ApplicationConnectionString);
        _readableConnectionString = _database.MigratorConnectionString;
    }

    [When("its owned PostgreSQL dependency is stopped")]
    public void WhenItsOwnedPostgreSqlDependencyIsStopped() => _database!.Stop();

    [When("an anonymous caller asks whether the service is live")]
    public async Task WhenAnAnonymousCallerAsksWhetherTheServiceIsLiveAsync() =>
        await RequestAsync("/health/live").ConfigureAwait(false);

    [When("an anonymous caller asks whether the service is ready")]
    public async Task WhenAnAnonymousCallerAsksWhetherTheServiceIsReadyAsync() =>
        await RequestAsync("/health/ready").ConfigureAwait(false);

    [Then("liveness remains successful")]
    public async Task ThenLivenessRemainsSuccessfulAsync()
    {
        using HttpResponseMessage response = await _client
            .GetAsync(new Uri(_baseAddress!, "/health/live"))
            .ConfigureAwait(false);
        string body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.OK, _feature);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/json");
        response.Headers.CacheControl!.NoStore.Should().BeTrue();
        response.Headers.GetValues(_correlationHeader).Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(body);
        document.RootElement.GetProperty("status").GetString().Should().Be("live");
        document.RootElement.GetProperty("service").GetString().Should().Be("ose-id-be");
    }

    [Then("liveness answers successfully with the fixed service identity")]
    public void ThenLivenessAnswersSuccessfullyWithTheFixedServiceIdentity()
    {
        _answer.Should().NotBeNull(_feature);
        _answer.StatusCode.Should().Be(HttpStatusCode.OK);
        _answer.Content.Headers.ContentType!.MediaType.Should().Be("application/json");

        using JsonDocument document = JsonDocument.Parse(_answerBody);
        JsonElement liveness = document.RootElement;

        liveness.EnumerateObject().Select(property => property.Name).Should().BeEquivalentTo("status", "service");
        liveness.GetProperty("status").GetString().Should().Be("live");
        liveness.GetProperty("service").GetString().Should().Be("ose-id-be");
    }

    [Then("the liveness answer is uncacheable and carries a correlation value")]
    public async Task ThenTheLivenessAnswerIsUncacheableAndCarriesACorrelationValueAsync()
    {
        _answer!.Headers.CacheControl!.NoStore.Should().BeTrue(_feature);

        string correlation = _answer.Headers.GetValues(_correlationHeader).Should().ContainSingle().Subject;
        correlation.Should().NotBeNullOrWhiteSpace();

        // A second ask over the same socket carries its own value, so nothing between the wire
        // and the handler is serving a stored copy of the first answer.
        using HttpResponseMessage repeated = await _client
            .GetAsync(new Uri(_baseAddress!, "/health/live"))
            .ConfigureAwait(false);

        repeated.Headers.GetValues(_correlationHeader).Single().Should().NotBe(correlation);
    }

    [Then("no dependency is consulted and no state is changed")]
    public async Task ThenNoDependencyIsConsultedAndNoStateIsChangedAsync()
    {
        // Readiness on the very same process, at the very same moment, reports the dependency
        // as unreachable. Liveness answered 200 anyway, so liveness cannot have consulted it.
        using HttpResponseMessage readiness = await _client
            .GetAsync(new Uri(_baseAddress!, "/health/ready"))
            .ConfigureAwait(false);
        string body = await readiness.Content.ReadAsStringAsync().ConfigureAwait(false);

        readiness.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable, _feature);

        using JsonDocument document = JsonDocument.Parse(body);
        document.RootElement.GetProperty("code").GetString().Should().Be("database_unavailable");

        // And nothing came back that a caller could carry into a next request.
        _answer!.Headers.Contains("Set-Cookie").Should().BeFalse();
    }

    [Then("readiness becomes unsuccessful with a stable database component code")]
    public async Task ThenReadinessBecomesUnsuccessfulWithAStableDatabaseComponentCodeAsync()
    {
        using HttpResponseMessage response = await _client
            .GetAsync(new Uri(_baseAddress!, "/health/ready"))
            .ConfigureAwait(false);
        _readinessBody = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable, _feature);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        response.Headers.CacheControl!.NoStore.Should().BeTrue();
        response.Headers.GetValues(_correlationHeader).Should().ContainSingle();

        using JsonDocument document = JsonDocument.Parse(_readinessBody);
        JsonElement problem = document.RootElement;

        problem.GetProperty("status").GetInt32().Should().Be(503);
        problem.GetProperty("code").GetString().Should().Be("database_unavailable");
    }

    [Then("the readiness status is {int}")]
    public void ThenTheReadinessStatusIs(int status)
    {
        _answer.Should().NotBeNull(_feature);
        ((int)_answer.StatusCode).Should().Be(status);
        _answer.Headers.CacheControl!.NoStore.Should().BeTrue();
        _answer.Headers.GetValues(_correlationHeader).Should().ContainSingle();
    }

    [Then("readiness reports {word} through the closed health or problem schema")]
    public void ThenReadinessReportsThroughTheClosedHealthOrProblemSchema(string result)
    {
        using JsonDocument document = JsonDocument.Parse(_answerBody);
        JsonElement body = document.RootElement;

        if (result == "ready")
        {
            _answer!.Content.Headers.ContentType!.MediaType.Should().Be("application/json");
            body.EnumerateObject().Select(property => property.Name).Should().BeEquivalentTo("status", "components");
            body.GetProperty("status").GetString().Should().Be("ready");
            body.GetProperty("components").GetProperty("postgresql").GetString().Should().Be("ready");
            body.GetProperty("components").GetProperty("schema").GetString().Should().Be("compatible");
            return;
        }

        _answer!.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        body.EnumerateObject()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("status", "code", "title", "correlationId");
        body.GetProperty("code").GetString().Should().Be(result);
        body.GetProperty("status").GetInt32().Should().Be(503);
        body.GetProperty("correlationId")
            .GetString()
            .Should()
            .Be(_answer.Headers.GetValues(_correlationHeader).Single());
    }

    [Then("a repeated request re-evaluates the current state without mutating it")]
    public async Task ThenARepeatedRequestReEvaluatesTheCurrentStateWithoutMutatingItAsync()
    {
        string? rowsBefore = _readableConnectionString is null ? null : ActiveHistoryRows(_readableConnectionString);

        using HttpResponseMessage repeated = await _client
            .GetAsync(new Uri(_baseAddress!, "/health/ready"))
            .ConfigureAwait(false);
        string repeatedBody = await repeated.Content.ReadAsStringAsync().ConfigureAwait(false);

        repeated.StatusCode.Should().Be(_answer!.StatusCode, _feature);
        WithoutCorrelation(repeatedBody).Should().Be(WithoutCorrelation(_answerBody));

        // A fresh correlation value on the repeat is what makes it a re-evaluation rather than
        // a replayed copy of the first answer.
        repeated
            .Headers.GetValues(_correlationHeader)
            .Single()
            .Should()
            .NotBe(_answer.Headers.GetValues(_correlationHeader).Single());

        // And where this row has a reachable database, its active history is untouched: two
        // readiness reads wrote nothing. The unavailable row has no reachable database by
        // construction, so its no-mutation evidence is the identical re-evaluation above.
        if (rowsBefore is not null)
        {
            ActiveHistoryRows(_readableConnectionString!).Should().Be(rowsBefore, _feature);
        }
    }

    [Then("no secret or connection detail is returned")]
    public void ThenNoSecretOrConnectionDetailIsReturned()
    {
        // The run's own generated passwords are the ground truth for "a secret leaked": if
        // sanitizing them changes nothing, none of them were present to begin with.
        _database!.Sanitize(_readinessBody).Should().Be(_readinessBody, _feature);
        _readinessBody.Should().NotContainAny("Host=", "Password=", "Username=", "Port=", "127.0.0.1", "localhost");
    }

    [Then("no connection, schema, secret, stack trace, or absolute path is disclosed")]
    public void ThenNoConnectionSchemaSecretStackTraceOrAbsolutePathIsDisclosed()
    {
        // Every password this run generated, whether this scenario owns the resource or shares
        // the assembly-wide one: if sanitizing changes nothing, none of them were present.
        PostgresResource secrets = _database ?? OseIdDatabase.Instance;
        secrets.Sanitize(_answerBody).Should().Be(_answerBody, _feature);

        _answerBody
            .Should()
            .NotContainAny(
                "Host=",
                "Port=",
                "Password=",
                "Username=",
                "127.0.0.1",
                "localhost",
                _compatibleMigrationId,
                FoundationSchemaContract.HistoryTableName,
                "Exception",
                " at ",
                "/",
                "\\"
            );
        _answerBody.Should().NotContain(BackendProcess.RepositoryRootPath);
    }

    public void Dispose()
    {
        _answer?.Dispose();
        _backend?.Dispose();
        _database?.Dispose();
    }

    private void StartOwnedDatabase()
    {
        _database = PostgresResource.Start(TimeSpan.FromMinutes(2));

        (int migrationExitCode, string migrationOutput) = MigrationRunner.Run(_database.MigratorConnectionString);
        if (migrationExitCode != 0)
        {
            throw new InvalidOperationException($"the migration stage failed: {_database.Sanitize(migrationOutput)}");
        }
    }

    private void StartBackend(string connectionString)
    {
        int port = AllocateEphemeralPort();
        _baseAddress = new Uri($"http://127.0.0.1:{port.ToString(CultureInfo.InvariantCulture)}");
        _backend = BackendProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_RUNTIME_MODE"] = "Test",
                ["OSE_ID_BE_PORT"] = port.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_CONNECTION"] = connectionString,
            }
        );

        if (!_backend.WaitForListener(port, TimeSpan.FromSeconds(60)))
        {
            string diagnostics = _backend.StandardError + _backend.StandardOutput;
            throw new InvalidOperationException(
                $"ose-id-be did not bind 127.0.0.1:{port.ToString(CultureInfo.InvariantCulture)} within its startup budget: "
                    + (_database?.Sanitize(diagnostics) ?? diagnostics)
            );
        }
    }

    private async Task RequestAsync(string route)
    {
        _answer = await _client.GetAsync(new Uri(_baseAddress!, route)).ConfigureAwait(false);
        _answerBody = await _answer.Content.ReadAsStringAsync().ConfigureAwait(false);
    }

    /// <summary>Every active migration-history row of one database, as a comparable value.</summary>
    private static string ActiveHistoryRows(string connectionString)
    {
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        using NpgsqlCommand command = connection.CreateCommand();
        command.CommandText = $"""
            SELECT coalesce(string_agg("MigrationId", ',' ORDER BY "MigrationId"), '')
            FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}"
            WHERE deleted_at IS NULL
            """;
        object? value = command.ExecuteScalar();

        return value is null or DBNull ? string.Empty : Convert.ToString(value, CultureInfo.InvariantCulture) ?? "";
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

    private static int AllocateEphemeralPort()
    {
        using var probe = new TcpListener(IPAddress.Loopback, 0);
        probe.Start();
        int port = ((IPEndPoint)probe.LocalEndpoint).Port;
        probe.Stop();
        return port;
    }
}
