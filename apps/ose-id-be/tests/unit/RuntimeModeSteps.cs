using FluentAssertions;
using OseId.Application.Foundation;
using Reqnroll;

namespace OseId.Be.Unit;

/// <summary>
/// Unit binding for specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature.
/// It exercises the mode decision itself, with no configuration provider, no host,
/// and no process: every branch of the parser is reachable from here.
/// </summary>
[Binding]
public sealed class RuntimeModeSteps
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature";

    private string? _declaredMode;
    private StartupDecision? _decision;

    [Given("the backend runtime mode is {word}")]
    public void GivenTheBackendRuntimeModeIs(string mode)
    {
        // "missing" is the absence of the value, not a value spelled "missing"; every
        // other example row is supplied to the guard exactly as the operator wrote it.
        _declaredMode = mode == "missing" ? null : mode;
    }

    [When("the backend process starts")]
    public void WhenTheBackendProcessStarts()
    {
        _decision = RuntimeModeStartupGuard.Evaluate(_declaredMode);
    }

    [Then("startup exits non-zero before serving the application")]
    public void ThenStartupExitsNonZeroBeforeServingTheApplication()
    {
        _decision.Should().NotBeNull(Feature);
        _decision.MayServe.Should().BeFalse();
        _decision.ExitCode.Should().NotBe(0);
        _decision.Mode.Should().BeNull();
    }

    [Then("the diagnostic returns the stable runtime-mode-disabled code")]
    public void ThenTheDiagnosticReturnsTheStableRuntimeModeDisabledCode()
    {
        _decision.Should().NotBeNull();
        _decision.DiagnosticCode.Should().Be("runtime_mode_disabled");

        // The diagnostic names the invariant, never the rejected configuration value.
        if (_declaredMode is not null)
        {
            _decision.DiagnosticMessage.Should().NotContain(_declaredMode);
        }
    }
}
