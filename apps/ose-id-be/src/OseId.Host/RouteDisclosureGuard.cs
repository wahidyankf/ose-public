using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using OseId.Domain.Routing;

namespace OseId.Host;

/// <summary>
/// The guard that stands between the dispatcher's method-mismatch answer and the wire.
/// The framework decides a method mismatch inside routing, before any handler this
/// application wrote runs, so neither <see cref="HealthEndpoints" /> nor
/// <see cref="DisabledCapabilityEndpoints" /> can be the place that answers it: the only
/// position that sees that answer is a middleware wrapping endpoint execution. It is
/// registered for the whole application rather than per route because every route OSE ID
/// owns wants the same thing, and a route added later would otherwise start disclosing
/// itself by default.
/// </summary>
internal static class RouteDisclosureGuard
{
    internal static IApplicationBuilder Use(IApplicationBuilder application)
    {
        application.Use(
            async (context, next) =>
            {
                await next(context).ConfigureAwait(false);

                // The dispatcher's method-mismatch answer is a status and an Allow header
                // with no body, so nothing has been written and nothing has been flushed
                // by the time control returns here. The HasStarted check keeps that a
                // checked fact rather than an assumption a later middleware could break.
                if (!RouteDisclosurePolicy.DisclosesRegisteredPath(context.Response.StatusCode))
                {
                    return;
                }

                if (context.Response.HasStarted)
                {
                    return;
                }

                foreach (string header in RouteDisclosurePolicy.DisclosingHeaders)
                {
                    context.Response.Headers.Remove(header);
                }

                AbsentRouteAnswer answer = RouteDisclosurePolicy.AbsentRoute;
                context.Response.ContentType = answer.ContentType;
                context.Response.ContentLength = answer.ContentLength;
                context.Response.StatusCode = answer.Status;
            }
        );

        return application;
    }
}
