using System.Globalization;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Npgsql;
using OseId.Domain.Capabilities;
using OseId.Domain.Persistence;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for
/// specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature. It talks to
/// the published host over a loopback socket exactly as an external caller would, so the
/// evidence covers the deployable output rather than an in-process composition of it, and
/// it reads the run's own PostgreSQL directly to prove that nothing was written.
/// </summary>
[Binding]
public sealed class DisabledCapabilityProcessSteps : IDisposable
{
    private const string _feature = "specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature";
    private const string _correlationHeader = "X-Correlation-ID";

    /// <summary>Bounded input the endpoint must never read, echo, or store.</summary>
    private const string _probe = "ose-id-bounded-probe";

    private DisabledCapability? _capability;
    private HttpResponseMessage? _response;
    private string _body = string.Empty;
    private string _rowsBefore = string.Empty;

    [Given("OSE ID is ready with OIDC authorization disabled")]
    public void GivenOidcAuthorizationIsDisabled() => ReadyWith("OIDC authorization");

    [Given("OSE ID is ready with OAuth token issuance disabled")]
    public void GivenOauthTokenIssuanceIsDisabled() => ReadyWith("OAuth token issuance");

    [Given("OSE ID is ready with external-provider sign-in disabled")]
    public void GivenExternalProviderSignInIsDisabled() => ReadyWith("external-provider sign-in");

    [Given("OSE ID is ready with SCIM user provisioning disabled")]
    public void GivenScimUserProvisioningIsDisabled() => ReadyWith("SCIM user provisioning");

    [Given("OSE ID is ready with platform administration disabled")]
    public void GivenPlatformAdministrationIsDisabled() => ReadyWith("platform administration");

    [When("a client requests {word} {word}")]
    public void WhenAClientRequests(string method, string path)
    {
        using var request = new HttpRequestMessage(
            new HttpMethod(method),
            new Uri(RunningBackend.BaseAddress, $"{path}?probe={_probe}")
        );
        if (!string.Equals(method, "GET", StringComparison.Ordinal))
        {
            request.Content = new StringContent($"{{\"probe\":\"{_probe}\"}}");
        }

        _response = RunningBackend.Client.Send(request);
        _body = _response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
    }

    [Then("the response status is {int} with the stable capability-disabled problem code")]
    public void ThenTheResponseStatusIsWithTheStableCapabilityDisabledProblemCode(int status)
    {
        _capability.Should().NotBeNull(_feature);
        _response.Should().NotBeNull();
        _response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        ((int)_response.StatusCode).Should().Be(status);

        _response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");

        using JsonDocument document = JsonDocument.Parse(_body);
        JsonElement problem = document.RootElement;

        problem
            .EnumerateObject()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("status", "code", "title", "correlationId");
        problem.GetProperty("status").GetInt32().Should().Be(status);
        problem.GetProperty("code").GetString().Should().Be("capability_disabled");
        problem.GetProperty("title").GetString().Should().Be("Capability is not available");
    }

    [Then("the refusal is uncacheable and carries a correlation value")]
    public void ThenTheRefusalIsUncacheableAndCarriesACorrelationValue()
    {
        _response!.Headers.CacheControl!.NoStore.Should().BeTrue(_feature);

        string correlation = _response.Headers.GetValues(_correlationHeader).Should().ContainSingle().Subject;
        correlation.Should().NotBeNullOrWhiteSpace();

        using JsonDocument document = JsonDocument.Parse(_body);
        document.RootElement.GetProperty("correlationId").GetString().Should().Be(correlation);

        // A second refusal of the same route carries its own value, so nothing between the
        // socket and the handler is serving a stored copy of the first answer.
        (_, string repeatedBody) = Refuse();
        using JsonDocument repeated = JsonDocument.Parse(repeatedBody);
        repeated.RootElement.GetProperty("correlationId").GetString().Should().NotBe(correlation);
    }

    [Then("no redirect, token, cookie, identity resource, or tenant fact is returned")]
    public void ThenNoRedirectTokenCookieIdentityResourceOrTenantFactIsReturned()
    {
        _response!.Headers.Contains("Set-Cookie").Should().BeFalse(_feature);
        _response.Headers.Location.Should().BeNull();
        _response.Headers.WwwAuthenticate.Should().BeEmpty();
        _body.Should().NotContainAny("access_token", "id_token", "Bearer", "tenant", "company");

        // The caller's own bounded input never comes back, so the refusal states no fact about
        // what was asked for.
        _body.Should().NotContain(_probe);
        _response.Headers.Should().NotContain(header => header.Value.Any(value => value.Contains(_probe)));
    }

    [Then("no identity or authorization record is created")]
    public void ThenNoIdentityOrAuthorizationRecordIsCreated()
    {
        // Repeated and concurrent refusals against the served process, so a first call that
        // created state would leave it where a later call or the database read below finds it.
        Parallel.For(0, 4, _ => Refuse());

        // The one durable store this run owns, read directly. Its active history is unchanged,
        // and the OSE ID schema still holds exactly one table — there is no identity,
        // authorization, or audit row anywhere, because there is nowhere for one to be.
        ActiveHistoryRows().Should().Be(_rowsBefore, _feature);
        TablesInSchema().Should().Be(FoundationSchemaContract.HistoryTableName, _feature);
    }

    public void Dispose() => _response?.Dispose();

    private void ReadyWith(string capability)
    {
        _capability = DisabledCapabilityCatalog.ByCapability(capability);
        RunningBackend.EnsureServing();
        _rowsBefore = ActiveHistoryRows();
    }

    private (HttpStatusCode Status, string Body) Refuse()
    {
        using var request = new HttpRequestMessage(
            new HttpMethod(_capability!.Method),
            new Uri(RunningBackend.BaseAddress, _capability.Path)
        );

        using HttpResponseMessage repeated = RunningBackend.Client.Send(request);
        string body = repeated.Content.ReadAsStringAsync().GetAwaiter().GetResult();

        repeated.StatusCode.Should().Be(HttpStatusCode.NotFound, _feature);
        return (repeated.StatusCode, body);
    }

    /// <summary>Every active migration-history row, as one comparable value.</summary>
    private static string ActiveHistoryRows() =>
        Query(
            $"""
            SELECT coalesce(string_agg("MigrationId", ',' ORDER BY "MigrationId"), '')
            FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}"
            WHERE deleted_at IS NULL
            """
        );

    /// <summary>Every table the OSE ID schema carries, as one comparable value.</summary>
    private static string TablesInSchema() =>
        Query(
            $"""
            SELECT coalesce(string_agg(table_name, ',' ORDER BY table_name), '')
            FROM information_schema.tables
            WHERE table_schema = '{FoundationSchemaContract.SchemaName}'
            """
        );

    private static string Query(string sql)
    {
        using var connection = new NpgsqlConnection(OseIdDatabase.Instance.MigratorConnectionString);
        connection.Open();
        using NpgsqlCommand command = connection.CreateCommand();
        command.CommandText = sql;
        object? value = command.ExecuteScalar();

        return value is null or DBNull ? string.Empty : Convert.ToString(value, CultureInfo.InvariantCulture) ?? "";
    }
}
