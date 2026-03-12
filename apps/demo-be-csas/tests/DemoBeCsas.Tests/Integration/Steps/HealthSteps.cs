using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class HealthSteps(TestWebApplicationFactory factory, SharedState state)
{
    [When(@"^an operations engineer sends GET \/health$")]
    public async Task WhenGetHealth()
    {
        var client = factory.CreateClient();
        state.LastResponse = await client.GetAsync("/health");
    }

    [When(@"^an unauthenticated engineer sends GET \/health$")]
    public async Task WhenUnauthenticatedGetHealth()
    {
        var client = factory.CreateClient();
        state.LastResponse = await client.GetAsync("/health");
    }

    [Then("the health status should be {string}")]
    public async Task ThenHealthStatus(string expectedStatus)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.GetProperty("status").GetString().Should().Be(expectedStatus);
    }

    [Then("the response should not include detailed component health information")]
    public async Task ThenNoDetailedHealthInfo()
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        body.Should().NotContain("components");
        body.Should().NotContain("details");
    }
}
