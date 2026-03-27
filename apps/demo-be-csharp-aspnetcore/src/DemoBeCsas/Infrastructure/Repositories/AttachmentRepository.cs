using DemoBeCsas.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace DemoBeCsas.Infrastructure.Repositories;

public interface IAttachmentRepository
{
    Task<AttachmentModel> CreateAsync(
        Guid expenseId,
        string filename,
        string contentType,
        long size,
        byte[] data,
        CancellationToken ct = default
    );
    Task<IReadOnlyList<AttachmentModel>> ListByExpenseAsync(
        Guid expenseId,
        CancellationToken ct = default
    );
    Task<AttachmentModel?> FindByIdAsync(Guid attachmentId, CancellationToken ct = default);
    Task DeleteAsync(Guid attachmentId, CancellationToken ct = default);
}

public class AttachmentRepository(AppDbContext db) : IAttachmentRepository
{
    public async Task<AttachmentModel> CreateAsync(
        Guid expenseId,
        string filename,
        string contentType,
        long size,
        byte[] data,
        CancellationToken ct = default
    )
    {
        var attachment = new AttachmentModel
        {
            Id = Guid.NewGuid(),
            ExpenseId = expenseId,
            Filename = filename,
            ContentType = contentType,
            Size = size,
            Data = data,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Attachments.Add(attachment);
        await db.SaveChangesAsync(ct);
        return attachment;
    }

    public async Task<IReadOnlyList<AttachmentModel>> ListByExpenseAsync(
        Guid expenseId,
        CancellationToken ct = default
    )
    {
        // Use client-side sort to avoid SQLite DateTimeOffset ORDER BY translation issue
        var items = await db.Attachments.Where(a => a.ExpenseId == expenseId).ToListAsync(ct);
        return items.OrderBy(a => a.CreatedAt).ToList();
    }

    public Task<AttachmentModel?> FindByIdAsync(
        Guid attachmentId,
        CancellationToken ct = default
    ) => db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId, ct);

    public async Task DeleteAsync(Guid attachmentId, CancellationToken ct = default)
    {
        var attachment = await db.Attachments.FirstAsync(a => a.Id == attachmentId, ct);
        db.Attachments.Remove(attachment);
        await db.SaveChangesAsync(ct);
    }
}
