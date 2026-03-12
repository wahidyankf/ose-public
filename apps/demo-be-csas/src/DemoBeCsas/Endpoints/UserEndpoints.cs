using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DemoBeCsas.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/users/me", GetMeAsync).RequireAuthorization();
        app.MapPatch("/api/v1/users/me", PatchMeAsync).RequireAuthorization();
        app.MapPost("/api/v1/users/me/password", ChangePasswordAsync).RequireAuthorization();
        app.MapPost("/api/v1/users/me/deactivate", DeactivateAsync).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> GetMeAsync(
        HttpContext ctx,
        IUserRepository userRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await userRepo.FindByIdAsync(userId.Value, ct);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(
            new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                display_name = user.DisplayName ?? user.Username,
                status = user.Status.ToString().ToUpperInvariant(),
                role = user.Role.ToString().ToUpperInvariant(),
            }
        );
    }

    private static async Task<IResult> PatchMeAsync(
        HttpContext ctx,
        [FromBody] PatchMeRequest req,
        IUserRepository userRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await userRepo.FindByIdAsync(userId.Value, ct);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        user.DisplayName = req.DisplayName;
        await userRepo.UpdateAsync(user, ct);

        return Results.Ok(
            new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                display_name = user.DisplayName,
                status = user.Status.ToString().ToUpperInvariant(),
                role = user.Role.ToString().ToUpperInvariant(),
            }
        );
    }

    private static async Task<IResult> ChangePasswordAsync(
        HttpContext ctx,
        [FromBody] ChangePasswordRequest req,
        IUserRepository userRepo,
        IPasswordHasher hasher,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await userRepo.FindByIdAsync(userId.Value, ct);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        if (req.OldPassword is null || !hasher.VerifyPassword(req.OldPassword, user.PasswordHash))
        {
            // Return 401 for incorrect old password (matches feature spec)
            return Results.Unauthorized();
        }

        if (req.NewPassword is null)
        {
            return Results.BadRequest(new { message = "New password is required" });
        }

        user.PasswordHash = hasher.HashPassword(req.NewPassword);
        await userRepo.UpdateAsync(user, ct);

        return Results.Ok();
    }

    private static async Task<IResult> DeactivateAsync(
        HttpContext ctx,
        IUserRepository userRepo,
        IRevokedTokenRepository revokedTokenRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var user = await userRepo.FindByIdAsync(userId.Value, ct);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        user.Status = UserStatus.Inactive;
        await userRepo.UpdateAsync(user, ct);
        await revokedTokenRepo.RevokeAllForUserAsync(userId.Value, DateTimeOffset.UtcNow, ct);

        return Results.Ok();
    }

    private static Guid? GetUserId(HttpContext ctx)
    {
        var sub = ctx.User.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;
        return sub is not null && Guid.TryParse(sub, out var g) ? g : null;
    }

    private sealed record PatchMeRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("display_name")]
        string? DisplayName
    );

    private sealed record ChangePasswordRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("old_password")]
        string? OldPassword,
        [property: System.Text.Json.Serialization.JsonPropertyName("new_password")]
        string? NewPassword
    );
}
