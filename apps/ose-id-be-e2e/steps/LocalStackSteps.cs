using System.Globalization;
using FluentAssertions;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for specs/apps/ose/id-be/behaviours/foundation/local-stack.feature. It runs the
/// real local-stack runner (apps/ose-id-be-e2e/scripts/local-stack.mjs) exactly as a developer
/// would: one process that owns a real PostgreSQL container, the published backend, and the
/// built web shell, in that order, then a real SIGTERM that must stop all three in reverse and
/// leave nothing behind. Every other E2E binding proves a slice of the delivered system through
/// its own owned resources; this is the one binding that proves the delivered runner itself.
/// <see cref="LocalStackRunnerProcess" /> owns the actual process lifecycle (spawn, marker
/// capture, signalling, disposal) shared with the plain-xUnit robustness suite in
/// <c>LocalStackRunnerTests</c>; this binding only supplies the Gherkin-facing assertions.
/// </summary>
[Binding]
public sealed class LocalStackSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/local-stack.feature";
    private const string ContainerPrefix = "ose-id-local-stack-pg-";

    private static readonly TimeSpan ReadinessBudget = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ShutdownBudget = TimeSpan.FromSeconds(30);

    private int _postgresPort;
    private int _backendPort;
    private int _webPort;
    private LocalStackRunnerProcess? _runner;

    [Given("the documented local prerequisites are available and no OSE ID resources are running")]
    public void GivenTheDocumentedLocalPrerequisitesAreAvailableAndNoOseIdResourcesAreRunning()
    {
        _postgresPort = LocalStackRunnerProcess.AllocateEphemeralPort();
        _backendPort = LocalStackRunnerProcess.AllocateEphemeralPort();
        _webPort = LocalStackRunnerProcess.AllocateEphemeralPort();

        LocalStackRunnerProcess.IsListening(_postgresPort).Should().BeFalse(Feature);
        LocalStackRunnerProcess.IsListening(_backendPort).Should().BeFalse(Feature);
        LocalStackRunnerProcess.IsListening(_webPort).Should().BeFalse(Feature);
    }

    [When("the developer starts OSE ID locally")]
    public void WhenTheDeveloperStartsOseIdLocally()
    {
        _runner = LocalStackRunnerProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_ID_POSTGRES_PORT"] = _postgresPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_BE_PORT"] = _backendPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_WEB_PORT"] = _webPort.ToString(CultureInfo.InvariantCulture),
            }
        );
    }

    [Then("PostgreSQL, the migrated backend, and the web shell become ready in dependency order")]
    public void ThenPostgreSqlTheMigratedBackendAndTheWebShellBecomeReadyInDependencyOrder()
    {
        LocalStackRunnerProcess runner = _runner!;
        runner.WaitForMarker("postgres ready", ReadinessBudget);
        runner.WaitForMarker("backend ready", ReadinessBudget);
        runner.WaitForMarker("web ready", ReadinessBudget);

        List<string> order = [.. runner.Markers];
        int postgresIndex = order.FindIndex(marker => marker.StartsWith("postgres ready", StringComparison.Ordinal));
        int backendIndex = order.FindIndex(marker => marker.StartsWith("backend ready", StringComparison.Ordinal));
        int webIndex = order.FindIndex(marker => marker.StartsWith("web ready", StringComparison.Ordinal));

        postgresIndex.Should().BeGreaterThanOrEqualTo(0, Feature);
        backendIndex.Should().BeGreaterThan(postgresIndex, Feature);
        webIndex.Should().BeGreaterThan(backendIndex, Feature);
    }

    [Then("stopping the runner leaves no owned process, container, network, volume, or port reservation")]
    public void ThenStoppingTheRunnerLeavesNoOwnedProcessContainerNetworkVolumeOrPortReservation()
    {
        LocalStackRunnerProcess runner = _runner!;
        runner.SendSigterm();

        bool exited = runner.Process.WaitForExit((int)ShutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue($"{Feature}: {runner.Diagnostics}");
        runner.Process.ExitCode.Should().Be(0, $"{Feature}: {runner.Diagnostics}");

        (int listCode, string listOutput) = LocalStackRunnerProcess.Docker(
            ["ps", "-a", "--filter", $"name={ContainerPrefix}", "--format", "{{.Names}}"],
            TimeSpan.FromSeconds(30)
        );
        listCode.Should().Be(0, Feature);
        listOutput.Should().BeEmpty(Feature);

        LocalStackRunnerProcess.IsListening(_postgresPort).Should().BeFalse(Feature);
        LocalStackRunnerProcess.IsListening(_backendPort).Should().BeFalse(Feature);
        LocalStackRunnerProcess.IsListening(_webPort).Should().BeFalse(Feature);
    }

    public void Dispose() => _runner?.Dispose();
}
