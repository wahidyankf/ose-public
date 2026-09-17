using System.Diagnostics;
using System.Net.Sockets;
using System.Text;

namespace OseId.Be.E2E;

/// <summary>
/// Owns the public process boundary of ose-id-be for the E2E adapter: it publishes the
/// deployable output once per test assembly, launches it with an explicit environment,
/// and exposes only what an outside observer can see — the exit code, the diagnostic
/// stream, and whether a loopback listener exists.
/// </summary>
public sealed class BackendProcess : IDisposable
{
    private static readonly Lazy<string> _publishedEntryPoint = new(Publish, isThreadSafe: true);
    private static readonly Lazy<string> _repositoryRootDirectory = new(RepositoryRoot, isThreadSafe: true);

    /// <summary>The absolute repository path, so a test can prove it never leaked.</summary>
    public static string RepositoryRootPath => _repositoryRootDirectory.Value;

    private readonly Process _process;
    private readonly StringBuilder _standardError = new();
    private readonly StringBuilder _standardOutput = new();

    private BackendProcess(Process process) => _process = process;

    public string StandardError
    {
        get
        {
            lock (_standardError)
            {
                return _standardError.ToString();
            }
        }
    }

    public string StandardOutput
    {
        get
        {
            lock (_standardOutput)
            {
                return _standardOutput.ToString();
            }
        }
    }

    public int ExitCode => _process.ExitCode;

    public static BackendProcess Start(IReadOnlyDictionary<string, string> environment)
    {
        ArgumentNullException.ThrowIfNull(environment);

        var startInfo = new ProcessStartInfo("dotnet")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
        };
        startInfo.ArgumentList.Add(_publishedEntryPoint.Value);

        // A published host must not inherit an ambient mode from the developer shell.
        startInfo.Environment.Remove("OSE_RUNTIME_MODE");
        startInfo.Environment.Remove("OSE_ID_BE_PORT");
        foreach ((string name, string value) in environment)
        {
            startInfo.Environment[name] = value;
        }

        Process process =
            Process.Start(startInfo)
            ?? throw new InvalidOperationException("the published ose-id-be host did not start");

        var started = new BackendProcess(process);
        process.ErrorDataReceived += (_, args) => Append(started._standardError, args.Data);
        process.OutputDataReceived += (_, args) => Append(started._standardOutput, args.Data);
        process.BeginErrorReadLine();
        process.BeginOutputReadLine();

        return started;
    }

    public bool WaitForExit(TimeSpan timeout) => _process.WaitForExit(timeout);

    public bool HasExited => _process.HasExited;

    /// <summary>
    /// Waits until the host accepts a loopback connection on <paramref name="port" />.
    /// This is a startup barrier, not a retry: a host that never listens fails the test
    /// with the elapsed budget rather than being tried again.
    /// </summary>
    public bool WaitForListener(int port, TimeSpan budget)
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow + budget;
        while (DateTimeOffset.UtcNow < deadline)
        {
            if (_process.HasExited)
            {
                return false;
            }

            if (IsListening(port))
            {
                return true;
            }

            Thread.Sleep(50);
        }

        return false;
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

    public void Dispose()
    {
        if (!_process.HasExited)
        {
            _process.Kill(entireProcessTree: true);
            _process.WaitForExit();
        }

        _process.Dispose();
    }

    private static void Append(StringBuilder target, string? line)
    {
        if (line is null)
        {
            return;
        }

        lock (target)
        {
            target.AppendLine(line);
        }
    }

    private static string Publish()
    {
        string repositoryRoot = RepositoryRootPath;
        string project = Path.Combine(repositoryRoot, "apps", "ose-id-be", "src", "OseId.Host", "OseId.Host.csproj");
        string output = Path.Combine(repositoryRoot, "apps", "ose-id-be", "dist", "e2e");

        var publish = new ProcessStartInfo("dotnet")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
        };
        publish.ArgumentList.Add("publish");
        publish.ArgumentList.Add(project);
        publish.ArgumentList.Add("-c");
        publish.ArgumentList.Add("Release");
        publish.ArgumentList.Add("-o");
        publish.ArgumentList.Add(output);

        using Process process =
            Process.Start(publish) ?? throw new InvalidOperationException("dotnet publish did not start");
        string diagnostics = process.StandardError.ReadToEnd() + process.StandardOutput.ReadToEnd();
        process.WaitForExit();

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"publishing ose-id-be failed: {diagnostics}");
        }

        return Path.Combine(output, "OseId.Host.dll");
    }

    private static string RepositoryRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);
        while (directory is not null)
        {
            string marker = Path.Combine(
                directory.FullName,
                "apps",
                "ose-id-be",
                "src",
                "OseId.Host",
                "OseId.Host.csproj"
            );
            if (File.Exists(marker))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException("the repository root containing apps/ose-id-be was not found");
    }
}
