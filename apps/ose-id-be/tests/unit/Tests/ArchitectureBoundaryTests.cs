using System.Reflection;
using FluentAssertions;
using Xunit;

namespace OseId.Be.Unit.Tests;

/// <summary>
/// Proves the hexagonal dependency boundary is a build-enforced property, not a
/// convention: Domain names no outward dependency at all, and Application never
/// links a transport, persistence, or protocol assembly. A future change that adds
/// a forbidden reference fails this test before it fails a reviewer's eye.
/// </summary>
public sealed class ArchitectureBoundaryTests
{
    private static readonly string[] ForbiddenAssemblyPrefixes =
    [
        "Microsoft.AspNetCore",
        "Microsoft.EntityFrameworkCore",
        "Npgsql",
        "SqlKata",
        "OpenIddict",
        "GraphQL",
        "ModelContextProtocol",
    ];

    [Fact]
    public void Domain_DeclaresNoProjectOrPackageReference()
    {
        string csproj = ReadCsproj("OseId.Domain");

        csproj.Should().NotContain("<PackageReference", "the domain ring names no outward dependency");
        csproj.Should().NotContain("<ProjectReference", "the domain ring is the innermost ring");
    }

    [Fact]
    public void Domain_AssemblyReferencesNoFrameworkOrDataOrTransportType()
    {
        Assembly domain = typeof(OseId.Domain.Runtime.RuntimeMode).Assembly;

        AssertNoForbiddenReference(domain);
    }

    [Fact]
    public void Application_DeclaresOnlyTheDomainProjectReference()
    {
        string csproj = ReadCsproj("OseId.Application");

        csproj
            .Should()
            .NotContain("<PackageReference", "a use case exposes no ASP.NET, EF, OpenIddict, GraphQL, or MCP type");
        csproj.Should().Contain("""<ProjectReference Include="../OseId.Domain/OseId.Domain.csproj" />""");
        CountOccurrences(csproj, "<ProjectReference")
            .Should()
            .Be(
                1,
                "the domain is the only ring the application may name, so a second project reference to any sibling breaks the boundary even when that sibling declares no forbidden package"
            );
    }

    [Fact]
    public void Application_AssemblyReferencesNoFrameworkOrDataOrTransportType()
    {
        Assembly application = typeof(OseId.Application.Foundation.StartupDecision).Assembly;

        AssertNoForbiddenReference(application);
    }

    private static void AssertNoForbiddenReference(Assembly assembly)
    {
        string[] referenced = [.. assembly.GetReferencedAssemblies().Select(name => name.Name ?? string.Empty)];

        foreach (string forbiddenPrefix in ForbiddenAssemblyPrefixes)
        {
            referenced
                .Should()
                .NotContain(
                    name => name.StartsWith(forbiddenPrefix, StringComparison.Ordinal),
                    $"{assembly.GetName().Name} must never reference a {forbiddenPrefix}* assembly"
                );
        }
    }

    private static int CountOccurrences(string content, string token)
    {
        int count = 0;
        int index = content.IndexOf(token, StringComparison.Ordinal);
        while (index >= 0)
        {
            count++;
            index = content.IndexOf(token, index + token.Length, StringComparison.Ordinal);
        }

        return count;
    }

    private static string ReadCsproj(string projectName) =>
        File.ReadAllText(
            Path.Combine(RepositoryRoot(), "apps", "ose-id-be", "src", projectName, $"{projectName}.csproj")
        );

    private static string RepositoryRoot()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);
        while (directory is not null)
        {
            if (
                File.Exists(
                    Path.Combine(directory.FullName, "apps", "ose-id-be", "src", "OseId.Host", "OseId.Host.csproj")
                )
            )
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException("the repository root containing apps/ose-id-be was not found");
    }
}
