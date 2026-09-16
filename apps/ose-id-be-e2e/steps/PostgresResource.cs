using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Net.Sockets;
using System.Text.RegularExpressions;

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
public sealed partial class PostgresResource : IDisposable
{
    private const string Image = "postgres:17-alpine";

    // Matches only the connection-establishment failures the official image's temp-instance/
    // real-instance startup transition produces: the temp instance's socket disappearing,
    // connections being refused before the real instance is listening, or the temp instance
    // forcibly closing an already-connected client when it is told to shut down. Never a query or
    // permission error, so a genuine SQL mistake still fails immediately instead of being retried
    // away.
    [GeneratedRegex(
        "No such file or directory|Connection refused|the database system is (starting up|shutting down)"
            + "|terminating connection due to administrator command|server closed the connection unexpectedly"
            + "|connection to server was lost",
        RegexOptions.IgnoreCase
    )]
    private static partial Regex ConnectionRacePattern();

    // A retried startup statement reporting "already exists" is a success, not a conflict: on a
    // container this run just created, with fixed role/database names, only this same call's own
    // earlier attempt could have created them already — most likely after committing but before
    // its result reached the client across the connection the temp/real transition just severed.
    [GeneratedRegex("already exists", RegexOptions.IgnoreCase)]
    private static partial Regex AlreadyDonePattern();

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
    /// Starts the container, waits for the real PostgreSQL instance to accept the exact connection
    /// the bootstrap statements depend on, then creates the database and the two least-privilege
    /// login roles. Waiting on that connection observes a state transition; it is not a retry of a
    /// failed assertion.
    ///
    /// Never sweeps stale containers itself: this test run may already own other instances of this
    /// resource by the time a later scenario calls this, and a sweep here would remove them by their
    /// shared name prefix along with anything genuinely stale. <see cref="RemoveStaleContainers" />
    /// runs exactly once, before the first resource in a test run starts.
    /// </summary>
    public static PostgresResource Start(TimeSpan readinessBudget)
    {
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

        // Shared across the readiness wait and the bootstrap statements below: a probe that
        // succeeded against the temp instance moments before the real instance took over must not
        // reset a fresh budget for what comes next, or the two phases could together run far
        // longer than the caller asked for.
        DateTimeOffset deadline = DateTimeOffset.UtcNow + readinessBudget;
        try
        {
            resource.WaitUntilAcceptingConnections(deadline, readinessBudget);
            resource.Bootstrap(deadline);
            return resource;
        }
        catch
        {
            resource.Dispose();
            throw;
        }
    }

    /// <summary>
    /// Waits for the real, long-running postgres instance to accept the exact connection the
    /// bootstrap statements below depend on. <c>pg_isready</c> can observe the official image's
    /// temporary init-script instance and report ready moments before its socket disappears and
    /// the real instance takes over; probing with the same connection the next step depends on —
    /// not a separate, weaker check — is what makes "ready" mean "the next step will work."
    /// Waiting on a real state transition is not a retry of a failed assertion.
    /// </summary>
    private void WaitUntilAcceptingConnections(DateTimeOffset deadline, TimeSpan budget)
    {
        while (DateTimeOffset.UtcNow < deadline)
        {
            (int exitCode, _) = DockerWithInput(
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
                    "postgres",
                    "--no-psqlrc",
                    "--quiet",
                    "--set",
                    "ON_ERROR_STOP=1",
                ],
                "SELECT 1;",
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
    private void Bootstrap(DateTimeOffset deadline)
    {
        PsqlDuringStartup(
            "postgres",
            $"""
            CREATE ROLE {MigratorRole} LOGIN PASSWORD '{MigratorPassword}'
              NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
            CREATE ROLE {ApplicationRole} LOGIN PASSWORD '{ApplicationPassword}'
              NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
            CREATE DATABASE {DatabaseName} OWNER {MigratorRole};
            """,
            deadline
        );

        // PUBLIC keeps no create privilege anywhere in the OSE ID database, so a role that is
        // granted nothing can do nothing rather than falling back to a default.
        PsqlDuringStartup(
            DatabaseName,
            $"""
            REVOKE ALL ON DATABASE {DatabaseName} FROM PUBLIC;
            REVOKE ALL ON SCHEMA public FROM PUBLIC;
            GRANT CONNECT ON DATABASE {DatabaseName} TO {MigratorRole};
            GRANT CONNECT ON DATABASE {DatabaseName} TO {ApplicationRole};
            """,
            deadline
        );
    }

    /// <summary>
    /// Runs one bootstrap statement, retrying only while <paramref name="deadline" /> has not
    /// passed and the failure matches <see cref="ConnectionRacePattern" /> — the documented
    /// temp-instance/real-instance transition, never a real SQL mistake. A retried statement that
    /// reports "already exists" (<see cref="AlreadyDonePattern" />) is treated as success rather
    /// than a conflict, for the reason recorded on that pattern.
    /// </summary>
    private void PsqlDuringStartup(string database, string sql, DateTimeOffset deadline)
    {
        for (; ; )
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
                TimeSpan.FromSeconds(15)
            );
            if (exitCode == 0)
            {
                return;
            }

            if (AlreadyDonePattern().IsMatch(output))
            {
                return;
            }

            if (DateTimeOffset.UtcNow >= deadline || !ConnectionRacePattern().IsMatch(output))
            {
                throw new InvalidOperationException($"psql failed: {Sanitize(output)}");
            }

            Thread.Sleep(250);
        }
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

    /// <summary>
    /// Stops the container without removing it, so a scenario can observe its dependency
    /// becoming unreachable and <see cref="Dispose" /> can still clean up afterward. There
    /// is no corresponding resume: no scenario in this codebase needs the dependency to
    /// come back once stopped.
    /// </summary>
    public void Stop()
    {
        (int exitCode, string output) = Docker(["stop", "--time", "5", _containerName], TimeSpan.FromSeconds(30));
        if (exitCode != 0)
        {
            throw new InvalidOperationException($"stopping the owned PostgreSQL container failed: {Sanitize(output)}");
        }
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
    ///
    /// Callers run this exactly once, before the test run's first <see cref="Start" /> call: once
    /// any resource is owned, its container shares this same prefix and a later sweep could not
    /// distinguish it from a stale one.
    /// </summary>
    public static void RemoveStaleContainers()
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
