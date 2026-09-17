using OseId.Application.Foundation.Ports;
using OseId.Domain.Correlation;

namespace OseId.Be.Unit;

/// <summary>
/// In-process double for the one outbound port a disabled-capability rejection may
/// use. It records every call so a test can assert that a rejection reaches nothing
/// else, and it returns a fixed value so no test depends on a random identifier.
/// </summary>
public sealed class RecordingCorrelationIdFactory : ICorrelationIdFactory
{
    public const string FixedValue = "corr_0000000000000000000000000000000f";

    public int CreatedCount { get; private set; }

    public CorrelationId Create()
    {
        CreatedCount++;
        return CorrelationId.Accept(FixedValue);
    }
}
