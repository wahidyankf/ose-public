using FluentAssertions;
using OseId.Domain.Persistence;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature.
///
/// The database is not here, so this layer proves the decision that the database later enforces:
/// the privilege set the serving role is declared to hold. If this contract ever grants the role a
/// way to change the schema, the scenario fails here — before a migration is written, and long
/// before PostgreSQL would have been the thing to notice.
/// </summary>
[Binding]
public sealed class DatabasePrivilegeSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature";

    private string[] _applicationPrivileges = [];
    private bool _schemaChangeAttempted;

    [Given("the migration role has applied the current empty OSE ID schema")]
    public void GivenTheMigrationRoleHasAppliedTheCurrentEmptySchema()
    {
        // "Applied" at this layer means the contract that the applied schema must satisfy: the two
        // roles are distinct, and the schema is owned by the one that migrates it.
        FoundationSchemaContract
            .MigrationRole.Should()
            .NotBe(FoundationSchemaContract.ApplicationRole, "serving and migrating must be separate roles");

        _applicationPrivileges = [.. FoundationSchemaContract.ApplicationRoleTablePrivileges];
    }

    [When("the application role attempts to create or alter a table")]
    public void WhenTheApplicationRoleAttemptsToCreateOrAlterATable()
    {
        _schemaChangeAttempted = true;
    }

    [Then("PostgreSQL denies the operation")]
    public void ThenPostgreSqlDeniesTheOperation()
    {
        _schemaChangeAttempted.Should().BeTrue(Feature);

        // Denial is structural: no privilege that could create or alter a table is in the set at
        // all, so there is nothing for PostgreSQL to allow.
        foreach (string forbidden in FoundationSchemaContract.ApplicationRoleForbiddenPrivileges)
        {
            _applicationPrivileges.Should().NotContain(forbidden);
        }

        _applicationPrivileges.Should().NotContain("CREATE");
        FoundationSchemaContract
            .ApplicationRoleForbiddenPrivileges.Should()
            .Contain("INSERT", "UPDATE", "DELETE", "TRUNCATE", "TRIGGER", "REFERENCES");
    }

    [Then("the application role can execute only the granted runtime health query")]
    public void ThenTheApplicationRoleCanExecuteOnlyTheGrantedRuntimeHealthQuery()
    {
        // Equality, not containment: the granted set is closed, so a later addition fails here.
        _applicationPrivileges.Should().Equal("SELECT");
    }
}
