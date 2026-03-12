using System.IdentityModel.Tokens.Jwt;
using System.Text;
using DemoBeCsas.Auth;
using Microsoft.IdentityModel.Tokens;

namespace DemoBeCsas.Endpoints;

public static class TokenEndpoints
{
    public static IEndpointRouteBuilder MapTokenEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/tokens/claims", GetClaimsAsync).RequireAuthorization();
        app.MapGet("/.well-known/jwks.json", GetJwks);
        return app;
    }

    private static IResult GetClaimsAsync(HttpContext ctx)
    {
        var claims = ctx.User.Claims.Select(c => new { type = c.Type, value = c.Value });
        return Results.Ok(new { claims });
    }

    private static IResult GetJwks(IConfiguration config)
    {
        var secret = config["APP_JWT_SECRET"] ?? string.Empty;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var keyId = Convert.ToBase64String(key.ComputeJwkThumbprint())
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

        return Results.Ok(
            new
            {
                keys = new[]
                {
                    new
                    {
                        kty = "oct",
                        use = "sig",
                        alg = SecurityAlgorithms.HmacSha256,
                        kid = keyId,
                    },
                },
            }
        );
    }
}
