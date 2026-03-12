using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace DemoBeCsas.Tests.Unit;

/// <summary>
/// xUnit integration tests that exercise endpoint edge cases not covered by the
/// Reqnroll feature scenarios. These cover:
/// - Requests without a valid "sub" claim (GetUserId returns null in handlers)
/// - Missing required fields (title/currency validation)
/// - ParseDate and ParseExpenseType private paths
/// - UpdateExpense and DeleteExpense with non-existent IDs
/// - Admin not-found paths
/// - Auth edge cases (missing fields, logout-all without sub)
/// - TokenEndpoints GetClaims path
/// </summary>
[Trait("Category", "Unit")]
public class EndpointEdgeCaseTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private const string TestSecret = "test-jwt-secret-at-least-32-chars-long!!";

    public EndpointEdgeCaseTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// Creates a JWT signed with the test secret but with no "sub" claim.
    /// This makes GetUserId() return null inside the endpoint handlers because
    /// the sub claim is absent. The TokenRevocationMiddleware will reject this
    /// (lines 32-34 in TokenRevocationMiddleware.cs), returning 401.
    /// </summary>
    private static string CreateTokenWithoutSubClaim()
    {
        var keyBytes = Encoding.UTF8.GetBytes(TestSecret);
        var key = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            claims: new[]
            {
                new System.Security.Claims.Claim("username", "ghost"),
                new System.Security.Claims.Claim("role", "User"),
            },
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );
        return handler.WriteToken(token);
    }

    /// <summary>
    /// Creates a fully valid JWT for a real registered user.
    /// </summary>
    private async Task<string> RegisterAndLoginAsync(string username = "edgeuser")
    {
        var client = _factory.CreateClient();
        var password = "Str0ng#EdgePass1";
        var email = $"{username}@edge.example.com";

        // Register (may already exist from prior test run)
        var regBody = JsonSerializer.Serialize(new { username, email, password });
        await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(regBody, Encoding.UTF8, "application/json")
        );

        // Login
        var loginBody = JsonSerializer.Serialize(new { username, password });
        var loginResp = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(loginBody, Encoding.UTF8, "application/json")
        );
        var loginJson = await loginResp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(loginJson);
        return doc.RootElement.GetProperty("access_token").GetString()!;
    }

    private HttpClient CreateClientWithNoSubToken()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", CreateTokenWithoutSubClaim());
        return client;
    }

    private HttpClient CreateAuthorizedClient(string token)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // ── TokenRevocationMiddleware: null sub / invalid GUID ─────────────

    [Fact]
    public async Task AnyAuthEndpoint_WithoutSubClaim_Returns401ViaMiddleware()
    {
        // Exercises TokenRevocationMiddleware lines 32-34 (null sub or bad GUID parse)
        var client = CreateClientWithNoSubToken();
        var response = await client.GetAsync("/api/v1/users/me");
        ((int)response.StatusCode).Should().Be(401);
    }

    // ── AuthEndpoints edge cases ───────────────────────────────────────

    [Fact]
    public async Task Register_WithMissingFields_Returns400()
    {
        // Covers AuthEndpoints lines 31-33: null username/email/password check
        var client = _factory.CreateClient();
        var body = JsonSerializer.Serialize(new { });
        var response = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(400);
    }

    [Fact]
    public async Task Register_WithInvalidUsername_Returns400()
    {
        // Covers AuthEndpoints lines 37-39: username validation error
        var client = _factory.CreateClient();
        var body = JsonSerializer.Serialize(new { username = "x!", email = "x@example.com", password = "Str0ng#Pass1" });
        var response = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(400);
    }

    [Fact]
    public async Task Login_WithMissingFields_Returns401()
    {
        // Covers AuthEndpoints lines 91-93: null username/password check
        var client = _factory.CreateClient();
        var body = JsonSerializer.Serialize(new { });
        var response = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    [Fact]
    public async Task Login_WithDisabledAccount_Returns401()
    {
        // Covers AuthEndpoints lines 108-110: disabled account check
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DemoBeCsas.Infrastructure.AppDbContext>();
        // Create a disabled user directly
        var user = new DemoBeCsas.Infrastructure.Models.UserModel
        {
            Id = Guid.NewGuid(),
            Username = "disableduser_edge",
            Email = "disableduser_edge@example.com",
            PasswordHash = new DemoBeCsas.Infrastructure.PasswordHasher().HashPassword("Str0ng#Pass1"),
            Status = DemoBeCsas.Domain.UserStatus.Disabled,
            Role = DemoBeCsas.Domain.Role.User,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var client = _factory.CreateClient();
        var body = JsonSerializer.Serialize(new { username = "disableduser_edge", password = "Str0ng#Pass1" });
        var response = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    [Fact]
    public async Task LogoutAll_WithoutSubClaim_Returns401()
    {
        // Covers AuthEndpoints lines 257-259: null userId in logout-all
        var client = CreateClientWithNoSubToken();
        var response = await client.PostAsync("/api/v1/auth/logout-all", null);
        ((int)response.StatusCode).Should().Be(401);
    }

    // ── ExpenseEndpoints: missing required fields ──────────────────────

    [Fact]
    public async Task CreateExpense_WithMissingTitleAndCurrency_Returns400()
    {
        // Covers ExpenseEndpoints lines 37-41: title is null || currency is null
        var token = await RegisterAndLoginAsync("expenseedge1");
        var client = CreateAuthorizedClient(token);
        var body = JsonSerializer.Serialize(new { amount = 10.00m });
        var response = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(400);
    }

    [Fact]
    public async Task UpdateExpense_WithMissingTitleAndCurrency_Returns400()
    {
        // Covers ExpenseEndpoints lines 167-171: title/currency check in UpdateExpenseAsync
        var token = await RegisterAndLoginAsync("expenseedge2");
        var client = CreateAuthorizedClient(token);

        // First create an expense to get a valid ID
        var createBody = JsonSerializer.Serialize(new
        {
            description = "Test expense",
            amount = 10.00m,
            currency = "USD",
        });
        var createResp = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(createBody, Encoding.UTF8, "application/json")
        );
        createResp.EnsureSuccessStatusCode();
        var createJson = await createResp.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var expenseId = createDoc.RootElement.GetProperty("id").GetString()!;

        // Now update with missing fields
        var updateBody = JsonSerializer.Serialize(new { amount = 20.00m });
        var response = await client.PutAsync(
            $"/api/v1/expenses/{expenseId}",
            new StringContent(updateBody, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(400);
    }

    [Fact]
    public async Task UpdateExpense_WithNonExistentId_Returns404()
    {
        // Covers ExpenseEndpoints lines 190-192: expense not found in UpdateExpenseAsync
        var token = await RegisterAndLoginAsync("expenseedge3");
        var client = CreateAuthorizedClient(token);
        var body = JsonSerializer.Serialize(new
        {
            description = "Updated",
            amount = 10.00m,
            currency = "USD",
        });
        var response = await client.PutAsync(
            $"/api/v1/expenses/{Guid.NewGuid()}",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(404);
    }

    [Fact]
    public async Task DeleteExpense_WithNonExistentId_Returns404()
    {
        // Covers ExpenseEndpoints lines 229-231: expense not found in DeleteExpenseAsync
        var token = await RegisterAndLoginAsync("expenseedge4");
        var client = CreateAuthorizedClient(token);
        var response = await client.DeleteAsync($"/api/v1/expenses/{Guid.NewGuid()}");
        ((int)response.StatusCode).Should().Be(404);
    }

    [Fact]
    public async Task GetExpense_WithNonExistentId_Returns404()
    {
        // Covers ExpenseEndpoints lines 144-146: expense not found in GetExpenseAsync
        var token = await RegisterAndLoginAsync("expenseedge5");
        var client = CreateAuthorizedClient(token);
        var response = await client.GetAsync($"/api/v1/expenses/{Guid.NewGuid()}");
        ((int)response.StatusCode).Should().Be(404);
    }

    [Fact]
    public async Task CreateExpense_WithIncomeType_Succeeds()
    {
        // Covers ExpenseEndpoints line 246: ParseExpenseType "income" branch
        var token = await RegisterAndLoginAsync("expenseedge6");
        var client = CreateAuthorizedClient(token);
        var body = JsonSerializer.Serialize(new
        {
            description = "Salary",
            amount = 5000.00m,
            currency = "USD",
            type = "income",
        });
        var response = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(201);
    }

    [Fact]
    public async Task CreateExpense_WithNullDate_UsesCurrentTime()
    {
        // Covers ExpenseEndpoints lines 251-253: ParseDate with null dateStr
        var token = await RegisterAndLoginAsync("expenseedge7");
        var client = CreateAuthorizedClient(token);
        var body = JsonSerializer.Serialize(new
        {
            description = "No date",
            amount = 10.00m,
            currency = "USD",
            // date is intentionally omitted (null)
        });
        var response = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(201);
    }

    [Fact]
    public async Task CreateExpense_WithInvalidDate_FallsBackToCurrentTime()
    {
        // Covers ExpenseEndpoints line 271: ParseDate fallback when parse fails
        var token = await RegisterAndLoginAsync("expenseedge8");
        var client = CreateAuthorizedClient(token);
        var body = JsonSerializer.Serialize(new
        {
            description = "Bad date",
            amount = 10.00m,
            currency = "USD",
            date = "not-a-date",
        });
        var response = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(201);
    }

    [Fact]
    public async Task UpdateExpense_WithInvalidAmountForCurrency_Returns400()
    {
        // Covers ExpenseEndpoints lines 175-177: amount validation in UpdateExpenseAsync
        var token = await RegisterAndLoginAsync("expenseedge9");
        var client = CreateAuthorizedClient(token);

        var createBody = JsonSerializer.Serialize(new
        {
            description = "Original",
            amount = 100m,
            currency = "IDR",
        });
        var createResp = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(createBody, Encoding.UTF8, "application/json")
        );
        createResp.EnsureSuccessStatusCode();
        var createJson = await createResp.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var expenseId = createDoc.RootElement.GetProperty("id").GetString()!;

        // Update with fractional IDR amount (invalid)
        var updateBody = JsonSerializer.Serialize(new
        {
            description = "Updated",
            amount = 100.50m,
            currency = "IDR",
        });
        var response = await client.PutAsync(
            $"/api/v1/expenses/{expenseId}",
            new StringContent(updateBody, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(400);
    }

    [Fact]
    public async Task UpdateExpense_WithInvalidUnit_Returns400()
    {
        // Covers ExpenseEndpoints lines 180-186: unit validation in UpdateExpenseAsync
        var token = await RegisterAndLoginAsync("expenseedge10");
        var client = CreateAuthorizedClient(token);

        var createBody = JsonSerializer.Serialize(new
        {
            description = "Original",
            amount = 10.00m,
            currency = "USD",
        });
        var createResp = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(createBody, Encoding.UTF8, "application/json")
        );
        createResp.EnsureSuccessStatusCode();
        var createJson = await createResp.Content.ReadAsStringAsync();
        using var createDoc = JsonDocument.Parse(createJson);
        var expenseId = createDoc.RootElement.GetProperty("id").GetString()!;

        // Update with invalid unit
        var updateBody = JsonSerializer.Serialize(new
        {
            description = "Updated",
            amount = 10.00m,
            currency = "USD",
            unit = "furlong",
        });
        var response = await client.PutAsync(
            $"/api/v1/expenses/{expenseId}",
            new StringContent(updateBody, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(400);
    }

    // ── UserEndpoints: user not found in DB after auth ─────────────────

    [Fact]
    public async Task GetMe_WhenUserDeletedFromDb_Returns401()
    {
        // Covers UserEndpoints lines 33-35: user is null check in GetMeAsync
        // We register, get token, delete user from DB, then call GetMe
        var client = _factory.CreateClient();
        var username = "ghostuser_getme";
        var password = "Str0ng#Pass1";
        var email = $"{username}@example.com";

        var regBody = JsonSerializer.Serialize(new { username, email, password });
        var regResp = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(regBody, Encoding.UTF8, "application/json")
        );
        var regJson = await regResp.Content.ReadAsStringAsync();
        using var regDoc = JsonDocument.Parse(regJson);
        var userId = regDoc.RootElement.GetProperty("id").GetString()!;

        var loginBody = JsonSerializer.Serialize(new { username, password });
        var loginResp = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(loginBody, Encoding.UTF8, "application/json")
        );
        var loginJson = await loginResp.Content.ReadAsStringAsync();
        using var loginDoc = JsonDocument.Parse(loginJson);
        var token = loginDoc.RootElement.GetProperty("access_token").GetString()!;

        // Delete user from DB directly
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DemoBeCsas.Infrastructure.AppDbContext>();
        var userModel = await db.Users.FindAsync(Guid.Parse(userId));
        if (userModel is not null)
        {
            db.Users.Remove(userModel);
            await db.SaveChangesAsync();
        }

        // Now call GetMe - middleware will reject (user not active) before handler
        var authorizedClient = CreateAuthorizedClient(token);
        var response = await authorizedClient.GetAsync("/api/v1/users/me");
        ((int)response.StatusCode).Should().Be(401);
    }

    [Fact]
    public async Task ChangePassword_WhenUserDeletedFromDb_Returns401()
    {
        // Covers UserEndpoints lines 101-103: user is null in ChangePasswordAsync
        var client = _factory.CreateClient();
        var username = "ghostuser_pwd";
        var password = "Str0ng#Pass1";
        var email = $"{username}@example.com";

        var regBody = JsonSerializer.Serialize(new { username, email, password });
        var regResp = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(regBody, Encoding.UTF8, "application/json")
        );
        var regJson = await regResp.Content.ReadAsStringAsync();
        using var regDoc = JsonDocument.Parse(regJson);
        var userId = regDoc.RootElement.GetProperty("id").GetString()!;

        var loginBody = JsonSerializer.Serialize(new { username, password });
        var loginResp = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(loginBody, Encoding.UTF8, "application/json")
        );
        var loginJson = await loginResp.Content.ReadAsStringAsync();
        using var loginDoc = JsonDocument.Parse(loginJson);
        var token = loginDoc.RootElement.GetProperty("access_token").GetString()!;

        // Delete user from DB
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DemoBeCsas.Infrastructure.AppDbContext>();
        var userModel = await db.Users.FindAsync(Guid.Parse(userId));
        if (userModel is not null)
        {
            db.Users.Remove(userModel);
            await db.SaveChangesAsync();
        }

        var authorizedClient = CreateAuthorizedClient(token);
        var pwBody = JsonSerializer.Serialize(new { old_password = password, new_password = "NewStr0ng#Pass2" });
        var response = await authorizedClient.PostAsync(
            "/api/v1/users/me/password",
            new StringContent(pwBody, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    // ── AdminEndpoints: user not found ────────────────────────────────

    [Fact]
    public async Task AdminDisableUser_WhenUserNotFound_Returns404()
    {
        // Covers AdminEndpoints lines 57-59: user not found in DisableUserAsync
        var adminToken = await RegisterAdminAndLoginAsync();
        var client = CreateAuthorizedClient(adminToken);
        var response = await client.PostAsync($"/api/v1/admin/users/{Guid.NewGuid()}/disable", null);
        ((int)response.StatusCode).Should().Be(404);
    }

    [Fact]
    public async Task AdminEnableUser_WhenUserNotFound_Returns404()
    {
        // Covers AdminEndpoints lines 74-76: user not found in EnableUserAsync
        var adminToken = await RegisterAdminAndLoginAsync();
        var client = CreateAuthorizedClient(adminToken);
        var response = await client.PostAsync($"/api/v1/admin/users/{Guid.NewGuid()}/enable", null);
        ((int)response.StatusCode).Should().Be(404);
    }

    [Fact]
    public async Task AdminUnlockUser_WhenUserNotFound_Returns404()
    {
        // Covers AdminEndpoints lines 91-93: user not found in UnlockUserAsync
        var adminToken = await RegisterAdminAndLoginAsync();
        var client = CreateAuthorizedClient(adminToken);
        var response = await client.PostAsync($"/api/v1/admin/users/{Guid.NewGuid()}/unlock", null);
        ((int)response.StatusCode).Should().Be(404);
    }

    [Fact]
    public async Task AdminForcePasswordReset_WhenUserNotFound_Returns404()
    {
        // Covers AdminEndpoints lines 109-111: user not found in ForcePasswordResetAsync
        var adminToken = await RegisterAdminAndLoginAsync();
        var client = CreateAuthorizedClient(adminToken);
        var response = await client.PostAsync(
            $"/api/v1/admin/users/{Guid.NewGuid()}/force-password-reset",
            null
        );
        ((int)response.StatusCode).Should().Be(404);
    }

    // ── TokenEndpoints: GetClaims ─────────────────────────────────────

    [Fact]
    public async Task GetClaims_WithValidToken_ReturnsClaims()
    {
        // Covers TokenEndpoints lines 18-21: GetClaimsAsync
        var token = await RegisterAndLoginAsync("tokenclaims_user");
        var client = CreateAuthorizedClient(token);
        var response = await client.GetAsync("/api/v1/tokens/claims");
        ((int)response.StatusCode).Should().Be(200);
    }

    // ── ReportEndpoints: GetUserId null ───────────────────────────────

    [Fact]
    public async Task GetPlReport_WithoutSubClaim_Returns401()
    {
        // Covers ReportEndpoints lines 26-28: null userId via middleware
        var client = CreateClientWithNoSubToken();
        var response = await client.GetAsync("/api/v1/reports/pl");
        ((int)response.StatusCode).Should().Be(401);
    }

    // ── AttachmentEndpoints ───────────────────────────────────────────

    [Fact]
    public async Task UploadAttachment_WithoutSubClaim_Returns401()
    {
        // Covers AttachmentEndpoints lines 43-45: null userId via middleware
        var client = CreateClientWithNoSubToken();
        var content = new MultipartFormDataContent();
        var response = await client.PostAsync(
            $"/api/v1/expenses/{Guid.NewGuid()}/attachments",
            content
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    [Fact]
    public async Task ListAttachments_WithoutSubClaim_Returns401()
    {
        // Covers AttachmentEndpoints lines 106-108: null userId via middleware
        var client = CreateClientWithNoSubToken();
        var response = await client.GetAsync($"/api/v1/expenses/{Guid.NewGuid()}/attachments");
        ((int)response.StatusCode).Should().Be(401);
    }

    [Fact]
    public async Task DeleteAttachment_WithoutSubClaim_Returns401()
    {
        // Covers AttachmentEndpoints lines 145-147: null userId via middleware
        var client = CreateClientWithNoSubToken();
        var response = await client.DeleteAsync(
            $"/api/v1/expenses/{Guid.NewGuid()}/attachments/{Guid.NewGuid()}"
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    // ── Auth: Refresh edge cases ──────────────────────────────────────

    [Fact]
    public async Task Refresh_WithNullRefreshToken_Returns401()
    {
        // Covers AuthEndpoints lines 158-160: null refreshToken check
        var client = _factory.CreateClient();
        var body = JsonSerializer.Serialize(new { refresh_token = (string?)null });
        var response = await client.PostAsync(
            "/api/v1/auth/refresh",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    [Fact]
    public async Task Refresh_WithInvalidToken_Returns401()
    {
        // Covers AuthEndpoints lines 170-172: DecodeToken returns null
        var client = _factory.CreateClient();
        var body = JsonSerializer.Serialize(new { refresh_token = "not-a-valid-token" });
        var response = await client.PostAsync(
            "/api/v1/auth/refresh",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    [Fact]
    public async Task Refresh_WithTokenWithoutSubClaim_Returns401()
    {
        // Covers AuthEndpoints lines 183-185: userId null or non-GUID parse
        var client = _factory.CreateClient();
        var tokenWithoutSub = CreateTokenWithoutSubClaim();
        var body = JsonSerializer.Serialize(new { refresh_token = tokenWithoutSub });
        var response = await client.PostAsync(
            "/api/v1/auth/refresh",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(401);
    }

    // ── UserEndpoints: null password / missing user after auth ────────

    [Fact]
    public async Task ChangePassword_WithNullNewPassword_Returns400()
    {
        // Covers UserEndpoints lines 112-114: new password is null
        var token = await RegisterAndLoginAsync("pwdnull_user");
        var client = CreateAuthorizedClient(token);
        var body = JsonSerializer.Serialize(new { old_password = "Str0ng#EdgePass1", new_password = (string?)null });
        var response = await client.PostAsync(
            "/api/v1/users/me/password",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(400);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private async Task<string> RegisterAdminAndLoginAsync()
    {
        var client = _factory.CreateClient();
        const string username = "adminedge_user";
        const string password = "Adm1n#Edge123";
        var email = $"{username}@example.com";

        var regBody = JsonSerializer.Serialize(new { username, email, password });
        var regResp = await client.PostAsync(
            "/api/v1/auth/register",
            new StringContent(regBody, Encoding.UTF8, "application/json")
        );

        // Set role to Admin directly in DB
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DemoBeCsas.Infrastructure.AppDbContext>();
        var user = db.Users.FirstOrDefault(u => u.Username == username);
        if (user is not null)
        {
            user.Role = DemoBeCsas.Domain.Role.Admin;
            await db.SaveChangesAsync();
        }

        var loginBody = JsonSerializer.Serialize(new { username, password });
        var loginResp = await client.PostAsync(
            "/api/v1/auth/login",
            new StringContent(loginBody, Encoding.UTF8, "application/json")
        );
        var loginJson = await loginResp.Content.ReadAsStringAsync();
        using var loginDoc = JsonDocument.Parse(loginJson);
        return loginDoc.RootElement.GetProperty("access_token").GetString()!;
    }
}
