using System.Text;
using DemoBeCsas.Auth;
using DemoBeCsas.Endpoints;
using DemoBeCsas.Infrastructure;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Org.OpenAPITools.DemoBeCsas.Contracts;

var builder = WebApplication.CreateBuilder(args);

// Register generated contract JSON converters so request bodies with enum string
// values (e.g. "income"/"expense" for TypeEnum) deserialize correctly.
builder.Services.ConfigureHttpJsonOptions(opts =>
{
    opts.SerializerOptions.Converters.Add(new RegisterRequestJsonConverter());
    opts.SerializerOptions.Converters.Add(new LoginRequestJsonConverter());
    opts.SerializerOptions.Converters.Add(new RefreshRequestJsonConverter());
    opts.SerializerOptions.Converters.Add(new UpdateProfileRequestJsonConverter());
    opts.SerializerOptions.Converters.Add(new ChangePasswordRequestJsonConverter());
    opts.SerializerOptions.Converters.Add(new CreateExpenseRequestJsonConverter());
    opts.SerializerOptions.Converters.Add(new UpdateExpenseRequestJsonConverter());
    opts.SerializerOptions.Converters.Add(new ExpenseJsonConverter());
});

// Configuration
builder.WebHost.UseUrls($"http://+:{builder.Configuration["PORT"] ?? "8201"}");

// Database
var databaseUrl = builder.Configuration["DATABASE_URL"];
if (!string.IsNullOrEmpty(databaseUrl))
{
    builder.Services.AddDbContext<AppDbContext>(opts =>
        opts.UseNpgsql(databaseUrl).UseSnakeCaseNamingConvention());
}

// Authentication
var jwtSecret =
    builder.Configuration["APP_JWT_SECRET"]
    ?? throw new InvalidOperationException("APP_JWT_SECRET is required");

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        // Disable inbound claim type mapping so JWT claim names are preserved as-is
        // (e.g. "role" stays "role" instead of being remapped to ClaimTypes.Role URL)
        opts.MapInboundClaims = false;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };
    });

// Authorization
builder.Services.AddDemoBeAuthorization();

// Repositories and services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<IAttachmentRepository, AttachmentRepository>();
builder.Services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();

var app = builder.Build();

// Apply pending EF Core migrations on startup (PostgreSQL only).
// SQLite in-memory databases used by unit tests have their schema created via
// EnsureCreated inside TestWebApplicationFactory / IntegrationTestHost instead,
// because EF Core migrations do not support the SQLite in-memory provider.
if (!string.IsNullOrEmpty(databaseUrl))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// Map ArgumentException thrown by generated JSON converters to 400 Bad Request.
// The generated converters (csharp OpenAPI generator) throw ArgumentException when required
// request fields are missing or null — which is contract validation, not a server error.
app.Use(async (ctx, next) =>
{
    try
    {
        await next(ctx);
    }
    catch (ArgumentException)
    {
        ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
        await ctx.Response.WriteAsJsonAsync(new { message = "Invalid or missing required request fields" });
    }
});

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TokenRevocationMiddleware>();

// Endpoints
app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapAdminEndpoints();
app.MapExpenseEndpoints();
app.MapReportEndpoints();
app.MapAttachmentEndpoints();
app.MapTokenEndpoints();

if (builder.Configuration["ENABLE_TEST_API"] == "true")
{
    app.MapTestApiEndpoints();
}

await app.RunAsync();

// Needed for WebApplicationFactory in integration tests
#pragma warning disable S1118 // Add a 'protected' constructor or the 'static' keyword to the class declaration
public partial class Program { }
#pragma warning restore S1118
