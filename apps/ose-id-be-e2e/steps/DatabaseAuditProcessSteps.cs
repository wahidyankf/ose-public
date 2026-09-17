using System.Globalization;
using FluentAssertions;
using Npgsql;
using OseId.Domain.Persistence;
using Reqnroll;
using Xunit;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for
/// specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature.
///
/// The assertion this scenario exists for is the one that cannot be faked at a lower layer: a real
/// `DELETE` against a real row, through the real serving role, is rejected — and the row is still
/// there afterward, with every audit column intact, and readiness still reads it as active.
/// </summary>
[Binding]
public sealed class DatabaseAuditProcessSteps
{
    private const string _feature =
        "specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature";

    private string _activeMigrationId = string.Empty;
    private PostgresException? _rejection;

    [Given("the migrated OSE ID database contains an active migration-history record")]
    public void GivenTheMigratedDatabaseContainsAnActiveRecord()
    {
        OseIdDatabase.FirstMigrationExitCode.Should().Be(0, _feature);

        _activeMigrationId = Query(
            OseIdDatabase.Instance.MigratorConnectionString,
            $"""
            SELECT "MigrationId" FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}"
            WHERE deleted_at IS NULL
            """
        );

        _activeMigrationId.Should().Be(SchemaCompatibility.CompatibleMigrationIds[0]);
    }

    [When("the serving role attempts to physically delete that record")]
    public void WhenTheServingRoleAttemptsToPhysicallyDeleteThatRecord()
    {
        try
        {
            Execute(
                OseIdDatabase.Instance.ApplicationConnectionString,
                $"""DELETE FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}" """
                    + $"""WHERE "MigrationId" = '{_activeMigrationId}'"""
            );
        }
        catch (PostgresException refused)
        {
            _rejection = refused;
        }
    }

    [Then("PostgreSQL rejects the operation")]
    public void ThenPostgreSqlRejectsTheOperation()
    {
        _rejection.Should().NotBeNull(_feature);

        // The serving role has no DELETE at all, so the request never reaches the guard trigger —
        // both layers of the defense-in-depth are real, and this proves the outer one specifically.
        _rejection.SqlState.Should().Be(PostgresErrorCodes.InsufficientPrivilege);

        // The migration-role owner is also rejected, by the guard trigger this time, which proves
        // the trigger is a real second layer and not merely a privilege the owner could bypass.
        var ownerRejection = Assert.Throws<PostgresException>(() =>
            Execute(
                OseIdDatabase.Instance.MigratorConnectionString,
                $"""DELETE FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}" """
                    + $"""WHERE "MigrationId" = '{_activeMigrationId}'"""
            )
        );

        ownerRejection.SqlState.Should().Be(FoundationSchemaContract.HardDeleteSqlState);
        ownerRejection.MessageText.Should().Be(FoundationSchemaContract.HardDeleteMessage);
    }

    [Then("the record remains stored with all six audit columns")]
    public void ThenTheRecordRemainsStoredWithAllSixAuditColumns()
    {
        string presentColumns = Query(
            OseIdDatabase.Instance.MigratorConnectionString,
            $"""
            SELECT string_agg(column_name, ',')
            FROM information_schema.columns
            WHERE table_schema = '{FoundationSchemaContract.SchemaName}'
              AND table_name = '{FoundationSchemaContract.HistoryTableName}'
              AND column_name = ANY(@columns)
            """,
            ("@columns", FoundationSchemaContract.AuditEnvelopeColumns.ToArray())
        );

        foreach (string column in FoundationSchemaContract.AuditEnvelopeColumns)
        {
            presentColumns.Should().Contain(column);
        }

        string rowCount = Query(
            OseIdDatabase.Instance.MigratorConnectionString,
            $"""
            SELECT count(*)::text FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}"
            WHERE "MigrationId" = '{_activeMigrationId}'
            """
        );

        rowCount.Should().Be("1", "the rejected delete must not have removed the row");
    }

    [Then("an ordinary readiness check still sees the active migration state")]
    public void ThenAnOrdinaryReadinessCheckStillSeesTheActiveMigrationState()
    {
        string readable = Query(
            OseIdDatabase.Instance.ApplicationConnectionString,
            $"""
            SELECT string_agg("MigrationId", ',')
            FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}"
            WHERE deleted_at IS NULL
            """
        );

        readable.Should().Be(_activeMigrationId);
    }

    private static void Execute(string connectionString, string sql)
    {
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        using NpgsqlCommand command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    private static string Query(string connectionString, string sql, params (string Name, object Value)[] parameters)
    {
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        using NpgsqlCommand command = connection.CreateCommand();
        command.CommandText = sql;
        foreach ((string name, object value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        object? value2 = command.ExecuteScalar();

        return value2 is null or DBNull
            ? string.Empty
            : Convert.ToString(value2, CultureInfo.InvariantCulture) ?? string.Empty;
    }
}
