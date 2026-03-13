using System.Text.Json;
using DemoBeCsas.Auth;
using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure;
using DemoBeCsas.Infrastructure.Models;
using DemoBeCsas.Infrastructure.Repositories;
using DemoBeCsas.Tests.ScenarioContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DemoBeCsas.Tests;

/// <summary>
/// Implements all integration-test operations by calling service and repository
/// classes directly — no HTTP transport, no WebApplicationFactory.CreateClient().
///
/// Each method returns a <see cref="ServiceResponse"/> whose StatusCode mirrors
/// what the corresponding HTTP endpoint would have returned, allowing existing
/// Gherkin "Then the response status code should be N" steps to work unchanged.
/// </summary>
public sealed class ServiceLayer(IntegrationTestHost host)
{
    private const int MaxFailedAttempts = 5;
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "application/pdf",
    ];

    // ─────────────────────────────────────────────────────────────
    // Auth
    // ─────────────────────────────────────────────────────────────

    public async Task<ServiceResponse> RegisterAsync(
        string username,
        string email,
        string password,
        string? displayName = null
    )
    {
        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var hasher = sp.GetRequiredService<IPasswordHasher>();

        var usernameError = UserValidation.ValidateUsername(username);
        if (usernameError is not null)
        {
            return DomainError400(usernameError.Message);
        }

        var emailError = UserValidation.ValidateEmail(email);
        if (emailError is not null)
        {
            return DomainError400(emailError.Message);
        }

        var passwordError = UserValidation.ValidatePassword(password);
        if (passwordError is not null)
        {
            return DomainError400(passwordError.Message);
        }

        var existing = await userRepo.FindByUsernameAsync(username);
        if (existing is not null)
        {
            return Json(409, new { message = $"Username '{username}' already exists" });
        }

        var hash = hasher.HashPassword(password);
        var user = await userRepo.CreateAsync(
            username,
            email,
            hash,
            displayName ?? username
        );

        return Json(
            201,
            new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                display_name = user.DisplayName,
            }
        );
    }

    public async Task<ServiceResponse> LoginAsync(string username, string password)
    {
        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var hasher = sp.GetRequiredService<IPasswordHasher>();
        var jwtService = sp.GetRequiredService<IJwtService>();

        var user = await userRepo.FindByUsernameAsync(username);
        if (user is null)
        {
            return Json(401, new { message = "Invalid username or password" });
        }

        if (user.Status == UserStatus.Locked)
        {
            return Json(401, new { message = "Account is locked" });
        }

        if (user.Status == UserStatus.Disabled)
        {
            return Json(401, new { message = "Account is disabled" });
        }

        if (!hasher.VerifyPassword(password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.Status = UserStatus.Locked;
            }

            await userRepo.UpdateAsync(user);
            return Json(401, new { message = "Invalid username or password" });
        }

        if (user.Status == UserStatus.Inactive)
        {
            return Json(401, new { message = "Account is deactivated" });
        }

        user.FailedLoginAttempts = 0;
        await userRepo.UpdateAsync(user);

        var accessToken = jwtService.CreateAccessToken(
            user.Id.ToString(),
            user.Username,
            user.Role.ToString().ToUpperInvariant()
        );
        var refreshToken = jwtService.CreateRefreshToken(user.Id.ToString());

        return Json(
            200,
            new
            {
                access_token = accessToken,
                refresh_token = refreshToken,
                token_type = "Bearer",
            }
        );
    }

    public async Task<ServiceResponse> RefreshTokenAsync(string? refreshToken)
    {
        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var jwtService = sp.GetRequiredService<IJwtService>();
        var revokedTokenRepo = sp.GetRequiredService<IRevokedTokenRepository>();

        if (refreshToken is null)
        {
            return Json(401, new { message = "Invalid token" });
        }

        var principal = jwtService.DecodeToken(refreshToken);
        if (principal is null)
        {
            return Json(401, new { message = "Invalid token" });
        }

        var userId = principal.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;

        if (userId is null || !Guid.TryParse(userId, out var userGuid))
        {
            return Json(401, new { message = "Invalid token" });
        }

        var user = await userRepo.FindByIdAsync(userGuid);
        if (user is null)
        {
            return Json(401, new { message = "Invalid token" });
        }

        if (user.Status == UserStatus.Inactive)
        {
            return Json(401, new { message = "Account is deactivated" });
        }

        if (user.Status == UserStatus.Disabled)
        {
            return Json(401, new { message = "Account is disabled" });
        }

        if (user.Status != UserStatus.Active)
        {
            return Json(401, new { message = "Invalid token" });
        }

        var jti = jwtService.GetJti(refreshToken);
        if (jti is null || await revokedTokenRepo.IsRevokedAsync(jti))
        {
            return Json(401, new { message = "Invalid token" });
        }

        var issuedAt = jwtService.GetIssuedAt(refreshToken);
        var revokedBefore = await revokedTokenRepo.GetUserRevokedBeforeAsync(userGuid);
        if (revokedBefore.HasValue && issuedAt.HasValue && issuedAt.Value <= revokedBefore.Value)
        {
            return Json(401, new { message = "Invalid token" });
        }

        // Revoke old refresh token
        await revokedTokenRepo.RevokeAsync(jti, userGuid);

        var newAccessToken = jwtService.CreateAccessToken(
            user.Id.ToString(),
            user.Username,
            user.Role.ToString().ToUpperInvariant()
        );
        var newRefreshToken = jwtService.CreateRefreshToken(user.Id.ToString());

        return Json(
            200,
            new
            {
                access_token = newAccessToken,
                refresh_token = newRefreshToken,
                token_type = "Bearer",
            }
        );
    }

    public async Task<ServiceResponse> LogoutAsync(string? accessToken)
    {
        if (accessToken is null)
        {
            return Json(200, new { });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;
        var jwtService = sp.GetRequiredService<IJwtService>();
        var revokedTokenRepo = sp.GetRequiredService<IRevokedTokenRepository>();

        var jti = jwtService.GetJti(accessToken);
        if (jti is null)
        {
            return Json(200, new { });
        }

        var principal = jwtService.DecodeToken(accessToken);
        var userId = principal?.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;

        if (userId is not null && Guid.TryParse(userId, out var userGuid))
        {
            await revokedTokenRepo.RevokeAsync(jti, userGuid);
        }

        return Json(200, new { });
    }

    public async Task<ServiceResponse> LogoutAllAsync(string? accessToken)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;
        var jwtService = sp.GetRequiredService<IJwtService>();
        var revokedTokenRepo = sp.GetRequiredService<IRevokedTokenRepository>();

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var principal = jwtService.DecodeToken(accessToken);
        var userId = principal?.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;

        if (userId is null || !Guid.TryParse(userId, out var userGuid))
        {
            return Json(401, new { message = "Unauthorized" });
        }

        await revokedTokenRepo.RevokeAllForUserAsync(userGuid, DateTimeOffset.UtcNow);
        return Json(200, new { });
    }

    // ─────────────────────────────────────────────────────────────
    // User endpoints
    // ─────────────────────────────────────────────────────────────

    public async Task<ServiceResponse> GetMeAsync(string? accessToken)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.FindByIdAsync(userId.Value);
        if (user is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        return Json(
            200,
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

    public async Task<ServiceResponse> PatchMeAsync(string? accessToken, string? displayName)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.FindByIdAsync(userId.Value);
        if (user is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        user.DisplayName = displayName;
        await userRepo.UpdateAsync(user);

        return Json(
            200,
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

    public async Task<ServiceResponse> ChangePasswordAsync(
        string? accessToken,
        string? oldPassword,
        string? newPassword
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var hasher = sp.GetRequiredService<IPasswordHasher>();
        var user = await userRepo.FindByIdAsync(userId.Value);
        if (user is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        if (oldPassword is null || !hasher.VerifyPassword(oldPassword, user.PasswordHash))
        {
            return Json(401, new { message = "Invalid old password" });
        }

        if (newPassword is null)
        {
            return Json(400, new { message = "New password is required" });
        }

        user.PasswordHash = hasher.HashPassword(newPassword);
        await userRepo.UpdateAsync(user);

        return Json(200, new { });
    }

    public async Task<ServiceResponse> DeactivateAsync(string? accessToken)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var revokedTokenRepo = sp.GetRequiredService<IRevokedTokenRepository>();
        var user = await userRepo.FindByIdAsync(userId.Value);
        if (user is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        user.Status = UserStatus.Inactive;
        await userRepo.UpdateAsync(user);
        await revokedTokenRepo.RevokeAllForUserAsync(userId.Value, DateTimeOffset.UtcNow);

        return Json(200, new { });
    }

    // ─────────────────────────────────────────────────────────────
    // Admin endpoints
    // ─────────────────────────────────────────────────────────────

    public async Task<ServiceResponse> AdminListUsersAsync(
        string? accessToken,
        int page = 1,
        int size = 20,
        string? email = null
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var adminCheckResult = await CheckAdminAsync(accessToken, sp);
        if (adminCheckResult is not null)
        {
            return adminCheckResult;
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var safePage = Math.Max(1, page);
        var safeSize = size <= 0 ? 20 : size;
        var (items, total) = await userRepo.ListAsync(safePage, safeSize, email);

        return Json(
            200,
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

    public async Task<ServiceResponse> AdminDisableUserAsync(string? accessToken, Guid userId)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var adminCheckResult = await CheckAdminAsync(accessToken, sp);
        if (adminCheckResult is not null)
        {
            return adminCheckResult;
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.FindByIdAsync(userId);
        if (user is null)
        {
            return Json(404, new { message = "User not found" });
        }

        user.Status = UserStatus.Disabled;
        await userRepo.UpdateAsync(user);
        return Json(200, new { });
    }

    public async Task<ServiceResponse> AdminEnableUserAsync(string? accessToken, Guid userId)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var adminCheckResult = await CheckAdminAsync(accessToken, sp);
        if (adminCheckResult is not null)
        {
            return adminCheckResult;
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.FindByIdAsync(userId);
        if (user is null)
        {
            return Json(404, new { message = "User not found" });
        }

        user.Status = UserStatus.Active;
        await userRepo.UpdateAsync(user);
        return Json(200, new { });
    }

    public async Task<ServiceResponse> AdminUnlockUserAsync(string? accessToken, Guid userId)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var adminCheckResult = await CheckAdminAsync(accessToken, sp);
        if (adminCheckResult is not null)
        {
            return adminCheckResult;
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.FindByIdAsync(userId);
        if (user is null)
        {
            return Json(404, new { message = "User not found" });
        }

        user.Status = UserStatus.Active;
        user.FailedLoginAttempts = 0;
        await userRepo.UpdateAsync(user);
        return Json(200, new { });
    }

    public async Task<ServiceResponse> AdminForcePasswordResetAsync(
        string? accessToken,
        Guid userId
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var adminCheckResult = await CheckAdminAsync(accessToken, sp);
        if (adminCheckResult is not null)
        {
            return adminCheckResult;
        }

        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.FindByIdAsync(userId);
        if (user is null)
        {
            return Json(404, new { message = "User not found" });
        }

        var resetToken = Guid.NewGuid().ToString("N");
        return Json(200, new { reset_token = resetToken });
    }

    // ─────────────────────────────────────────────────────────────
    // Expenses
    // ─────────────────────────────────────────────────────────────

    public async Task<ServiceResponse> CreateExpenseAsync(
        string? accessToken,
        string? description,
        string? title,
        string? category,
        decimal amount,
        string? currency,
        string? type,
        double? quantity,
        string? unit,
        string? dateStr
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var effectiveTitle = description ?? title;
        if (effectiveTitle is null || currency is null)
        {
            return Json(400, new { message = "description/title and currency are required" });
        }

        var amountError = CurrencyValidation.ValidateAmount(currency, amount);
        if (amountError is not null)
        {
            return DomainError400(amountError.Message);
        }

        if (unit is not null)
        {
            var unitError = UnitValidation.ValidateUnit(unit);
            if (unitError is not null)
            {
                return DomainError400(unitError.Message);
            }
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var expenseType = type?.ToLowerInvariant() == "income" ? ExpenseType.Income : ExpenseType.Expense;
        var date = ParseDate(dateStr);
        var effectiveCategory = category ?? string.Empty;

        var expense = await expenseRepo.CreateAsync(
            userId.Value,
            effectiveTitle,
            effectiveCategory,
            amount,
            currency,
            expenseType,
            quantity,
            unit,
            date
        );

        return Json(201, ExpenseToResponse(expense));
    }

    public async Task<ServiceResponse> ListExpensesAsync(
        string? accessToken,
        int page = 1,
        int size = 20
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var safePage = Math.Max(1, page);
        var safeSize = size <= 0 ? 20 : size;
        var (items, total) = await expenseRepo.ListByUserAsync(userId.Value, safePage, safeSize);

        return Json(
            200,
            new
            {
                data = items.Select(ExpenseToResponse),
                total,
                page = safePage,
                size = safeSize,
            }
        );
    }

    public async Task<ServiceResponse> GetExpenseAsync(string? accessToken, Guid expenseId)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var expense = await expenseRepo.FindByIdAsync(expenseId, userId.Value);
        if (expense is null)
        {
            return Json(404, new { message = "Expense not found" });
        }

        return Json(200, ExpenseToResponse(expense));
    }

    public async Task<ServiceResponse> UpdateExpenseAsync(
        string? accessToken,
        Guid expenseId,
        string? description,
        string? title,
        string? category,
        decimal amount,
        string? currency,
        string? type,
        double? quantity,
        string? unit,
        string? dateStr
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var effectiveTitle = description ?? title;
        if (effectiveTitle is null || currency is null)
        {
            return Json(400, new { message = "description/title and currency are required" });
        }

        var amountError = CurrencyValidation.ValidateAmount(currency, amount);
        if (amountError is not null)
        {
            return DomainError400(amountError.Message);
        }

        if (unit is not null)
        {
            var unitError = UnitValidation.ValidateUnit(unit);
            if (unitError is not null)
            {
                return DomainError400(unitError.Message);
            }
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var existing = await expenseRepo.FindByIdAsync(expenseId, userId.Value);
        if (existing is null)
        {
            return Json(404, new { message = "Expense not found" });
        }

        var expenseType = type?.ToLowerInvariant() == "income" ? ExpenseType.Income : ExpenseType.Expense;
        var date = ParseDate(dateStr);
        var effectiveCategory = category ?? existing.Category;

        var updated = await expenseRepo.UpdateAsync(
            expenseId,
            userId.Value,
            effectiveTitle,
            effectiveCategory,
            amount,
            currency,
            expenseType,
            quantity,
            unit,
            date
        );

        return Json(200, ExpenseToResponse(updated));
    }

    public async Task<ServiceResponse> DeleteExpenseAsync(string? accessToken, Guid expenseId)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var existing = await expenseRepo.FindByIdAsync(expenseId, userId.Value);
        if (existing is null)
        {
            return Json(404, new { message = "Expense not found" });
        }

        await expenseRepo.DeleteAsync(expenseId, userId.Value);
        return new ServiceResponse(204, string.Empty);
    }

    public async Task<ServiceResponse> GetExpenseSummaryAsync(string? accessToken)
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var summaries = await expenseRepo.SummaryByCurrencyAsync(userId.Value);

        var currencyTotals = summaries.ToDictionary(
            s => s.Currency,
            s => FormatAmount(s.ExpenseTotal, s.Currency)
        );

        return Json(200, currencyTotals);
    }

    // ─────────────────────────────────────────────────────────────
    // Reports
    // ─────────────────────────────────────────────────────────────

    public async Task<ServiceResponse> GetPlReportAsync(
        string? accessToken,
        string? from,
        string? to,
        string? currency
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var fromDate = from is not null
            ? DateTimeOffset.Parse(
                from + "T00:00:00Z",
                System.Globalization.CultureInfo.InvariantCulture
            )
            : DateTimeOffset.MinValue;

        var toDate = to is not null
            ? DateTimeOffset.Parse(
                to + "T23:59:59Z",
                System.Globalization.CultureInfo.InvariantCulture
            )
            : DateTimeOffset.MaxValue;

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var expenses = await expenseRepo.ListByUserAndDateRangeAsync(
            userId.Value,
            fromDate,
            toDate,
            currency
        );

        var effectiveCurrency = currency ?? "USD";
        var incomeTotal = expenses.Where(e => e.Type == ExpenseType.Income).Sum(e => e.Amount);
        var expenseTotal = expenses.Where(e => e.Type == ExpenseType.Expense).Sum(e => e.Amount);

        var incomeBreakdown = expenses
            .Where(e => e.Type == ExpenseType.Income)
            .GroupBy(e => e.Category)
            .ToDictionary(
                g => g.Key,
                g => FormatAmount(g.Sum(e => e.Amount), effectiveCurrency)
            );

        var expenseBreakdown = expenses
            .Where(e => e.Type == ExpenseType.Expense)
            .GroupBy(e => e.Category)
            .ToDictionary(
                g => g.Key,
                g => FormatAmount(g.Sum(e => e.Amount), effectiveCurrency)
            );

        return Json(
            200,
            new
            {
                income_total = FormatAmount(incomeTotal, effectiveCurrency),
                expense_total = FormatAmount(expenseTotal, effectiveCurrency),
                net = FormatAmount(incomeTotal - expenseTotal, effectiveCurrency),
                income_breakdown = incomeBreakdown,
                expense_breakdown = expenseBreakdown,
            }
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Attachments
    // ─────────────────────────────────────────────────────────────

    public async Task<ServiceResponse> UploadAttachmentAsync(
        string? accessToken,
        Guid expenseId,
        string filename,
        string contentType,
        byte[] data
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var expense = await expenseRepo.FindByIdAsync(expenseId, userId.Value);
        if (expense is null)
        {
            return Json(403, new { message = "Access denied" });
        }

        if (!AllowedContentTypes.Contains(contentType))
        {
            return Json(415, new { message = "Unsupported media type" });
        }

        if (data.Length > MaxFileSizeBytes)
        {
            return Json(413, new { message = "File size exceeds the maximum allowed limit" });
        }

        var attachmentRepo = sp.GetRequiredService<IAttachmentRepository>();
        var attachment = await attachmentRepo.CreateAsync(
            expenseId,
            filename,
            contentType,
            data.Length,
            data
        );

        return Json(
            201,
            new
            {
                id = attachment.Id,
                expense_id = attachment.ExpenseId,
                filename = attachment.FileName,
                content_type = attachment.ContentType,
                file_size_bytes = attachment.FileSizeBytes,
                url = $"/api/v1/expenses/{expenseId}/attachments/{attachment.Id}/download",
                created_at = attachment.CreatedAt,
            }
        );
    }

    public async Task<ServiceResponse> ListAttachmentsAsync(
        string? accessToken,
        Guid expenseId
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var expense = await expenseRepo.FindByIdAsync(expenseId, userId.Value);
        if (expense is null)
        {
            return Json(403, new { message = "Access denied" });
        }

        var attachmentRepo = sp.GetRequiredService<IAttachmentRepository>();
        var attachments = await attachmentRepo.ListByExpenseAsync(expenseId);

        return Json(
            200,
            new
            {
                attachments = attachments.Select(a => new
                {
                    id = a.Id,
                    expense_id = a.ExpenseId,
                    filename = a.FileName,
                    content_type = a.ContentType,
                    file_size_bytes = a.FileSizeBytes,
                    url = $"/api/v1/expenses/{expenseId}/attachments/{a.Id}/download",
                    created_at = a.CreatedAt,
                }),
            }
        );
    }

    public async Task<ServiceResponse> DeleteAttachmentAsync(
        string? accessToken,
        Guid expenseId,
        Guid attachmentId
    )
    {
        if (accessToken is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;

        var authCheckResult = await CheckAuthAsync(accessToken, sp);
        if (authCheckResult is not null)
        {
            return authCheckResult;
        }

        var userId = ExtractUserId(accessToken, sp);
        if (userId is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var expenseRepo = sp.GetRequiredService<IExpenseRepository>();
        var expense = await expenseRepo.FindByIdAsync(expenseId, userId.Value);
        if (expense is null)
        {
            return Json(403, new { message = "Access denied" });
        }

        var attachmentRepo = sp.GetRequiredService<IAttachmentRepository>();
        var attachment = await attachmentRepo.FindByIdAsync(attachmentId);
        if (attachment is null || attachment.ExpenseId != expenseId)
        {
            return Json(404, new { message = "Attachment not found" });
        }

        await attachmentRepo.DeleteAsync(attachmentId);
        return new ServiceResponse(204, string.Empty);
    }

    // ─────────────────────────────────────────────────────────────
    // Health & Tokens
    // ─────────────────────────────────────────────────────────────

    public ServiceResponse HealthCheck() =>
        Json(200, new { status = "UP" });

    public ServiceResponse GetJwks()
    {
        using var scope = host.CreateScope();
        var sp = scope.ServiceProvider;
        var jwtService = sp.GetRequiredService<IJwtService>();

        // Return the JWKS structure (key details are not sensitive in test context)
        return Json(
            200,
            new
            {
                keys = new[]
                {
                    new
                    {
                        kty = "oct",
                        use = "sig",
                        alg = "HS256",
                        kid = "test-key",
                    },
                },
            }
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Direct database helpers (for test setup — Given steps)
    // ─────────────────────────────────────────────────────────────

    public async Task SetUserStatusDirectAsync(string username, string status)
    {
        using var scope = host.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            return;
        }

        user.Status = Enum.Parse<UserStatus>(status, ignoreCase: true);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task SetUserRoleDirectAsync(string username, string role)
    {
        using var scope = host.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            return;
        }

        user.Role = Enum.Parse<Role>(role, ignoreCase: true);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<Guid> SetUserLockedDirectAsync(string username)
    {
        using var scope = host.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            return Guid.Empty;
        }

        user.Status = UserStatus.Locked;
        user.FailedLoginAttempts = 5;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return user.Id;
    }

    public async Task SetUserFailedAttemptsDirectAsync(string username, int attempts)
    {
        using var scope = host.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            return;
        }

        user.FailedLoginAttempts = attempts;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<Guid> GetUserIdByUsernameAsync(string username)
    {
        using var scope = host.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Id ?? Guid.Empty;
    }

    public async Task<string?> GetUserStatusAsync(string username)
    {
        using var scope = host.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Status.ToString();
    }

    public async Task CleanDatabaseAsync()
    {
        using var scope = host.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Attachments.ExecuteDeleteAsync();
        await db.Expenses.ExecuteDeleteAsync();
        await db.RevokedTokens.ExecuteDeleteAsync();
        await db.Users.ExecuteDeleteAsync();
    }

    // ─────────────────────────────────────────────────────────────
    // Auth check helpers — mirror the middleware / endpoint guards
    // ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns a 401 ServiceResponse if the token is invalid/revoked/expired
    /// or the user is not active. Returns null if the token is valid.
    /// </summary>
    private async Task<ServiceResponse?> CheckAuthAsync(
        string accessToken,
        IServiceProvider sp
    )
    {
        var jwtService = sp.GetRequiredService<IJwtService>();
        var principal = jwtService.DecodeToken(accessToken);
        if (principal is null)
        {
            return Json(401, new { message = "Unauthorized" });
        }

        var sub = principal
            .FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
            ?.Value;

        if (sub is null || !Guid.TryParse(sub, out var userId))
        {
            return Json(401, new { message = "Unauthorized" });
        }

        // Check individual JTI revocation
        var jti = jwtService.GetJti(accessToken);
        if (jti is not null)
        {
            var revokedTokenRepo = sp.GetRequiredService<IRevokedTokenRepository>();
            if (await revokedTokenRepo.IsRevokedAsync(jti))
            {
                return Json(401, new { message = "Unauthorized" });
            }

            // Check per-user revocation (logout-all / deactivate)
            var issuedAt = jwtService.GetIssuedAt(accessToken);
            var revokedBefore = await revokedTokenRepo.GetUserRevokedBeforeAsync(userId);
            if (
                revokedBefore.HasValue
                && issuedAt.HasValue
                && issuedAt.Value <= revokedBefore.Value
            )
            {
                return Json(401, new { message = "Unauthorized" });
            }
        }

        // Check user is still active
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var user = await userRepo.FindByIdAsync(userId);
        if (user is null || user.Status != UserStatus.Active)
        {
            return Json(401, new { message = "Account is deactivated" });
        }

        return null;
    }

    /// <summary>
    /// Returns a 401/403 ServiceResponse if the caller is not an admin.
    /// Returns null if the caller has the ADMIN role.
    /// </summary>
    private async Task<ServiceResponse?> CheckAdminAsync(
        string accessToken,
        IServiceProvider sp
    )
    {
        var authCheck = await CheckAuthAsync(accessToken, sp);
        if (authCheck is not null)
        {
            return authCheck;
        }

        var jwtService = sp.GetRequiredService<IJwtService>();
        var principal = jwtService.DecodeToken(accessToken);
        var roleClaim = principal?.FindFirst("role")?.Value;

        if (!string.Equals(roleClaim, "ADMIN", StringComparison.OrdinalIgnoreCase))
        {
            return Json(403, new { message = "Forbidden" });
        }

        return null;
    }

    private Guid? ExtractUserId(string accessToken, IServiceProvider sp)
    {
        var jwtService = sp.GetRequiredService<IJwtService>();
        var principal = jwtService.DecodeToken(accessToken);
        var sub = principal
            ?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
            ?.Value;
        return sub is not null && Guid.TryParse(sub, out var g) ? g : null;
    }

    // ─────────────────────────────────────────────────────────────
    // Formatting / mapping helpers
    // ─────────────────────────────────────────────────────────────

    private static ServiceResponse Json(int statusCode, object body) =>
        new(
            statusCode,
            JsonSerializer.Serialize(body, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            })
        );

    private static ServiceResponse DomainError400(string message) =>
        Json(400, new { message });

    private static string FormatAmount(decimal amount, string currency) =>
        currency == "IDR"
            ? Math.Round(amount, 0, MidpointRounding.AwayFromZero).ToString("F0")
            : amount.ToString("F2");

    private static DateTimeOffset ParseDate(string? dateStr)
    {
        if (dateStr is null)
        {
            return DateTimeOffset.UtcNow;
        }

        var normalized = dateStr.Length == 10 ? dateStr + "T00:00:00Z" : dateStr;

        return DateTimeOffset.TryParse(
            normalized,
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None,
            out var parsed
        )
            ? parsed
            : DateTimeOffset.UtcNow;
    }

    private static object ExpenseToResponse(Infrastructure.Models.ExpenseModel e) =>
        new
        {
            id = e.Id,
            description = e.Title,
            category = e.Category,
            amount = FormatAmount(e.Amount, e.Currency),
            currency = e.Currency,
            type = e.Type.ToString().ToLowerInvariant(),
            quantity = e.Quantity,
            unit = e.Unit,
            date = e.Date.ToString("yyyy-MM-dd"),
            created_at = e.CreatedAt,
            updated_at = e.UpdatedAt,
        };
}
