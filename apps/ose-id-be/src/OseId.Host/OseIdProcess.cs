using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using OseId.Application.Foundation;

namespace OseId.Host;

/// <summary>
/// The process boundary. It orders the one thing that must never be reordered: the
/// runtime-mode decision is taken from configuration alone, before a builder, a route
/// table, a dependency, or a listener exists, and a refusal returns an exit code instead
/// of an HTTP response because there is nothing to answer with.
/// </summary>
public static class OseIdProcess
{
    /// <summary>Runs OSE ID and returns the process exit code.</summary>
    /// <param name="args">The command-line arguments the runner supplied.</param>
    /// <param name="diagnostics">Where a refused start writes its sanitized diagnostic.</param>
    public static async Task<int> RunAsync(string[] args, TextWriter diagnostics)
    {
        ArgumentNullException.ThrowIfNull(diagnostics);

        IConfiguration configuration = new ConfigurationBuilder().AddEnvironmentVariables().Build();
        StartupDecision decision = OseIdHost.EvaluateStartup(configuration);

        if (!decision.MayServe)
        {
            await diagnostics
                .WriteLineAsync($"{decision.DiagnosticCode}: {decision.DiagnosticMessage}")
                .ConfigureAwait(false);
            await diagnostics.FlushAsync().ConfigureAwait(false);
            return decision.ExitCode;
        }

        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder(args);
        builder.WebHost.UseUrls(OseIdHost.ListenerOrigin(configuration));

        // No endpoint reads a body, so the host accepts only a small one. A caller that
        // sends more is refused by the server before any handler runs.
        builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 8 * 1024);
        OseIdHost.RegisterServices(builder.Services, builder.Configuration);

        WebApplication application = builder.Build();
        OseIdHost.MapInboundRoutes(application);

        await application.RunAsync().ConfigureAwait(false);
        return 0;
    }
}
