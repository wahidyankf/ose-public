using System.Globalization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OseId.Application.Foundation;
using OseId.Application.Foundation.Ports;
using OseId.Infrastructure.Correlation;

namespace OseId.Host;

/// <summary>
/// The composition root. It is the only place that names every concrete type: it decides
/// whether a start is admitted, registers each port against exactly one adapter, and maps
/// the closed inbound route table. Domain and application code never resolve a service
/// from the container and never select an implementation from caller input.
/// </summary>
public static class OseIdHost
{
    /// <summary>
    /// Decides whether this process may serve, reading only the declared runtime mode.
    /// The composition root calls this before it creates a builder, so a refused mode
    /// cannot reach route registration, dependency construction, or listener binding.
    /// </summary>
    public static StartupDecision EvaluateStartup(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        return RuntimeModeStartupGuard.Evaluate(configuration[RuntimeModeConfiguration.Key]);
    }

    /// <summary>
    /// The loopback origin the host binds. It is always a literal loopback address: the
    /// listener is never reachable from another machine in a mode OSE ID may serve.
    /// </summary>
    public static string ListenerOrigin(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        string? declaredPort = configuration[RuntimeModeConfiguration.PortKey];
        int port = int.TryParse(declaredPort, NumberStyles.None, CultureInfo.InvariantCulture, out int parsed)
            ? parsed
            : RuntimeModeConfiguration.ReservedPort;

        return $"http://127.0.0.1:{port.ToString(CultureInfo.InvariantCulture)}";
    }

    /// <summary>Registers every port against exactly one adapter.</summary>
    public static void RegisterServices(IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddSingleton<ICorrelationIdFactory, GuidCorrelationIdFactory>();
        services.AddSingleton<RejectDisabledCapability>();
    }

    /// <summary>
    /// Maps the complete inbound route table. Nothing else is registered: no health route
    /// yet, and no account, token, company, or administration route at all.
    /// </summary>
    public static IEndpointRouteBuilder MapInboundRoutes(IEndpointRouteBuilder routes)
    {
        ArgumentNullException.ThrowIfNull(routes);

        return DisabledCapabilityEndpoints.Map(routes);
    }
}
