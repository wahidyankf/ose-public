using System.Reflection;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using OseId.Host;
using OseId.Infrastructure.Persistence;
using OseId.Infrastructure.Persistence.Migrations;
using Xunit;

namespace OseId.Be.Integration.Tests;

/// <summary>
/// Proves the Phase 3 Gate's "no EF runtime query path" acceptance as a build-enforced property.
///
/// Entity Framework exists in this codebase only to author and apply migrations. The composition
/// root must never register a <see cref="DbContext" />, and the runtime persistence adapter it does
/// register must be built on SqlKata/Npgsql rather than EF. A future change that added
/// <c>AddDbContext</c> to <see cref="OseIdHost.RegisterServices" /> would pass every SqlKata contract
/// test and still violate the migration-time-only boundary; this is the test that would catch it.
/// </summary>
public sealed class PersistenceRuntimeBoundaryTests
{
    [Fact]
    public void RegisterServices_NeverRegistersAnEntityFrameworkDbContext()
    {
        var services = new ServiceCollection();

        OseIdHost.RegisterServices(services);

        services
            .Should()
            .NotContain(
                descriptor => typeof(DbContext).IsAssignableFrom(descriptor.ServiceType),
                "the serving host must never resolve a DbContext; Entity Framework is migration-time tooling only"
            );
    }

    [Fact]
    public void RegisterServices_NeverRegistersTheMigrationDbContextByName()
    {
        var services = new ServiceCollection();

        OseIdHost.RegisterServices(services);

        services
            .Should()
            .NotContain(descriptor =>
                descriptor.ServiceType == typeof(OseIdMigrationDbContext)
                || descriptor.ImplementationType == typeof(OseIdMigrationDbContext)
            );
    }

    [Fact]
    public void OseIdHostAssembly_ReferencesNoEntityFrameworkAssembly()
    {
        // The composition root itself must not even link against Entity Framework. A DbContext
        // could only be constructed here if the assembly could see the type at all.
        Assembly host = typeof(OseIdHost).Assembly;
        string[] referenced = [.. host.GetReferencedAssemblies().Select(name => name.Name ?? string.Empty)];

        referenced
            .Should()
            .NotContain(
                name => name.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal),
                "OseId.Host must never link Entity Framework; the migrator is a separate executable"
            );
    }

    [Fact]
    public void MigrationHistoryQuery_IsCompiledByTheSqlKataPostgresCompiler()
    {
        // The one runtime query the serving role executes goes through SqlKata, not EF. This is the
        // positive half of the boundary: the property under test is not "EF is absent" alone, but
        // "SqlKata is what stands in its place."
        MigrationHistoryQuery.Compiler.Should().BeOfType<SqlKata.Compilers.PostgresCompiler>();
    }

    [Fact]
    public void CreateIdentityFoundation_Down_IsRejectedRatherThanRunOrSilentlyIgnored()
    {
        // OSE ID migrations are forward-only: reverting this one would drop the audit envelope and
        // the hard-delete guard that make the history defensible, so recovery is a new forward
        // migration, never a downgrade. This is the "rollback" half of the migration-compatibility
        // proof for the first migration in this codebase — there is no earlier schema to roll back
        // to, so the provable property is that an attempted rollback fails loudly instead of either
        // running (and quietly weakening the schema) or being silently accepted as a no-op.
        Migration migration = new CreateIdentityFoundation();

        Action act = () => _ = migration.DownOperations;

        act.Should()
            .Throw<NotSupportedException>()
            .WithMessage("OSE ID migrations are forward-only; repair a defect with a new forward migration.");
    }
}
