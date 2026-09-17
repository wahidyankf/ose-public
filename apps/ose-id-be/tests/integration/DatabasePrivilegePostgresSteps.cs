using FluentAssertions;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using OseId.Domain.Persistence;
using OseId.Infrastructure.Persistence.Migrations;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature.
///
/// This layer sits between the contract the Unit adapter checks and the live server the E2E adapter
/// drives: it reads the SQL the migration will actually execute and proves that SQL grants what the
/// contract says and nothing more. A migration that quietly widened the serving role would pass Unit
/// — the contract would still read correctly — and would only be caught here, without a database.
/// </summary>
[Binding]
public sealed class DatabasePrivilegePostgresSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature";

    private string _migrationSql = string.Empty;
    private bool _schemaChangeAttempted;

    [Given("the migration role has applied the current empty OSE ID schema")]
    public void GivenTheMigrationRoleHasAppliedTheCurrentEmptySchema()
    {
        _migrationSql = MigrationSql.ForCreateIdentityFoundation();

        _migrationSql.Should().NotBeNullOrWhiteSpace(Feature);

        // The slice creates no domain table at all; a CREATE TABLE here would mean a placeholder
        // entity crept in that a later plan would have to undo.
        _migrationSql.Should().NotContain("CREATE TABLE", "the foundation migration creates no domain table");
    }

    [When("the application role attempts to create or alter a table")]
    public void WhenTheApplicationRoleAttemptsToCreateOrAlterATable()
    {
        // The attempt is refused by what the migration did and did not grant, which is what the
        // assertions below read out of the migration's own SQL.
        _schemaChangeAttempted = true;
    }

    [Then("PostgreSQL denies the operation")]
    public void ThenPostgreSqlDeniesTheOperation()
    {
        _schemaChangeAttempted.Should().BeTrue(Feature);

        string applicationRole = FoundationSchemaContract.ApplicationRole;

        foreach (string forbidden in FoundationSchemaContract.ApplicationRoleForbiddenPrivileges)
        {
            _migrationSql
                .Should()
                .NotContain(
                    $"GRANT {forbidden}",
                    $"the migration must never grant {forbidden} to any role on the history table"
                );
        }

        _migrationSql
            .Should()
            .NotContain($"GRANT ALL ON SCHEMA {FoundationSchemaContract.SchemaName} TO {applicationRole}");
        _migrationSql.Should().NotContain($"GRANT CREATE");

        // PUBLIC is stripped explicitly, so a role that was granted nothing inherits nothing.
        _migrationSql.Should().Contain($"REVOKE ALL ON SCHEMA {FoundationSchemaContract.SchemaName} FROM PUBLIC");
        _migrationSql.Should().Contain("FROM PUBLIC");
    }

    [Then("the application role can execute only the granted runtime health query")]
    public void ThenTheApplicationRoleCanExecuteOnlyTheGrantedRuntimeHealthQuery()
    {
        string applicationRole = FoundationSchemaContract.ApplicationRole;

        _migrationSql
            .Should()
            .Contain($"GRANT USAGE ON SCHEMA {FoundationSchemaContract.SchemaName} TO {applicationRole}");
        _migrationSql
            .Should()
            .Contain(
                $"""GRANT SELECT ON {FoundationSchemaContract.SchemaName}."{FoundationSchemaContract.HistoryTableName}" TO {applicationRole}"""
            );

        // Exactly one table-level grant reaches the serving role.
        int grantsToApplicationRole = _migrationSql
            .Split('\n')
            .Count(line => line.Contains($"TO {applicationRole}", StringComparison.Ordinal));

        grantsToApplicationRole.Should().Be(2, "exactly USAGE on the schema and SELECT on the table");
    }
}

/// <summary>
/// Reads the SQL a migration would execute, rather than the source file that declares it, so the
/// assertion is about the statements PostgreSQL receives.
/// </summary>
internal static class MigrationSql
{
    public static string ForCreateIdentityFoundation()
    {
        Migration migration = new CreateIdentityFoundation();

        return string.Join('\n', migration.UpOperations.OfType<SqlOperation>().Select(operation => operation.Sql));
    }
}
