module OrganicLeverBe.Handlers.TestHandler

open System
open Giraffe
open Microsoft.EntityFrameworkCore
open OrganicLeverBe.Infrastructure.AppDbContext

let private testApiEnabled () =
    Environment.GetEnvironmentVariable("ENABLE_TEST_API") = "true"

let resetDb: HttpHandler =
    fun next ctx ->
        if not (testApiEnabled ()) then
            RequestErrors.notFound (json {| error = "Not Found" |}) next ctx
        else
            task {
                let db = ctx.GetService<AppDbContext>()

                let! _ = db.Database.ExecuteSqlRawAsync("DELETE FROM refresh_tokens")
                let! _ = db.Database.ExecuteSqlRawAsync("DELETE FROM users")

                return! json {| message = "Database reset successful" |} next ctx
            }

/// Test-only endpoint: deletes users but keeps refresh tokens.
/// Used to test the "user not found" path in the refresh token handler.
let deleteUsersOnly: HttpHandler =
    fun next ctx ->
        if not (testApiEnabled ()) then
            RequestErrors.notFound (json {| error = "Not Found" |}) next ctx
        else
            task {
                let db = ctx.GetService<AppDbContext>()
                let! _ = db.Database.ExecuteSqlRawAsync("DELETE FROM users")

                return! json {| message = "Users deleted" |} next ctx
            }
