using System.Text;
using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class ExpenseSteps(TestWebApplicationFactory factory, SharedState state, AuthSteps auth)
{
    internal Guid? _bobExpenseId;

    // ─────────────────────────────────────────────────────────────
    // Given helpers
    // ─────────────────────────────────────────────────────────────

    [Given(@"^alice has created an entry with body (.+)$")]
    public async Task GivenAliceCreatedEntry(string body)
    {
        var client = auth.AuthorizedClient();
        var response = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(
            201,
            $"Failed to create entry: {await response.Content.ReadAsStringAsync()}"
        );
        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        if (doc.RootElement.TryGetProperty("id", out var idEl))
        {
            state.LastExpenseId = Guid.Parse(idEl.GetString()!);
        }
    }

    [Given(@"^alice has created an expense with body (.+)$")]
    public async Task GivenAliceCreatedExpense(string body) => await GivenAliceCreatedEntry(body);

    [Given(@"^alice has created 3 entries$")]
    public async Task GivenAliceCreated3Entries()
    {
        var bodies = new[]
        {
            """{ "amount": "10.00", "currency": "USD", "category": "food", "description": "Entry 1", "date": "2025-01-01", "type": "expense" }""",
            """{ "amount": "20.00", "currency": "USD", "category": "food", "description": "Entry 2", "date": "2025-01-02", "type": "expense" }""",
            """{ "amount": "30.00", "currency": "USD", "category": "food", "description": "Entry 3", "date": "2025-01-03", "type": "expense" }""",
        };
        foreach (var body in bodies)
        {
            await GivenAliceCreatedEntry(body);
        }
    }

    [Given(@"^bob has created an entry with body (.+)$")]
    public async Task GivenBobCreatedEntry(string body)
    {
        // Login as bob (bob was registered earlier in the scenario background)
        var (bobToken, _) = await auth.LoginUserAsync("bob", "Str0ng#Pass2");
        bobToken.Should().NotBeNull("bob should be able to login");

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", bobToken!);
        var response = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        ((int)response.StatusCode).Should().Be(
            201,
            $"Failed to create bob's entry: {await response.Content.ReadAsStringAsync()}"
        );
        var responseBody = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBody);
        if (doc.RootElement.TryGetProperty("id", out var idEl))
        {
            _bobExpenseId = Guid.Parse(idEl.GetString()!);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^alice sends POST /api/v1/expenses with body (.+)$")]
    public async Task WhenAliceCreatesExpense(string body)
    {
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
        if (state.LastResponse.IsSuccessStatusCode)
        {
            var responseBody = await state.LastResponse.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("id", out var idEl))
            {
                state.LastExpenseId = Guid.Parse(idEl.GetString()!);
            }
        }
    }

    [When(@"^the client sends POST /api/v1/expenses with body (.+)$")]
    public async Task WhenUnauthenticatedClientCreatesExpense(string body)
    {
        var client = factory.CreateClient();
        state.LastResponse = await client.PostAsync(
            "/api/v1/expenses",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(@"^alice sends GET /api/v1/expenses/\{expenseId\}$")]
    public async Task WhenAliceGetsExpense()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.GetAsync($"/api/v1/expenses/{state.LastExpenseId}");
    }

    [When(@"^alice sends GET /api/v1/expenses$")]
    public async Task WhenAliceListsExpenses()
    {
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.GetAsync("/api/v1/expenses?page=1&size=20");
    }

    [When(@"^alice sends PUT /api/v1/expenses/\{expenseId\} with body (.+)$")]
    public async Task WhenAliceUpdatesExpense(string body)
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.PutAsync(
            $"/api/v1/expenses/{state.LastExpenseId}",
            new StringContent(body, Encoding.UTF8, "application/json")
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{expenseId\}$")]
    public async Task WhenAliceDeletesExpense()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.DeleteAsync($"/api/v1/expenses/{state.LastExpenseId}");
    }

    [When(@"^alice sends GET /api/v1/expenses/summary$")]
    public async Task WhenAliceGetsSummary()
    {
        var client = auth.AuthorizedClient();
        state.LastResponse = await client.GetAsync("/api/v1/expenses/summary");
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps — numeric field comparisons
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain ""([^""]+)"" equal to (\d+(?:\.\d+)?)$")]
    public async Task ThenResponseBodyContainsNumericField(string field, double value)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(field, out var el)
            .Should().BeTrue($"Field '{field}' not found in: {body}");
        var actual = el.ValueKind == JsonValueKind.Number
            ? el.GetDouble()
            : double.Parse(el.GetString()!);
        actual.Should().BeApproximately(value, 0.0001);
    }

    [Then(@"^the response body should contain ""([^""]+)"" total equal to ""([^""]+)""$")]
    public async Task ThenResponseBodyContainsCurrencyTotal(string currency, string expectedTotal)
    {
        state.LastResponse.Should().NotBeNull();
        var body = await state.LastResponse!.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(currency, out var el)
            .Should().BeTrue($"Currency '{currency}' not found in: {body}");
        var actual = el.ValueKind == JsonValueKind.Number
            ? el.GetDecimal()
            : decimal.Parse(el.GetString()!);
        actual.Should().Be(decimal.Parse(expectedTotal));
    }
}
