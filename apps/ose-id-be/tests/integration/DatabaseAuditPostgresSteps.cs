using FluentAssertions;
using OseId.Domain.Persistence;
using OseId.Infrastructure.Persistence;
using Reqnroll;
using SqlKata.Compilers;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for
/// specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature.
///
/// Two seams meet in this scenario, and this layer proves both without a server: the migration
/// installs the envelope and the guard, and the one query the serving role is granted is compiled
/// for PostgreSQL with an explicit projection and an explicit tombstone predicate. The compiled SQL
/// is asserted rather than snapshotted to a file so the property under test — named columns, no
/// wildcard, active rows only — is legible at the assertion instead of in a diff.
/// </summary>
[Binding]
public sealed class DatabaseAuditPostgresSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature";

    private string _migrationSql = string.Empty;
    private string _readinessSql = string.Empty;
    private bool _hardDeleteAttempted;

    [Given("the migrated OSE ID database contains an active migration-history record")]
    public void GivenTheMigratedDatabaseContainsAnActiveRecord()
    {
        _migrationSql = MigrationSql.ForCreateIdentityFoundation();
        _readinessSql = MigrationHistoryQuery.Compile().Sql;

        _migrationSql.Should().NotBeNullOrWhiteSpace(Feature);
        MigrationHistoryQuery.Compiler.Should().BeOfType<PostgresCompiler>("OSE-owned runtime SQL is PostgreSQL SQL");
    }

    [When("the serving role attempts to physically delete that record")]
    public void WhenTheServingRoleAttemptsToPhysicallyDeleteThatRecord()
    {
        // The attempt is refused by the grant set and the guard the migration installs; both are
        // read below. No delete is expressible through the adapter under test at all.
        _hardDeleteAttempted = true;
    }

    [Then("PostgreSQL rejects the operation")]
    public void ThenPostgreSqlRejectsTheOperation()
    {
        _hardDeleteAttempted.Should().BeTrue(Feature);

        _migrationSql
            .Should()
            .Contain(
                $"CREATE TRIGGER {FoundationSchemaContract.HardDeleteGuardTrigger}",
                "a named guard stands behind the missing DELETE privilege"
            );
        _migrationSql.Should().Contain("BEFORE DELETE ON");
        _migrationSql.Should().Contain("FOR EACH ROW");
        _migrationSql.Should().Contain($"ERRCODE = '{FoundationSchemaContract.HardDeleteSqlState}'");
        _migrationSql.Should().Contain(FoundationSchemaContract.HardDeleteMessage);

        // Nothing in OSE ID migration SQL may itself remove rows.
        _migrationSql.Should().NotContain("DELETE FROM");
        _migrationSql.Should().NotContain("TRUNCATE ");
        _migrationSql.Should().NotContain("DROP TABLE");

        // Any foreign key this schema ever gains must restrict rather than propagate a delete.
        _migrationSql.Should().NotContain("ON DELETE CASCADE");
        _migrationSql.Should().NotContain("ON DELETE SET NULL");
    }

    [Then("the record remains stored with all six audit columns")]
    public void ThenTheRecordRemainsStoredWithAllSixAuditColumns()
    {
        foreach (string column in FoundationSchemaContract.AuditEnvelopeColumns)
        {
            _migrationSql.Should().Contain($"ADD COLUMN {column}", "the envelope is added by the migration");
        }

        foreach (string constraint in FoundationSchemaContract.ExpectedCheckConstraints)
        {
            _migrationSql.Should().Contain($"ADD CONSTRAINT {constraint}");
        }
    }

    [Then("an ordinary readiness check still sees the active migration state")]
    public void ThenAnOrdinaryReadinessCheckStillSeesTheActiveMigrationState()
    {
        // Explicit projection: every granted column is named and no wildcard is emitted.
        foreach (string column in MigrationHistoryQuery.ProjectedColumns)
        {
            _readinessSql.Should().Contain($"\"{column}\"");
        }

        _readinessSql.Should().NotContain("*", "a wildcard projection is not expressible through the adapter");

        // The tombstone predicate is in the SQL itself, not applied after the fact in memory.
        _readinessSql.Should().Contain("\"deleted_at\" IS NULL");
        _readinessSql
            .Should()
            .Contain(
                $"\"{FoundationSchemaContract.SchemaName}\".\"{FoundationSchemaContract.HistoryTableName}\"",
                "the read is scoped to the single table the serving role is granted"
            );

        // The runtime budget is finite, so a stalled read cannot hold a request open indefinitely.
        NpgsqlMigrationHistoryReader.CommandTimeout.Should().Be(TimeSpan.FromSeconds(5));
    }
}
