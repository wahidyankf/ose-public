using System.Globalization;

namespace OseId.Be.E2E;

/// <summary>
/// The one served ose-id-be instance the E2E adapter keeps alive for route evidence. The
/// reserved loopback port is a fixed reservation rather than an allocation, so exactly
/// one instance may hold it; sharing that instance is what makes the reservation
/// enforceable instead of a race between scenarios.
/// </summary>
public static class RunningBackend
{
    /// <summary>The port reserved for ose-id-be in docs/reference/web-sites.md.</summary>
    public const int ReservedPort = 8501;

    private static readonly Lazy<BackendProcess> _instance = new(StartServing, isThreadSafe: true);
    private static readonly Lazy<HttpClient> _sharedClient = new(
        () => new HttpClient { Timeout = TimeSpan.FromSeconds(30) },
        isThreadSafe: true
    );

    public static Uri BaseAddress { get; } =
        new($"http://127.0.0.1:{ReservedPort.ToString(CultureInfo.InvariantCulture)}");

    public static HttpClient Client => _sharedClient.Value;

    public static void EnsureServing() => _ = _instance.Value;

    /// <summary>Releases the served instance and its reserved port.</summary>
    public static void Stop()
    {
        if (_instance.IsValueCreated)
        {
            _instance.Value.Dispose();
        }

        if (_sharedClient.IsValueCreated)
        {
            _sharedClient.Value.Dispose();
        }
    }

    private static BackendProcess StartServing()
    {
        BackendProcess backend = BackendProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_RUNTIME_MODE"] = "Test",
                ["OSE_ID_BE_PORT"] = ReservedPort.ToString(CultureInfo.InvariantCulture),
                // Syntactically valid so host registration never throws; this shared
                // instance serves only the disabled-capability and runtime-mode
                // scenarios, none of which read readiness, so its unreachability never
                // matters. A real, owned PostgreSQL is HealthProcessSteps's instance.
                ["OSE_ID_CONNECTION"] =
                    "Host=127.0.0.1;Port=1;Database=ose_id;Username=ose_id_test;Password=ose_id_test",
            }
        );

        if (!backend.WaitForListener(ReservedPort, TimeSpan.FromSeconds(60)))
        {
            string diagnostics = backend.StandardError + backend.StandardOutput;
            backend.Dispose();
            throw new InvalidOperationException(
                $"ose-id-be did not bind 127.0.0.1:{ReservedPort} within its startup budget: {diagnostics}"
            );
        }

        return backend;
    }
}
