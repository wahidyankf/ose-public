using System.Globalization;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using OseId.Host;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for specs/apps/ose/id-be/behaviours/foundation/local-stack.feature. It
/// proves the host/runner composition contract the local-stack runner
/// (apps/ose-id-be-e2e/scripts/local-stack.mjs) depends on: that <c>OSE_ID_BE_PORT</c> alone
/// decides the backend's declared loopback listener origin, and that the delivered host stops
/// synchronously and cleanly when asked. Docker, PostgreSQL, the published executable, and the
/// web shell are the E2E adapter's obligation; this binding never starts a container or a built
/// process.
/// </summary>
[Binding]
public sealed class LocalStackCompositionSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/local-stack.feature";

    // The port the documented local-stack default reserves for ose-id-be
    // (docs/reference/web-sites.md), the same value local-stack.mjs falls back to.
    private const int DocumentedBackendPort = 8501;

    private string? _resolvedOrigin;
    private TestHostFixture? _host;

    [Given("the documented local prerequisites are available and no OSE ID resources are running")]
    public static void GivenTheDocumentedLocalPrerequisitesAreAvailableAndNoOseIdResourcesAreRunning()
    {
        // Nothing to arrange: the property under test is the composition contract the runner
        // depends on (a port flowing through configuration to a bound listener origin), true
        // regardless of the host's current resource state.
    }

    [When("the developer starts OSE ID locally")]
    public void WhenTheDeveloperStartsOseIdLocally()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    [RuntimeModeConfiguration.PortKey] = DocumentedBackendPort.ToString(CultureInfo.InvariantCulture),
                }
            )
            .Build();

        _resolvedOrigin = OseIdHost.ListenerOrigin(configuration);
        _host = TestHostFixture.Start();
    }

    [Then("PostgreSQL, the migrated backend, and the web shell become ready in dependency order")]
    public void ThenPostgreSqlTheMigratedBackendAndTheWebShellBecomeReadyInDependencyOrder()
    {
        // PostgreSQL and the web shell are owned by Docker and the built Next.js process,
        // neither of which exists at this tier. The composition contract this tier can prove
        // is that the exact environment variable the runner sets is the only thing deciding
        // where the backend listens, and that it always resolves to loopback.
        _resolvedOrigin
            .Should()
            .Be($"http://127.0.0.1:{DocumentedBackendPort.ToString(CultureInfo.InvariantCulture)}", Feature);
    }

    [Then("stopping the runner leaves no owned process, container, network, volume, or port reservation")]
    public void ThenStoppingTheRunnerLeavesNoOwnedProcessContainerNetworkVolumeOrPortReservation()
    {
        // Containers, volumes, and real ports are the E2E adapter's obligation. The composition
        // contract this tier can prove is that the delivered host stops synchronously and
        // cleanly when asked — the same property the runner's SIGTERM handler depends on to
        // observe a real process exit rather than a hang.
        Action stop = () => _host!.Dispose();
        stop.Should().NotThrow(Feature);
        _host = null;
    }

    public void Dispose() => _host?.Dispose();
}
