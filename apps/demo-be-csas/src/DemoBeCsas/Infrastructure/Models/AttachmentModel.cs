namespace DemoBeCsas.Infrastructure.Models;

public class AttachmentModel
{
    public Guid Id { get; set; }
    public Guid ExpenseId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public byte[] Data { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; }
}
