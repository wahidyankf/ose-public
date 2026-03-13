using DemoBeCsas.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace DemoBeCsas.Tests;

/// <summary>
/// WebApplicationFactory used for both unit-level tests (SQLite in-memory, no external services)
/// and integration tests (real PostgreSQL, configured via DATABASE_URL environment variable).
///
/// When DATABASE_URL is not set (unit/test:quick mode), replaces the production EF Core
/// registration with SQLite in-memory using a single shared connection so all DbContext
/// instances in a scenario see the same data.
///
/// When DATABASE_URL is set (docker-compose integration mode), delegates to the production
/// PostgreSQL registration wired in Program.cs without overriding it.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    // A single shared connection drives all DbContext instances in this test scenario.
    // SQLite in-memory databases exist only as long as at least one connection is open.
    // By passing the same open SqliteConnection to every DbContext we guarantee
    // that writes from one request scope are immediately visible in the next.
    // Only used when DATABASE_URL is not set (SQLite in-memory mode).
    private SqliteConnection? _sharedConnection;

    private static bool UsePostgres =>
        !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DATABASE_URL"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("APP_JWT_SECRET", "test-jwt-secret-at-least-32-chars-long!!");
        builder.UseEnvironment("Development");

        if (!UsePostgres)
        {
            // Unit mode: replace production DB registration with SQLite in-memory.
            builder.ConfigureServices(services =>
            {
                // Remove all EF Core database-provider-specific registrations to avoid
                // the "multiple providers registered" error when DATABASE_URL is absent
                // but Npgsql was registered by Program.cs before ConfigureWebHost runs.
                RemoveDbContextRegistrations(services);

                // Create and open one shared connection — all DbContexts reuse it
                _sharedConnection = new SqliteConnection("DataSource=:memory:");
                _sharedConnection.Open();

                services.AddDbContext<AppDbContext>(opts =>
                    opts.UseSqlite(_sharedConnection)
                );

                // Create the schema once using the shared connection
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.EnsureCreated();
            });
        }
        // When UsePostgres is true, Program.cs already registered Npgsql from DATABASE_URL.
        // No override needed — EnsureCreated in Program.cs startup creates the schema.
    }

    /// <summary>
    /// Removes all EF Core DbContext and related service registrations so a fresh
    /// provider (e.g., SQLite) can be registered without conflicts.
    /// </summary>
    private static void RemoveDbContextRegistrations(IServiceCollection services)
    {
        var toRemove = services
            .Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(DbContextOptions) ||
                d.ServiceType == typeof(IDbContextOptionsConfiguration<AppDbContext>))
            .ToList();
        foreach (var descriptor in toRemove)
        {
            services.Remove(descriptor);
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _sharedConnection?.Close();
            _sharedConnection?.Dispose();
        }
        base.Dispose(disposing);
    }
}
