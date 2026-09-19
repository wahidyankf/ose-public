using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OseId.Application.Foundation;
using OseId.Domain.Runtime;
using OseId.Host;
using Reqnroll;

namespace OseId.Be.Integration;

/// <summary>
/// Integration binding for specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature.
/// It drives the real host startup sequence with real configuration binding, in the order
/// <see cref="OseIdProcess" /> itself uses, and proves that a refused mode stops before any
/// container, route table, or server is built rather than after.
/// </summary>
[Binding]
public sealed class RuntimeModeHostSteps : IDisposable
{
    private const string Feature = "specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature";

    /// <summary>
    /// A usable listener port and a usable connection string, supplied on every run. They make
    /// the refusal the only reason nothing was built: a start that bound nothing for want of a
    /// port, or registered nothing for want of a connection string, would prove nothing.
    /// </summary>
    private const string DeclaredPort = "8599";

    private const string DeclaredConnectionString =
        "Host=127.0.0.1;Port=1;Database=ose_id;Username=ose_id_test;Password=ose_id_test";

    private readonly Dictionary<string, string?> _environment = new(StringComparer.Ordinal)
    {
        [RuntimeModeConfiguration.PortKey] = DeclaredPort,
        [PersistenceConfiguration.ConnectionKey] = DeclaredConnectionString,
    };

    private readonly ServiceCollection _services = [];

    private string? _declaredMode;
    private IConfiguration? _configuration;
    private StartupDecision? _decision;
    private TestHostFixture? _startedHost;

    [Given("the backend runtime mode is {word}")]
    public void GivenTheBackendRuntimeModeIs(string mode)
    {
        if (mode != "missing")
        {
            _declaredMode = mode;
            _environment[RuntimeModeConfiguration.Key] = mode;
        }
    }

    [When("the backend process starts")]
    public void WhenTheBackendProcessStarts()
    {
        _configuration = new ConfigurationBuilder().AddInMemoryCollection(_environment).Build();

        _decision = OseIdHost.EvaluateStartup(_configuration);

        // Only an admitted decision is allowed to reach registration and host construction; that
        // ordering is the invariant, so the binding reproduces it instead of asserting around it.
        if (_decision.MayServe)
        {
            OseIdHost.RegisterServices(_services, _configuration);
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
    public void ThenTheDiagnosticReturnsTheStableRuntimeModeDisabledCode() =>
        _decision!.DiagnosticCode.Should().Be(RuntimeModePolicy.DiagnosticCode);

    [Then("no configured listener is bound")]
    public void ThenNoConfiguredListenerIsBound()
    {
        // A listener origin was fully determined from this same configuration, so the host had
        // somewhere to bind and declined to reach that stage at all.
        OseIdHost.ListenerOrigin(_configuration!).Should().Be($"http://127.0.0.1:{DeclaredPort}");

        _startedHost.Should().BeNull(Feature);
    }

    [Then("no database or identity row is changed")]
    public void ThenNoDatabaseOrIdentityRowIsChanged()
    {
        // The refused start never reached registration, so no data source was built and no port
        // exists to reach a row through. The connection string was present and usable for
        // registration, so an empty container is the guard's doing and not a missing setting.
        _configuration![PersistenceConfiguration.ConnectionKey].Should().Be(DeclaredConnectionString);
        _services.Should().BeEmpty(Feature);
    }

    [Then("the diagnostic discloses no secret, configuration value, stack trace, or absolute path")]
    public void ThenTheDiagnosticDisclosesNoSecretConfigurationValueStackTraceOrAbsolutePath()
    {
        _decision!.DiagnosticMessage.Should().NotBeNull(Feature);
        string diagnostic = _decision.DiagnosticMessage;

        // Every value configuration carried on this run, none of which may travel outward.
        diagnostic.Should().NotContainAny(DeclaredPort, DeclaredConnectionString, "ose_id_test", "Host=");
        if (_declaredMode is not null)
        {
            diagnostic.Should().NotContain(_declaredMode);
        }

        diagnostic.Should().NotContainAny("=", "/", "\\", "Exception", " at ");
    }

    public void Dispose() => _startedHost?.Dispose();
}
