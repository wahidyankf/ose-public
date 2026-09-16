using FluentAssertions;
using Reqnroll;

namespace OseId.Be.E2E;

/// <summary>
/// E2E binding for specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature. It
/// observes the published executable from outside: the exit code, the diagnostic stream,
/// and the absence of a listener are the only evidence used, because that is all a
/// runner or an attacker can see.
/// </summary>
[Binding]
public sealed class RuntimeModeProcessSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature";
    private const int ReservedPort = 8501;

    private readonly Dictionary<string, string> _environment = new(StringComparer.Ordinal)
    {
        ["OSE_ID_BE_PORT"] = ReservedPort.ToString(System.Globalization.CultureInfo.InvariantCulture),
    };

    private BackendProcess? _backend;
    private bool _exited;

    [Given("the backend runtime mode is {word}")]
    public void GivenTheBackendRuntimeModeIs(string mode)
    {
        if (mode != "missing")
        {
            _environment["OSE_RUNTIME_MODE"] = mode;
        }
    }

    [When("the backend process starts")]
    public void WhenTheBackendProcessStarts()
    {
        _backend = BackendProcess.Start(_environment);
        _exited = _backend.WaitForExit(TimeSpan.FromSeconds(60));
    }

    [Then("startup exits non-zero before serving the application")]
    public void ThenStartupExitsNonZeroBeforeServingTheApplication()
    {
        _exited.Should().BeTrue($"{Feature} requires a refused mode to terminate the process");
        _backend!.ExitCode.Should().NotBe(0);

        // "Before serving" is proven from the process's own account of itself: a host that
        // reached the serving stage announces its listener and its startup, and this one
        // never does. Probing the port instead would only prove that some other process
        // does not hold it.
        string output = _backend.StandardOutput + _backend.StandardError;
        output.Should().NotContain("Now listening on");
        output.Should().NotContain("Application started");
        output.Should().NotContain(ReservedPort.ToString(System.Globalization.CultureInfo.InvariantCulture));
    }

    [Then("the diagnostic returns the stable runtime-mode-disabled code")]
    public void ThenTheDiagnosticReturnsTheStableRuntimeModeDisabledCode()
    {
        string diagnostics = _backend!.StandardError + _backend.StandardOutput;

        diagnostics.Should().Contain("runtime_mode_disabled");

        // A refused start is a sanitized one: no stack trace and no machine path.
        diagnostics.Should().NotContain("Exception");
        diagnostics.Should().NotContain(BackendProcess.RepositoryRootPath);
    }

    public void Dispose() => _backend?.Dispose();
}
