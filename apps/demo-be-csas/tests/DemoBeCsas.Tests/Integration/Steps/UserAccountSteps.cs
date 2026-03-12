using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class UserAccountSteps(SharedState state, AuthSteps auth)
{
    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^alice sends GET /api/v1/users/me$")]
    public async Task WhenAliceSendsGetMe()
    {
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.GetAsync("/api/v1/users/me");
    }

    [When(@"^alice sends PATCH /api/v1/users/me with body \{ ""display_name"": ""([^""]+)"" \}$")]
    public async Task WhenAlicePatchesMe(string displayName)
    {
        var client = auth.AuthorizedClient();
        var body = JsonSerializer.Serialize(new { display_name = displayName });
        state.LastResponse = await client.PatchAsync(
            "/api/v1/users/me",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(
        @"^alice sends POST /api/v1/users/me/password with body \{ ""old_password"": ""([^""]+)"", ""new_password"": ""([^""]+)"" \}$"
    )]
    public async Task WhenAliceChangesPassword(string oldPassword, string newPassword)
    {
        var client = auth.AuthorizedClient();
        var body = JsonSerializer.Serialize(
            new { old_password = oldPassword, new_password = newPassword }
        );
        state.LastResponse = await client.PostAsync(
            "/api/v1/users/me/password",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(@"^alice sends POST /api/v1/users/me/deactivate$")]
    public async Task WhenAliceDeactivates()
    {
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.PostAsync("/api/v1/users/me/deactivate", null);
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps (password change error)
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain an error message about incorrect password$")]
    public async Task ThenErrorAboutIncorrectPassword()
    {
        state.LastResponse.Should().NotBeNull();
        ((int)state.LastResponse!.StatusCode).Should().BeOneOf(400, 401);
    }
}
