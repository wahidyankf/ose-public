using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DemoBeCsas.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/admin/users", ListUsersAsync).RequireAuthorization("Admin");
        app.MapPost("/api/v1/admin/users/{id}/disable", DisableUserAsync).RequireAuthorization("Admin");
        app.MapPost("/api/v1/admin/users/{id}/enable", EnableUserAsync).RequireAuthorization("Admin");
        app.MapPost("/api/v1/admin/users/{id}/unlock", UnlockUserAsync).RequireAuthorization("Admin");
        app.MapPost("/api/v1/admin/users/{id}/force-password-reset", ForcePasswordResetAsync).RequireAuthorization("Admin");
        return app;
    }

    private static async Task<IResult> ListUsersAsync(
        IUserRepository userRepo,
        CancellationToken ct,
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        [FromQuery] string? email = null
    )
    {
        var safePage = Math.Max(1, page == 0 ? 1 : page);
        var safeSize = size <= 0 ? 20 : size;
        var (items, total) = await userRepo.ListAsync(safePage, safeSize, email, ct);
        return Results.Ok(
            new
            {
                data = items.Select(u => new
                {
                    id = u.Id,
                    username = u.Username,
                    email = u.Email,
                    display_name = u.DisplayName,
                    status = u.Status.ToString().ToUpperInvariant(),
                    role = u.Role.ToString().ToUpperInvariant(),
                }),
                total,
                page = safePage,
                size = safeSize,
            }
        );
    }

    private static async Task<IResult> DisableUserAsync(
        Guid id,
        IUserRepository userRepo,
        CancellationToken ct
    )
    {
        var user = await userRepo.FindByIdAsync(id, ct);
        if (user is null)
        {
            return DomainErrorMapper.ToHttpResult(new NotFoundError("User"));
        }

        user.Status = UserStatus.Disabled;
        await userRepo.UpdateAsync(user, ct);
        return Results.Ok();
    }

    private static async Task<IResult> EnableUserAsync(
        Guid id,
        IUserRepository userRepo,
        CancellationToken ct
    )
    {
        var user = await userRepo.FindByIdAsync(id, ct);
        if (user is null)
        {
            return DomainErrorMapper.ToHttpResult(new NotFoundError("User"));
        }

        user.Status = UserStatus.Active;
        await userRepo.UpdateAsync(user, ct);
        return Results.Ok();
    }

    private static async Task<IResult> UnlockUserAsync(
        Guid id,
        IUserRepository userRepo,
        CancellationToken ct
    )
    {
        var user = await userRepo.FindByIdAsync(id, ct);
        if (user is null)
        {
            return DomainErrorMapper.ToHttpResult(new NotFoundError("User"));
        }

        user.Status = UserStatus.Active;
        user.FailedLoginAttempts = 0;
        await userRepo.UpdateAsync(user, ct);
        return Results.Ok();
    }

    private static async Task<IResult> ForcePasswordResetAsync(
        Guid id,
        IUserRepository userRepo,
        CancellationToken ct
    )
    {
        var user = await userRepo.FindByIdAsync(id, ct);
        if (user is null)
        {
            return DomainErrorMapper.ToHttpResult(new NotFoundError("User"));
        }

        var resetToken = Guid.NewGuid().ToString("N");
        return Results.Ok(new { reset_token = resetToken });
    }
}
