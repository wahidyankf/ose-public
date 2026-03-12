using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DemoBeCsas.Endpoints;

public static class ExpenseEndpoints
{
    public static IEndpointRouteBuilder MapExpenseEndpoints(this IEndpointRouteBuilder app)
    {
        // Summary MUST be registered before /{id} to avoid "summary" being parsed as a Guid
        app.MapGet("/api/v1/expenses/summary", GetSummaryAsync).RequireAuthorization();
        app.MapPost("/api/v1/expenses", CreateExpenseAsync).RequireAuthorization();
        app.MapGet("/api/v1/expenses", ListExpensesAsync).RequireAuthorization();
        app.MapGet("/api/v1/expenses/{id}", GetExpenseAsync).RequireAuthorization();
        app.MapPut("/api/v1/expenses/{id}", UpdateExpenseAsync).RequireAuthorization();
        app.MapDelete("/api/v1/expenses/{id}", DeleteExpenseAsync).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> CreateExpenseAsync(
        HttpContext ctx,
        [FromBody] ExpenseRequest req,
        IExpenseRepository expenseRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Accept either "description" or "title" as the display name
        var title = req.Description ?? req.Title;
        if (title is null || req.Currency is null)
        {
            return Results.BadRequest(
                new { message = "description/title and currency are required" }
            );
        }

        var amountError = CurrencyValidation.ValidateAmount(req.Currency, req.Amount);
        if (amountError is not null)
        {
            return DomainErrorMapper.ToHttpResult(amountError);
        }

        if (req.Unit is not null)
        {
            var unitError = UnitValidation.ValidateUnit(req.Unit);
            if (unitError is not null)
            {
                return DomainErrorMapper.ToHttpResult(unitError);
            }
        }

        var type = ParseExpenseType(req.Type);
        var date = ParseDate(req.DateStr);
        var category = req.Category ?? string.Empty;
        var expense = await expenseRepo.CreateAsync(
            userId.Value,
            title,
            category,
            req.Amount,
            req.Currency,
            type,
            req.Quantity,
            req.Unit,
            date,
            ct
        );

        return Results.Created($"/api/v1/expenses/{expense.Id}", ToResponse(expense));
    }

    private static async Task<IResult> ListExpensesAsync(
        HttpContext ctx,
        IExpenseRepository expenseRepo,
        CancellationToken ct,
        [FromQuery] int page = 1,
        [FromQuery] int size = 20
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var safePage = Math.Max(1, page == 0 ? 1 : page);
        var safeSize = size <= 0 ? 20 : size;
        var (items, total) = await expenseRepo.ListByUserAsync(userId.Value, safePage, safeSize, ct);
        return Results.Ok(
            new
            {
                data = items.Select(ToResponse),
                total,
                page = safePage,
                size = safeSize,
            }
        );
    }

    private static async Task<IResult> GetSummaryAsync(
        HttpContext ctx,
        IExpenseRepository expenseRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var summaries = await expenseRepo.SummaryByCurrencyAsync(userId.Value, ct);

        // Build a currency-keyed dictionary: e.g. { "USD": "30.00", "IDR": "150000" }
        // Total = income - expense per currency (expense is negative contribution)
        var currencyTotals = summaries.ToDictionary(
            s => s.Currency,
            s => FormatAmount(s.ExpenseTotal, s.Currency)
        );

        return Results.Ok(currencyTotals);
    }

    private static async Task<IResult> GetExpenseAsync(
        HttpContext ctx,
        Guid id,
        IExpenseRepository expenseRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var expense = await expenseRepo.FindByIdAsync(id, userId.Value, ct);
        if (expense is null)
        {
            return Results.NotFound(new { message = "Expense not found" });
        }

        return Results.Ok(ToResponse(expense));
    }

    private static async Task<IResult> UpdateExpenseAsync(
        HttpContext ctx,
        Guid id,
        [FromBody] ExpenseRequest req,
        IExpenseRepository expenseRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var title = req.Description ?? req.Title;
        if (title is null || req.Currency is null)
        {
            return Results.BadRequest(
                new { message = "description/title and currency are required" }
            );
        }

        var amountError = CurrencyValidation.ValidateAmount(req.Currency, req.Amount);
        if (amountError is not null)
        {
            return DomainErrorMapper.ToHttpResult(amountError);
        }

        if (req.Unit is not null)
        {
            var unitError = UnitValidation.ValidateUnit(req.Unit);
            if (unitError is not null)
            {
                return DomainErrorMapper.ToHttpResult(unitError);
            }
        }

        var existing = await expenseRepo.FindByIdAsync(id, userId.Value, ct);
        if (existing is null)
        {
            return Results.NotFound(new { message = "Expense not found" });
        }

        var type = ParseExpenseType(req.Type);
        var date = ParseDate(req.DateStr);
        var category = req.Category ?? existing.Category;
        var updated = await expenseRepo.UpdateAsync(
            id,
            userId.Value,
            title,
            category,
            req.Amount,
            req.Currency,
            type,
            req.Quantity,
            req.Unit,
            date,
            ct
        );

        return Results.Ok(ToResponse(updated));
    }

    private static async Task<IResult> DeleteExpenseAsync(
        HttpContext ctx,
        Guid id,
        IExpenseRepository expenseRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var existing = await expenseRepo.FindByIdAsync(id, userId.Value, ct);
        if (existing is null)
        {
            return Results.NotFound(new { message = "Expense not found" });
        }

        await expenseRepo.DeleteAsync(id, userId.Value, ct);
        return Results.NoContent();
    }

    private static Guid? GetUserId(HttpContext ctx)
    {
        var sub = ctx.User.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;
        return sub is not null && Guid.TryParse(sub, out var g) ? g : null;
    }

    private static ExpenseType ParseExpenseType(string? type) =>
        type?.ToLowerInvariant() == "income" ? ExpenseType.Income : ExpenseType.Expense;

    private static DateTimeOffset ParseDate(string? dateStr)
    {
        if (dateStr is null)
        {
            return DateTimeOffset.UtcNow;
        }

        // If the input is a plain date (yyyy-MM-dd), treat it as UTC midnight
        // to avoid local-timezone offsets skewing date-range comparisons.
        var normalized = dateStr.Length == 10 ? dateStr + "T00:00:00Z" : dateStr;

        if (
            DateTimeOffset.TryParse(
                normalized,
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out var parsed
            )
        )
        {
            return parsed;
        }

        return DateTimeOffset.UtcNow;
    }

    private static string FormatAmount(decimal amount, string currency) =>
        currency == "IDR"
            ? Math.Round(amount, 0, MidpointRounding.AwayFromZero).ToString("F0")
            : amount.ToString("F2");

    private static object ToResponse(Infrastructure.Models.ExpenseModel e) =>
        new
        {
            id = e.Id,
            description = e.Title,
            category = e.Category,
            amount = FormatAmount(e.Amount, e.Currency),
            currency = e.Currency,
            type = e.Type.ToString().ToLowerInvariant(),
            quantity = e.Quantity,
            unit = e.Unit,
            date = e.Date.ToString("yyyy-MM-dd"),
            created_at = e.CreatedAt,
            updated_at = e.UpdatedAt,
        };

    private sealed record ExpenseRequest(
        string? Description,
        string? Title,
        string? Category,
        decimal Amount,
        string? Currency,
        string? Type,
        double? Quantity,
        string? Unit,
        [property: System.Text.Json.Serialization.JsonPropertyName("date")] string? DateStr
    );
}
