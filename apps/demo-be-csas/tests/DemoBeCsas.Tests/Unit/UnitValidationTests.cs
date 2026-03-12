using DemoBeCsas.Domain;
using FluentAssertions;
using Xunit;

namespace DemoBeCsas.Tests.Unit;

[Trait("Category", "Unit")]
public class UnitValidationTests
{
    [Theory]
    [InlineData("liter")]
    [InlineData("kilogram")]
    [InlineData("meter")]
    [InlineData("gallon")]
    [InlineData("pound")]
    [InlineData("foot")]
    [InlineData("mile")]
    [InlineData("ounce")]
    public void ValidateUnit_ReturnsNull_ForSupportedUnits(string unit)
    {
        var error = UnitValidation.ValidateUnit(unit);

        error.Should().BeNull();
    }

    [Theory]
    [InlineData("LITER")]
    [InlineData("Kilogram")]
    [InlineData("METER")]
    public void ValidateUnit_ReturnsNull_ForSupportedUnits_CaseInsensitive(string unit)
    {
        var error = UnitValidation.ValidateUnit(unit);

        error.Should().BeNull();
    }

    [Theory]
    [InlineData("cup")]
    [InlineData("tablespoon")]
    [InlineData("invalid_unit")]
    [InlineData("")]
    public void ValidateUnit_ReturnsError_ForUnsupportedUnits(string unit)
    {
        var error = UnitValidation.ValidateUnit(unit);

        error.Should().NotBeNull();
        error!.Message.Should().Contain("Unsupported unit");
    }
}
