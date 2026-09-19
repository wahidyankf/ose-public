using FluentAssertions;
using OseId.Application.Health;
using OseId.Domain.Health;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// The liveness use case. Liveness has exactly one outcome, so this suite proves the
/// outcome's two fixed fields and its correlation-handling rule rather than a branch table.
/// </summary>
public sealed class ReportLivenessTests
{
    [Fact]
    public void Execute_AlwaysReportsLive()
    {
        var result = new ReportLiveness(new RecordingCorrelationIdFactory()).Execute(suppliedCorrelationId: null);

        result.Status.Should().Be(LivenessPolicy.Status);
        result.Service.Should().Be(LivenessPolicy.ServiceName);
    }

    [Fact]
    public void Execute_WithNoSuppliedCorrelationId_GeneratesOne()
    {
        var correlationIds = new RecordingCorrelationIdFactory();

        LivenessResult result = new ReportLiveness(correlationIds).Execute(suppliedCorrelationId: null);

        result.CorrelationId.Should().Be(RecordingCorrelationIdFactory.FixedValue);
        correlationIds.CreatedCount.Should().Be(1);
    }

    [Fact]
    public void Execute_WithASuppliedCorrelationIdTheContractAccepts_ReusesIt()
    {
        var correlationIds = new RecordingCorrelationIdFactory();

        LivenessResult result = new ReportLiveness(correlationIds).Execute("corr_caller_supplied");

        result.CorrelationId.Should().Be("corr_caller_supplied");
        correlationIds.CreatedCount.Should().Be(0);
    }

    [Fact]
    public void Execute_WithAnUnusableSuppliedCorrelationId_ReplacesItRatherThanReflectingIt()
    {
        var correlationIds = new RecordingCorrelationIdFactory();

        LivenessResult result = new ReportLiveness(correlationIds).Execute(suppliedCorrelationId: "has spaces");

        result.CorrelationId.Should().Be(RecordingCorrelationIdFactory.FixedValue);
        correlationIds.CreatedCount.Should().Be(1);
    }

    [Fact]
    public void Constructor_RejectsANullCorrelationIdFactory()
    {
        Action act = () => _ = new ReportLiveness(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
