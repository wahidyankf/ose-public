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
    private const string _containerPrefix = "ose-id-local-stack-pg-";
    private static readonly TimeSpan _readinessBudget = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan _shutdownBudget = TimeSpan.FromSeconds(30);

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

        bool exited = runner.Process.WaitForExit((int)_shutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(1, runner.Diagnostics);
        runner.Diagnostics.Should().Contain("port collision", runner.Diagnostics);

        // Refusing never means removing: the occupant this run never owned is still listening.
        occupant.Server.IsBound.Should().BeTrue();

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={_containerPrefix}",
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
        runner.WaitForMarker("web ready", _readinessBudget);

        bool exited = runner.Process.WaitForExit((int)_shutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(1, runner.Diagnostics);
        runner.Diagnostics.Should().Contain("unknown --fixture-profile: bogus-profile", runner.Diagnostics);

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={_containerPrefix}",
            "--format",
            "{{.Names}}",
        ]);
        listCode.Should().Be(0);
        listOutput.Should().BeEmpty(runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(postgresPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(backendPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(webPort).Should().BeFalse();
    }

    /// <summary>
    /// The window this proves is between a stage's process being spawned and that stage reporting
    /// itself ready. The process is already owned there, so a readiness failure must still stop it
    /// and still remove the run-scoped build output it was started from. Cleanup that decides what
    /// to tear down from how far startup *succeeded* skips both: the just-spawned backend outlives
    /// the run holding its port — which the next invocation's port-collision guard then refuses to
    /// start against — and <c>apps/ose-id-be/dist/local-stack/&lt;runId&gt;/</c> is left behind with
    /// no sweep anywhere in the repo that would ever remove it.
    ///
    /// The window is reached through the runner's fixture-profile seam, which fails this readiness
    /// wait the instant the instance is spawned, rather than by racing its real minute-long
    /// readiness budget: the assertions below observe a process table and a filesystem that the
    /// runner's own exit has already settled, never a timing coincidence.
    /// </summary>
    [Fact]
    public async Task BackendReadinessFailureStillStopsTheSpawnedBackendAndRemovesItsRunOutput()
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
            extraArguments: ["--fixture-profile=foundation-backend-readiness-fails"]
        );

        // Getting this far is what makes the failure below a *mid-startup* one: the run already
        // owns a real container, and it publishes and spawns a real backend before failing.
        runner.WaitForMarker("postgres ready", _readinessBudget);

        bool exited = runner.Process.WaitForExit((int)_readinessBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(1, runner.Diagnostics);
        runner.RunId.Should().NotBeEmpty(runner.Diagnostics);
        runner
            .Diagnostics.Should()
            .Contain(
                $"ose-id-be at http://127.0.0.1:{backendPort.ToString(CultureInfo.InvariantCulture)}",
                runner.Diagnostics
            )
            .And.Contain("did not become ready (forced by --fixture-profile)", runner.Diagnostics);

        // That message is raised only after the publish returned an entry point and that entry
        // point was spawned, so both the listening backend and the run-scoped output directory
        // below certainly existed moments earlier: their absence now is cleanup's own doing.
        LocalStackRunnerProcess.IsListening(backendPort).Should().BeFalse(runner.Diagnostics);
        Directory.Exists(BackendRunDirectory(runner.RunId)).Should().BeFalse(runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(postgresPort).Should().BeFalse(runner.Diagnostics);
        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={_containerPrefix}",
            "--format",
            "{{.Names}}",
        ]);
        listCode.Should().Be(0);
        listOutput.Should().BeEmpty(runner.Diagnostics);
    }

    /// <summary>
    /// The same spawned-but-not-yet-ready window, one stage later: the web process is spawned
    /// before its readiness wait, and <c>next build</c> writes
    /// <c>apps/ose-id-web/.next/local-stack-runs/&lt;runId&gt;/</c> before either. A failure there
    /// must leave neither the process on its port nor that directory — nor the backend stage's own
    /// output, which the same run still owns.
    /// </summary>
    [Fact]
    public async Task WebReadinessFailureStillStopsTheSpawnedWebProcessAndRemovesBothRunOutputs()
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
            extraArguments: ["--fixture-profile=foundation-web-readiness-fails"]
        );

        // The backend stage must complete for the web stage to be reached at all; this marker is
        // what pins the forced failure below to the web stage specifically.
        runner.WaitForMarker("backend ready", _readinessBudget);

        bool exited = runner.Process.WaitForExit((int)_readinessBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(1, runner.Diagnostics);
        runner.RunId.Should().NotBeEmpty(runner.Diagnostics);
        runner
            .Diagnostics.Should()
            .Contain(
                $"ose-id-web at http://127.0.0.1:{webPort.ToString(CultureInfo.InvariantCulture)}",
                runner.Diagnostics
            )
            .And.Contain("did not become ready (forced by --fixture-profile)", runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(webPort).Should().BeFalse(runner.Diagnostics);
        Directory.Exists(WebDistDirectory(runner.RunId)).Should().BeFalse(runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(backendPort).Should().BeFalse(runner.Diagnostics);
        Directory.Exists(BackendRunDirectory(runner.RunId)).Should().BeFalse(runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(postgresPort).Should().BeFalse(runner.Diagnostics);
        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={_containerPrefix}",
            "--format",
            "{{.Names}}",
        ]);
        listCode.Should().Be(0);
        listOutput.Should().BeEmpty(runner.Diagnostics);
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

        runner.WaitForMarker("backend ready", _readinessBudget);
        LocalStackRunnerProcess.IsListening(backendPort).Should().BeTrue(runner.Diagnostics);
        LocalStackRunnerProcess.IsListening(secondBackendPort).Should().BeTrue(runner.Diagnostics);

        runner.WaitForMarker("web ready", _readinessBudget);

        runner.SendSigterm();
        bool exited = runner.Process.WaitForExit((int)_shutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(0, runner.Diagnostics);

        LocalStackRunnerProcess.IsListening(backendPort).Should().BeFalse();
        LocalStackRunnerProcess.IsListening(secondBackendPort).Should().BeFalse();

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={_containerPrefix}",
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
        first.WaitForMarker("web ready", _readinessBudget);
        second.WaitForMarker("web ready", _readinessBudget);

        first.RunId.Should().NotBe(second.RunId, "two concurrent runs never share an identity");

        first.SendSigterm();
        second.SendSigterm();
        bool firstExited = first.Process.WaitForExit((int)_shutdownBudget.TotalMilliseconds);
        bool secondExited = second.Process.WaitForExit((int)_shutdownBudget.TotalMilliseconds);
        firstExited.Should().BeTrue(first.Diagnostics);
        secondExited.Should().BeTrue(second.Diagnostics);
        first.Process.ExitCode.Should().Be(0, first.Diagnostics);
        second.Process.ExitCode.Should().Be(0, second.Diagnostics);

        (int listCode, string listOutput) = await LocalStackRunnerProcess.DockerAsync([
            "ps",
            "-a",
            "--filter",
            $"name={_containerPrefix}",
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

    [Fact]
    public async Task CleanupRestoresWebTsconfigToItsPreRunContent()
    {
        string tsconfigPath = Path.Combine(
            LocalStackRunnerProcess.RepositoryRoot(),
            "apps",
            "ose-id-web",
            "tsconfig.json"
        );
        string beforeContent = await File.ReadAllTextAsync(tsconfigPath, TestContext.Current.CancellationToken);

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
            }
        );

        runner.WaitForMarker("web ready", _readinessBudget);

        // Proves this is a real before/after comparison, not one that would pass even if
        // cleanup never touched the file: the readiness build itself must have appended this
        // run's own two entries to the tracked tsconfig.json first.
        string duringContent = await File.ReadAllTextAsync(tsconfigPath, TestContext.Current.CancellationToken);
        duringContent.Should().Contain(runner.RunId, "the build that reached readiness appends this run's own entries");

        runner.SendSigterm();
        bool exited = runner.Process.WaitForExit((int)_shutdownBudget.TotalMilliseconds);
        exited.Should().BeTrue(runner.Diagnostics);
        runner.Process.ExitCode.Should().Be(0, runner.Diagnostics);

        string afterContent = await File.ReadAllTextAsync(tsconfigPath, TestContext.Current.CancellationToken);
        afterContent
            .Should()
            .Be(beforeContent, "cleanup must prune this run's own entries back to the pre-run content");
    }

    /// <summary>
    /// Where the runner puts everything the backend stage writes for one run: the published
    /// executable and the MSBuild intermediate/binary output that produced it, both scoped to the
    /// run ID so concurrent invocations from this checkout never share either.
    /// </summary>
    private static string BackendRunDirectory(string runId) =>
        Path.Combine(LocalStackRunnerProcess.RepositoryRoot(), "apps", "ose-id-be", "dist", "local-stack", runId);

    /// <summary>The run-scoped Next build output, nested inside the already-ignored .next/.</summary>
    private static string WebDistDirectory(string runId) =>
        Path.Combine(
            LocalStackRunnerProcess.RepositoryRoot(),
            "apps",
            "ose-id-web",
            ".next",
            "local-stack-runs",
            runId
        );

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
