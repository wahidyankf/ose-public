using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace DemoBeCsas.Infrastructure.Repositories;

public interface IUserRepository
{
    Task<UserModel> CreateAsync(
        string username,
        string email,
        string passwordHash,
        string? displayName,
        Role role = Role.User,
        CancellationToken ct = default
    );
    Task<UserModel?> FindByUsernameAsync(string username, CancellationToken ct = default);
    Task<UserModel?> FindByIdAsync(Guid userId, CancellationToken ct = default);
    Task<UserModel> UpdateAsync(UserModel user, CancellationToken ct = default);
    Task<(IReadOnlyList<UserModel> Items, int Total)> ListAsync(
        int page,
        int size,
        string? emailFilter = null,
        CancellationToken ct = default
    );
}

public class UserRepository(AppDbContext db) : IUserRepository
{
    public async Task<UserModel> CreateAsync(
        string username,
        string email,
        string passwordHash,
        string? displayName,
        Role role = Role.User,
        CancellationToken ct = default
    )
    {
        var now = DateTimeOffset.UtcNow;
        var user = new UserModel
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = passwordHash,
            DisplayName = displayName ?? string.Empty,
            Status = UserStatus.Active,
            Role = role,
            FailedLoginAttempts = 0,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return user;
    }

    public Task<UserModel?> FindByUsernameAsync(string username, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Username == username, ct);

    public Task<UserModel?> FindByIdAsync(Guid userId, CancellationToken ct = default) =>
        db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

    public async Task<UserModel> UpdateAsync(UserModel user, CancellationToken ct = default)
    {
        user.UpdatedAt = DateTimeOffset.UtcNow;
        db.Users.Update(user);
        await db.SaveChangesAsync(ct);
        return user;
    }

    public async Task<(IReadOnlyList<UserModel> Items, int Total)> ListAsync(
        int page,
        int size,
        string? emailFilter = null,
        CancellationToken ct = default
    )
    {
        var query = db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(emailFilter))
        {
            query = query.Where(u => u.Email.Contains(emailFilter));
        }

        var total = await query.CountAsync(ct);
        // Use AsEnumerable to perform client-side sort to avoid SQLite DateTimeOffset translation issue
        var items = (await query.ToListAsync(ct))
            .OrderBy(u => u.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .ToList();
        return (items, total);
    }
}
