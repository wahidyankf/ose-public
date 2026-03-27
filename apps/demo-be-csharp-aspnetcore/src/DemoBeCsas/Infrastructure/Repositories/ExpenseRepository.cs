using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace DemoBeCsas.Infrastructure.Repositories;

public record CurrencySummary(string Currency, decimal IncomeTotal, decimal ExpenseTotal);

public interface IExpenseRepository
{
    Task<ExpenseModel> CreateAsync(
        Guid userId,
        string description,
        string category,
        decimal amount,
        string currency,
        ExpenseType type,
        double? quantity,
        string? unit,
        DateOnly date,
        CancellationToken ct = default
    );
    Task<ExpenseModel?> FindByIdAsync(Guid expenseId, Guid userId, CancellationToken ct = default);
    Task<(IReadOnlyList<ExpenseModel> Items, int Total)> ListByUserAsync(
        Guid userId,
        int page,
        int size,
        CancellationToken ct = default
    );
    Task<ExpenseModel> UpdateAsync(
        Guid expenseId,
        Guid userId,
        string description,
        string category,
        decimal amount,
        string currency,
        ExpenseType type,
        double? quantity,
        string? unit,
        DateOnly date,
        CancellationToken ct = default
    );
    Task DeleteAsync(Guid expenseId, Guid userId, CancellationToken ct = default);
    Task<IReadOnlyList<CurrencySummary>> SummaryByCurrencyAsync(
        Guid userId,
        CancellationToken ct = default
    );
    Task<IReadOnlyList<ExpenseModel>> ListByUserAndDateRangeAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        string? currency,
        CancellationToken ct = default
    );
}

public class ExpenseRepository(AppDbContext db) : IExpenseRepository
{
    public async Task<ExpenseModel> CreateAsync(
        Guid userId,
        string description,
        string category,
        decimal amount,
        string currency,
        ExpenseType type,
        double? quantity,
        string? unit,
        DateOnly date,
        CancellationToken ct = default
    )
    {
        var now = DateTimeOffset.UtcNow;
        var expense = new ExpenseModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Description = description,
            Category = category,
            Amount = amount,
            Currency = currency.ToUpperInvariant(),
            Type = type,
            Quantity = quantity,
            Unit = unit,
            Date = date,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.Expenses.Add(expense);
        await db.SaveChangesAsync(ct);
        return expense;
    }

    public Task<ExpenseModel?> FindByIdAsync(
        Guid expenseId,
        Guid userId,
        CancellationToken ct = default
    ) =>
        db.Expenses.FirstOrDefaultAsync(
            e => e.Id == expenseId && e.UserId == userId,
            ct
        );

    public async Task<(IReadOnlyList<ExpenseModel> Items, int Total)> ListByUserAsync(
        Guid userId,
        int page,
        int size,
        CancellationToken ct = default
    )
    {
        var query = db.Expenses.Where(e => e.UserId == userId);
        var total = await query.CountAsync(ct);
        // Use client-side sort to avoid SQLite DateTimeOffset ORDER BY translation issue
        var all = await query.ToListAsync(ct);
        var items = all.OrderByDescending(e => e.Date)
            .Skip((page - 1) * size)
            .Take(size)
            .ToList();
        return (items, total);
    }

    public async Task<ExpenseModel> UpdateAsync(
        Guid expenseId,
        Guid userId,
        string description,
        string category,
        decimal amount,
        string currency,
        ExpenseType type,
        double? quantity,
        string? unit,
        DateOnly date,
        CancellationToken ct = default
    )
    {
        var expense = await db.Expenses.FirstAsync(
            e => e.Id == expenseId && e.UserId == userId,
            ct
        );
        expense.Description = description;
        expense.Category = category;
        expense.Amount = amount;
        expense.Currency = currency.ToUpperInvariant();
        expense.Type = type;
        expense.Quantity = quantity;
        expense.Unit = unit;
        expense.Date = date;
        expense.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return expense;
    }

    public async Task DeleteAsync(
        Guid expenseId,
        Guid userId,
        CancellationToken ct = default
    )
    {
        var expense = await db.Expenses.FirstAsync(
            e => e.Id == expenseId && e.UserId == userId,
            ct
        );
        db.Expenses.Remove(expense);
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<CurrencySummary>> SummaryByCurrencyAsync(
        Guid userId,
        CancellationToken ct = default
    )
    {
        var expenses = await db.Expenses.Where(e => e.UserId == userId).ToListAsync(ct);
        return expenses
            .GroupBy(e => e.Currency)
            .Select(g => new CurrencySummary(
                g.Key,
                g.Where(e => e.Type == ExpenseType.Income).Sum(e => e.Amount),
                g.Where(e => e.Type == ExpenseType.Expense).Sum(e => e.Amount)
            ))
            .ToList();
    }

    public async Task<IReadOnlyList<ExpenseModel>> ListByUserAndDateRangeAsync(
        Guid userId,
        DateOnly from,
        DateOnly to,
        string? currency,
        CancellationToken ct = default
    )
    {
        var allExpenses = await db.Expenses.Where(e => e.UserId == userId).ToListAsync(ct);
        var filtered = allExpenses.Where(e => e.Date >= from && e.Date <= to);
        if (!string.IsNullOrWhiteSpace(currency))
        {
            var upper = currency.ToUpperInvariant();
            filtered = filtered.Where(e => e.Currency == upper);
        }

        return filtered.ToList();
    }
}
