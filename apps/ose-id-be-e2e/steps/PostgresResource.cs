using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Net.Sockets;

namespace OseId.Be.E2E;

/// <summary>
/// The owned PostgreSQL resource for the backend E2E adapter.
///
/// Every container this type creates carries a non-secret run identifier in its name, and cleanup
/// removes exactly that container. No command here matches a pattern, prunes, or touches a resource
/// the run did not create, so an E2E failure can never take a developer's other databases with it.
///
/// The port is allocated from the ephemeral range rather than fixed at the documented 5438 so that
/// two runs can overlap; 5438 remains the manual-development default recorded in the local-stack
/// contract.
/// </summary>
public sealed class PostgresResource : IDisposable
{
    private const string Image = "postgres:17-alpine";

    /// <summary>
    /// Every container this type creates is named "{NamePrefix}{runId}". A HIPPO shed reaps the
    /// test process tree but cannot reach a detached container, since it is not a child process of
    /// the shedded test at kill time — so a hard shed can leave one of these behind across runs.
    /// <see cref="RemoveStaleContainers"/> sweeps by this exact prefix only, never a broader match.
    /// </summary>
    private const string NamePrefix = "ose-id-e2e-pg-";

    /// <summary>The bootstrap password. It is generated per run and never leaves the process.</summary>
    private readonly string _superuserPassword = Guid.NewGuid().ToString("N");

    private readonly string _containerName;
    private bool _removed;

    public string RunId { get; }

    public int Port { get; }

    public const string DatabaseName = "ose_id";

    /// <summary>The migration role: owns the schema, applies forward migrations, handles no traffic.</summary>
    public const string MigratorRole = "ose_id_migrator";

    /// <summary>The serving role: connects and reads the granted history query, and nothing else.</summary>
    public const string ApplicationRole = "ose_id_app";

    public string MigratorPassword { get; } = Guid.NewGuid().ToString("N");

    public string ApplicationPassword { get; } = Guid.NewGuid().ToString("N");

    private PostgresResource(string runId, int port, string containerName)
    {
        RunId = runId;
        Port = port;
        _containerName = containerName;
    }

    public string SuperuserConnectionString => Connection("postgres", _superuserPassword, "postgres");

    public string MigratorConnectionString => Connection(MigratorRole, MigratorPassword, DatabaseName);

    public string ApplicationConnectionString => Connection(ApplicationRole, ApplicationPassword, DatabaseName);

    private string Connection(string user, string password, string database) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"Host=127.0.0.1;Port={Port};Database={database};Username={user};Password={password};Timeout=10;Command Timeout=10"
        );

    /// <summary>
    /// Starts the container, waits for PostgreSQL's own readiness probe, then creates the database
    /// and the two least-privilege login roles. Waiting on <c>pg_isready</c> observes a state
    /// transition; it is not a retry of a failed assertion.
    /// </summary>
    public static PostgresResource Start(TimeSpan readinessBudget)
    {
        RemoveStaleContainers();

        string runId = Guid.NewGuid().ToString("N")[..12];
        int port = AllocateEphemeralPort();
        var resource = new PostgresResource(runId, port, $"{NamePrefix}{runId}");

        string[] run =
        [
            "run",
            "--detach",
            "--name",
            resource._containerName,
            "--publish",
            string.Create(CultureInfo.InvariantCulture, $"127.0.0.1:{port}:5432"),
            "--env",
            $"POSTGRES_PASSWORD={resource._superuserPassword}",
            // The default database is the superuser's own; the OSE ID database is created below by
            // an explicit statement so its owner is unambiguous.
            "--env",
            "POSTGRES_DB=postgres",
            Image,
        ];

        (int exitCode, string output) = Docker(run, TimeSpan.FromMinutes(5));
        if (exitCode != 0)
        {
            throw new InvalidOperationException($"starting the owned PostgreSQL container failed: {output}");
        }

        try
        {
            resource.WaitUntilAcceptingConnections(readinessBudget);
            resource.Bootstrap();
            return resource;
        }
        catch
        {
            resource.Dispose();
            throw;
        }
    }

    private void WaitUntilAcceptingConnections(TimeSpan budget)
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow + budget;
        while (DateTimeOffset.UtcNow < deadline)
        {
            (int exitCode, _) = Docker(
                ["exec", _containerName, "pg_isready", "--username", "postgres", "--dbname", "postgres"],
                TimeSpan.FromSeconds(15)
            );
            if (exitCode == 0)
            {
                return;
            }

            Thread.Sleep(250);
        }

        throw new TimeoutException(
            $"the owned PostgreSQL container did not accept connections within {budget.TotalSeconds:F0}s"
        );
    }

    /// <summary>
    /// Creates the database and both login roles with the exact attribute set the persistence
    /// contract requires. Neither role may create databases or roles, inherit privileges it was not
    /// granted, or bypass row-level security.
    /// </summary>
    private void Bootstrap()
    {
        Psql(
            "postgres",
            $"""
            CREATE ROLE {MigratorRole} LOGIN PASSWORD '{MigratorPassword}'
              NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
            CREATE ROLE {ApplicationRole} LOGIN PASSWORD '{ApplicationPassword}'
              NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
            CREATE DATABASE {DatabaseName} OWNER {MigratorRole};
            """
        );

        // PUBLIC keeps no create privilege anywhere in the OSE ID database, so a role that is
        // granted nothing can do nothing rather than falling back to a default.
        Psql(
            DatabaseName,
            $"""
            REVOKE ALL ON DATABASE {DatabaseName} FROM PUBLIC;
            REVOKE ALL ON SCHEMA public FROM PUBLIC;
            GRANT CONNECT ON DATABASE {DatabaseName} TO {MigratorRole};
            GRANT CONNECT ON DATABASE {DatabaseName} TO {ApplicationRole};
            """
        );
    }

    /// <summary>
    /// Runs a statement as the container superuser. This exists only for bootstrap and for probes
    /// that must observe state the serving role is not allowed to see; no test uses it to perform a
    /// mutation the application itself should have made.
    /// </summary>
    public string Psql(string database, string sql)
    {
        (int exitCode, string output) = DockerWithInput(
            [
                "exec",
                "--interactive",
                "--env",
                $"PGPASSWORD={_superuserPassword}",
                _containerName,
                "psql",
                "--username",
                "postgres",
                "--dbname",
                database,
                "--no-psqlrc",
                "--quiet",
                "--tuples-only",
                "--no-align",
                "--set",
                "ON_ERROR_STOP=1",
            ],
            sql,
            TimeSpan.FromSeconds(60)
        );

        return exitCode == 0 ? output : throw new InvalidOperationException($"psql failed: {Sanitize(output)}");
    }

    /// <summary>Removes the run's own container by exact name. Never prunes.</summary>
    public void Dispose()
    {
        if (_removed)
        {
            return;
        }

        _removed = true;
        Docker(["rm", "--force", "--volumes", _containerName], TimeSpan.FromMinutes(2));
    }

    /// <summary>
    /// Strips the run's generated secrets from any text before it can reach an assertion message or
    /// a captured evidence file.
    /// </summary>
    public string Sanitize(string text)
    {
        ArgumentNullException.ThrowIfNull(text);

        return text.Replace(_superuserPassword, "[redacted]", StringComparison.Ordinal)
            .Replace(MigratorPassword, "[redacted]", StringComparison.Ordinal)
            .Replace(ApplicationPassword, "[redacted]", StringComparison.Ordinal);
    }

    /// <summary>
    /// Removes any container left over from a prior run that a hard HIPPO shed prevented from
    /// reaching its own <see cref="Dispose"/>. Matches by exact name prefix only — never a pattern
    /// that could reach a container this type did not create — so a repeated shed cannot accumulate
    /// orphaned containers across runs.
    /// </summary>
    private static void RemoveStaleContainers()
    {
        (int listExitCode, string listOutput) = Docker(
            ["ps", "--all", "--filter", $"name={NamePrefix}", "--format", "{{.Names}}"],
            TimeSpan.FromSeconds(30)
        );
        if (listExitCode != 0)
        {
            // Best-effort sweep: a listing failure does not block the run, since Start() below will
            // fail loudly on its own if a name collision remains.
            return;
        }

        // Docker's "name" filter matches the substring anywhere in the name; re-check the prefix
        // here so the removal below can never reach a container this type did not create.
        string[] staleNames = listOutput
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(name => name.StartsWith(NamePrefix, StringComparison.Ordinal))
            .ToArray();
        if (staleNames.Length == 0)
        {
            return;
        }

        Docker(["rm", "--force", "--volumes", .. staleNames], TimeSpan.FromMinutes(2));
    }

    private static int AllocateEphemeralPort()
    {
        using var probe = new TcpListener(System.Net.IPAddress.Loopback, 0);
        probe.Start();
        int port = ((System.Net.IPEndPoint)probe.LocalEndpoint).Port;
        probe.Stop();
        return port;
    }

    private static (int ExitCode, string Output) Docker(IReadOnlyList<string> arguments, TimeSpan timeout) =>
        DockerWithInput(arguments, standardInput: null, timeout);

    private static (int ExitCode, string Output) DockerWithInput(
        IReadOnlyList<string> arguments,
        string? standardInput,
        TimeSpan timeout
    )
    {
        var startInfo = new ProcessStartInfo("docker")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            RedirectStandardInput = standardInput is not null,
            UseShellExecute = false,
        };
        foreach (string argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using Process process =
            Process.Start(startInfo) ?? throw new InvalidOperationException("the docker command did not start");

        if (standardInput is not null)
        {
            process.StandardInput.Write(standardInput);
            process.StandardInput.Close();
        }

        string output = process.StandardOutput.ReadToEnd();
        string error = process.StandardError.ReadToEnd();

        if (!process.WaitForExit((int)timeout.TotalMilliseconds))
        {
            process.Kill(entireProcessTree: true);
            throw new TimeoutException($"a docker command exceeded {timeout.TotalSeconds:F0}s");
        }

        return (process.ExitCode, (output + error).Trim());
    }
}
