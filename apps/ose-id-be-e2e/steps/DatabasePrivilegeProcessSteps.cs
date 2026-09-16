using System.Globalization;
using FluentAssertions;
using Npgsql;
using OseId.Domain.Persistence;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature.
///
/// This is the layer where the claim stops being a contract and becomes PostgreSQL's answer: the
/// serving role connects for real, issues real DDL, and is refused by the server. The Unit and
/// Integration adapters prove the intent and the SQL; only this one proves the enforcement.
/// </summary>
[Binding]
public sealed class DatabasePrivilegeProcessSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature";

    private readonly List<PostgresException> _refusals = [];
    private string? _healthQueryResult;

    [Given("the migration role has applied the current empty OSE ID schema")]
    public static void GivenTheMigrationRoleHasAppliedTheCurrentEmptySchema()
    {
        OseIdDatabase.FirstMigrationExitCode.Should().Be(0, Feature);

        // Applying an already-current database is a success, not an error.
        OseIdDatabase.SecondMigrationExitCode.Should().Be(0, "migration must be idempotent");

        // "Empty" is literal: the schema carries the migration history table and nothing else.
        string tables = Query(
            OseIdDatabase.Instance.MigratorConnectionString,
            $"SELECT string_agg(tablename, ',' ORDER BY tablename) FROM pg_tables WHERE schemaname = '{FoundationSchemaContract.SchemaName}'"
        );

        tables.Should().Be(FoundationSchemaContract.HistoryTableName, "the foundation creates no domain table");
    }

    [When("the application role attempts to create or alter a table")]
    public void WhenTheApplicationRoleAttemptsToCreateOrAlterATable()
    {
        string history = $"{FoundationSchemaContract.SchemaName}.\"{FoundationSchemaContract.HistoryTableName}\"";

        // Every shape of schema change the role could reach for, not just the easiest one. GRANT is
        // deliberately excluded from this probe list: PostgreSQL treats a role granting a privilege
        // to itself as a silent no-op warning rather than a refusal, so it proves nothing here — the
        // "only the granted query" assertion below reads the catalog instead, which is what actually
        // proves self-grant never took effect.
        foreach (
            string statement in new[]
            {
                $"CREATE TABLE {FoundationSchemaContract.SchemaName}.privilege_probe (id integer)",
                $"ALTER TABLE {history} ADD COLUMN privilege_probe integer",
                $"DROP TABLE {history}",
                $"CREATE INDEX privilege_probe_index ON {history} (\"MigrationId\")",
            }
        )
        {
            _refusals.Add(ExpectRefusal(statement));
        }
    }

    [Then("PostgreSQL denies the operation")]
    public void ThenPostgreSqlDeniesTheOperation()
    {
        _refusals.Should().HaveCount(4, "every attempted schema change must be refused");

        foreach (PostgresException refusal in _refusals)
        {
            // insufficient_privilege covers both "permission denied" (no USAGE on the schema) and
            // "must be owner of table" (an owner-only DDL statement); PostgreSQL raises the same
            // SQLSTATE for both, so asserting the code is exact rather than a family match.
            refusal.SqlState.Should().Be(PostgresErrorCodes.InsufficientPrivilege);
        }

        // The refusals changed nothing: the table still carries exactly its contracted columns.
        string columns = Query(
            OseIdDatabase.Instance.MigratorConnectionString,
            $"""
            SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
            FROM information_schema.columns
            WHERE table_schema = '{FoundationSchemaContract.SchemaName}'
              AND table_name = '{FoundationSchemaContract.HistoryTableName}'
            """
        );

        columns.Should().Be(string.Join(',', FoundationSchemaContract.HistoryColumns.Select(column => column.Name)));
    }

    [Then("the application role can execute only the granted runtime health query")]
    public void ThenTheApplicationRoleCanExecuteOnlyTheGrantedRuntimeHealthQuery()
    {
        // A self-grant is a silent no-op in PostgreSQL rather than a refusal, so its absence of
        // effect — not an exception — is the proof. Running it here and then reading the catalog is
        // what actually shows the attempt changed nothing.
        string history = $"{FoundationSchemaContract.SchemaName}.\"{FoundationSchemaContract.HistoryTableName}\"";
        Execute(
            OseIdDatabase.Instance.ApplicationConnectionString,
            $"GRANT ALL ON {history} TO {FoundationSchemaContract.ApplicationRole}"
        );

        // The granted read works.
        _healthQueryResult = Query(
            OseIdDatabase.Instance.ApplicationConnectionString,
            $"""
            SELECT string_agg("MigrationId", ',' ORDER BY "MigrationId")
            FROM {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}"
            WHERE deleted_at IS NULL
            """
        );

        _healthQueryResult.Should().Be(SchemaCompatibility.CompatibleMigrationIds[0]);

        // And the catalog agrees that SELECT is the whole of it.
        string granted = Query(
            OseIdDatabase.Instance.MigratorConnectionString,
            $"""
            SELECT string_agg(DISTINCT privilege_type, ',' ORDER BY privilege_type)
            FROM information_schema.table_privileges
            WHERE table_schema = '{FoundationSchemaContract.SchemaName}'
              AND table_name = '{FoundationSchemaContract.HistoryTableName}'
              AND grantee = '{FoundationSchemaContract.ApplicationRole}'
            """
        );

        granted.Should().Be("SELECT");

        // PUBLIC holds nothing, so an unnamed role inherits nothing.
        string publicGrants = Query(
            OseIdDatabase.Instance.MigratorConnectionString,
            $"""
            SELECT count(*)::text FROM information_schema.table_privileges
            WHERE table_schema = '{FoundationSchemaContract.SchemaName}' AND grantee = 'PUBLIC'
            """
        );

        publicGrants.Should().Be("0");
    }

    private static PostgresException ExpectRefusal(string statement)
    {
        try
        {
            Execute(OseIdDatabase.Instance.ApplicationConnectionString, statement);
        }
        catch (PostgresException refused)
        {
            return refused;
        }

        throw new InvalidOperationException(
            $"the serving role was allowed to run a schema change it must never be allowed to run: {statement}"
        );
    }

    private static void Execute(string connectionString, string sql)
    {
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        using NpgsqlCommand command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    private static string Query(string connectionString, string sql)
    {
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        using NpgsqlCommand command = connection.CreateCommand();
        command.CommandText = sql;
        object? value = command.ExecuteScalar();

        return value is null or DBNull
            ? string.Empty
            : Convert.ToString(value, CultureInfo.InvariantCulture) ?? string.Empty;
    }
}
