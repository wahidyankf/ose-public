using DemoBeCsas.Domain;
using DemoBeCsas.Infrastructure.Repositories;

namespace DemoBeCsas.Endpoints;

public static class AttachmentEndpoints
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "application/pdf",
    ];

    public static IEndpointRouteBuilder MapAttachmentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/expenses/{expenseId}/attachments", UploadAttachmentAsync)
            .RequireAuthorization()
            .DisableAntiforgery();
        app.MapGet("/api/v1/expenses/{expenseId}/attachments", ListAttachmentsAsync)
            .RequireAuthorization();
        app.MapDelete(
                "/api/v1/expenses/{expenseId}/attachments/{attachmentId}",
                DeleteAttachmentAsync
            )
            .RequireAuthorization();
        return app;
    }

    private static async Task<IResult> UploadAttachmentAsync(
        HttpContext ctx,
        Guid expenseId,
        IFormFile? file,
        IExpenseRepository expenseRepo,
        IAttachmentRepository attachmentRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var expense = await expenseRepo.FindByIdAsync(expenseId, userId.Value, ct);
        if (expense is null)
        {
            return DomainErrorMapper.ToHttpResult(new ForbiddenError("Access denied"));
        }

        if (file is null)
        {
            return Results.BadRequest(new { message = "file is required" });
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            return DomainErrorMapper.ToHttpResult(new UnsupportedMediaTypeError(file.ContentType));
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return DomainErrorMapper.ToHttpResult(new FileTooLargeError(MaxFileSizeBytes));
        }

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        var data = ms.ToArray();

        var attachment = await attachmentRepo.CreateAsync(
            expenseId,
            file.FileName,
            file.ContentType,
            file.Length,
            data,
            ct
        );

        return Results.Created(
            $"/api/v1/expenses/{expenseId}/attachments/{attachment.Id}",
            new
            {
                id = attachment.Id,
                expense_id = attachment.ExpenseId,
                filename = attachment.Filename,
                contentType = attachment.ContentType,
                file_size_bytes = attachment.Size,
                url = $"/api/v1/expenses/{expenseId}/attachments/{attachment.Id}/download",
                created_at = attachment.CreatedAt,
            }
        );
    }

    private static async Task<IResult> ListAttachmentsAsync(
        HttpContext ctx,
        Guid expenseId,
        IExpenseRepository expenseRepo,
        IAttachmentRepository attachmentRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var expense = await expenseRepo.FindByIdAsync(expenseId, userId.Value, ct);
        if (expense is null)
        {
            return DomainErrorMapper.ToHttpResult(new ForbiddenError("Access denied"));
        }

        var attachments = await attachmentRepo.ListByExpenseAsync(expenseId, ct);
        return Results.Ok(
            new
            {
                attachments = attachments.Select(a => new
                {
                    id = a.Id,
                    expense_id = a.ExpenseId,
                    filename = a.Filename,
                    contentType = a.ContentType,
                    file_size_bytes = a.Size,
                    url = $"/api/v1/expenses/{expenseId}/attachments/{a.Id}/download",
                    created_at = a.CreatedAt,
                }),
            }
        );
    }

    private static async Task<IResult> DeleteAttachmentAsync(
        HttpContext ctx,
        Guid expenseId,
        Guid attachmentId,
        IExpenseRepository expenseRepo,
        IAttachmentRepository attachmentRepo,
        CancellationToken ct
    )
    {
        var userId = GetUserId(ctx);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var expense = await expenseRepo.FindByIdAsync(expenseId, userId.Value, ct);
        if (expense is null)
        {
            return DomainErrorMapper.ToHttpResult(new ForbiddenError("Access denied"));
        }

        var attachment = await attachmentRepo.FindByIdAsync(attachmentId, ct);
        if (attachment is null || attachment.ExpenseId != expenseId)
        {
            return DomainErrorMapper.ToHttpResult(new NotFoundError("Attachment"));
        }

        await attachmentRepo.DeleteAsync(attachmentId, ct);
        return Results.NoContent();
    }

    private static Guid? GetUserId(HttpContext ctx)
    {
        var sub = ctx.User.FindFirst(
            System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub
        )?.Value;
        return sub is not null && Guid.TryParse(sub, out var g) ? g : null;
    }
}
