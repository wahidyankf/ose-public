namespace DemoBeCsas.Infrastructure.Models;

public class RevokedTokenModel
{
    public Guid Id { get; set; }
    public string Jti { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public DateTimeOffset RevokedAt { get; set; }
}
