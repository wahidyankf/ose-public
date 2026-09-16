using System.Globalization;
using System.Net;
using System.Net.Sockets;
using FluentAssertions;
using Xunit;

namespace OseId.Be.E2E;

/// <summary>
/// Plain xUnit proof for specs/apps/ose/id-be/behaviours/foundation/local-stack.feature's
/// robustness properties that are implementation detail rather than developer-facing behaviour:
/// port collision refusal, failure-path cleanup, two backend instances, and two independent runs
/// never colliding. <see cref="LocalStackSteps" /> proves the one Gherkin scenario end to end;
/// this class proves the surrounding edges the same real runner must also get right. Like
/// <c>PersistenceRuntimeBoundaryTests</c> in the Integration adapter, it deliberately carries no
/// <c>[Binding]</c> attribute: nothing here is a step a scenario names.
/// <see cref="LocalStackRunnerProcess" /> owns the actual process lifecycle (spawn, marker
/// capture, signalling, disposal) shared with <see cref="LocalStackSteps" />; this class only
/// supplies port-allocation test inputs and the assertions specific to each robustness case.
/// </summary>
public sealed class LocalStackRunnerTests
{
    private const string ContainerPrefix = "ose-id-local-stack-pg-";
    private static readonly TimeSpan ReadinessBudget = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ShutdownBudget = TimeSpan.FromSeconds(30);

    [Fact]
    public async Task PortCollisionRefusesWithoutStartingAnything()
    {
        using var occupant = new TcpListener(IPAddress.Loopback, 0);
        occupant.Start();
        int occupiedPort = ((IPEndPoint)occupant.LocalEndpoint).Port;

        int[] freePorts = AllocateDistinctEphemeralPorts(2);

        using LocalStackRunnerProcess runner = LocalStackRunnerProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_ID_POSTGRES_PORT"] = occupiedPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_BE_PORT"] = freePorts[0].ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_WEB_PORT"] = freePorts[1].ToString(CultureInfo.InvariantCulture),
            }
        );

        bool exited = runner.Process.WaitForExit((int)ShutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(1, runner.Diagnostics);
        runner.Diagnostics.Should().Contain("port collision", runner.Diagnostics);

        // Refusing never means removing: the occupant this run never owned is still listening.
        occupant.Server.IsBound.Should().BeTrue();

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={ContainerPrefix}",
            "--format",
            "{{.Names}}",
        ]);
        listCode.Should().Be(0);
        listOutput.Should().BeEmpty("a refused run never starts a container");
    }

    [Fact]
    public async Task UnknownFixtureProfileFailsAfterReadinessAndCleansUpEverything()
    {
        int[] ports = AllocateDistinctEphemeralPorts(3);
        int postgresPort = ports[0];
        int backendPort = ports[1];
        int webPort = ports[2];

        using LocalStackRunnerProcess runner = LocalStackRunnerProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_ID_POSTGRES_PORT"] = postgresPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_BE_PORT"] = backendPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_WEB_PORT"] = webPort.ToString(CultureInfo.InvariantCulture),
            },
            extraArguments: ["--fixture-profile=bogus-profile"]
        );

        // No signal needed: the runner reaches full readiness, then its own fixture-profile
        // application throws for an unrecognised name, which must drive the same reverse
        // cleanup the SIGTERM path drives in LocalStackSteps — proving the catch-block cleanup
        // entry point, not just the signal-handler one.
        runner.WaitForMarker("web ready", ReadinessBudget);

        bool exited = runner.Process.WaitForExit((int)ShutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(1, runner.Diagnostics);
        runner.Diagnostics.Should().Contain("unknown --fixture-profile: bogus-profile", runner.Diagnostics);

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={ContainerPrefix}",
            "--format",
            "{{.Names}}",
        ]);
        listCode.Should().Be(0);
        listOutput.Should().BeEmpty(runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(postgresPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(backendPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(webPort).Should().BeFalse();
    }

    [Fact]
    public async Task TwoInstancesBothBackendsBecomeReadyAndBothStop()
    {
        (int backendPort, int secondBackendPort) = AllocateAdjacentFreePortPair();
        int[] otherPorts = AllocateDistinctEphemeralPorts(2, excluding: [backendPort, secondBackendPort]);
        int postgresPort = otherPorts[0];
        int webPort = otherPorts[1];

        using LocalStackRunnerProcess runner = LocalStackRunnerProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_ID_POSTGRES_PORT"] = postgresPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_BE_PORT"] = backendPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_WEB_PORT"] = webPort.ToString(CultureInfo.InvariantCulture),
            },
            extraArguments: ["--instances=2"]
        );

        runner.WaitForMarker("backend ready", ReadinessBudget);
        LocalStackRunnerProcess.IsListening(backendPort).Should().BeTrue(runner.Diagnostics);
        LocalStackRunnerProcess.IsListening(secondBackendPort).Should().BeTrue(runner.Diagnostics);

        runner.WaitForMarker("web ready", ReadinessBudget);

        runner.SendSigterm();
        bool exited = runner.Process.WaitForExit((int)ShutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(0, runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(backendPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(secondBackendPort).Should().BeFalse();

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={ContainerPrefix}",
            "--format",
            "{{.Names}}",
        ]);
        listCode.Should().Be(0);
        listOutput.Should().BeEmpty(runner.Diagnostics);
    }

    [Fact]
    public async Task TwoConcurrentRunsUseIndependentRunIdsAndBothCleanUpFully()
    {
        int[] ports = AllocateDistinctEphemeralPorts(6);
        int firstPostgresPort = ports[0];
        int firstBackendPort = ports[1];
        int firstWebPort = ports[2];
        int secondPostgresPort = ports[3];
        int secondBackendPort = ports[4];
        int secondWebPort = ports[5];

        using LocalStackRunnerProcess first = LocalStackRunnerProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_ID_POSTGRES_PORT"] = firstPostgresPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_BE_PORT"] = firstBackendPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_WEB_PORT"] = firstWebPort.ToString(CultureInfo.InvariantCulture),
            }
        );
        using LocalStackRunnerProcess second = LocalStackRunnerProcess.Start(
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["OSE_ID_POSTGRES_PORT"] = secondPostgresPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_BE_PORT"] = secondBackendPort.ToString(CultureInfo.InvariantCulture),
                ["OSE_ID_WEB_PORT"] = secondWebPort.ToString(CultureInfo.InvariantCulture),
            }
        );

        // Both runs proceed genuinely concurrently: neither WaitForMarker call below starts
        // before both processes already exist, so this proves independence, not sequencing.
        first.WaitForMarker("web ready", ReadinessBudget);
        second.WaitForMarker("web ready", ReadinessBudget);

        first.RunId.Should().NotBe(second.RunId, "two concurrent runs never share an identity");

        first.SendSigterm();
        second.SendSigterm();
        bool firstExited = first.Process.WaitForExit((int)ShutdownBudget.TotalMilliseconds);
        bool secondExited = second.Process.WaitForExit((int)ShutdownBudget.TotalMilliseconds);
        firstExited.Should().BeTrue(first.Diagnostics);
        secondExited.Should().BeTrue(second.Diagnostics);
        first.Process.ExitCode.Should().Be(0, first.Diagnostics);
        second.Process.ExitCode.Should().Be(0, second.Diagnostics);

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={ContainerPrefix}",
            "--format",
            "{{.Names}}",
        ]);
        listCode.Should().Be(0);
        listOutput.Should().BeEmpty($"{first.Diagnostics}\n{second.Diagnostics}");

        LocalStackRunnerProcess.IsListening(firstPostgresPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(firstBackendPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(firstWebPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(secondPostgresPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(secondBackendPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(secondWebPort).Should().BeFalse();
    }

    /// <summary>
    /// Binds <paramref name="count" /> listeners simultaneously so the OS can never hand out the
    /// same ephemeral port twice within one allocation, then releases them all together. A test
    /// needing several ports must never allocate them one bind-then-release call at a time:
    /// releasing the first before asking for the second reopens exactly the collision this
    /// method exists to prevent — a real defect this way once put two of a test's own roles on
    /// the identical port.
    /// </summary>
    private static int[] AllocateDistinctEphemeralPorts(int count, IReadOnlyCollection<int>? excluding = null)
    {
        var listeners = new List<TcpListener>(count);
        try
        {
            while (listeners.Count < count)
            {
                var listener = new TcpListener(IPAddress.Loopback, 0);
                listener.Start();
                int port = ((IPEndPoint)listener.LocalEndpoint).Port;
                if (excluding is not null && excluding.Contains(port))
                {
                    listener.Stop();
                    continue;
                }

                listeners.Add(listener);
            }

            return [.. listeners.Select(listener => ((IPEndPoint)listener.LocalEndpoint).Port)];
        }
        finally
        {
            foreach (TcpListener listener in listeners)
            {
                listener.Stop();
            }
        }
    }

    /// <summary>
    /// The runner derives a two-instance run's second backend port as <c>port + 1</c>; a test
    /// proving two instances needs a real adjacent pair, not two independently free ports that
    /// happen not to be adjacent. Bounded retries look for that pair; they are establishing a
    /// valid precondition, never retrying a flaky assertion about the code under test.
    /// </summary>
    private static (int First, int Second) AllocateAdjacentFreePortPair()
    {
        for (int attempt = 0; attempt < 20; attempt++)
        {
            int candidate = LocalStackRunnerProcess.AllocateEphemeralPort();
            if (IsPortBindable(candidate + 1))
            {
                return (candidate, candidate + 1);
            }
        }

        throw new InvalidOperationException("no adjacent free port pair was found after 20 attempts");
    }

    private static bool IsPortBindable(int port)
    {
        try
        {
            using var probe = new TcpListener(IPAddress.Loopback, port);
            probe.Start();
            probe.Stop();
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
    }
}
