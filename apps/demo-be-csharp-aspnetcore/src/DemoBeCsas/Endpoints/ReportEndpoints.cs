using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace DemoBeCsas.Endpoints;

public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/reports/pl", GetPlReportAsync).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> GetPlReportAsync(
        HttpContext ctx,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate,
        [FromQuery] string? currency,
        IExpenseRepository expenseRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var fromDate =
            startDate is not null
                ? DateTimeOffset.Parse(
                    startDate + "T00:00:00Z",
                    System.Globalization.CultureInfo.InvariantCulture
                )
                : DateTimeOffset.MinValue;
        var toDate =
            endDate is not null
                ? DateTimeOffset.Parse(
                    endDate + "T23:59:59Z",
                    System.Globalization.CultureInfo.InvariantCulture
                )
                : DateTimeOffset.MaxValue;

        var expenses = await expenseRepo.ListByUserAndDateRangeAsync(
            userId.Value,
            fromDate,
            toDate,
            currency,
            ct
        );

        var incomeTotal = expenses.Where(e => e.Type == ExpenseType.Income).Sum(e => e.Amount);
        var expenseTotal = expenses.Where(e => e.Type == ExpenseType.Expense).Sum(e => e.Amount);

        var incomeBreakdown = expenses
            .Where(e => e.Type == ExpenseType.Income)
            .GroupBy(e => e.Category)
            .Select(g => new
            {
                category = g.Key,
                type = "income",
                total = FormatAmount(g.Sum(e => e.Amount), currency ?? "USD"),
            })
            .ToArray();

        var expenseBreakdown = expenses
            .Where(e => e.Type == ExpenseType.Expense)
            .GroupBy(e => e.Category)
            .Select(g => new
            {
                category = g.Key,
                type = "expense",
                total = FormatAmount(g.Sum(e => e.Amount), currency ?? "USD"),
            })
            .ToArray();

        return Results.Ok(
            new
            {
                startDate,
                endDate,
                currency,
                totalIncome = FormatAmount(incomeTotal, currency ?? "USD"),
                totalExpense = FormatAmount(expenseTotal, currency ?? "USD"),
                net = FormatAmount(incomeTotal - expenseTotal, currency ?? "USD"),
                incomeBreakdown,
                expenseBreakdown,
            }
        );
    }

    private static string FormatAmount(decimal amount, string currency) =>
        currency == "IDR"
            ? Math.Round(amount, 0, MidpointRounding.AwayFromZero).ToString("F0")
            : amount.ToString("F2");

    private static Guid? GetUserId(HttpContext ctx)
    {
        var sub = ctx.User.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;
        return sub is not null && Guid.TryParse(sub, out var g) ? g : null;
    }
}
