using DemoBeCsas.Domain;
using FluentAssertions;
using Xunit;

namespace DemoBeCsas.Tests.Unit;

[Trait("Category", "Unit")]
public class UserValidationTests
{
    [Theory]
    [InlineData("Short1!", "Password must be at least 12 characters")]
    [InlineData("alllowercase!", "Password must contain at least one uppercase letter")]
    [InlineData("NoSpecialChar12", "Password must contain at least one special character")]
    public void ValidatePassword_ReturnsError_ForInvalidPasswords(
        string password,
        string expectedMessage
    )
    {
        var error = UserValidation.ValidatePassword(password);

        error.Should().NotBeNull();
        error!.Message.Should().Be(expectedMessage);
    }

    [Theory]
    [InlineData("Str0ng#Password")]
    [InlineData("ValidPass123!")]
    [InlineData("AnotherValid@Password1")]
    public void ValidatePassword_ReturnsNull_ForValidPasswords(string password)
    {
        var error = UserValidation.ValidatePassword(password);

        error.Should().BeNull();
    }

    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@")]
    [InlineData("@nodomain.com")]
    [InlineData("")]
    public void ValidateEmail_ReturnsError_ForInvalidEmails(string email)
    {
        var error = UserValidation.ValidateEmail(email);

        error.Should().NotBeNull();
        error!.Message.Should().Be("Invalid email address");
    }

    [Theory]
    [InlineData("user@example.com")]
    [InlineData("test.user+tag@domain.org")]
    public void ValidateEmail_ReturnsNull_ForValidEmails(string email)
    {
        var error = UserValidation.ValidateEmail(email);

        error.Should().BeNull();
    }

    [Theory]
    [InlineData("ab")]
    [InlineData("")]
    [InlineData("has space")]
    [InlineData("has@symbol")]
    public void ValidateUsername_ReturnsError_ForInvalidUsernames(string username)
    {
        var error = UserValidation.ValidateUsername(username);

        error.Should().NotBeNull();
    }

    [Theory]
    [InlineData("alice")]
    [InlineData("user_123")]
    [InlineData("my-handle")]
    public void ValidateUsername_ReturnsNull_ForValidUsernames(string username)
    {
        var error = UserValidation.ValidateUsername(username);

        error.Should().BeNull();
    }
}
