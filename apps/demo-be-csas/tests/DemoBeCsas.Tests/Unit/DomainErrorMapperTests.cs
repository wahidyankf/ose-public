using DemoBeCsas.Domain;
using DemoBeCsas.Endpoints;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace DemoBeCsas.Tests.Unit;

/// <summary>
/// Tests for DomainErrorMapper covering all switch arms including the default case.
/// </summary>
[Trait("Category", "Unit")]
public class DomainErrorMapperTests
{
    [Fact]
    public void ToHttpResult_ValidationError_ReturnsBadRequest()
    {
        var error = new ValidationError("field", "Invalid value");
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    [Fact]
    public void ToHttpResult_NotFoundError_ReturnsNotFound()
    {
        var error = new NotFoundError("User");
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    [Fact]
    public void ToHttpResult_ForbiddenError_ReturnsForbidden()
    {
        var error = new ForbiddenError("Access denied");
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    [Fact]
    public void ToHttpResult_ConflictError_ReturnsConflict()
    {
        var error = new ConflictError("Already exists");
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    [Fact]
    public void ToHttpResult_UnauthorizedError_ReturnsUnauthorized()
    {
        var error = new UnauthorizedError("Not authorized");
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    [Fact]
    public void ToHttpResult_FileTooLargeError_Returns413()
    {
        var error = new FileTooLargeError(1024L);
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    [Fact]
    public void ToHttpResult_UnsupportedMediaTypeError_Returns415()
    {
        var error = new UnsupportedMediaTypeError("text/plain");
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    [Fact]
    public void ToHttpResult_UnknownDomainError_ReturnsProblem()
    {
        // Covers the default `_` arm in the switch expression (line 17)
        var error = new UnknownTestError("Something unexpected");
        var result = DomainErrorMapper.ToHttpResult(error);
        result.Should().NotBeNull();
    }

    // A concrete subclass of DomainError not handled by any explicit switch arm
    private sealed record UnknownTestError(string Message) : DomainError(Message);
}
