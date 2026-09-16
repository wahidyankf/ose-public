using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace OseId.Be.E2E;

/// <summary>
/// Owns one spawned <c>apps/ose-id-be-e2e/scripts/local-stack.mjs</c> process end to end: starting
/// it, capturing its diagnostic output and readiness markers in order, signalling it, and disposing
/// it gracefully-then-forcefully. Both the Gherkin-bound <see cref="LocalStackSteps" /> and the
/// plain-xUnit <c>LocalStackRunnerTests</c> robustness suite drive the same real runner the same
/// way; this class is the one place that owns *how*, so neither duplicates the other's process
/// lifecycle, signal handling, marker parsing, repository-root discovery, or disposal safety net.
/// Network/container use (docker, sockets) stays here in the E2E project, never moved into Unit or
/// Integration — only the duplication across these two E2E files is what this class removes.
/// </summary>
internal sealed class LocalStackRunnerProcess : IDisposable
{
    private static readonly TimeSpan ShutdownBudget = TimeSpan.FromSeconds(30);

    // Volta's "node" shim on PATH does not exec-replace itself with the pinned interpreter; it
    // spawns the real node as a separate, independently-PID'd process and the shim's own PID can
    // outlive or detach from it. Signalling the shim's PID (what a bare ProcessStartInfo("node")
    // would hand back) never reaches the script's SIGTERM handler, so the shim dies with the
    // signal's raw default disposition (exit 143) while the real interpreter — and everything it
    // owns — is silently orphaned. Resolving the pinned interpreter's real path up front makes
    // Process.Id the PID that actually runs the script.
    private static readonly Lazy<string> NodeExecutablePath = new(ResolveNodeExecutablePath);

    private readonly List<string> _markers = [];
    private readonly StringBuilder _diagnostics = new();
    private readonly object _sync = new();

    private LocalStackRunnerProcess(Process process) => Process = process;

    public Process Process { get; }

    public string RunId { get; private set; } = string.Empty;

    public string Diagnostics
    {
        get
        {
            lock (_sync)
            {
                return _diagnostics.ToString();
            }
        }
    }

    /// <summary>Readiness markers (e.g. "postgres ready") in the order the runner reported them.</summary>
    public IReadOnlyList<string> Markers
    {
        get
        {
            lock (_sync)
            {
                return [.. _markers];
            }
        }
    }

    public static LocalStackRunnerProcess Start(
        IReadOnlyDictionary<string, string> environment,
        IReadOnlyList<string>? extraArguments = null
    )
    {
        string repositoryRoot = RepositoryRoot();
        string script = Path.Combine(repositoryRoot, "apps", "ose-id-be-e2e", "scripts", "local-stack.mjs");

        var startInfo = new ProcessStartInfo(NodeExecutablePath.Value)
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            WorkingDirectory = repositoryRoot,
        };
        startInfo.ArgumentList.Add(script);
        foreach (string argument in extraArguments ?? [])
        {
            startInfo.ArgumentList.Add(argument);
        }

        foreach ((string name, string value) in environment)
        {
            startInfo.Environment[name] = value;
        }

        Process process =
            Process.Start(startInfo) ?? throw new InvalidOperationException("the local-stack runner did not start");

        var handle = new LocalStackRunnerProcess(process);
        process.OutputDataReceived += (_, args) => handle.RecordLine(args.Data);
        process.ErrorDataReceived += (_, args) => handle.RecordLine(args.Data);
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        return handle;
    }

    public void WaitForMarker(string markerPrefix, TimeSpan budget)
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow + budget;
        while (DateTimeOffset.UtcNow < deadline)
        {
            if (Markers.Any(marker => marker.StartsWith(markerPrefix, StringComparison.Ordinal)))
            {
                return;
            }

            if (Process.HasExited)
            {
                break;
            }

            Thread.Sleep(100);
        }

        throw new TimeoutException(
            $"the local-stack runner never reported \"{markerPrefix}\" within {budget.TotalSeconds:F0}s: {Diagnostics}"
        );
    }

    public void SendSigterm()
    {
        var startInfo = new ProcessStartInfo("kill")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
        };
        startInfo.ArgumentList.Add("-TERM");
        startInfo.ArgumentList.Add(Process.Id.ToString(CultureInfo.InvariantCulture));

        using Process kill =
            Process.Start(startInfo) ?? throw new InvalidOperationException("the kill command did not start");
        string diagnostics = kill.StandardError.ReadToEnd() + kill.StandardOutput.ReadToEnd();
        kill.WaitForExit();

        if (kill.ExitCode != 0)
        {
            throw new InvalidOperationException($"sending SIGTERM to pid {Process.Id} failed: {diagnostics}");
        }
    }

    public void Dispose()
    {
        if (!Process.HasExited)
        {
            // A failed assertion or a timed-out wait must still leave no owned resource behind.
            // Asking nicely first gives the runner's own SIGTERM handler the chance to stop and
            // remove its PostgreSQL container; force-killing straight away would orphan it.
            try
            {
                SendSigterm();
            }
            catch
            {
                // The graceful attempt is best-effort; the force-kill below is the real guarantee.
            }

            if (!Process.WaitForExit((int)ShutdownBudget.TotalMilliseconds))
            {
                Process.Kill(entireProcessTree: true);
                Process.WaitForExit();
            }
        }

        Process.Dispose();
    }

    private void RecordLine(string? line)
    {
        if (line is null)
        {
            return;
        }

        lock (_sync)
        {
            _diagnostics.AppendLine(line);
        }

        // The runner labels every lifecycle line "[local-stack <runId>] <message>"; only the
        // message matters for marker matching, and the runId is captured once from the first line.
        if (!line.StartsWith("[local-stack ", StringComparison.Ordinal))
        {
            return;
        }

        int closingBracket = line.IndexOf(']');
        if (closingBracket <= "[local-stack ".Length)
        {
            return;
        }

        if (RunId.Length == 0)
        {
            RunId = line["[local-stack ".Length..closingBracket];
        }

        lock (_sync)
        {
            _markers.Add(line[(closingBracket + 2)..]);
        }
    }

    public static bool IsListening(int port)
    {
        try
        {
            using var probe = new TcpClient();
            probe.Connect("127.0.0.1", port);
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
    }

    public static int AllocateEphemeralPort()
    {
        using var probe = new TcpListener(IPAddress.Loopback, 0);
        probe.Start();
        int port = ((IPEndPoint)probe.LocalEndpoint).Port;
        probe.Stop();
        return port;
    }

    public static (int ExitCode, string Output) Docker(IReadOnlyList<string> arguments, TimeSpan timeout)
    {
        var startInfo = new ProcessStartInfo("docker")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
        };
        foreach (string argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using Process process =
            Process.Start(startInfo) ?? throw new InvalidOperationException("the docker command did not start");
        string output = process.StandardOutput.ReadToEnd();
        string error = process.StandardError.ReadToEnd();

        if (!process.WaitForExit((int)timeout.TotalMilliseconds))
        {
            process.Kill(entireProcessTree: true);
            throw new TimeoutException($"a docker command exceeded {timeout.TotalSeconds:F0}s");
        }

        return (process.ExitCode, (output + error).Trim());
    }

    public static async Task<(int ExitCode, string Output)> DockerAsync(IReadOnlyList<string> arguments)
    {
        var startInfo = new ProcessStartInfo("docker")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
        };
        foreach (string argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using Process process =
            Process.Start(startInfo) ?? throw new InvalidOperationException("the docker command did not start");
        string output = await process.StandardOutput.ReadToEndAsync().ConfigureAwait(false);
        string error = await process.StandardError.ReadToEndAsync().ConfigureAwait(false);
        await process.WaitForExitAsync().ConfigureAwait(false);

        return (process.ExitCode, (output + error).Trim());
    }

    private static string RepositoryRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);
        while (directory is not null)
        {
            string marker = Path.Combine(directory.FullName, "apps", "ose-id-be-e2e", "scripts", "local-stack.mjs");
            if (File.Exists(marker))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException("the repository root containing apps/ose-id-be-e2e was not found");
    }

    private static string ResolveNodeExecutablePath()
    {
        try
        {
            var startInfo = new ProcessStartInfo("volta")
            {
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
            };
            startInfo.ArgumentList.Add("which");
            startInfo.ArgumentList.Add("node");

            using Process? volta = Process.Start(startInfo);
            if (volta is null)
            {
                return "node";
            }

            string output = volta.StandardOutput.ReadToEnd().Trim();
            volta.StandardError.ReadToEnd();
            volta.WaitForExit();

            return volta.ExitCode == 0 && File.Exists(output) ? output : "node";
        }
        catch (Exception error) when (error is InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            // No Volta on PATH (e.g. a non-Volta CI image): the plain command name is the
            // interpreter itself there, so the shim-detachment problem this resolves does not
            // apply.
            return "node";
        }
    }
}
