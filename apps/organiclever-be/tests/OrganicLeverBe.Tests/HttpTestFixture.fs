module OrganicLeverBe.Tests.HttpTestFixture

open Microsoft.AspNetCore.Hosting
open Microsoft.AspNetCore.Mvc.Testing

/// WebApplicationFactory for the OrganicLeverBe app under test.
/// Used in unit tests to exercise the real Giraffe handler pipeline and obtain
/// AltCover coverage for handler code, without requiring any external services.
type TestWebAppFactory() =
    inherit WebApplicationFactory<OrganicLeverBe.Program.Marker>()

    override _.ConfigureWebHost(builder: IWebHostBuilder) =
        builder.UseEnvironment("Testing") |> ignore
