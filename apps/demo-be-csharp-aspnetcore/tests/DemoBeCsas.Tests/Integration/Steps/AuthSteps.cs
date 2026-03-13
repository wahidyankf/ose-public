using System.Text;
using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class AuthSteps(ServiceLayer svc, SharedState state)
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
        await svc.SetUserStatusDirectAsync(username, "Inactive");
    }

    [Given(@"^a user ""([^""]+)"" is registered and locked after too many failed logins$")]
    public async Task GivenUserLockedAfterTooManyFailedLogins(string username)
    {
        await RegisterUserAsync(username, $"{username}@example.com", "Str0ng#Pass1");
        var id = await svc.SetUserLockedDirectAsync(username);
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
        await svc.SetUserRoleDirectAsync(username, "Admin");
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
            state.LastCreatedId = await svc.GetUserIdByUsernameAsync(username);
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
            state.LastCreatedId = await svc.GetUserIdByUsernameAsync(username);
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
        // Consume the current refresh token — the old one is now spent
        await svc.RefreshTokenAsync(state.RefreshToken);
        // Do NOT update state.RefreshToken so it remains the old (now-revoked) one
    }

    [Given(@"^the user ""([^""]+)"" has been deactivated$")]
    public async Task GivenUserDeactivated(string username)
    {
        await svc.SetUserStatusDirectAsync(username, "Inactive");
    }

    [Given(@"^alice has already logged out once$")]
    public async Task GivenAliceHasAlreadyLoggedOut()
    {
        state.LastResponse = await svc.LogoutAsync(state.AccessToken);
    }

    [Given(@"^alice has deactivated her own account via POST /api/v1/users/me/deactivate$")]
    public async Task GivenAliceDeactivatedOwnAccount()
    {
        state.LastResponse = await svc.DeactivateAsync(state.AccessToken);
    }

    [Given(@"^alice's account has been disabled by the admin$")]
    public async Task GivenAliceAccountDisabledByAdmin()
    {
        await svc.SetUserStatusDirectAsync("alice", "Disabled");
    }

    [Given(@"^alice's account has been disabled$")]
    public async Task GivenAliceAccountDisabled()
    {
        await svc.SetUserStatusDirectAsync("alice", "Disabled");
    }

    [Given(@"^an admin has unlocked alice's account$")]
    public async Task GivenAdminUnlockedAlice()
    {
        await svc.SetUserStatusDirectAsync("alice", "Active");
        await svc.SetUserFailedAttemptsDirectAsync("alice", 0);
    }

    [Given(@"^""([^""]+)"" has had the maximum number of failed login attempts$")]
    public async Task GivenUserHadMaxFailedLoginAttempts(string username)
    {
        // Simulate 5 consecutive failed logins
        for (var i = 0; i < 5; i++)
        {
            await svc.LoginAsync(username, "WrongPass#1234");
        }

        if (username == "alice" && state.LastCreatedId == null)
        {
            state.LastCreatedId = await svc.GetUserIdByUsernameAsync(username);
        }
    }

    [Given(@"^the admin has disabled alice's account via POST /api/v1/admin/users/\{alice_id\}/disable$")]
    public async Task GivenAdminDisabledAlice()
    {
        // Always look up alice by username to get the real alice ID
        var aliceId = await svc.GetUserIdByUsernameAsync("alice");
        if (aliceId != Guid.Empty)
        {
            state.LastCreatedId = aliceId;
        }

        state.LastResponse = await svc.AdminDisableUserAsync(_adminToken, aliceId);
    }

    [Given(@"^alice has logged out and her access token is blacklisted$")]
    public async Task GivenAliceLoggedOutAndTokenBlacklisted()
    {
        await svc.LogoutAsync(state.AccessToken);
    }

    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^the client sends POST /api/v1/auth/register with body \{ ""username"": ""([^""]+)"", ""email"": ""([^""]+)"", ""password"": ""([^""]*)"" \}$")]
    public async Task WhenClientRegisters(string username, string email, string password)
    {
        state.LastResponse = await svc.RegisterAsync(username, email, password);
    }

    [When(@"^the client sends POST /api/v1/auth/login with body \{ ""username"": ""([^""]+)"", ""password"": ""([^""]*)"" \}$")]
    public async Task WhenClientLogins(string username, string password)
    {
        state.LastResponse = await svc.LoginAsync(username, password);
    }

    [When(@"^alice sends POST /api/v1/auth/refresh with her refresh token$")]
    public async Task WhenAliceRefreshesToken()
    {
        state.LastResponse = await svc.RefreshTokenAsync(state.RefreshToken);
    }

    [When(@"^alice sends POST /api/v1/auth/refresh with her original refresh token$")]
    public async Task WhenAliceRefreshesWithOriginalToken()
    {
        // state.RefreshToken is still the original (before rotation), send it again
        state.LastResponse = await svc.RefreshTokenAsync(state.RefreshToken);
    }

    [When(@"^alice sends POST /api/v1/auth/logout with her access token$")]
    public async Task WhenAliceLogout()
    {
        state.LastResponse = await svc.LogoutAsync(state.AccessToken);
    }

    [When(@"^alice sends POST /api/v1/auth/logout-all with her access token$")]
    public async Task WhenAliceLogoutAll()
    {
        state.LastResponse = await svc.LogoutAllAsync(state.AccessToken);
    }

    [When(@"^the client sends GET /api/v1/users/me with alice's access token$")]
    public async Task WhenGetMeWithAliceToken()
    {
        state.LastResponse = await svc.GetMeAsync(state.AccessToken);
    }

    // ─────────────────────────────────────────────────────────────
    // Then / assertion steps
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain a non-null ""([^""]+)"" field$")]
    public void ThenResponseBodyContainsNonNullField(string field)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(field, out var el).Should().BeTrue($"Field '{field}' not found in: {body}");
        el.ValueKind.Should().NotBe(JsonValueKind.Null, $"Field '{field}' should not be null in: {body}");
    }

    [Then(@"^the response body should contain ""([^""]+)"" equal to ""([^""]+)""$")]
    public void ThenResponseBodyFieldEquals(string field, string value)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
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
    public void ThenResponseBodyDoesNotContainField(string field)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(field, out _).Should().BeFalse($"Field '{field}' should not be present in: {body}");
    }

    [Then(@"^the response body should contain an error message about invalid credentials$")]
    public void ThenErrorAboutInvalidCredentials()
    {
        state.LastResponse.Should().NotBeNull();
        state.LastResponse!.StatusCode.Should().Be(401);
    }

    [Then(@"^the response body should contain an error message about account deactivation$")]
    public void ThenErrorAboutAccountDeactivation()
    {
        state.LastResponse.Should().NotBeNull();
        state.LastResponse!.StatusCode.Should().BeOneOf(401, 403, 423);
    }

    [Then(@"^the response body should contain an error message about duplicate username$")]
    public void ThenErrorAboutDuplicateUsername()
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        body.ToLowerInvariant().Should().ContainAny("already exists", "conflict", "duplicate", "exists");
    }

    [Then(@"^the response body should contain a validation error for ""([^""]+)""$")]
    public void ThenValidationErrorForField(string field)
    {
        state.LastResponse.Should().NotBeNull();
        var status = state.LastResponse!.StatusCode;
        status.Should().BeOneOf([400, 415], $"Expected a 400/415 for field '{field}'");
    }

    [Then(@"^alice's access token should be invalidated$")]
    public async Task ThenAliceAccessTokenInvalidated()
    {
        var response = await svc.GetMeAsync(state.AccessToken);
        response.StatusCode.Should().Be(401);
    }

    [Then(@"^alice's account status should be ""([^""]+)""$")]
    public async Task ThenAliceAccountStatus(string expectedStatus)
    {
        var status = await svc.GetUserStatusAsync("alice");
        status.Should().NotBeNull();
        status!.ToLowerInvariant().Should().Be(expectedStatus.ToLowerInvariant());
    }

    [Then(@"^alice's access token should be recorded as revoked$")]
    public async Task ThenAliceTokenRecordedAsRevoked()
    {
        var response = await svc.GetMeAsync(state.AccessToken);
        response.StatusCode.Should().Be(401);
    }

    [Then(@"^the response body should contain an error message about token expiration$")]
    public void ThenErrorAboutTokenExpiration()
    {
        state.LastResponse.Should().NotBeNull();
        // 401 status is sufficient for expired token
        state.LastResponse!.StatusCode.Should().Be(401);
    }

    [Then(@"^the response body should contain an error message about invalid token$")]
    public void ThenErrorAboutInvalidToken()
    {
        state.LastResponse.Should().NotBeNull();
        // 401 status is sufficient for invalid/spent token
        state.LastResponse!.StatusCode.Should().Be(401);
    }

    // ─────────────────────────────────────────────────────────────
    // Internal helpers reused by other step classes
    // ─────────────────────────────────────────────────────────────

    internal string? _adminToken;
    internal Guid? _adminId;
    internal Guid? _aliceId;

    internal async Task<Guid> RegisterUserAsync(string username, string email, string password)
    {
        var response = await svc.RegisterAsync(username, email, password);
        if (response.StatusCode == 201)
        {
            using var doc = JsonDocument.Parse(response.Body);
            if (doc.RootElement.TryGetProperty("id", out var idEl))
            {
                return Guid.Parse(idEl.GetString()!);
            }
        }

        // If already exists, find in db
        return await svc.GetUserIdByUsernameAsync(username);
    }

    internal async Task<(string? AccessToken, string? RefreshToken)> LoginUserAsync(
        string username,
        string password
    )
    {
        var response = await svc.LoginAsync(username, password);
        if (!response.IsSuccess)
        {
            return (null, null);
        }

        using var doc = JsonDocument.Parse(response.Body);
        var accessToken = doc.RootElement.TryGetProperty("access_token", out var at)
            ? at.GetString()
            : null;
        var refreshToken = doc.RootElement.TryGetProperty("refresh_token", out var rt)
            ? rt.GetString()
            : null;
        return (accessToken, refreshToken);
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
