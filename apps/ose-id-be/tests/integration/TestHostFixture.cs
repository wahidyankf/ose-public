using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using OseId.Host;

namespace OseId.Be.Integration;

/// <summary>
/// Composes the delivered host over an in-memory transport. The registration and the
/// route mapping are the production ones; only the transport is replaced, so the
/// middleware order, route table, headers, and serializer under test are real while
/// the test binds no socket and reserves no port.
/// </summary>
public sealed class TestHostFixture : IDisposable
{
    private readonly WebApplication _application;

    private TestHostFixture(WebApplication application) => _application = application;

    public HttpClient Client => _application.GetTestClient();

    /// <summary>
    /// Every route the built host actually answers, as the framework sees it. Reading the
    /// real endpoint data source is what makes the negative inventory an assertion rather
    /// than an assumption: an accidentally registered route shows up here.
    /// </summary>
    public IReadOnlyList<string> RouteTable =>
        [
            .. _application
                .Services.GetRequiredService<EndpointDataSource>()
                .Endpoints.OfType<RouteEndpoint>()
                .Select(endpoint =>
                    $"{string.Join(',', endpoint.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? [])} {endpoint.RoutePattern.RawText}"
                ),
        ];

    public static TestHostFixture Start()
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseTestServer();
        OseIdHost.RegisterServices(builder.Services);

        WebApplication application = builder.Build();
        OseIdHost.MapInboundRoutes(application);
        application.StartAsync().GetAwaiter().GetResult();

        return new TestHostFixture(application);
    }

    public void Dispose()
    {
        _application.StopAsync().GetAwaiter().GetResult();
        ((IDisposable)_application).Dispose();
    }
}
