using System.Diagnostics;

namespace OseId.Be.E2E;

/// <summary>
/// Runs the real migrator executable against an owned PostgreSQL resource's migration
/// role. Extracted so "how the migration stage is invoked" has exactly one definition
/// regardless of how many owned databases a test run creates: the shared assembly-level
/// resource <see cref="OseIdDatabase" /> keeps alive, and any scenario-scoped resource a
/// binding starts and stops on its own.
/// </summary>
internal static class MigrationRunner
{
    public static (int ExitCode, string Output) Run(string migratorConnectionString)
    {
        var startInfo = new ProcessStartInfo("dotnet")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
        };
        startInfo.ArgumentList.Add("run");
        startInfo.ArgumentList.Add("--project");
        startInfo.ArgumentList.Add(
            Path.Combine(
                BackendProcess.RepositoryRootPath,
                "apps",
                "ose-id-be",
                "src",
                "OseId.Migrator",
                "OseId.Migrator.csproj"
            )
        );

        // The migration role's credentials reach the migration stage and nothing else; the
        // serving host is never given them.
        startInfo.Environment["OSE_ID_MIGRATION_CONNECTION"] = migratorConnectionString;

        using Process process =
            Process.Start(startInfo) ?? throw new InvalidOperationException("the migration stage did not start");

        string output = process.StandardOutput.ReadToEnd() + process.StandardError.ReadToEnd();
        process.WaitForExit();

        return (process.ExitCode, output);
    }
}
