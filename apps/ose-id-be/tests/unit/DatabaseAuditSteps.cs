using FluentAssertions;
using OseId.Domain.Persistence;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for
/// specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature.
///
/// This layer proves the two properties that make the scenario decidable without a database: the
/// audit envelope is complete and ordered, and a tombstone can never satisfy readiness. The second
/// is the one that matters — if <see cref="SchemaCompatibility" /> counted a soft-deleted migration
/// as applied, retaining the row would preserve evidence while quietly lying about the schema.
/// </summary>
[Binding]
public sealed class DatabaseAuditSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature";

    private MigrationHistoryRecord? _activeRecord;
    private bool _hardDeleteAttempted;

    [Given("the migrated OSE ID database contains an active migration-history record")]
    public void GivenTheMigratedDatabaseContainsAnActiveRecord()
    {
        _activeRecord = new MigrationHistoryRecord
        {
            MigrationId = SchemaCompatibility.CompatibleMigrationIds[0],
            ProductVersion = "10.0.12",
            CreatedAt = DateTimeOffset.UnixEpoch,
            CreatedBy = "system",
            UpdatedAt = DateTimeOffset.UnixEpoch,
            UpdatedBy = "system",
        };

        _activeRecord.IsActive.Should().BeTrue(Feature);
    }

    [When("the serving role attempts to physically delete that record")]
    public void WhenTheServingRoleAttemptsToPhysicallyDeleteThatRecord()
    {
        _hardDeleteAttempted = true;
    }

    [Then("PostgreSQL rejects the operation")]
    public void ThenPostgreSqlRejectsTheOperation()
    {
        _hardDeleteAttempted.Should().BeTrue();

        // The serving role holds no DELETE, and a named guard stands behind that. Both are stated
        // in the contract, so neither can be dropped without failing this scenario.
        FoundationSchemaContract.ApplicationRoleTablePrivileges.Should().NotContain("DELETE");
        FoundationSchemaContract.ApplicationRoleForbiddenPrivileges.Should().Contain("DELETE");
        FoundationSchemaContract.HardDeleteGuardTrigger.Should().NotBeNullOrWhiteSpace();
        FoundationSchemaContract.HardDeleteSqlState.Should().Be("OS001");
    }

    [Then("the record remains stored with all six audit columns")]
    public void ThenTheRecordRemainsStoredWithAllSixAuditColumns()
    {
        _activeRecord.Should().NotBeNull();

        FoundationSchemaContract
            .AuditEnvelopeColumns.Should()
            .Equal("created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by");

        // The envelope is part of the physical table, in envelope order after the two framework
        // columns, so a projection cannot read the row without being able to see its disposition.
        FoundationSchemaContract
            .HistoryColumns.Select(column => column.Name)
            .Should()
            .ContainInOrder(FoundationSchemaContract.AuditEnvelopeColumns);
    }

    [Then("an ordinary readiness check still sees the active migration state")]
    public void ThenAnOrdinaryReadinessCheckStillSeesTheActiveMigrationState()
    {
        SchemaCompatibility.Evaluate([_activeRecord!]).Should().Be(SchemaState.Ready);

        // And the converse, which is the property worth having: a retained-but-tombstoned row is
        // evidence, never readiness.
        MigrationHistoryRecord tombstoned = _activeRecord! with
        {
            DeletedAt = DateTimeOffset.UnixEpoch,
            DeletedBy = "system",
        };

        tombstoned.IsActive.Should().BeFalse();
        SchemaCompatibility.Evaluate([tombstoned]).Should().Be(SchemaState.SchemaIncompatible);
    }
}
