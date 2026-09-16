using FluentAssertions;
using Microsoft.Extensions.Configuration;
using OseId.Application.Foundation;
using OseId.Host;
using Xunit;

namespace OseId.Be.Integration;

/// <summary>
/// The admitted half of the startup guard at the host boundary. The corpus owns the
/// refused modes; this keeps the guard from satisfying them by refusing everything, and
/// proves that an admitted mode really does reach a serving pipeline.
/// </summary>
public sealed class RuntimeModeHostTests
{
    [Theory]
    [InlineData("Local")]
    [InlineData("Test")]
    public async Task AdmittedMode_BuildsAHostThatAnswers(string declaredMode)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [RuntimeModeConfiguration.Key] = declaredMode })
            .Build();

        StartupDecision decision = OseIdHost.EvaluateStartup(configuration);
        decision.MayServe.Should().BeTrue();

        using var host = TestHostFixture.Start();
        using HttpResponseMessage response = await host
            .Client.GetAsync(new Uri("/connect/authorize", UriKind.Relative), TestContext.Current.CancellationToken)
            .ConfigureAwait(true);

        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public void ListenerOrigin_DefaultsToTheReservedLoopbackPort()
    {
        IConfiguration empty = new ConfigurationBuilder().Build();

        OseIdHost.ListenerOrigin(empty).Should().Be("http://127.0.0.1:8501");
    }

    [Theory]
    [InlineData("9999", "http://127.0.0.1:9999")]
    [InlineData("not-a-port", "http://127.0.0.1:8501")]
    [InlineData("-1", "http://127.0.0.1:8501")]
    public void ListenerOrigin_IsAlwaysAnAbsoluteLoopbackOrigin(string declaredPort, string expected)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { [RuntimeModeConfiguration.PortKey] = declaredPort }
            )
            .Build();

        OseIdHost.ListenerOrigin(configuration).Should().Be(expected);
    }

    [Fact]
    public void MappedRoutes_AreExactlyTheDisabledCapabilityInventory()
    {
        using var host = TestHostFixture.Start();

        host.RouteTable.Should()
            .Equal(
                "GET /connect/authorize",
                "POST /connect/token",
                "GET /external/google/challenge",
                "POST /scim/v2/Users",
                "GET /platform/admin/companies"
            );
    }
}
