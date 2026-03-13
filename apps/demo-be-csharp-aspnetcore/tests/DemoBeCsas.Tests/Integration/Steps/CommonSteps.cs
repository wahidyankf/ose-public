using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
public class CommonSteps(ServiceLayer svc, SharedState state)
{
    [BeforeScenario]
    public async Task CleanDatabase()
    {
        await svc.CleanDatabaseAsync();
    }

    [Given("the API is running")]
    public void GivenTheApiIsRunning()
    {
        // ServiceLayer is always ready — nothing to do
    }

    [Then("the response status code should be {int}")]
    public void ThenStatusCode(int expectedCode)
    {
        state.LastResponse.Should().NotBeNull();
        state.LastResponse!.StatusCode.Should().Be(
            expectedCode,
            $"Response body: {state.LastResponse.Body}"
        );
    }

    [Then("the response status code should be {int} or {int}")]
    public void ThenStatusCodeOneOf(int code1, int code2)
    {
        state.LastResponse.Should().NotBeNull();
        state.LastResponse!.StatusCode.Should().BeOneOf(code1, code2);
    }
}
