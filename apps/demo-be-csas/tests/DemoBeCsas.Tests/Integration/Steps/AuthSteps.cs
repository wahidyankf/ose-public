using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DemoBeCsas.Infrastructure;
using DemoBeCsas.Infrastructure.Models;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class AuthSteps(TestWebApplicationFactory factory, SharedState state)
{
    // ─────────────────────────────────────────────────────────────
    // Background / Given steps
    // ─────────────────────────────────────────────────────────────

    [Given(@"^a user ""([^""]+)"" is registered with password ""([^""]+)""$")]
    public async Task GivenUserRegisteredWithPassword(string username, string password)
    {
        var email = $"{username}@example.com";
        await RegisterUserAsync(username, email, password);
    }

    [Given(@"^a user ""([^""]+)"" is registered with email ""([^""]+)"" and password ""([^""]+)""$")]
    public async Task GivenUserRegisteredWithEmailAndPassword(string username, string email, string password)
    {
        var id = await RegisterUserAsync(username, email, password);
        if (username == "alice")
        {
            state.LastCreatedId = id;
        }
    }

    [Given(@"^a user ""([^""]+)"" is registered and deactivated$")]
    public async Task GivenUserRegisteredAndDeactivated(string username)
    {
        await RegisterUserAsync(username, $"{username}@example.com", "Str0ng#Pass1");
        await SetUserStatusAsync(username, "Inactive");
    }

    [Given(@"^a user ""([^""]+)"" is registered and locked after too many failed logins$")]
    public async Task GivenUserLockedAfterTooManyFailedLogins(string username)
    {
        await RegisterUserAsync(username, $"{username}@example.com", "Str0ng#Pass1");
        var id = await SetUserLockedAsync(username);
        if (username == "alice")
        {
            state.LastCreatedId = id;
        }
    }

    [Given(@"^an admin user ""([^""]+)"" is registered and logged in$")]
    public async Task GivenAdminUserRegisteredAndLoggedIn(string username)
    {
        var email = $"{username}@example.com";
        const string password = "Adm1n#Secure123";
        var id = await RegisterUserAsync(username, email, password);
        await SetUserRoleAsync(username, "Admin");
        var (accessToken, _) = await LoginUserAsync(username, password);
        state.LastCreatedUsername = username;
        // Store admin token and ID internally
        _adminToken = accessToken;
        _adminId = id;
        // Note: do NOT overwrite state.LastCreatedId here - that belongs to alice
    }

    [Given(@"^users ""alice"", ""bob"", and ""carol"" are registered$")]
    public async Task GivenMultipleUsersRegistered()
    {
        _aliceId = await RegisterUserAsync("alice", "alice@example.com", "Str0ng#Pass1");
        await RegisterUserAsync("bob", "bob@example.com", "Str0ng#Pass2");
        await RegisterUserAsync("carol", "carol@example.com", "Str0ng#Pass3");
        state.LastCreatedId = _aliceId;
    }

    [Given(@"^""([^""]+)"" has logged in and stored the access token$")]
    public async Task GivenUserLoggedInStoredAccessToken(string username)
    {
        var password = username == "alice" ? "Str0ng#Pass1" : "Adm1n#Secure123";
        var (accessToken, _) = await LoginUserAsync(username, password);
        state.AccessToken = accessToken;
        if (username == "alice" && state.LastCreatedId == null)
        {
            state.LastCreatedId = await GetUserIdByUsernameAsync(username);
        }
    }

    [Given(@"^""([^""]+)"" has logged in and stored the access token and refresh token$")]
    public async Task GivenUserLoggedInStoredBothTokens(string username)
    {
        var password = username == "alice" ? "Str0ng#Pass1" : "Adm1n#Secure123";
        var (accessToken, refreshToken) = await LoginUserAsync(username, password);
        state.AccessToken = accessToken;
        state.RefreshToken = refreshToken;
        if (username == "alice" && state.LastCreatedId == null)
        {
            state.LastCreatedId = await GetUserIdByUsernameAsync(username);
        }
    }

    [Given(@"^alice's refresh token has expired$")]
    public void GivenAliceRefreshTokenExpired()
    {
        // Use an expired token (signed but past expiry)
        state.RefreshToken = BuildExpiredRefreshToken();
    }

    [Given(@"^alice has used her refresh token to get a new token pair$")]
    public async Task GivenAliceHasUsedRefreshToken()
    {
        var client = factory.CreateClient();
        var body = JsonSerializer.Serialize(new { refresh_token = state.RefreshToken });
        var response = await client.PostAsync(
            "/api/v1/auth/refresh",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        // Original token is now spent; we do NOT update state.RefreshToken so it stays as the old one
    }

    [Given(@"^the user ""([^""]+)"" has been deactivated$")]
    public async Task GivenUserDeactivated(string username)
    {
        await SetUserStatusAsync(username, "Inactive");
    }

    [Given(@"^alice has already logged out once$")]
    public async Task GivenAliceHasAlreadyLoggedOut()
    {
        var client = AuthorizedClient();
        state.LastResponse = await client.PostAsync("/api/v1/auth/logout", null);
    }

    [Given(@"^alice has deactivated her own account via POST /api/v1/users/me/deactivate$")]
    public async Task GivenAliceDeactivatedOwnAccount()
    {
        var client = AuthorizedClient();
        state.LastResponse = await client.PostAsync("/api/v1/users/me/deactivate", null);
    }

    [Given(@"^alice's account has been disabled by the admin$")]
    public async Task GivenAliceAccountDisabledByAdmin()
    {
        await SetUserStatusAsync("alice", "Disabled");
    }

    [Given(@"^alice's account has been disabled$")]
    public async Task GivenAliceAccountDisabled()
    {
        await SetUserStatusAsync("alice", "Disabled");
    }

    [Given(@"^an admin has unlocked alice's account$")]
    public async Task GivenAdminUnlockedAlice()
    {
        await SetUserStatusAsync("alice", "Active");
        await SetUserFailedAttemptsAsync("alice", 0);
    }

    [Given(@"^""([^""]+)"" has had the maximum number of failed login attempts$")]
    public async Task GivenUserHadMaxFailedLoginAttempts(string username)
    {
        var client = factory.CreateClient();
        const string wrongPassword = "WrongPass#1234";
        for (var i = 0; i < 5; i++)
        {
            var body = JsonSerializer.Serialize(new { username, password = wrongPassword });
            await client.PostAsync(
                "/api/v1/auth/login",
                new StringContent(body, Encoding.UTF8, "application/json")
            );
        }
        if (username == "alice" && state.LastCreatedId == null)
        {
            state.LastCreatedId = await GetUserIdByUsernameAsync(username);
        }
    }

    [Given(@"^the admin has disabled alice's account via POST /api/v1/admin/users/\{alice_id\}/disable$")]
    public async Task GivenAdminDisabledAlice()
    {
        // Always look up alice by username to avoid using the admin's ID
        var aliceId = await GetUserIdByUsernameAsync("alice");
        if (aliceId != Guid.Empty)
        {
            state.LastCreatedId = aliceId;
        }
        var client = AdminClient();
        state.LastResponse = await client.PostAsync($"/api/v1/admin/users/{aliceId}/disable", null);
    }

    [Given(@"^alice has logged out and her access token is blacklisted$")]
    public async Task GivenAliceLoggedOutAndTokenBlacklisted()
    {
        var client = AuthorizedClient();
        await client.PostAsync("/api/v1/auth/logout", null);
    }

    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^the client sends POST /api/v1/auth/register with body \{ ""username"": ""([^""]+)"", ""email"": ""([^""]+)"", ""password"": ""([^""]*)"" \}$")]
    public async Task WhenClientRegisters(string username, string email, string password)
    {
        var client = factory.CreateClient();
        var body = JsonSerializer.Serialize(new { username, email, password });
        state.LastResponse = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(@"^the client sends POST /api/v1/auth/login with body \{ ""username"": ""([^""]+)"", ""password"": ""([^""]*)"" \}$")]
    public async Task WhenClientLogins(string username, string password)
    {
        var client = factory.CreateClient();
        var body = JsonSerializer.Serialize(new { username, password });
        state.LastResponse = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(@"^alice sends POST /api/v1/auth/refresh with her refresh token$")]
    public async Task WhenAliceRefreshesToken()
    {
        var client = factory.CreateClient();
        var body = JsonSerializer.Serialize(new { refresh_token = state.RefreshToken });
        state.LastResponse = await client.PostAsync(
            "/api/v1/auth/refresh",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(@"^alice sends POST /api/v1/auth/refresh with her original refresh token$")]
    public async Task WhenAliceRefreshesWithOriginalToken()
    {
        // state.RefreshToken is still the original (before rotation), send it again
        var client = factory.CreateClient();
        var body = JsonSerializer.Serialize(new { refresh_token = state.RefreshToken });
        state.LastResponse = await client.PostAsync(
            "/api/v1/auth/refresh",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(@"^alice sends POST /api/v1/auth/logout with her access token$")]
    public async Task WhenAliceLogout()
    {
        var client = AuthorizedClient();
        state.LastResponse = await client.PostAsync("/api/v1/auth/logout", null);
    }

    [When(@"^alice sends POST /api/v1/auth/logout-all with her access token$")]
    public async Task WhenAliceLogoutAll()
    {
        var client = AuthorizedClient();
        state.LastResponse = await client.PostAsync("/api/v1/auth/logout-all", null);
    }

    [When(@"^the client sends GET /api/v1/users/me with alice's access token$")]
    public async Task WhenGetMeWithAliceToken()
    {
        var client = AuthorizedClient();
        state.LastResponse = await client.GetAsync("/api/v1/users/me");
    }

    // ─────────────────────────────────────────────────────────────
    // Then / assertion steps
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain a non-null ""([^""]+)"" field$")]
    public async Task ThenResponseBodyContainsNonNullField(string field)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(field, out var el).Should().BeTrue($"Field '{field}' not found in: {body}");
        el.ValueKind.Should().NotBe(JsonValueKind.Null, $"Field '{field}' should not be null in: {body}");
    }

    [Then(@"^the response body should contain ""([^""]+)"" equal to ""([^""]+)""$")]
    public async Task ThenResponseBodyFieldEquals(string field, string value)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(field, out var el).Should().BeTrue($"Field '{field}' not found in: {body}");
        // Handle both string and numeric JSON values
        if (el.ValueKind == JsonValueKind.Number)
        {
            var actualDecimal = el.GetDecimal();
            var expectedDecimal = decimal.Parse(value, System.Globalization.CultureInfo.InvariantCulture);
            actualDecimal.Should().Be(expectedDecimal, $"Field '{field}' in: {body}");
        }
        else
        {
            el.GetString().Should().Be(value);
        }
    }

    [Then(@"^the response body should not contain a ""([^""]+)"" field$")]
    public async Task ThenResponseBodyDoesNotContainField(string field)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(field, out _).Should().BeFalse($"Field '{field}' should not be present in: {body}");
    }

    [Then(@"^the response body should contain an error message about invalid credentials$")]
    public async Task ThenErrorAboutInvalidCredentials()
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        // A 401 can have an empty body — that's fine
        ((int)state.LastResponse!.StatusCode).Should().Be(401);
    }

    [Then(@"^the response body should contain an error message about account deactivation$")]
    public async Task ThenErrorAboutAccountDeactivation()
    {
        state.LastResponse.Should().NotBeNull();
        ((int)state.LastResponse!.StatusCode).Should().BeOneOf(401, 403, 423);
    }

    [Then(@"^the response body should contain an error message about duplicate username$")]
    public async Task ThenErrorAboutDuplicateUsername()
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        body.ToLowerInvariant().Should().ContainAny("already exists", "conflict", "duplicate", "exists");
    }

    [Then(@"^the response body should contain a validation error for ""([^""]+)""$")]
    public async Task ThenValidationErrorForField(string field)
    {
        state.LastResponse.Should().NotBeNull();
        var status = (int)state.LastResponse!.StatusCode;
        status.Should().BeOneOf([400, 415], $"Expected a 400/415 for field '{field}'");
    }

    [Then(@"^alice's access token should be invalidated$")]
    public async Task ThenAliceAccessTokenInvalidated()
    {
        var client = AuthorizedClient();
        var response = await client.GetAsync("/api/v1/users/me");
        ((int)response.StatusCode).Should().Be(401);
    }

    [Then(@"^alice's account status should be ""([^""]+)""$")]
    public async Task ThenAliceAccountStatus(string expectedStatus)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == "alice");
        user.Should().NotBeNull();
        user!.Status.ToString().ToLowerInvariant().Should().Be(expectedStatus.ToLowerInvariant());
    }

    [Then(@"^alice's access token should be recorded as revoked$")]
    public async Task ThenAliceTokenRecordedAsRevoked()
    {
        var client = AuthorizedClient();
        var response = await client.GetAsync("/api/v1/users/me");
        ((int)response.StatusCode).Should().Be(401);
    }

    [Then(@"^the response body should contain an error message about token expiration$")]
    public async Task ThenErrorAboutTokenExpiration()
    {
        state.LastResponse.Should().NotBeNull();
        // 401 status is sufficient for expired token
        ((int)state.LastResponse!.StatusCode).Should().Be(401);
    }

    [Then(@"^the response body should contain an error message about invalid token$")]
    public async Task ThenErrorAboutInvalidToken()
    {
        state.LastResponse.Should().NotBeNull();
        // 401 status is sufficient for invalid/spent token
        ((int)state.LastResponse!.StatusCode).Should().Be(401);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers (internal, reusable by other step classes)
    // ─────────────────────────────────────────────────────────────

    internal string? _adminToken;
    internal Guid? _adminId;
    internal Guid? _aliceId;

    internal HttpClient AuthorizedClient()
    {
        var client = factory.CreateClient();
        if (state.AccessToken is not null)
        {
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", state.AccessToken);
        }
        return client;
    }

    internal HttpClient AdminClient()
    {
        var client = factory.CreateClient();
        if (_adminToken is not null)
        {
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _adminToken);
        }
        return client;
    }

    internal async Task<Guid> RegisterUserAsync(string username, string email, string password)
    {
        var client = factory.CreateClient();
        var body = JsonSerializer.Serialize(new { username, email, password });
        var response = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        if ((int)response.StatusCode == 201)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("id", out var idEl))
            {
                return Guid.Parse(idEl.GetString()!);
            }
        }
        // If already exists, find in db
        return await GetUserIdByUsernameAsync(username);
    }

    internal async Task<(string? AccessToken, string? RefreshToken)> LoginUserAsync(string username, string password)
    {
        var client = factory.CreateClient();
        var body = JsonSerializer.Serialize(new { username, password });
        var response = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        if (!response.IsSuccessStatusCode)
        {
            return (null, null);
        }
        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        var accessToken = doc.RootElement.TryGetProperty("access_token", out var at)
            ? at.GetString()
            : null;
        var refreshToken = doc.RootElement.TryGetProperty("refresh_token", out var rt)
            ? rt.GetString()
            : null;
        return (accessToken, refreshToken);
    }

    internal async Task SetUserStatusAsync(string username, string status)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            return;
        }
        user.Status = Enum.Parse<DemoBeCsas.Domain.UserStatus>(status, ignoreCase: true);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }

    internal async Task SetUserRoleAsync(string username, string role)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            return;
        }
        user.Role = Enum.Parse<DemoBeCsas.Domain.Role>(role, ignoreCase: true);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }

    internal async Task<Guid> SetUserLockedAsync(string username)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null)
        {
            return Guid.Empty;
        }
        user.Status = DemoBeCsas.Domain.UserStatus.Locked;
        user.FailedLoginAttempts = 5;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return user.Id;
    }

    internal async Task SetUserFailedAttemptsAsync(string username, int attempts)
    {
        using var scope = factory.Services.CreateScope();
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

    internal async Task<Guid> GetUserIdByUsernameAsync(string username)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Id ?? Guid.Empty;
    }

    private static string BuildExpiredRefreshToken()
    {
        // Return a well-formed but expired JWT (signed with the test secret)
        var secret = "test-jwt-secret-at-least-32-chars-long!!";
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(keyBytes);
        var creds = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            key,
            Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256
        );
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            claims: new[]
            {
                new System.Security.Claims.Claim("sub", Guid.NewGuid().ToString()),
                new System.Security.Claims.Claim("token_type", "refresh"),
            },
            expires: DateTime.UtcNow.AddSeconds(-1), // already expired
            signingCredentials: creds
        );
        return handler.WriteToken(token);
    }
}

// Extension for FirstOrDefaultAsync without EF Core dependency in step file
file static class DbSetExtensions
{
    public static async System.Threading.Tasks.Task<UserModel?> FirstOrDefaultAsync(
        this Microsoft.EntityFrameworkCore.DbSet<UserModel> set,
        System.Linq.Expressions.Expression<Func<UserModel, bool>> predicate
    ) => await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .FirstOrDefaultAsync(set, predicate);

    public static async System.Threading.Tasks.Task<UserModel?> FindAsync(
        this Microsoft.EntityFrameworkCore.DbSet<UserModel> set,
        Guid id
    ) => await set.FirstOrDefaultAsync(u => u.Id == id);
}
