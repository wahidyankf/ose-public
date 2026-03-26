using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DemoBeCsas.Infrastructure;

/// <summary>
/// Design-time factory used by <c>dotnet ef</c> CLI tools to create an
/// <see cref="AppDbContext"/> without running the full application startup.
///
/// This class is only used by EF Core tooling (migrations, scaffolding) and is
/// never instantiated at runtime. The <c>PrivateAssets="all"</c> attribute on
/// <c>Microsoft.EntityFrameworkCore.Design</c> ensures it is excluded from the
/// published output.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=demo_be_csas_dev;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(connectionString).UseSnakeCaseNamingConvention();

        return new AppDbContext(optionsBuilder.Options);
    }
}
