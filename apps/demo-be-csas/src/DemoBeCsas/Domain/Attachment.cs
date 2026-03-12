namespace DemoBeCsas.Domain;

public sealed record AttachmentDomain(
    Guid Id,
    Guid ExpenseId,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    byte[] Data,
    DateTimeOffset CreatedAt
);
