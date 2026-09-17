using FluentAssertions;
using OseId.Application.Foundation;
using OseId.Domain.Runtime;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// The allowed half of the startup guard. The Gherkin corpus owns the rejected modes
/// because those are the security-relevant outcomes; these cases keep the permitted
/// branch honest so the guard cannot pass its scenarios by refusing everything.
/// </summary>
public sealed class RuntimeModeStartupGuardTests
{
    [Theory]
    [InlineData("Local", RuntimeMode.Local)]
    [InlineData("Test", RuntimeMode.Test)]
    public void Evaluate_SupportedMode_MayServe(string declaredMode, RuntimeMode expected)
    {
        StartupDecision decision = RuntimeModeStartupGuard.Evaluate(declaredMode);

        decision.MayServe.Should().BeTrue();
        decision.Mode.Should().Be(expected);
        decision.ExitCode.Should().Be(0);
        decision.DiagnosticCode.Should().BeNull();
        decision.DiagnosticMessage.Should().BeNull();
    }

    [Theory]
    [InlineData("local")]
    [InlineData("TEST")]
    [InlineData(" Local")]
    [InlineData("Local ")]
    [InlineData("Development")]
    [InlineData("")]
    [InlineData("   ")]
    public void Evaluate_ModeThatIsNotExactlyLocalOrTest_FailsClosed(string declaredMode)
    {
        StartupDecision decision = RuntimeModeStartupGuard.Evaluate(declaredMode);

        decision.MayServe.Should().BeFalse();
        decision.ExitCode.Should().Be(1);
        decision.DiagnosticCode.Should().Be(RuntimeModePolicy.DiagnosticCode);
    }

    [Fact]
    public void Evaluate_MissingMode_ReportsTheMissingDenial()
    {
        StartupDecision decision = RuntimeModeStartupGuard.Evaluate(declaredMode: null);

        decision.Denial.Should().Be(RuntimeModeDenial.Missing);
        decision.DiagnosticMessage.Should().Be(RuntimeModePolicy.MissingDiagnosticMessage);
    }

    [Fact]
    public void Evaluate_UnsupportedMode_ReportsTheUnsupportedDenialWithoutEchoingIt()
    {
        StartupDecision decision = RuntimeModeStartupGuard.Evaluate("Production");

        decision.Denial.Should().Be(RuntimeModeDenial.Unsupported);
        decision.DiagnosticMessage.Should().Be(RuntimeModePolicy.UnsupportedDiagnosticMessage);
        decision.DiagnosticMessage.Should().NotContain("Production");
    }

    [Fact]
    public void ResolvedModes_AreExactlyLocalAndTest()
    {
        RuntimeModePolicy.ServableModes.Should().Equal(RuntimeMode.Local, RuntimeMode.Test);
    }

    [Fact]
    public void DiagnosticMessageFor_AnAdmittedStart_HasNothingToSay()
    {
        RuntimeModePolicy.DiagnosticMessageFor(RuntimeModeDenial.None).Should().BeNull();
    }
}
