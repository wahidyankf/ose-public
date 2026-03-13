using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class HealthSteps(ServiceLayer svc, SharedState state)
{
    [When(@"^an operations engineer sends GET \/health$")]
    public void WhenGetHealth()
    {
        state.LastResponse = svc.HealthCheck();
    }

    [When(@"^an unauthenticated engineer sends GET \/health$")]
    public void WhenUnauthenticatedGetHealth()
    {
        state.LastResponse = svc.HealthCheck();
    }

    [Then("the health status should be {string}")]
    public void ThenHealthStatus(string expectedStatus)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.GetProperty("status").GetString().Should().Be(expectedStatus);
    }

    [Then("the response should not include detailed component health information")]
    public void ThenNoDetailedHealthInfo()
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        body.Should().NotContain("components");
        body.Should().NotContain("details");
    }
}
