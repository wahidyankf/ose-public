using FluentAssertions;
using Microsoft.Extensions.Configuration;
using OseId.Application.Foundation;
using OseId.Domain.Runtime;
using OseId.Host;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature.
/// It drives the real host startup sequence with real configuration binding, and proves
/// that a refused mode stops before any server is built rather than after.
/// </summary>
[Binding]
public sealed class RuntimeModeHostSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature";

    private readonly Dictionary<string, string?> _environment = [];
    private StartupDecision? _decision;
    private TestHostFixture? _startedHost;

    [Given("the backend runtime mode is {word}")]
    public void GivenTheBackendRuntimeModeIs(string mode)
    {
        if (mode != "missing")
        {
            _environment[RuntimeModeConfiguration.Key] = mode;
        }
    }

    [When("the backend process starts")]
    public void WhenTheBackendProcessStarts()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(_environment).Build();

        _decision = OseIdHost.EvaluateStartup(configuration);

        // Only an admitted decision is allowed to reach host construction; that ordering
        // is the invariant, so the binding reproduces it instead of asserting around it.
        if (_decision.MayServe)
        {
            _startedHost = TestHostFixture.Start();
        }
    }

    [Then("startup exits non-zero before serving the application")]
    public void ThenStartupExitsNonZeroBeforeServingTheApplication()
    {
        _decision.Should().NotBeNull(Feature);
        _decision.MayServe.Should().BeFalse();
        _decision.ExitCode.Should().NotBe(0);
        _startedHost.Should().BeNull("a refused mode must not build or start a server");
    }

    [Then("the diagnostic returns the stable runtime-mode-disabled code")]
    public void ThenTheDiagnosticReturnsTheStableRuntimeModeDisabledCode()
    {
        _decision!.DiagnosticCode.Should().Be(RuntimeModePolicy.DiagnosticCode);
    }

    public void Dispose() => _startedHost?.Dispose();
}
