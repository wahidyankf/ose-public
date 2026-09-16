using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OseId.Application.Health;
using OseId.Domain.Health;

namespace OseId.Host;

/// <summary>
/// The inbound adapter for the two health routes. Liveness reads no port; readiness
/// awaits exactly the one bounded schema read. Both write the correlation value to the
/// header on every response, and to the body only for a problem — the same asymmetry
/// <see cref="DisabledCapabilityEndpoints" /> already follows for its one problem shape.
/// </summary>
internal static class HealthEndpoints
{
    private const string ProblemMediaType = "application/problem+json";
    private const string JsonMediaType = "application/json";
    private const string CorrelationHeader = "X-Correlation-ID";

    private static readonly JsonSerializerOptions ResponseJson = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };

    internal static IEndpointRouteBuilder Map(IEndpointRouteBuilder routes)
    {
        routes.MapGet("/health/live", ReportLivenessAsync);
        routes.MapGet("/health/ready", ReportReadinessAsync);

        return routes;
    }

    private static Task ReportLivenessAsync(HttpContext context)
    {
        ReportLiveness useCase = context.RequestServices.GetRequiredService<ReportLiveness>();
        LivenessResult result = useCase.Execute(context.Request.Headers[CorrelationHeader].FirstOrDefault());

        context.Response.StatusCode = StatusCodes.Status200OK;
        context.Response.ContentType = JsonMediaType;
        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers[CorrelationHeader] = result.CorrelationId;

        // The correlation value belongs in the header alone here: a liveness success
        // body carries only status and service, never the value that just went out on
        // the header a line above.
        return context.Response.WriteAsync(
            JsonSerializer.Serialize(new LivenessBody(result.Status, result.Service), ResponseJson),
            context.RequestAborted
        );
    }

    private static async Task ReportReadinessAsync(HttpContext context)
    {
        ReportReadiness useCase = context.RequestServices.GetRequiredService<ReportReadiness>();
        ReadinessResult result = await useCase
            .ExecuteAsync(context.Request.Headers[CorrelationHeader].FirstOrDefault(), context.RequestAborted)
            .ConfigureAwait(false);

        context.Response.Headers.CacheControl = "no-store";
        context.Response.Headers[CorrelationHeader] = result.CorrelationId;

        switch (result)
        {
            case ReadinessResult.Ready:
                context.Response.StatusCode = StatusCodes.Status200OK;
                context.Response.ContentType = JsonMediaType;
                await context
                    .Response.WriteAsync(
                        JsonSerializer.Serialize(
                            new ReadinessReadyBody(
                                ReadinessPolicy.ReadyStatus,
                                new ReadinessComponents(
                                    ReadinessPolicy.PostgresqlComponentReady,
                                    ReadinessPolicy.SchemaComponentCompatible
                                )
                            ),
                            ResponseJson
                        ),
                        context.RequestAborted
                    )
                    .ConfigureAwait(false);
                break;
            case ReadinessResult.Problem problem:
                // The problem record already carries exactly the four allowlisted
                // fields the contract permits, so it is serialized as-is rather than
                // projected into a second shape.
                context.Response.StatusCode = problem.Status;
                context.Response.ContentType = ProblemMediaType;
                await context
                    .Response.WriteAsync(JsonSerializer.Serialize(problem, ResponseJson), context.RequestAborted)
                    .ConfigureAwait(false);
                break;
            default:
                throw new UnreachableException($"unmapped readiness result {result.GetType()}");
        }
    }

    private sealed record LivenessBody(string Status, string Service);

    private sealed record ReadinessReadyBody(string Status, ReadinessComponents Components);

    private sealed record ReadinessComponents(string Postgresql, string Schema);
}
