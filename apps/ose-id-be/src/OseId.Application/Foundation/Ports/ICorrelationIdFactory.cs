using OseId.Domain.Correlation;

namespace OseId.Application.Foundation.Ports;

/// <summary>
/// Outbound port for minting a correlation value. Generating one is a side effect — it
/// consumes entropy and is not reproducible — so the application declares the port and an
/// infrastructure adapter implements it, which is also what lets a test observe every
/// call a use case makes.
/// </summary>
public interface ICorrelationIdFactory
{
    /// <summary>Mints a fresh correlation value.</summary>
    CorrelationId Create();
}
