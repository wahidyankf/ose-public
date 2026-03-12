using System.Text.RegularExpressions;

namespace DemoBeCsas.Domain;

public sealed record UserDomain(
    Guid Id,
    string Username,
    string Email,
    string PasswordHash,
    string? DisplayName,
    UserStatus Status,
    Role Role,
    int FailedLoginAttempts,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public static partial class UserValidation
{
    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled)]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"^[a-zA-Z0-9_-]{3,50}$", RegexOptions.Compiled)]
    private static partial Regex UsernameRegex();

    public static DomainError? ValidatePassword(string password)
    {
        if (password.Length < 12)
        {
            return new ValidationError("password", "Password must be at least 12 characters");
        }

        if (!password.Any(char.IsUpper))
        {
            return new ValidationError(
                "password",
                "Password must contain at least one uppercase letter"
            );
        }

        if (!password.Any(c => !char.IsLetterOrDigit(c)))
        {
            return new ValidationError(
                "password",
                "Password must contain at least one special character"
            );
        }

        return null;
    }

    public static DomainError? ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !EmailRegex().IsMatch(email))
        {
            return new ValidationError("email", "Invalid email address");
        }

        return null;
    }

    public static DomainError? ValidateUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username) || !UsernameRegex().IsMatch(username))
        {
            return new ValidationError(
                "username",
                "Username must be 3-50 characters and contain only letters, numbers, underscores, or hyphens"
            );
        }

        return null;
    }
}
