using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;

namespace DemoBeCsas.Auth;

/// <summary>
/// Middleware that checks token revocation and user status after authentication.
/// Only applies to endpoints that require authorization.
/// Rejects requests with revoked JTIs or from inactive/disabled/locked users.
/// </summary>
public class TokenRevocationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext ctx,
        IJwtService jwtService,
        IRevokedTokenRepository revokedTokenRepo,
        IUserRepository userRepo
    )
    {
        // Only enforce revocation/status check on endpoints that require authorization
        var endpoint = ctx.GetEndpoint();
        var requiresAuth = endpoint?.Metadata.GetMetadata<IAuthorizeData>() is not null;

        if (requiresAuth && ctx.User.Identity?.IsAuthenticated == true)
        {
            var sub = ctx.User.FindFirst(
                System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
            )?.Value;

            if (sub is null || !Guid.TryParse(sub, out var userId))
            {
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            // Check individual token revocation (logout)
            var authHeader = ctx.Request.Headers.Authorization.ToString();
            if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authHeader["Bearer ".Length..].Trim();
                var jti = jwtService.GetJti(token);
                if (jti is not null && await revokedTokenRepo.IsRevokedAsync(jti, ctx.RequestAborted))
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return;
                }

                // Check per-user revocation (logout-all / deactivate)
                var issuedAt = jwtService.GetIssuedAt(token);
                var revokedBefore = await revokedTokenRepo.GetUserRevokedBeforeAsync(userId, ctx.RequestAborted);
                if (revokedBefore.HasValue && issuedAt.HasValue && issuedAt.Value <= revokedBefore.Value)
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return;
                }
            }

            // Check user is still active
            var user = await userRepo.FindByIdAsync(userId, ctx.RequestAborted);
            if (user is null || user.Status != UserStatus.Active)
            {
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }
        }

        await next(ctx);
    }
}
