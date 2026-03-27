using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Org.OpenAPITools.Client;
using Org.OpenAPITools.DemoBeCsas.Contracts;

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
        [FromBody] CreateExpenseRequest req,
        IExpenseRepository expenseRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        if (!decimal.TryParse(req.Amount, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var amount))
        {
            return Results.BadRequest(new { message = "amount must be a valid number" });
        }

        var amountError = CurrencyValidation.ValidateAmount(req.Currency, amount);
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

        var type = req.Type == CreateExpenseRequest.TypeEnum.Income ? ExpenseType.Income : ExpenseType.Expense;
        var quantity = req.Quantity.HasValue ? (double?)Convert.ToDouble(req.Quantity.Value) : null;
        var expense = await expenseRepo.CreateAsync(
            userId.Value,
            req.Description,
            req.Category,
            amount,
            req.Currency,
            type,
            quantity,
            req.Unit,
            req.Date,
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
                content = items.Select(ToResponse),
                totalElements = total,
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
        // Only include currencies with a positive expense total (matches Go/Clojure behaviour)
        var currencyTotals = summaries
            .Where(s => s.ExpenseTotal > 0)
            .ToDictionary(
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
        [FromBody] UpdateExpenseRequest req,
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

        // Resolve update fields, falling back to existing values when not provided
        var description = req.Description ?? existing.Description;
        var currency = req.Currency ?? existing.Currency;

        if (!decimal.TryParse(
            req.Amount ?? existing.Amount.ToString(System.Globalization.CultureInfo.InvariantCulture),
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture,
            out var amount))
        {
            return Results.BadRequest(new { message = "amount must be a valid number" });
        }

        var amountError = CurrencyValidation.ValidateAmount(currency, amount);
        if (amountError is not null)
        {
            return DomainErrorMapper.ToHttpResult(amountError);
        }

        var unit = req.Unit ?? existing.Unit;
        if (unit is not null)
        {
            var unitError = UnitValidation.ValidateUnit(unit);
            if (unitError is not null)
            {
                return DomainErrorMapper.ToHttpResult(unitError);
            }
        }

        ExpenseType type;
        if (req.Type.HasValue)
        {
            type = req.Type.Value == UpdateExpenseRequest.TypeEnum.Income ? ExpenseType.Income : ExpenseType.Expense;
        }
        else
        {
            type = existing.Type;
        }
        var date = req.Date ?? existing.Date;
        var category = req.Category ?? existing.Category;
        var quantity = req.Quantity.HasValue
            ? (double?)Convert.ToDouble(req.Quantity.Value)
            : existing.Quantity;

        var updated = await expenseRepo.UpdateAsync(
            id,
            userId.Value,
            description,
            category,
            amount,
            currency,
            type,
            quantity,
            unit,
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

    private static string FormatAmount(decimal amount, string currency) =>
        currency == "IDR"
            ? Math.Round(amount, 0, MidpointRounding.AwayFromZero).ToString("F0")
            : amount.ToString("F2");

    private static Expense ToResponse(Infrastructure.Models.ExpenseModel e)
    {
        var type = e.Type == Domain.ExpenseType.Income
            ? Expense.TypeEnum.Income
            : Expense.TypeEnum.Expense;

        var quantity = e.Quantity.HasValue
            ? new Option<decimal?>((decimal)e.Quantity.Value)
            : default(Option<decimal?>);

        var unit = e.Unit is not null
            ? new Option<string?>(e.Unit)
            : default(Option<string?>);

        return new Expense(
            id: e.Id.ToString(),
            amount: FormatAmount(e.Amount, e.Currency),
            currency: e.Currency,
            category: e.Category,
            description: e.Description,
            date: e.Date,
            type: type,
            userId: e.UserId.ToString(),
            createdAt: e.CreatedAt.UtcDateTime,
            updatedAt: e.UpdatedAt.UtcDateTime,
            quantity: quantity,
            unit: unit
        );
    }
}
