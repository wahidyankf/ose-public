namespace DemoBeCsas.Auth;

public static class AuthorizationExtensions
{
    public static IServiceCollection AddDemoBeAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization(opts =>
        {
            opts.AddPolicy(
                "Admin",
                policy => policy.RequireAssertion(ctx =>
                    ctx.User.HasClaim("role", "Admin")
                )
            );
        });
        return services;
    }
}
