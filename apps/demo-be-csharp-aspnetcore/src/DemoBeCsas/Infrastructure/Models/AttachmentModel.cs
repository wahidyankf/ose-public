namespace DemoBeCsas.Infrastructure.Models;

public class AttachmentModel
{
    public Guid Id { get; set; }
    public Guid ExpenseId { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public byte[] Data { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; }
}
