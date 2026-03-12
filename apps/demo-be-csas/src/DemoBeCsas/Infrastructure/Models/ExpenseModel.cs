using DemoBeCsas.Domain;

namespace DemoBeCsas.Infrastructure.Models;

public class ExpenseModel
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public ExpenseType Type { get; set; } = ExpenseType.Expense;
    public double? Quantity { get; set; }
    public string? Unit { get; set; }
    public DateTimeOffset Date { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
