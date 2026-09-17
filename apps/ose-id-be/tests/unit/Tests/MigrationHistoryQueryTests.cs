using FluentAssertions;
using OseId.Infrastructure.Persistence;
using SqlKata;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// The compiled shape of the one read the serving role is granted. It is built without a
/// database, so a contract change is caught here rather than only surfacing at the
/// Integration adapter's snapshot.
/// </summary>
public sealed class MigrationHistoryQueryTests
{
    [Fact]
    public void Compile_ProjectsExactlyTheAllowlistedColumns()
    {
        SqlResult compiled = MigrationHistoryQuery.Compile();

        foreach (string column in MigrationHistoryQuery.ProjectedColumns)
        {
            compiled.Sql.Should().Contain(column);
        }
    }

    [Fact]
    public void Compile_ReadsOnlyTheActiveHistoryTableAndFiltersTombstones()
    {
        SqlResult compiled = MigrationHistoryQuery.Compile();

        // The PostgreSQL compiler quotes the schema and table separately rather than as one
        // dotted identifier, so the assertion matches that exact compiled shape.
        compiled
            .Sql.Should()
            .Contain($"\"{MigrationHistoryQuery.SchemaName}\".\"{MigrationHistoryQuery.TableName}\"");
        compiled.Sql.Should().Contain("deleted_at");
        compiled.Sql.Should().ContainEquivalentOf("is null");
        compiled.Sql.Should().NotContainEquivalentOf("order by");
    }

    [Fact]
    public void Compile_BindsNoParameter()
    {
        // The active-history read is value-free: nothing a caller supplies reaches this
        // query, so there is nothing to bind.
        SqlResult compiled = MigrationHistoryQuery.Compile();

        compiled.NamedBindings.Should().BeEmpty();
    }

    [Fact]
    public void Compile_IsDeterministic()
    {
        SqlResult first = MigrationHistoryQuery.Compile();
        SqlResult second = MigrationHistoryQuery.Compile();

        second.Sql.Should().Be(first.Sql);
    }
}
