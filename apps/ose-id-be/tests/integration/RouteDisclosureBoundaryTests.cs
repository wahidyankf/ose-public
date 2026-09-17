using System.Net;
using System.Text.Json;
using FluentAssertions;
using OseId.Domain.Capabilities;
using Xunit;

namespace OseId.Be.Integration;

/// <summary>
/// The two halves the route-disclosure scenario deliberately does not state. Replacing
/// the dispatcher's method-mismatch answer is a change to every answer the pipeline
/// sends, so these prove the change reached only that answer: a request that names a
/// method a route does register still receives its contracted response, and a request
/// that names no route at all still receives the ordinary not-found it always did.
/// </summary>
public sealed class RouteDisclosureBoundaryTests
{
    private const string CorrelationHeader = "X-Correlation-ID";
    private const string AllowHeader = "Allow";
    private const string ActiveMigration = "20260916060219_CreateIdentityFoundation";

    [Fact]
    public async Task RegisteredHealthRoutes_KeepTheirContractedAnswerAsync()
    {
        using TestHostFixture host = TestHostFixture.Start(
            migrationHistoryReader: FakeMigrationHistoryReader.WithActiveRecords(ActiveMigration)
        );

        foreach (string path in new[] { "/health/live", "/health/ready" })
        {
            using HttpResponseMessage response = await host
                .Client.GetAsync(new Uri(path, UriKind.Relative), TestContext.Current.CancellationToken)
                .ConfigureAwait(true);

            response.StatusCode.Should().Be(HttpStatusCode.OK, path);
            response.Content.Headers.ContentType!.MediaType.Should().Be("application/json", path);
            response.Headers.CacheControl!.NoStore.Should().BeTrue(path);
            response.Headers.GetValues(CorrelationHeader).Should().ContainSingle(path);
        }
    }

    [Fact]
    public async Task RegisteredCapabilityRoutes_KeepTheirRefusalAsync()
    {
        using TestHostFixture host = TestHostFixture.Start();

        foreach (DisabledCapability capability in DisabledCapabilityCatalog.All)
        {
            using var request = new HttpRequestMessage(new HttpMethod(capability.Method), capability.Path);
            using HttpResponseMessage response = await host
                .Client.SendAsync(request, TestContext.Current.CancellationToken)
                .ConfigureAwait(true);
            string body = await response
                .Content.ReadAsStringAsync(TestContext.Current.CancellationToken)
                .ConfigureAwait(true);

            response.StatusCode.Should().Be(HttpStatusCode.NotFound, capability.Capability);
            response
                .Content.Headers.ContentType!.MediaType.Should()
                .Be("application/problem+json", capability.Capability);
            response.Headers.CacheControl!.NoStore.Should().BeTrue(capability.Capability);
            response.Headers.GetValues(CorrelationHeader).Should().ContainSingle(capability.Capability);

            using JsonDocument document = JsonDocument.Parse(body);
            document
                .RootElement.GetProperty("code")
                .GetString()
                .Should()
                .Be(DisabledCapabilityPolicy.ProblemCode, capability.Capability);
        }
    }

    [Theory]
    [InlineData("GET")]
    [InlineData("POST")]
    [InlineData("DELETE")]
    public async Task UnregisteredPath_StillAnswersAnOrdinaryNotFoundAsync(string method)
    {
        using TestHostFixture host = TestHostFixture.Start();
        using var request = new HttpRequestMessage(new HttpMethod(method), "/ose-id-registers-no-such-path");

        using HttpResponseMessage response = await host
            .Client.SendAsync(request, TestContext.Current.CancellationToken)
            .ConfigureAwait(true);
        string body = await response
            .Content.ReadAsStringAsync(TestContext.Current.CancellationToken)
            .ConfigureAwait(true);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        ResponseShape.Names(response, AllowHeader).Should().BeFalse();
        ResponseShape.Names(response, CorrelationHeader).Should().BeFalse();
        response.Content.Headers.ContentType.Should().BeNull();
        body.Should().BeEmpty();
    }
}
