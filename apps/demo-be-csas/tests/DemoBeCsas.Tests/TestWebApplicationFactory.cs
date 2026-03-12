using DemoBeCsas.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DemoBeCsas.Tests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    // A single shared connection drives all DbContext instances in this test scenario.
    // SQLite in-memory databases exist only as long as at least one connection is open.
    // By passing the same open SqliteConnection to every DbContext we guarantee
    // that writes from one request scope are immediately visible in the next.
    private SqliteConnection? _sharedConnection;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("APP_JWT_SECRET", "test-jwt-secret-at-least-32-chars-long!!");
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Remove production EF Core registration
            var descriptors = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>))
                .ToList();
            foreach (var descriptor in descriptors)
            {
                services.Remove(descriptor);
            }

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
