using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class AdminSteps(SharedState state, AuthSteps auth)
{
    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^the admin sends GET /api/v1/admin/users$")]
    public async Task WhenAdminListsUsers()
    {
        var client = auth.AdminClient();
        state.LastResponse = await client.GetAsync("/api/v1/admin/users?page=1&size=20");
    }

    [When(@"^the admin sends GET /api/v1/admin/users\?email=alice@example\.com$")]
    public async Task WhenAdminSearchesByEmail()
    {
        var client = auth.AdminClient();
        state.LastResponse = await client.GetAsync(
            "/api/v1/admin/users?email=alice@example.com&page=1&size=20"
        );
    }

    [When(@"^the admin sends POST /api/v1/admin/users/\{alice_id\}/disable with body \{ ""reason"": ""([^""]+)"" \}$")]
    public async Task WhenAdminDisablesAlice(string reason)
    {
        var aliceId = state.LastCreatedId ?? auth._aliceId;
        aliceId.Should().NotBeNull("alice's ID should be known");
        var client = auth.AdminClient();
        state.LastResponse = await client.PostAsync($"/api/v1/admin/users/{aliceId}/disable", null);
    }

    [When(@"^the admin sends POST /api/v1/admin/users/\{alice_id\}/enable$")]
    public async Task WhenAdminEnablesAlice()
    {
        var aliceId = state.LastCreatedId ?? auth._aliceId;
        aliceId.Should().NotBeNull("alice's ID should be known");
        var client = auth.AdminClient();
        state.LastResponse = await client.PostAsync($"/api/v1/admin/users/{aliceId}/enable", null);
    }

    [When(@"^the admin sends POST /api/v1/admin/users/\{alice_id\}/unlock$")]
    public async Task WhenAdminUnlocksAlice()
    {
        var aliceId = state.LastCreatedId ?? auth._aliceId;
        aliceId.Should().NotBeNull("alice's ID should be known");
        var client = auth.AdminClient();
        state.LastResponse = await client.PostAsync($"/api/v1/admin/users/{aliceId}/unlock", null);
    }

    [When(@"^the admin sends POST /api/v1/admin/users/\{alice_id\}/force-password-reset$")]
    public async Task WhenAdminForcePasswordReset()
    {
        var aliceId = state.LastCreatedId ?? auth._aliceId;
        aliceId.Should().NotBeNull("alice's ID should be known");
        var client = auth.AdminClient();
        state.LastResponse = await client.PostAsync(
            $"/api/v1/admin/users/{aliceId}/force-password-reset",
            null
        );
        if (state.LastResponse.IsSuccessStatusCode)
        {
            var body = await state.LastResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("reset_token", out var rt))
            {
                state.LastResetToken = rt.GetString();
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain at least one user with ""email"" equal to ""([^""]+)""$")]
    public async Task ThenResponseContainsUserWithEmail(string email)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        body.Should().Contain(email, $"Expected user with email '{email}' in: {body}");
    }
}
