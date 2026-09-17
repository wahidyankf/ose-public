using System.Reflection;
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
        _decision.Should().NotBeNull(Feature);
        _decision.DiagnosticCode.Should().Be("runtime_mode_disabled");
    }

    [Then("no configured listener is bound")]
    public void ThenNoConfiguredListenerIsBound()
    {
        _decision.Should().NotBeNull(Feature);

        // The decision is the whole of what the composition root receives before it may build
        // anything, and it names no port, origin, or listener. A refused decision therefore
        // leaves the composition root with nothing to bind, by construction rather than by a
        // later branch remembering to check.
        typeof(StartupDecision)
            .GetProperties()
            .Select(property => property.Name)
            .Should()
            .BeEquivalentTo("Mode", "Denial", "ExitCode", "DiagnosticCode", "DiagnosticMessage", "MayServe");
        _decision.MayServe.Should().BeFalse();
    }

    [Then("no database or identity row is changed")]
    public void ThenNoDatabaseOrIdentityRowIsChanged()
    {
        _decision.Should().NotBeNull(Feature);

        // The guard's entire surface is one static decision taken from one string. It holds no
        // port, no constructor, and no field, so the refusal path has nothing through which a
        // row could be read, let alone written.
        typeof(RuntimeModeStartupGuard)
            .GetMethods(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Select(method => method.Name)
            .Should()
            .BeEquivalentTo("Evaluate");
        typeof(RuntimeModeStartupGuard)
            .GetMethod(nameof(RuntimeModeStartupGuard.Evaluate))!
            .GetParameters()
            .Select(parameter => parameter.ParameterType)
            .Should()
            .BeEquivalentTo([typeof(string)]);
        typeof(RuntimeModeStartupGuard)
            .GetFields(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Select(field => field.Name)
            .Should()
            .BeEquivalentTo("RefusedExitCode");
    }

    [Then("the diagnostic discloses no secret, configuration value, stack trace, or absolute path")]
    public void ThenTheDiagnosticDisclosesNoSecretConfigurationValueStackTraceOrAbsolutePath()
    {
        _decision.Should().NotBeNull(Feature);

        _decision.DiagnosticMessage.Should().NotBeNull(Feature);
        string diagnostic = _decision.DiagnosticMessage;

        // The diagnostic names the invariant, never the rejected configuration value.
        if (_declaredMode is not null)
        {
            diagnostic.Should().NotContain(_declaredMode);
        }

        // Nor anything shaped like a setting, a path, or a stack frame. The message is one
        // sentence built from fixed policy text, so none of these can appear by accident.
        diagnostic.Should().NotContainAny("=", "/", "\\", "Exception", " at ");
        diagnostic.Split('\n').Should().ContainSingle();
    }
}
