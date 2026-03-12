namespace DemoBeCsas.Tests.ScenarioContext;

public class SharedState
{
    public HttpResponseMessage? LastResponse { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public Guid? LastCreatedId { get; set; }
    public string? LastCreatedUsername { get; set; }
    public string? LastResetToken { get; set; }
    public Guid? LastExpenseId { get; set; }
    public Guid? LastAttachmentId { get; set; }
}
