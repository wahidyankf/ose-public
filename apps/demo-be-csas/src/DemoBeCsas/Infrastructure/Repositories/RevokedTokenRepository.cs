using DemoBeCsas.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace DemoBeCsas.Infrastructure.Repositories;

public interface IRevokedTokenRepository
{
    Task RevokeAsync(string jti, Guid userId, CancellationToken ct = default);
    Task<bool> IsRevokedAsync(string jti, CancellationToken ct = default);
    Task RevokeAllForUserAsync(Guid userId, DateTimeOffset revokedBefore, CancellationToken ct = default);
    Task<DateTimeOffset?> GetUserRevokedBeforeAsync(Guid userId, CancellationToken ct = default);
}

public class RevokedTokenRepository(AppDbContext db) : IRevokedTokenRepository
{
    public async Task RevokeAsync(string jti, Guid userId, CancellationToken ct = default)
    {
        var already = await db.RevokedTokens.AnyAsync(r => r.Jti == jti, ct);
        if (!already)
        {
            db.RevokedTokens.Add(
                new RevokedTokenModel
                {
                    Id = Guid.NewGuid(),
                    Jti = jti,
                    UserId = userId,
                    RevokedAt = DateTimeOffset.UtcNow,
                }
            );
            await db.SaveChangesAsync(ct);
        }
    }

    public Task<bool> IsRevokedAsync(string jti, CancellationToken ct = default) =>
        db.RevokedTokens.AnyAsync(r => r.Jti == jti, ct);

    public async Task RevokeAllForUserAsync(
        Guid userId,
        DateTimeOffset revokedBefore,
        CancellationToken ct = default
    )
    {
        // Use a special sentinel jti to store the "revoke all before" timestamp
        var sentinelJti = $"revoke-all:{userId}";
        var existing = await db.RevokedTokens.FirstOrDefaultAsync(
            r => r.Jti == sentinelJti,
            ct
        );
        if (existing is null)
        {
            db.RevokedTokens.Add(
                new RevokedTokenModel
                {
                    Id = Guid.NewGuid(),
                    Jti = sentinelJti,
                    UserId = userId,
                    RevokedAt = revokedBefore,
                }
            );
        }
        else
        {
            existing.RevokedAt = revokedBefore;
            db.RevokedTokens.Update(existing);
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<DateTimeOffset?> GetUserRevokedBeforeAsync(
        Guid userId,
        CancellationToken ct = default
    )
    {
        var sentinelJti = $"revoke-all:{userId}";
        var sentinel = await db.RevokedTokens.FirstOrDefaultAsync(
            r => r.Jti == sentinelJti,
            ct
        );
        return sentinel?.RevokedAt;
    }
}
