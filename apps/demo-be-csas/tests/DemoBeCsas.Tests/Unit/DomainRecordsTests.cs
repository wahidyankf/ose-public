using DemoBeCsas.Domain;
using FluentAssertions;
using Xunit;

namespace DemoBeCsas.Tests.Unit;

[Trait("Category", "Unit")]
public class DomainRecordsTests
{
    [Fact]
    public void AttachmentDomain_CanBeConstructed()
    {
        var id = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var data = new byte[] { 1, 2, 3 };

        var attachment = new AttachmentDomain(id, expenseId, "file.png", "image/png", 3L, data, now);

        attachment.Id.Should().Be(id);
        attachment.ExpenseId.Should().Be(expenseId);
        attachment.FileName.Should().Be("file.png");
        attachment.ContentType.Should().Be("image/png");
        attachment.FileSizeBytes.Should().Be(3L);
        attachment.Data.Should().BeSameAs(data);
        attachment.CreatedAt.Should().Be(now);
    }

    [Fact]
    public void ExpenseDomain_CanBeConstructed()
    {
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var expense = new ExpenseDomain(
            id, userId, "Coffee", 5.50m, "USD", ExpenseType.Expense, "1.0", "liter", now, now, now
        );

        expense.Id.Should().Be(id);
        expense.UserId.Should().Be(userId);
        expense.Title.Should().Be("Coffee");
        expense.Amount.Should().Be(5.50m);
        expense.Currency.Should().Be("USD");
        expense.Type.Should().Be(ExpenseType.Expense);
        expense.Quantity.Should().Be("1.0");
        expense.Unit.Should().Be("liter");
        expense.Date.Should().Be(now);
        expense.CreatedAt.Should().Be(now);
        expense.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void UserDomain_CanBeConstructed()
    {
        var id = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var user = new UserDomain(
            id, "alice", "alice@example.com", "hash", "Alice", UserStatus.Active, Role.User, 0, now, now
        );

        user.Id.Should().Be(id);
        user.Username.Should().Be("alice");
        user.Email.Should().Be("alice@example.com");
        user.PasswordHash.Should().Be("hash");
        user.DisplayName.Should().Be("Alice");
        user.Status.Should().Be(UserStatus.Active);
        user.Role.Should().Be(Role.User);
        user.FailedLoginAttempts.Should().Be(0);
        user.CreatedAt.Should().Be(now);
        user.UpdatedAt.Should().Be(now);
    }

    [Fact]
    public void DomainErrors_CanBeConstructed()
    {
        var validation = new ValidationError("field", "message");
        var notFound = new NotFoundError("User");
        var forbidden = new ForbiddenError("Access denied");
        var conflict = new ConflictError("Already exists");
        var unauthorized = new UnauthorizedError("Not authorized");
        var fileTooLarge = new FileTooLargeError(1024L);
        var unsupportedMedia = new UnsupportedMediaTypeError("text/plain");

        validation.Field.Should().Be("field");
        validation.Message.Should().Be("message");
        notFound.Message.Should().Be("User not found");
        forbidden.Message.Should().Be("Access denied");
        conflict.Message.Should().Be("Already exists");
        unauthorized.Message.Should().Be("Not authorized");
        fileTooLarge.LimitBytes.Should().Be(1024L);
        fileTooLarge.Message.Should().Be("File size exceeds the maximum allowed limit");
        unsupportedMedia.Type.Should().Be("text/plain");
        unsupportedMedia.Message.Should().Be("Unsupported media type");
    }
}
