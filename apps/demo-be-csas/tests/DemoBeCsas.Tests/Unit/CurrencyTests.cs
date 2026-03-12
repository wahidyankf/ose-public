using DemoBeCsas.Domain;
using FluentAssertions;
using Xunit;

namespace DemoBeCsas.Tests.Unit;

[Trait("Category", "Unit")]
public class CurrencyTests
{
    [Theory]
    [InlineData("USD", 10.00)]
    [InlineData("USD", 0.01)]
    [InlineData("IDR", 1000)]
    [InlineData("IDR", 0)]
    public void ValidateAmount_ReturnsNull_ForValidAmounts(string currency, decimal amount)
    {
        var error = CurrencyValidation.ValidateAmount(currency, amount);

        error.Should().BeNull();
    }

    [Theory]
    [InlineData("USD", 10.001, "USD requires 2 decimal place(s)")]
    [InlineData("IDR", 100.5, "IDR requires 0 decimal place(s)")]
    public void ValidateAmount_ReturnsError_ForWrongDecimalPlaces(
        string currency,
        decimal amount,
        string expectedMessage
    )
    {
        var error = CurrencyValidation.ValidateAmount(currency, amount);

        error.Should().NotBeNull();
        error!.Message.Should().Be(expectedMessage);
    }

    [Fact]
    public void ValidateAmount_ReturnsError_ForUnsupportedCurrency()
    {
        var error = CurrencyValidation.ValidateAmount("EUR", 10.00m);

        error.Should().NotBeNull();
        error!.Message.Should().Contain("Unsupported currency");
    }

    [Fact]
    public void ValidateAmount_ReturnsError_ForNegativeAmount()
    {
        var error = CurrencyValidation.ValidateAmount("USD", -1.00m);

        error.Should().NotBeNull();
        error!.Message.Should().Be("Amount must not be negative");
    }
}
