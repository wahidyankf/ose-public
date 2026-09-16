using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OseId.Application.Foundation;
using OseId.Domain.Capabilities;

namespace OseId.Host;

/// <summary>
/// The inbound adapter for every capability OSE ID registers and refuses. It maps the
/// exact method and path pairs from the domain inventory and nothing else, so an unknown
/// path still receives the framework's ordinary not-found answer without a capability
/// code — which is what lets a test tell a disabled capability from an absent route.
/// </summary>
internal static class DisabledCapabilityEndpoints
{
    private const string ProblemMediaType = "application/problem+json";
    private const string CorrelationHeader = "X-Correlation-ID";

    private static readonly JsonSerializerOptions ProblemJson = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    internal static IEndpointRouteBuilder Map(IEndpointRouteBuilder routes)
    {
        foreach (DisabledCapability capability in DisabledCapabilityCatalog.All)
        {
            routes.MapMethods(capability.Path, [capability.Method], RefuseAsync);
        }

        return routes;
    }

    private static async Task RefuseAsync(HttpContext context)
    {
        // The request body is never read and no query value is inspected, so nothing a
        // caller sends reaches a parser, a log line, or the answer.
        RejectDisabledCapability useCase = context.RequestServices.GetRequiredService<RejectDisabledCapability>();
        CapabilityDisabledResult result = useCase.Reject(context.Request.Headers[CorrelationHeader].FirstOrDefault());

        context.Response.StatusCode = result.Status;
        context.Response.ContentType = ProblemMediaType;
        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers[CorrelationHeader] = result.CorrelationId;

        await context
            .Response.WriteAsync(JsonSerializer.Serialize(result, ProblemJson), context.RequestAborted)
            .ConfigureAwait(false);
    }
}
