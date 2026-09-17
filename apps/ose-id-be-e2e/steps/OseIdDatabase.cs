using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// The one owned database the backend E2E run shares, and the migration stage that prepares it.
///
/// One container per test assembly rather than one per scenario: starting PostgreSQL is a real cost,
/// and the scenarios here are read-only probes or rejected writes, so none can observe another's
/// state. The run-scoped name still means cleanup removes exactly what this run created.
/// </summary>
[Binding]
public static class OseIdDatabase
{
    private static PostgresResource? _resource;

    /// <summary>The started resource. Available only between the test-run hooks below.</summary>
    public static PostgresResource Instance =>
        _resource ?? throw new InvalidOperationException("the owned PostgreSQL resource is not started");

    /// <summary>Output of the second migration run, retained as the idempotence evidence.</summary>
    public static string SecondMigrationOutput { get; private set; } = string.Empty;

    public static int FirstMigrationExitCode { get; private set; } = -1;

    public static int SecondMigrationExitCode { get; private set; } = -1;

    [BeforeTestRun]
    public static void StartOwnedDatabase()
    {
        // The one sweep for the whole test run, before any scenario-scoped resource
        // (this one included) has started and claimed the shared name prefix.
        PostgresResource.RemoveStaleContainers();

        _resource = PostgresResource.Start(TimeSpan.FromMinutes(2));

        // Applied twice on purpose. The runner invokes migration unconditionally, so "already
        // current" must be an ordinary success rather than an error the operator learns to ignore.
        (FirstMigrationExitCode, _) = RunMigrator();
        (SecondMigrationExitCode, string secondOutput) = RunMigrator();
        SecondMigrationOutput = secondOutput;

        if (FirstMigrationExitCode != 0 || SecondMigrationExitCode != 0)
        {
            throw new InvalidOperationException(
                $"the migration stage failed: first={FirstMigrationExitCode} second={SecondMigrationExitCode} {secondOutput}"
            );
        }
    }

    [AfterTestRun]
    public static void StopOwnedDatabase()
    {
        _resource?.Dispose();
        _resource = null;
    }

    private static (int ExitCode, string Output) RunMigrator()
    {
        (int exitCode, string output) = MigrationRunner.Run(Instance.MigratorConnectionString);

        return (exitCode, Instance.Sanitize(output));
    }
}
