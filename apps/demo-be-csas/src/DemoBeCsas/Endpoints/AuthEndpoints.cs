using DemoBeCsas.Auth;
using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DemoBeCsas.Endpoints;

public static class AuthEndpoints
{
    private const int MaxFailedAttempts = 5;

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/register", RegisterAsync);
        app.MapPost("/api/v1/auth/login", LoginAsync);
        app.MapPost("/api/v1/auth/refresh", RefreshAsync);
        app.MapPost("/api/v1/auth/logout", (HttpRequest req, IJwtService jwt, IRevokedTokenRepository rt, CancellationToken ct) => LogoutAsync(req, jwt, rt, ct));
        app.MapPost("/api/v1/auth/logout-all", (HttpContext c, IRevokedTokenRepository rt, CancellationToken ct) => LogoutAllAsync(c, rt, ct)).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> RegisterAsync(
        [FromBody] RegisterRequest req,
        IUserRepository userRepo,
        IPasswordHasher hasher,
        CancellationToken ct
    )
    {
        if (req.Username is null || req.Email is null || req.Password is null)
        {
            return Results.BadRequest(new { message = "username, email, and password are required" });
        }

        var usernameError = UserValidation.ValidateUsername(req.Username);
        if (usernameError is not null)
        {
            return DomainErrorMapper.ToHttpResult(usernameError);
        }

        var emailError = UserValidation.ValidateEmail(req.Email);
        if (emailError is not null)
        {
            return DomainErrorMapper.ToHttpResult(emailError);
        }

        var passwordError = UserValidation.ValidatePassword(req.Password);
        if (passwordError is not null)
        {
            return DomainErrorMapper.ToHttpResult(passwordError);
        }

        var existing = await userRepo.FindByUsernameAsync(req.Username, ct);
        if (existing is not null)
        {
            return DomainErrorMapper.ToHttpResult(
                new ConflictError($"Username '{req.Username}' already exists")
            );
        }

        var hash = hasher.HashPassword(req.Password);
        var user = await userRepo.CreateAsync(
            req.Username,
            req.Email,
            hash,
            req.DisplayName ?? req.Username,
            ct: ct
        );

        return Results.Created(
            $"/api/v1/users/{user.Id}",
            new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                display_name = user.DisplayName,
            }
        );
    }

    private static async Task<IResult> LoginAsync(
        [FromBody] LoginRequest req,
        IUserRepository userRepo,
        IPasswordHasher hasher,
        IJwtService jwtService,
        CancellationToken ct
    )
    {
        if (req.Username is null || req.Password is null)
        {
            return Results.Unauthorized();
        }

        var user = await userRepo.FindByUsernameAsync(req.Username, ct);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        if (user.Status == UserStatus.Locked)
        {
            // Return 401 for locked accounts (not 423) to match feature spec
            return Results.Unauthorized();
        }

        if (user.Status == UserStatus.Disabled)
        {
            return Results.Unauthorized();
        }

        if (!hasher.VerifyPassword(req.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.Status = UserStatus.Locked;
            }

            await userRepo.UpdateAsync(user, ct);
            return Results.Unauthorized();
        }

        if (user.Status == UserStatus.Inactive)
        {
            return Results.Unauthorized();
        }

        user.FailedLoginAttempts = 0;
        await userRepo.UpdateAsync(user, ct);

        var accessToken = jwtService.CreateAccessToken(
            user.Id.ToString(),
            user.Username,
            user.Role.ToString()
        );
        var refreshToken = jwtService.CreateRefreshToken(user.Id.ToString());

        return Results.Ok(
            new
            {
                access_token = accessToken,
                refresh_token = refreshToken,
                token_type = "Bearer",
            }
        );
    }

    private static async Task<IResult> RefreshAsync(
        [FromBody] RefreshRequest req,
        IUserRepository userRepo,
        IJwtService jwtService,
        IRevokedTokenRepository revokedTokenRepo,
        CancellationToken ct
    )
    {
        if (req.RefreshToken is null)
        {
            return Results.Unauthorized();
        }

        var principal = jwtService.DecodeToken(req.RefreshToken);
        if (principal is null)
        {
            return Results.Unauthorized();
        }

        var userId = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (userId is null || !Guid.TryParse(userId, out var userGuid))
        {
            return Results.Unauthorized();
        }

        var jti = jwtService.GetJti(req.RefreshToken);
        if (jti is null || await revokedTokenRepo.IsRevokedAsync(jti, ct))
        {
            return Results.Unauthorized();
        }

        var issuedAt = jwtService.GetIssuedAt(req.RefreshToken);
        var revokedBefore = await revokedTokenRepo.GetUserRevokedBeforeAsync(userGuid, ct);
        if (revokedBefore.HasValue && issuedAt.HasValue && issuedAt.Value <= revokedBefore.Value)
        {
            return Results.Unauthorized();
        }

        var user = await userRepo.FindByIdAsync(userGuid, ct);
        if (user is null || user.Status != UserStatus.Active)
        {
            return Results.Unauthorized();
        }

        // Revoke old refresh token
        await revokedTokenRepo.RevokeAsync(jti, userGuid, ct);

        var newAccessToken = jwtService.CreateAccessToken(
            user.Id.ToString(),
            user.Username,
            user.Role.ToString()
        );
        var newRefreshToken = jwtService.CreateRefreshToken(user.Id.ToString());

        return Results.Ok(
            new
            {
                access_token = newAccessToken,
                refresh_token = newRefreshToken,
                token_type = "Bearer",
            }
        );
    }

    private static async Task<IResult> LogoutAsync(
        HttpRequest request,
        IJwtService jwtService,
        IRevokedTokenRepository revokedTokenRepo,
        CancellationToken ct
    )
    {
        var authHeader = request.Headers.Authorization.ToString();
        if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Ok();
        }

        var token = authHeader["Bearer ".Length..].Trim();
        var jti = jwtService.GetJti(token);
        if (jti is null)
        {
            return Results.Ok();
        }

        var principal = jwtService.DecodeToken(token);
        var userId = principal?.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;

        if (userId is not null && Guid.TryParse(userId, out var userGuid))
        {
            await revokedTokenRepo.RevokeAsync(jti, userGuid, ct);
        }

        return Results.Ok();
    }

    private static async Task<IResult> LogoutAllAsync(
        HttpContext ctx,
        IRevokedTokenRepository revokedTokenRepo,
        CancellationToken ct
    )
    {
        var userId = ctx.User.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;

        if (userId is null || !Guid.TryParse(userId, out var userGuid))
        {
            return Results.Unauthorized();
        }

        await revokedTokenRepo.RevokeAllForUserAsync(userGuid, DateTimeOffset.UtcNow, ct);
        return Results.Ok();
    }

    private sealed record RegisterRequest(
        string? Username,
        string? Email,
        string? Password,
        string? DisplayName = null
    );

    private sealed record LoginRequest(string? Username, string? Password);

    private sealed record RefreshRequest(
        [property: System.Text.Json.Serialization.JsonPropertyName("refresh_token")]
        string? RefreshToken
    );
}
