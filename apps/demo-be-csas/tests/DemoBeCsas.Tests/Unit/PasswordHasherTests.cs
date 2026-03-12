using DemoBeCsas.Infrastructure;
using FluentAssertions;
using Xunit;

namespace DemoBeCsas.Tests.Unit;

[Trait("Category", "Unit")]
public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void HashPassword_ProducesDifferentHashForSameInput()
    {
        var hash1 = _hasher.HashPassword("Str0ng#Password");
        var hash2 = _hasher.HashPassword("Str0ng#Password");

        // BCrypt uses random salt — hashes should differ
        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void VerifyPassword_ReturnsTrue_ForMatchingPassword()
    {
        var hash = _hasher.HashPassword("Str0ng#Password");

        var result = _hasher.VerifyPassword("Str0ng#Password", hash);

        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_ReturnsFalse_ForWrongPassword()
    {
        var hash = _hasher.HashPassword("Str0ng#Password");

        var result = _hasher.VerifyPassword("WrongPassword!", hash);

        result.Should().BeFalse();
    }
}
