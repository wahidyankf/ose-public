using FluentAssertions;
using OseId.Domain.Correlation;
using OseId.Infrastructure.Correlation;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// The delivered correlation adapter. A generated value has to satisfy the same contract
/// a supplied one does, because both end up in the same header and the same log line.
/// </summary>
public sealed class GuidCorrelationIdFactoryTests
{
    [Fact]
    public void Create_ProducesAValueTheContractAccepts()
    {
        CorrelationId created = new GuidCorrelationIdFactory().Create();

        CorrelationId.TryAccept(created.Value, out _).Should().BeTrue();
        created.Value.Should().StartWith("corr_");
        created.Value.Length.Should().BeLessThanOrEqualTo(CorrelationId.MaximumLength);
    }

    [Fact]
    public void Create_ProducesADistinctValueEachTime()
    {
        var factory = new GuidCorrelationIdFactory();

        factory.Create().Should().NotBe(factory.Create());
    }
}
