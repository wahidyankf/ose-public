using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class ReportingSteps(SharedState state, AuthSteps auth)
{
    // ─────────────────────────────────────────────────────────────
    // When steps — each PL query variant
    // ─────────────────────────────────────────────────────────────

    [When(@"^alice sends GET /api/v1/reports/pl\?from=2025-01-01&to=2025-01-31&currency=USD$")]
    public async Task WhenAliceGetsPLJan()
    {
        await PerformGetPl("2025-01-01", "2025-01-31", "USD");
    }

    [When(@"^alice sends GET /api/v1/reports/pl\?from=2025-02-01&to=2025-02-28&currency=USD$")]
    public async Task WhenAliceGetsPLFeb()
    {
        await PerformGetPl("2025-02-01", "2025-02-28", "USD");
    }

    [When(@"^alice sends GET /api/v1/reports/pl\?from=2025-03-01&to=2025-03-31&currency=USD$")]
    public async Task WhenAliceGetsPLMar()
    {
        await PerformGetPl("2025-03-01", "2025-03-31", "USD");
    }

    [When(@"^alice sends GET /api/v1/reports/pl\?from=2025-04-01&to=2025-04-30&currency=USD$")]
    public async Task WhenAliceGetsPLApr()
    {
        await PerformGetPl("2025-04-01", "2025-04-30", "USD");
    }

    [When(@"^alice sends GET /api/v1/reports/pl\?from=2025-05-01&to=2025-05-31&currency=USD$")]
    public async Task WhenAliceGetsPLMay()
    {
        await PerformGetPl("2025-05-01", "2025-05-31", "USD");
    }

    [When(@"^alice sends GET /api/v1/reports/pl\?from=2099-01-01&to=2099-01-31&currency=USD$")]
    public async Task WhenAliceGetsPLFuture()
    {
        await PerformGetPl("2099-01-01", "2099-01-31", "USD");
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the income breakdown should contain ""([^""]+)"" with amount ""([^""]+)""$")]
    public async Task ThenIncomeBreakdownContains(string category, string amount)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("income_breakdown", out var breakdown)
            .Should().BeTrue($"'income_breakdown' not found in: {body}");
        breakdown.TryGetProperty(category, out var catEl)
            .Should().BeTrue($"Category '{category}' not found in income_breakdown of: {body}");
        decimal.Parse(catEl.GetRawText()).Should().Be(decimal.Parse(amount));
    }

    [Then(@"^the expense breakdown should contain ""([^""]+)"" with amount ""([^""]+)""$")]
    public async Task ThenExpenseBreakdownContains(string category, string amount)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("expense_breakdown", out var breakdown)
            .Should().BeTrue($"'expense_breakdown' not found in: {body}");
        breakdown.TryGetProperty(category, out var catEl)
            .Should().BeTrue($"Category '{category}' not found in expense_breakdown of: {body}");
        decimal.Parse(catEl.GetRawText()).Should().Be(decimal.Parse(amount));
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private async Task PerformGetPl(string from, string to, string currency)
    {
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.GetAsync(
            $"/api/v1/reports/pl?from={from}&to={to}&currency={currency}"
        );
    }
}
