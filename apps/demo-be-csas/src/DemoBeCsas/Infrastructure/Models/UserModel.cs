using DemoBeCsas.Domain;

namespace DemoBeCsas.Infrastructure.Models;

public class UserModel
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public Role Role { get; set; } = Role.User;
    public int FailedLoginAttempts { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
