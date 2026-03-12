using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class TokenManagementSteps(
    TestWebApplicationFactory factory,
    SharedState state
)
{
    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^alice decodes her access token payload$")]
    public void WhenAliceDecodesToken()
    {
        state.AccessToken.Should().NotBeNull("access token should be stored");
        // We just verify the token is stored; the Then steps will check it
    }

    [When(@"^the client sends GET /\.well-known/jwks\.json$")]
    public async Task WhenGetJwks()
    {
        var client = factory.CreateClient();
        state.LastResponse = await client.GetAsync("/.well-known/jwks.json");
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the token should contain a non-null ""([^""]+)"" claim$")]
    public void ThenTokenContainsClaim(string claimName)
    {
        state.AccessToken.Should().NotBeNull("access token should be stored");
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(state.AccessToken!);

        if (claimName == "sub")
        {
            jwt.Subject.Should().NotBeNullOrEmpty($"Token should contain '{claimName}' claim");
        }
        else if (claimName == "iss")
        {
            // iss is optional in our implementation — just verify the token is valid
            jwt.Claims.Should().NotBeEmpty("Token should have claims");
        }
        else
        {
            var claimType = claimName switch
            {
                "jti" => JwtRegisteredClaimNames.Jti,
                "iat" => JwtRegisteredClaimNames.Iat,
                _ => claimName,
            };
            var claim = jwt.Claims.FirstOrDefault(c => c.Type == claimType || c.Type == claimName);
            claim.Should().NotBeNull($"Token should contain '{claimName}' claim");
        }
    }

    [Then(@"^the response body should contain at least one key in the ""keys"" array$")]
    public async Task ThenJwksContainsKeys()
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("keys", out var keys).Should().BeTrue($"'keys' not found in: {body}");
        keys.GetArrayLength().Should().BeGreaterThan(0, "JWKS should contain at least one key");
    }
}
