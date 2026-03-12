using DemoBeCsas.Infrastructure;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
public class CommonSteps(TestWebApplicationFactory factory, SharedState state)
{
    [BeforeScenario]
    public void CleanDatabase()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.ExecuteSqlRaw("DELETE FROM Attachments");
        db.Database.ExecuteSqlRaw("DELETE FROM Expenses");
        db.Database.ExecuteSqlRaw("DELETE FROM RevokedTokens");
        db.Database.ExecuteSqlRaw("DELETE FROM Users");
    }

    [Given("the API is running")]
    public void GivenTheApiIsRunning()
    {
        // WebApplicationFactory starts in-process — nothing to do
    }

    [Then("the response status code should be {int}")]
    public async Task ThenStatusCode(int expectedCode)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        ((int)state.LastResponse.StatusCode).Should().Be(
            expectedCode,
            $"Response body: {body}"
        );
    }

    [Then("the response status code should be {int} or {int}")]
    public void ThenStatusCodeOneOf(int code1, int code2)
    {
        state.LastResponse.Should().NotBeNull();
        var actual = (int)state.LastResponse!.StatusCode;
        actual.Should().BeOneOf(code1, code2);
    }

    protected HttpClient CreateClient() => factory.CreateClient();
}
