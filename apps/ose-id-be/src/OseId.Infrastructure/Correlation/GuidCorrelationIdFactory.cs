using System.Globalization;
using OseId.Application.Foundation.Ports;
using OseId.Domain.Correlation;

namespace OseId.Infrastructure.Correlation;

/// <summary>
/// Outbound adapter that mints correlation values. The value is opaque and carries no
/// tenant, account, host, or timing fact, so publishing it in a header and a log line
/// tells an observer only that two records belong together.
/// </summary>
public sealed class GuidCorrelationIdFactory : ICorrelationIdFactory
{
    private const string _prefix = "corr_";

    /// <inheritdoc />
    public CorrelationId Create() =>
        CorrelationId.Accept(_prefix + Guid.NewGuid().ToString("N", CultureInfo.InvariantCulture));
}
