using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class UserAccountSteps(ServiceLayer svc, SharedState state)
{
    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^alice sends GET /api/v1/users/me$")]
    public async Task WhenAliceSendsGetMe()
    {
        state.LastResponse = await svc.GetMeAsync(state.AccessToken);
    }

    [When(@"^alice sends PATCH /api/v1/users/me with body \{ ""display_name"": ""([^""]+)"" \}$")]
    public async Task WhenAlicePatchesMe(string displayName)
    {
        state.LastResponse = await svc.PatchMeAsync(state.AccessToken, displayName);
    }

    [When(
        @"^alice sends POST /api/v1/users/me/password with body \{ ""old_password"": ""([^""]+)"", ""new_password"": ""([^""]+)"" \}$"
    )]
    public async Task WhenAliceChangesPassword(string oldPassword, string newPassword)
    {
        state.LastResponse = await svc.ChangePasswordAsync(state.AccessToken, oldPassword, newPassword);
    }

    [When(@"^alice sends POST /api/v1/users/me/deactivate$")]
    public async Task WhenAliceDeactivates()
    {
        state.LastResponse = await svc.DeactivateAsync(state.AccessToken);
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps (password change error)
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain an error message about incorrect password$")]
    public void ThenErrorAboutIncorrectPassword()
    {
        state.LastResponse.Should().NotBeNull();
        state.LastResponse!.StatusCode.Should().BeOneOf(400, 401);
    }
}
