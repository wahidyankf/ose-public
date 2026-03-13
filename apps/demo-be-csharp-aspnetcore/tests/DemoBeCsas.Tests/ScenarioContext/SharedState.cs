namespace DemoBeCsas.Tests.ScenarioContext;

/// <summary>
/// Holds scenario-scoped state shared between step definition classes.
/// LastResponse captures the result of the most recent service operation
/// as a status code and JSON body string — no HTTP transport involved.
/// </summary>
public class SharedState
{
    public ServiceResponse? LastResponse { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public Guid? LastCreatedId { get; set; }
    public string? LastCreatedUsername { get; set; }
    public string? LastResetToken { get; set; }
    public Guid? LastExpenseId { get; set; }
    public Guid? LastAttachmentId { get; set; }
}

/// <summary>
/// Lightweight response abstraction returned by ServiceLayer operations.
/// Maps domain outcomes to HTTP-equivalent status codes so that Gherkin
/// "Then the response status code should be N" steps work without HTTP.
/// </summary>
public sealed record ServiceResponse(int StatusCode, string Body)
{
    public bool IsSuccess => StatusCode is >= 200 and < 300;
}
