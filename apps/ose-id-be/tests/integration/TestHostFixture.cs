using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OseId.Application.Persistence.Ports;
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
    // Syntactically valid so `NpgsqlDataSourceBuilder.Build()` never throws during
    // registration; deliberately unreachable (port 1) so a scenario that never touches
    // persistence cannot accidentally pass by finding a real database on the host.
    private const string DefaultConnectionString =
        "Host=127.0.0.1;Port=1;Database=ose_id;Username=ose_id_test;Password=ose_id_test";

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

    /// <param name="connectionString">
    /// The PostgreSQL connection string the built host registers a data source with. A
    /// scenario that never exercises readiness can omit it and receive the syntactically
    /// valid, deliberately unreachable default; a scenario proving database-backed
    /// behaviour supplies its own owned database's connection string.
    /// </param>
    /// <param name="migrationHistoryReader">
    /// Overrides the real <c>NpgsqlMigrationHistoryReader</c> with a controllable double.
    /// Proving that the delivered pipeline maps every dependency state to the contracted
    /// transport shape needs a database whose state this adapter can flip deterministically
    /// — real outage/recovery against an owned PostgreSQL is the E2E adapter's obligation,
    /// not this one's.
    /// </param>
    public static TestHostFixture Start(
        string? connectionString = null,
        IMigrationHistoryReader? migrationHistoryReader = null
    )
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseTestServer();
        builder.Configuration.AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                [PersistenceConfiguration.ConnectionKey] = connectionString ?? DefaultConnectionString,
            }
        );
        OseIdHost.RegisterServices(builder.Services, builder.Configuration);

        if (migrationHistoryReader is not null)
        {
            // Registered after the real adapter: a non-enumerable resolution of a
            // singleton interface returns the last registration, which is what makes
            // this an override rather than an ambiguous second candidate.
            builder.Services.AddSingleton(migrationHistoryReader);
        }

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
