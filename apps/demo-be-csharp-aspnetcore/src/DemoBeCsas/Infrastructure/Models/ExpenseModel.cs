using DemoBeCsas.Domain;

namespace DemoBeCsas.Infrastructure.Models;

public class ExpenseModel
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public ExpenseType Type { get; set; } = ExpenseType.Expense;
    public double? Quantity { get; set; }
    public string? Unit { get; set; }
    public DateOnly Date { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = "system";
    public string UpdatedBy { get; set; } = "system";
    public DateTimeOffset? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}
