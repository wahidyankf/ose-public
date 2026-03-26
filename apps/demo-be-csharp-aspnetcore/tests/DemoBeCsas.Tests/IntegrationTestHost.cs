using DemoBeCsas.Auth;
using DemoBeCsas.Infrastructure;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DemoBeCsas.Tests;

/// <summary>
/// Builds and owns the DI service container for integration tests.
/// No HTTP server is started — tests call services directly.
///
/// When DATABASE_URL is set (docker-compose integration mode) a real PostgreSQL
/// connection is used. When DATABASE_URL is absent (local test:quick mode) a
/// SQLite in-memory database is used with a single shared connection so all
/// DbContext instances within a test scenario see the same data.
/// </summary>
public sealed class IntegrationTestHost : IDisposable
{
    private readonly ServiceProvider _provider;
    private SqliteConnection? _sharedConnection;

    private static string? DatabaseUrl =>
        Environment.GetEnvironmentVariable("DATABASE_URL");

    private static string JwtSecret =>
        Environment.GetEnvironmentVariable("APP_JWT_SECRET")
        ?? "test-jwt-secret-at-least-32-chars-long!!";

    public IntegrationTestHost()
    {
        var services = new ServiceCollection();

        // Configuration — expose APP_JWT_SECRET for JwtService
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["APP_JWT_SECRET"] = JwtSecret }
            )
            .Build();
        services.AddSingleton<IConfiguration>(config);

        // Database — PostgreSQL when DATABASE_URL is present, SQLite otherwise
        if (!string.IsNullOrEmpty(DatabaseUrl))
        {
            services.AddDbContext<AppDbContext>(opts =>
                opts.UseNpgsql(DatabaseUrl).UseSnakeCaseNamingConvention());
        }
        else
        {
            _sharedConnection = new SqliteConnection("DataSource=:memory:");
            _sharedConnection.Open();
            services.AddDbContext<AppDbContext>(opts =>
                opts.UseSqlite(_sharedConnection));
        }

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IExpenseRepository, ExpenseRepository>();
        services.AddScoped<IAttachmentRepository, AttachmentRepository>();
        services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();

        // Auth services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();

        _provider = services.BuildServiceProvider();

        // Create schema once.
        // PostgreSQL: use MigrateAsync so __EFMigrationsHistory is populated — this
        // prevents "relation already exists" errors when TestWebApplicationFactory
        // boots Program.cs (which also calls MigrateAsync) in the same test run.
        // SQLite: use EnsureCreated because EF Core migrations don't support the
        // SQLite in-memory provider.
        using var scope = _provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (!string.IsNullOrEmpty(DatabaseUrl))
            db.Database.Migrate();
        else
            db.Database.EnsureCreated();
    }

    /// <summary>Creates a new DI scope for a single service operation.</summary>
    public IServiceScope CreateScope() => _provider.CreateScope();

    public void Dispose()
    {
        _provider.Dispose();
        _sharedConnection?.Close();
        _sharedConnection?.Dispose();
    }
}
