using FluentAssertions;
using OseId.Application.Health;
using OseId.Application.Persistence;
using OseId.Domain.Health;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// The readiness use case's mapping from every <see cref="OseId.Domain.Persistence.SchemaState" />
/// outcome to the closed response shape. The health.feature scenario narrates only the
/// database-outage row; this suite proves the schema-incompatible and ready rows the
/// same mapping must also carry, per the health adapter map's "readiness ... database/schema
/// codes" obligation.
/// </summary>
public sealed class ReportReadinessTests
{
    [Fact]
    public async Task ExecuteAsync_WithACompatibleAppliedSchema_ReportsReady()
    {
        var reader = FakeMigrationHistoryReader.WithActiveRecords("20260916060219_CreateIdentityFoundation");
        var correlationIds = new RecordingCorrelationIdFactory();
        var useCase = new ReportReadiness(new ReadSchemaState(reader), correlationIds);

        ReadinessResult result = await useCase.ExecuteAsync(
            suppliedCorrelationId: null,
            TestContext.Current.CancellationToken
        );

        result.Should().BeOfType<ReadinessResult.Ready>();
        result.CorrelationId.Should().Be(RecordingCorrelationIdFactory.FixedValue);
        reader.ReadCount.Should().Be(1);
    }

    [Fact]
    public async Task ExecuteAsync_WhenTheDatabaseCannotBeRead_ReportsDatabaseUnavailable()
    {
        var reader = FakeMigrationHistoryReader.Unavailable();
        var useCase = new ReportReadiness(new ReadSchemaState(reader), new RecordingCorrelationIdFactory());

        ReadinessResult result = await useCase.ExecuteAsync(
            suppliedCorrelationId: null,
            TestContext.Current.CancellationToken
        );

        var problem = result.Should().BeOfType<ReadinessResult.Problem>().Subject;
        problem.Status.Should().Be(ReadinessPolicy.ProblemStatus);
        problem.Code.Should().Be(ReadinessPolicy.DatabaseUnavailableCode);
        problem.Title.Should().Be(ReadinessPolicy.DatabaseUnavailableTitle);
    }

    [Fact]
    public async Task ExecuteAsync_WhenTheAppliedSetOmitsARequiredMigration_ReportsSchemaIncompatible()
    {
        // An empty active set is the simplest incompatible database: reachable, but it has
        // applied none of the migrations this build compiles against.
        var reader = FakeMigrationHistoryReader.WithActiveRecords();
        var useCase = new ReportReadiness(new ReadSchemaState(reader), new RecordingCorrelationIdFactory());

        ReadinessResult result = await useCase.ExecuteAsync(
            suppliedCorrelationId: null,
            TestContext.Current.CancellationToken
        );

        var problem = result.Should().BeOfType<ReadinessResult.Problem>().Subject;
        problem.Status.Should().Be(ReadinessPolicy.ProblemStatus);
        problem.Code.Should().Be(ReadinessPolicy.SchemaIncompatibleCode);
        problem.Title.Should().Be(ReadinessPolicy.SchemaIncompatibleTitle);
    }

    [Fact]
    public async Task ExecuteAsync_WithASuppliedCorrelationIdTheContractAccepts_ReusesIt()
    {
        var reader = FakeMigrationHistoryReader.WithActiveRecords("20260916060219_CreateIdentityFoundation");
        var correlationIds = new RecordingCorrelationIdFactory();
        var useCase = new ReportReadiness(new ReadSchemaState(reader), correlationIds);

        ReadinessResult result = await useCase.ExecuteAsync(
            "corr_caller_supplied",
            TestContext.Current.CancellationToken
        );

        result.CorrelationId.Should().Be("corr_caller_supplied");
        correlationIds.CreatedCount.Should().Be(0);
    }

    [Fact]
    public void Constructor_RejectsANullReadSchemaState()
    {
        Action act = () => _ = new ReportReadiness(null!, new RecordingCorrelationIdFactory());

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_RejectsANullCorrelationIdFactory()
    {
        var reader = FakeMigrationHistoryReader.Unavailable();

        Action act = () => _ = new ReportReadiness(new ReadSchemaState(reader), null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
