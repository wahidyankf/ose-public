using System.Text.Json;
using DemoBeCsas.Tests.ScenarioContext;
using FluentAssertions;
using Reqnroll;
using Xunit;

namespace DemoBeCsas.Tests.Integration.Steps;

[Binding]
[Trait("Category", "Integration")]
public class ExpenseSteps(ServiceLayer svc, SharedState state, AuthSteps auth)
{
    internal Guid? _bobExpenseId;

    // ─────────────────────────────────────────────────────────────
    // Given helpers
    // ─────────────────────────────────────────────────────────────

    [Given(@"^alice has created an entry with body (.+)$")]
    public async Task GivenAliceCreatedEntry(string bodyJson)
    {
        var (desc, title, category, amount, currency, type, quantity, unit, date) =
            ParseExpenseBody(bodyJson);
        var response = await svc.CreateExpenseAsync(
            state.AccessToken,
            desc,
            title,
            category,
            amount,
            currency,
            type,
            quantity,
            unit,
            date
        );
        ((int)response.StatusCode).Should().Be(
            201,
            $"Failed to create entry: {response.Body}"
        );
        using var doc = JsonDocument.Parse(response.Body);
        if (doc.RootElement.TryGetProperty("id", out var idEl))
        {
            state.LastExpenseId = Guid.Parse(idEl.GetString()!);
        }
    }

    [Given(@"^alice has created an expense with body (.+)$")]
    public async Task GivenAliceCreatedExpense(string bodyJson) =>
        await GivenAliceCreatedEntry(bodyJson);

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
    public async Task GivenBobCreatedEntry(string bodyJson)
    {
        var (bobToken, _) = await auth.LoginUserAsync("bob", "Str0ng#Pass2");
        bobToken.Should().NotBeNull("bob should be able to login");

        var (desc, title, category, amount, currency, type, quantity, unit, date) =
            ParseExpenseBody(bodyJson);
        var response = await svc.CreateExpenseAsync(
            bobToken,
            desc,
            title,
            category,
            amount,
            currency,
            type,
            quantity,
            unit,
            date
        );
        ((int)response.StatusCode).Should().Be(
            201,
            $"Failed to create bob's entry: {response.Body}"
        );
        using var doc = JsonDocument.Parse(response.Body);
        if (doc.RootElement.TryGetProperty("id", out var idEl))
        {
            _bobExpenseId = Guid.Parse(idEl.GetString()!);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // When steps
    // ─────────────────────────────────────────────────────────────

    [When(@"^alice sends POST /api/v1/expenses with body (.+)$")]
    public async Task WhenAliceCreatesExpense(string bodyJson)
    {
        var (desc, title, category, amount, currency, type, quantity, unit, date) =
            ParseExpenseBody(bodyJson);
        state.LastResponse = await svc.CreateExpenseAsync(
            state.AccessToken,
            desc,
            title,
            category,
            amount,
            currency,
            type,
            quantity,
            unit,
            date
        );
        if (state.LastResponse.IsSuccess)
        {
            using var doc = JsonDocument.Parse(state.LastResponse.Body);
            if (doc.RootElement.TryGetProperty("id", out var idEl))
            {
                state.LastExpenseId = Guid.Parse(idEl.GetString()!);
            }
        }
    }

    [When(@"^the client sends POST /api/v1/expenses with body (.+)$")]
    public async Task WhenUnauthenticatedClientCreatesExpense(string bodyJson)
    {
        var (desc, title, category, amount, currency, type, quantity, unit, date) =
            ParseExpenseBody(bodyJson);
        state.LastResponse = await svc.CreateExpenseAsync(
            null, // no token — unauthenticated
            desc,
            title,
            category,
            amount,
            currency,
            type,
            quantity,
            unit,
            date
        );
    }

    [When(@"^alice sends GET /api/v1/expenses/\{expenseId\}$")]
    public async Task WhenAliceGetsExpense()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        state.LastResponse = await svc.GetExpenseAsync(state.AccessToken, state.LastExpenseId!.Value);
    }

    [When(@"^alice sends GET /api/v1/expenses$")]
    public async Task WhenAliceListsExpenses()
    {
        state.LastResponse = await svc.ListExpensesAsync(state.AccessToken);
    }

    [When(@"^alice sends PUT /api/v1/expenses/\{expenseId\} with body (.+)$")]
    public async Task WhenAliceUpdatesExpense(string bodyJson)
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        var (desc, title, category, amount, currency, type, quantity, unit, date) =
            ParseExpenseBody(bodyJson);
        state.LastResponse = await svc.UpdateExpenseAsync(
            state.AccessToken,
            state.LastExpenseId!.Value,
            desc,
            title,
            category,
            amount,
            currency,
            type,
            quantity,
            unit,
            date
        );
    }

    [When(@"^alice sends DELETE /api/v1/expenses/\{expenseId\}$")]
    public async Task WhenAliceDeletesExpense()
    {
        state.LastExpenseId.Should().NotBeNull("expense ID should be set");
        state.LastResponse = await svc.DeleteExpenseAsync(
            state.AccessToken,
            state.LastExpenseId!.Value
        );
    }

    [When(@"^alice sends GET /api/v1/expenses/summary$")]
    public async Task WhenAliceGetsSummary()
    {
        state.LastResponse = await svc.GetExpenseSummaryAsync(state.AccessToken);
    }

    // ─────────────────────────────────────────────────────────────
    // Then steps — numeric field comparisons
    // ─────────────────────────────────────────────────────────────

    [Then(@"^the response body should contain ""([^""]+)"" equal to (\d+(?:\.\d+)?)$")]
    public void ThenResponseBodyContainsNumericField(string field, double value)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(field, out var el)
            .Should().BeTrue($"Field '{field}' not found in: {body}");
        var actual = el.ValueKind == JsonValueKind.Number
            ? el.GetDouble()
            : double.Parse(el.GetString()!);
        actual.Should().BeApproximately(value, 0.0001);
    }

    [Then(@"^the response body should contain ""([^""]+)"" total equal to ""([^""]+)""$")]
    public void ThenResponseBodyContainsCurrencyTotal(string currency, string expectedTotal)
    {
        state.LastResponse.Should().NotBeNull();
        var body = state.LastResponse!.Body;
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty(currency, out var el)
            .Should().BeTrue($"Currency '{currency}' not found in: {body}");
        var actual = el.ValueKind == JsonValueKind.Number
            ? el.GetDecimal()
            : decimal.Parse(el.GetString()!);
        actual.Should().Be(decimal.Parse(expectedTotal));
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private static (
        string? Description,
        string? Title,
        string? Category,
        decimal Amount,
        string? Currency,
        string? Type,
        double? Quantity,
        string? Unit,
        string? Date
    ) ParseExpenseBody(string bodyJson)
    {
        using var doc = JsonDocument.Parse(bodyJson);
        var root = doc.RootElement;

        string? description = root.TryGetProperty("description", out var d) ? d.GetString() : null;
        string? title = root.TryGetProperty("title", out var t) ? t.GetString() : null;
        string? category = root.TryGetProperty("category", out var c) ? c.GetString() : null;
        string? currency = root.TryGetProperty("currency", out var cur) ? cur.GetString() : null;
        string? type = root.TryGetProperty("type", out var tp) ? tp.GetString() : null;
        string? unit = root.TryGetProperty("unit", out var u) ? u.GetString() : null;
        string? date = root.TryGetProperty("date", out var dt) ? dt.GetString() : null;

        decimal amount = 0m;
        if (root.TryGetProperty("amount", out var amtEl))
        {
            if (amtEl.ValueKind == JsonValueKind.Number)
            {
                amount = amtEl.GetDecimal();
            }
            else if (amtEl.ValueKind == JsonValueKind.String)
            {
                amount = decimal.Parse(amtEl.GetString()!, System.Globalization.CultureInfo.InvariantCulture);
            }
        }

        double? quantity = null;
        if (root.TryGetProperty("quantity", out var qEl) && qEl.ValueKind == JsonValueKind.Number)
        {
            quantity = qEl.GetDouble();
        }

        return (description, title, category, amount, currency, type, quantity, unit, date);
    }
}
