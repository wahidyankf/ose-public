using System.Globalization;
using System.Net;
using System.Net.Sockets;
using FluentAssertions;
using Npgsql;
using OseId.Domain.Persistence;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature. It
/// observes the published executable from outside: the exit code, the diagnostic stream,
/// the port it was told to bind, and the run's own database are the only evidence used,
/// because that is all a runner or an attacker can see.
///
/// The refused process is given a usable port and the serving role's real credentials on
/// purpose. A start that bound nothing for want of a port, or wrote nothing for want of a
/// reachable database, would prove nothing about the guard.
/// </summary>
[Binding]
public sealed class RuntimeModeProcessSteps : IDisposable
{
    private const string _feature = "specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature";

    private readonly int _declaredPort = AllocateEphemeralPort();

    private readonly Dictionary<string, string> _environment = new(StringComparer.Ordinal);

    private string _declaredMode = string.Empty;
    private string _rowsBefore = string.Empty;
    private BackendProcess? _backend;
    private bool _exited;

    [Given("the backend runtime mode is {word}")]
    public void GivenTheBackendRuntimeModeIs(string mode)
    {
        _declaredMode = mode;
        _environment["OSE_ID_BE_PORT"] = _declaredPort.ToString(CultureInfo.InvariantCulture);
        _environment["OSE_ID_CONNECTION"] = OseIdDatabase.Instance.ApplicationConnectionString;
        if (mode != "missing")
        {
            _environment["OSE_RUNTIME_MODE"] = mode;
        }

        // The port must be free before the run, or "still free afterwards" would say nothing.
        BackendProcess.IsListening(_declaredPort).Should().BeFalse(_feature);
        _rowsBefore = ActiveHistoryRows();
    }

    [When("the backend process starts")]
    public void WhenTheBackendProcessStarts()
    {
        _backend = BackendProcess.Start(_environment);
        _exited = _backend.WaitForExit(TimeSpan.FromSeconds(60));
    }

    [Then("startup exits non-zero before serving the application")]
    public void ThenStartupExitsNonZeroBeforeServingTheApplication()
    {
        _exited.Should().BeTrue($"{_feature} requires a refused mode to terminate the process");
        _backend!.ExitCode.Should().NotBe(0);

        // "Before serving" is proven from the process's own account of itself: a host that
        // reached the serving stage announces its listener and its startup, and this one
        // never does.
        string output = _backend.StandardOutput + _backend.StandardError;
        output.Should().NotContain("Now listening on");
        output.Should().NotContain("Application started");
    }

    [Then("the diagnostic returns the stable runtime-mode-disabled code")]
    public void ThenTheDiagnosticReturnsTheStableRuntimeModeDisabledCode() =>
        (_backend!.StandardError + _backend.StandardOutput).Should().Contain("runtime_mode_disabled", _feature);

    [Then("no configured listener is bound")]
    public void ThenNoConfiguredListenerIsBound()
    {
        // The port the process was told to bind was free before it started and is free now, and
        // the process never named it in anything it wrote.
        BackendProcess.IsListening(_declaredPort).Should().BeFalse(_feature);
        (_backend!.StandardOutput + _backend.StandardError)
            .Should()
            .NotContain(_declaredPort.ToString(CultureInfo.InvariantCulture));
    }

    [Then("no database or identity row is changed")]
    public void ThenNoDatabaseOrIdentityRowIsChanged()
    {
        // The refused process held the serving role's real credentials for a reachable database
        // and wrote nothing: its active history is unchanged, and the OSE ID schema still holds
        // exactly the one table the migration created.
        ActiveHistoryRows().Should().Be(_rowsBefore, _feature);
        TablesInSchema().Should().Be(FoundationSchemaContract.HistoryTableName, _feature);
    }

    [Then("the diagnostic discloses no secret, configuration value, stack trace, or absolute path")]
    public void ThenTheDiagnosticDisclosesNoSecretConfigurationValueStackTraceOrAbsolutePath()
    {
        string diagnostics = _backend!.StandardError + _backend.StandardOutput;

        // The run's own generated passwords are the ground truth for "a secret leaked": if
        // sanitizing them changes nothing, none of them were present to begin with.
        OseIdDatabase.Instance.Sanitize(diagnostics).Should().Be(diagnostics, _feature);

        diagnostics
            .Should()
            .NotContainAny(
                "Host=",
                "Password=",
                "Username=",
                PostgresResource.ApplicationRole,
                BackendProcess.RepositoryRootPath,
                "Exception",
                "   at "
            );
        if (_declaredMode != "missing")
        {
            diagnostics.Should().NotContain($"={_declaredMode}");
            diagnostics.Should().NotContain("OSE_RUNTIME_MODE");
        }
    }

    public void Dispose() => _backend?.Dispose();

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

    private static int AllocateEphemeralPort()
    {
        using var probe = new TcpListener(IPAddress.Loopback, 0);
        probe.Start();
        int port = ((IPEndPoint)probe.LocalEndpoint).Port;
        probe.Stop();
        return port;
    }
}
