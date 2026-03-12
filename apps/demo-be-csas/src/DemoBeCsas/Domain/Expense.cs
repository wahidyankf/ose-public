namespace DemoBeCsas.Domain;

public sealed record ExpenseDomain(
    Guid Id,
    Guid UserId,
    string Title,
    decimal Amount,
    string Currency,
    ExpenseType Type,
    string? Quantity,
    string? Unit,
    DateTimeOffset Date,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public static class CurrencyValidation
{
    private static readonly IReadOnlyDictionary<string, int> DecimalPlaces =
        new Dictionary<string, int> { ["USD"] = 2, ["IDR"] = 0 };

    public static readonly IReadOnlyCollection<string> SupportedCurrencies =
        DecimalPlaces.Keys.ToList().AsReadOnly();

    public static DomainError? ValidateAmount(string currency, decimal amount)
    {
        if (!DecimalPlaces.TryGetValue(currency.ToUpperInvariant(), out var places))
        {
            return new ValidationError("currency", $"Unsupported currency: {currency}");
        }

        if (amount < 0)
        {
            return new ValidationError("amount", "Amount must not be negative");
        }

        var rounded = Math.Round(amount, places);
        if (rounded != amount)
        {
            return new ValidationError(
                "amount",
                $"{currency} requires {places} decimal place(s)"
            );
        }

        return null;
    }
}

public static class UnitValidation
{
    private static readonly HashSet<string> SupportedUnits =
    [
        "liter",
        "kilogram",
        "meter",
        "gallon",
        "pound",
        "foot",
        "mile",
        "ounce",
    ];

    public static DomainError? ValidateUnit(string unit)
    {
        if (!SupportedUnits.Contains(unit.ToLowerInvariant()))
        {
            return new ValidationError(
                "unit",
                $"Unsupported unit: {unit}. Supported units: {string.Join(", ", SupportedUnits)}"
            );
        }

        return null;
    }
}
