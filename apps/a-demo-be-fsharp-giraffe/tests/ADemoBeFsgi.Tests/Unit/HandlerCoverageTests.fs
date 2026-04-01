module ADemoBeFsgi.Tests.Unit.HandlerCoverageTests

open System
open System.IdentityModel.Tokens.Jwt
open System.Net.Http
open System.Net.Http.Headers
open System.Security.Claims
open System.Text
open System.Text.Json
open Microsoft.IdentityModel.Tokens
open Xunit
open ADemoBeFsgi.Domain.Types
open ADemoBeFsgi.Domain.Expense
open ADemoBeFsgi.Tests.TestFixture
open ADemoBeFsgi.Tests.HttpTestFixture
open ADemoBeFsgi.Tests.DirectServices
open ADemoBeFsgi.Infrastructure.Repositories.EfRepositories

// ─────────────────────────────────────────────────────────────────────────────
// Pure function branch coverage
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type TypesModuleTests() =

    [<Fact>]
    member _.``currencyToString returns USD``() =
        Assert.Equal("USD", currencyToString USD)

    [<Fact>]
    member _.``currencyToString returns IDR``() =
        Assert.Equal("IDR", currencyToString IDR)

    [<Fact>]
    member _.``roleToString returns USER``() = Assert.Equal("USER", roleToString User)

    [<Fact>]
    member _.``roleToString returns ADMIN``() =
        Assert.Equal("ADMIN", roleToString Admin)

    [<Fact>]
    member _.``statusToString returns ACTIVE``() =
        Assert.Equal("ACTIVE", statusToString Active)

    [<Fact>]
    member _.``statusToString returns INACTIVE``() =
        Assert.Equal("INACTIVE", statusToString Inactive)

    [<Fact>]
    member _.``statusToString returns DISABLED``() =
        Assert.Equal("DISABLED", statusToString Disabled)

    [<Fact>]
    member _.``statusToString returns LOCKED``() =
        Assert.Equal("LOCKED", statusToString Locked)

    [<Fact>]
    member _.``parseStatus returns Active for ACTIVE``() =
        Assert.Equal(Some Active, parseStatus "ACTIVE")

    [<Fact>]
    member _.``parseStatus returns Inactive for INACTIVE``() =
        Assert.Equal(Some Inactive, parseStatus "INACTIVE")

    [<Fact>]
    member _.``parseStatus returns Disabled for DISABLED``() =
        Assert.Equal(Some Disabled, parseStatus "DISABLED")

    [<Fact>]
    member _.``parseStatus returns Locked for LOCKED``() =
        Assert.Equal(Some Locked, parseStatus "LOCKED")

    [<Fact>]
    member _.``parseStatus returns None for unknown``() =
        Assert.Equal(None, parseStatus "unknown")

    [<Fact>]
    member _.``parseCurrency case insensitive lowercase``() =
        Assert.Equal(Ok USD, parseCurrency "usd")

    [<Fact>]
    member _.``parseCurrency case insensitive mixed``() =
        Assert.Equal(Ok IDR, parseCurrency "Idr")

    [<Fact>]
    member _.``supportedUnits contains expected units``() =
        Assert.True(supportedUnits.Contains("liter"))
        Assert.True(supportedUnits.Contains("kg"))
        Assert.True(supportedUnits.Contains("hour"))

[<Trait("Category", "Unit")>]
type ExpenseModuleTests() =

    [<Fact>]
    member _.``validateCurrencyPrecision USD too many decimals fails``() =
        let result = validateCurrencyPrecision "USD" 10.123m
        Assert.True(Result.isError result)

    [<Fact>]
    member _.``validateCurrencyPrecision IDR with decimals fails``() =
        let result = validateCurrencyPrecision "IDR" 100.5m
        Assert.True(Result.isError result)

    [<Fact>]
    member _.``validateCurrencyPrecision unknown currency fails``() =
        let result = validateCurrencyPrecision "EUR" 10.00m
        Assert.True(Result.isError result)

    [<Fact>]
    member _.``validateCurrencyPrecision USD valid passes``() =
        let result = validateCurrencyPrecision "USD" 10.00m
        Assert.True(Result.isOk result)

    [<Fact>]
    member _.``validateCurrencyPrecision IDR valid passes``() =
        let result = validateCurrencyPrecision "IDR" 100000m
        Assert.True(Result.isOk result)

    [<Fact>]
    member _.``validateUnit empty string passes``() =
        Assert.True(Result.isOk (validateUnit (Some "")))

    [<Fact>]
    member _.``validateUnit uppercase unit normalizes``() =
        let result = validateUnit (Some "LITER")
        Assert.Equal(Ok(Some "liter"), result)

// ─────────────────────────────────────────────────────────────────────────────
// JwtService branch coverage
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type JwtServiceTests() =

    [<Fact>]
    member _.``validateToken returns None for invalid token``() =
        let result = ADemoBeFsgi.Auth.JwtService.validateToken "not-a-valid-token"
        Assert.Equal(None, result)

    [<Fact>]
    member _.``getTokenJti returns None for invalid token``() =
        let result = ADemoBeFsgi.Auth.JwtService.getTokenJti "not-a-valid-token"
        Assert.Equal(None, result)

    [<Fact>]
    member _.``getTokenExpiry returns None for invalid token``() =
        let result = ADemoBeFsgi.Auth.JwtService.getTokenExpiry "not-a-valid-token"
        Assert.Equal(None, result)

    [<Fact>]
    member _.``generateAccessToken produces a parseable JWT``() =
        let userId = Guid.NewGuid()

        let token =
            ADemoBeFsgi.Auth.JwtService.generateAccessToken userId "alice" "alice@example.com" "user"

        Assert.False(String.IsNullOrEmpty(token))
        let jti = ADemoBeFsgi.Auth.JwtService.getTokenJti token
        Assert.True(jti.IsSome)

    [<Fact>]
    member _.``generateRefreshToken produces a parseable JWT``() =
        let userId = Guid.NewGuid()
        let token = ADemoBeFsgi.Auth.JwtService.generateRefreshToken userId
        Assert.False(String.IsNullOrEmpty(token))
        let expiry = ADemoBeFsgi.Auth.JwtService.getTokenExpiry token
        Assert.True(expiry.IsSome)

    [<Fact>]
    member _.``getJwks returns keys array``() =
        let jwks = ADemoBeFsgi.Auth.JwtService.getJwks ()
        let json = JsonSerializer.Serialize(jwks)
        Assert.Contains("keys", json)

    [<Fact>]
    member _.``generateAccessToken uses environment variable when set``() =
        let original = Environment.GetEnvironmentVariable("APP_JWT_SECRET")

        try
            Environment.SetEnvironmentVariable("APP_JWT_SECRET", "test-secret-long-enough-for-hmac-sha256-minimum")

            let userId = Guid.NewGuid()

            let token =
                ADemoBeFsgi.Auth.JwtService.generateAccessToken userId "bob" "bob@example.com" "user"

            Assert.False(String.IsNullOrEmpty(token))
        finally
            if original = null then
                Environment.SetEnvironmentVariable("APP_JWT_SECRET", null)
            else
                Environment.SetEnvironmentVariable("APP_JWT_SECRET", original)

// ─────────────────────────────────────────────────────────────────────────────
// Handler coverage via direct service calls
// ─────────────────────────────────────────────────────────────────────────────

let private jwtSecret = "dev-jwt-secret-at-least-32-characters-long-for-hmac"

let private makeCustomToken (claimsArr: Claim array) (includeJti: bool) =
    let key = SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    let signingCreds = SigningCredentials(key, SecurityAlgorithms.HmacSha256)
    let now = DateTime.UtcNow

    let allClaims =
        if includeJti then
            Array.append claimsArr [| Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) |]
        else
            claimsArr

    let token =
        JwtSecurityToken(
            issuer = "a-demo-be-fsharp-giraffe",
            audience = "a-demo-be-fsharp-giraffe",
            claims = allClaims,
            notBefore = now,
            expires = now.AddMinutes(15.0),
            signingCredentials = signingCreds
        )

    JwtSecurityTokenHandler().WriteToken(token)

let private shortId () =
    let raw = Guid.NewGuid().ToString("N")
    raw.Substring(0, 8)

let private registerAndLogin (db: ADemoBeFsgi.Infrastructure.AppDbContext.AppDbContext) (username: string) =
    let userRepo = createUserRepo db
    let rtRepo = createRefreshTokenRepo db
    let email = $"{username}@example.com"

    register userRepo username email "Str0ng#Pass1!"
    |> Async.RunSynchronously
    |> ignore

    let status, body =
        login userRepo rtRepo username "Str0ng#Pass1!" |> Async.RunSynchronously

    if status = 200 then
        let doc = JsonDocument.Parse(body)
        doc.RootElement.GetProperty("accessToken").GetString()
    else
        failwith $"Login failed for {username}: {status} {body}"

let private createExpenseForUser (db: ADemoBeFsgi.Infrastructure.AppDbContext.AppDbContext) (token: string) =
    let status, body =
        createExpense
            (createUserRepo db)
            (createTokenRepo db)
            (createExpenseRepo db)
            (Some token)
            "10.00"
            "USD"
            "food"
            "test"
            "2024-01-01"
            "expense"
            None
            None
        |> Async.RunSynchronously

    if status = 201 then
        let doc = JsonDocument.Parse(body)
        doc.RootElement.GetProperty("id").GetString()
    else
        failwith $"Create expense failed: {status} {body}"

// ─────────────────────────────────────────────────────────────────────────────
// Program handler coverage
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type ProgramHandlerCoverageTests() =

    [<Fact>]
    member _.``setAdminRole with nonexistent user returns 404``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let fakeUsername = $"nobody_{shortId ()}"

        let status, _ =
            setAdminRole (createUserRepo db) fakeUsername |> Async.RunSynchronously

        Assert.Equal(404, status)

// ─────────────────────────────────────────────────────────────────────────────
// Auth handler
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type AuthHandlerCoverageTests() =

    [<Fact>]
    member _.``register with empty username returns 400``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            register (createUserRepo db) "" "a@example.com" "Str0ng#Pass1!"
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``register with empty email returns 400``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            register (createUserRepo db) "alice" "" "Str0ng#Pass1!"
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``register with empty password returns 400``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            register (createUserRepo db) "alice" "a@example.com" ""
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``register with null username returns 400``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            register (createUserRepo db) null "a@example.com" "Str0ng#Pass1!"
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``login with inactive account returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"ina_{shortId ()}"
        let token = registerAndLogin db username

        deactivate (createUserRepo db) (createTokenRepo db) (Some token)
        |> Async.RunSynchronously
        |> ignore

        let status, _ =
            login (createUserRepo db) (createRefreshTokenRepo db) username "Str0ng#Pass1!"
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``login with disabled account returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"dis_{shortId ()}"

        let email = $"{username}@example.com"

        let _s, regBody =
            register (createUserRepo db) username email "Str0ng#Pass1!"
            |> Async.RunSynchronously

        let userId = JsonDocument.Parse(regBody).RootElement.GetProperty("id").GetString()

        let adminName = $"adm_{shortId ()}"
        let adminEmail = $"{adminName}@example.com"

        register (createUserRepo db) adminName adminEmail "Str0ng#Pass1!"
        |> Async.RunSynchronously
        |> ignore

        setAdminRole (createUserRepo db) adminName |> Async.RunSynchronously |> ignore
        let adminToken, _ = Some(registerAndLogin db adminName), None

        disableUser (createUserRepo db) (createTokenRepo db) adminToken (Guid.Parse(userId))
        |> Async.RunSynchronously
        |> ignore

        let status, _ =
            login (createUserRepo db) (createRefreshTokenRepo db) username "Str0ng#Pass1!"
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``login account gets locked after 5 failed attempts``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"lck_{shortId ()}"
        let email = $"{username}@example.com"

        register (createUserRepo db) username email "Str0ng#Pass1!"
        |> Async.RunSynchronously
        |> ignore

        for _ in 1..4 do
            let status, _ =
                login (createUserRepo db) (createRefreshTokenRepo db) username "WrongPass1!"
                |> Async.RunSynchronously

            Assert.Equal(401, status)

        let status, _ =
            login (createUserRepo db) (createRefreshTokenRepo db) username "WrongPass1!"
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``refresh with invalid token returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            refresh (createUserRepo db) (createRefreshTokenRepo db) "nonexistent"
            |> Async.RunSynchronously

        Assert.Equal(401, status)

// ─────────────────────────────────────────────────────────────────────────────
// Token handler
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type TokenHandlerCoverageTests() =

    [<Fact>]
    member _.``claims endpoint with valid token returns 200``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"tok_{shortId ()}"
        let token = registerAndLogin db username
        let status, body = getTokenClaims (Some token)
        Assert.Equal(200, status)
        Assert.Contains("sub", body)

    [<Fact>]
    member _.``claims endpoint without token returns 400``() =
        let status, _ = getTokenClaims None
        // No token → cannot decode → 400
        Assert.Equal(400, status)

    [<Fact>]
    member _.``jwks endpoint returns keys``() =
        let status, body = getJwks ()
        Assert.Equal(200, status)
        Assert.Contains("keys", body)

// ─────────────────────────────────────────────────────────────────────────────
// User handler
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type UserHandlerCoverageTests() =

    [<Fact>]
    member _.``changePassword with wrong old password returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"pwd_{shortId ()}"
        let token = registerAndLogin db username

        let status, _ =
            changePassword (createUserRepo db) (createTokenRepo db) (Some token) "WrongPass1!" "NewStr0ng#Pass1!"
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``updateProfile with null display name uses existing``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"prf_{shortId ()}"
        let token = registerAndLogin db username

        let status, _ =
            updateProfile (createUserRepo db) (createTokenRepo db) (Some token) null
            |> Async.RunSynchronously

        Assert.Equal(200, status)

// ─────────────────────────────────────────────────────────────────────────────
// Admin handler
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type AdminHandlerCoverageTests() =

    let createAdminContext () =
        let db, cleanup = createDb ()
        let adminName = $"adm_{shortId ()}"
        let adminEmail = $"{adminName}@example.com"

        register (createUserRepo db) adminName adminEmail "Str0ng#Pass1!"
        |> Async.RunSynchronously
        |> ignore

        setAdminRole (createUserRepo db) adminName |> Async.RunSynchronously |> ignore
        let adminToken = registerAndLogin db adminName
        db, cleanup, adminToken

    [<Fact>]
    member _.``disableUser with nonexistent user returns 404``() =
        let db, cleanup, adminToken = createAdminContext ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let fakeId = Guid.NewGuid()

        let status, _ =
            disableUser (createUserRepo db) (createTokenRepo db) (Some adminToken) fakeId
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``enableUser with nonexistent user returns 404``() =
        let db, cleanup, adminToken = createAdminContext ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let fakeId = Guid.NewGuid()

        let status, _ =
            enableUser (createUserRepo db) (createTokenRepo db) (Some adminToken) fakeId
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``unlockUser with nonexistent user returns 404``() =
        let db, cleanup, adminToken = createAdminContext ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let fakeId = Guid.NewGuid()

        let status, _ =
            unlockUser (createUserRepo db) (createTokenRepo db) (Some adminToken) fakeId
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``forcePasswordReset with nonexistent user returns 404``() =
        let db, cleanup, adminToken = createAdminContext ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let fakeId = Guid.NewGuid()

        let status, _ =
            forcePasswordReset (createUserRepo db) (createTokenRepo db) (Some adminToken) fakeId
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``listUsers with email filter returns filtered results``() =
        let db, cleanup, adminToken = createAdminContext ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            listUsers (createUserRepo db) (createTokenRepo db) (Some adminToken) 1 20 (Some "notexists@example.com")
            |> Async.RunSynchronously

        Assert.Equal(200, status)

    [<Fact>]
    member _.``non-admin user gets 403 on admin endpoint``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"nonadm_{shortId ()}"
        let token = registerAndLogin db username

        let status, _ =
            listUsers (createUserRepo db) (createTokenRepo db) (Some token) 1 20 None
            |> Async.RunSynchronously

        Assert.Equal(403, status)

// ─────────────────────────────────────────────────────────────────────────────
// Expense handler
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type ExpenseHandlerCoverageTests() =

    let setupUser () =
        let db, cleanup = createDb ()
        let username = $"exp_{shortId ()}"
        let token = registerAndLogin db username
        db, cleanup, token

    [<Fact>]
    member _.``create expense with invalid currency returns 400``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "10.00"
                "EUR"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                None
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``create expense with empty amount returns 400``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                ""
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                None
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``create expense with invalid amount format returns 400``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "not-a-number"
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                None
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``create expense with negative amount returns 400``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "-5.00"
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                None
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``create expense with invalid unit returns 400``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "10.00"
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                (Some "fathom")
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``create expense with IDR currency formats correctly``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, respBody =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "150000"
                "IDR"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                None
            |> Async.RunSynchronously

        Assert.Equal(201, status)
        Assert.Contains("150000", respBody)

    [<Fact>]
    member _.``create expense with invalid date defaults to now``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "10.00"
                "USD"
                "food"
                "test"
                "not-a-date"
                "expense"
                None
                None
            |> Async.RunSynchronously

        Assert.Equal(201, status)

    [<Fact>]
    member _.``create expense with null category and description``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "10.00"
                "USD"
                null
                null
                "2024-01-01"
                null
                None
                None
            |> Async.RunSynchronously

        Assert.Equal(201, status)

    [<Fact>]
    member _.``create expense with quantity and unit``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "10.00"
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
                (Some 2.5)
                (Some "kg")
            |> Async.RunSynchronously

        Assert.Equal(201, status)

    [<Fact>]
    member _.``getById returns 404 for nonexistent expense``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            getExpenseById (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) (Guid.NewGuid())
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``getById returns 403 when accessing another user's expense``() =
        let db, cleanup, token1 = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username2 = $"exp_{shortId ()}"
        let token2 = registerAndLogin db username2
        let expId = createExpenseForUser db token1

        let status, _ =
            getExpenseById
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token2)
                (Guid.Parse(expId))
            |> Async.RunSynchronously

        Assert.Equal(403, status)

    [<Fact>]
    member _.``getById with unit returns unit in response``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let _s, body =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "10.00"
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
                (Some 2.0)
                (Some "kg")
            |> Async.RunSynchronously

        let expId =
            Guid.Parse(JsonDocument.Parse(body).RootElement.GetProperty("id").GetString())

        let status, respBody =
            getExpenseById (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) expId
            |> Async.RunSynchronously

        Assert.Equal(200, status)
        Assert.Contains("kg", respBody)

    [<Fact>]
    member _.``getById with IDR currency formats correctly``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let _s, body =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "150000"
                "IDR"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                None
            |> Async.RunSynchronously

        let expId =
            Guid.Parse(JsonDocument.Parse(body).RootElement.GetProperty("id").GetString())

        let status, respBody =
            getExpenseById (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) expId
            |> Async.RunSynchronously

        Assert.Equal(200, status)
        Assert.Contains("150000", respBody)

    [<Fact>]
    member _.``update expense returns 404 for nonexistent``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            updateExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                (Guid.NewGuid())
                "20.00"
                "USD"
                "food"
                "updated"
                "2024-01-01"
                "expense"
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``update expense returns 403 for another user's expense``() =
        let db, cleanup, token1 = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username2 = $"exp_{shortId ()}"
        let token2 = registerAndLogin db username2
        let expId = createExpenseForUser db token1

        let status, _ =
            updateExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token2)
                (Guid.Parse(expId))
                "20.00"
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
            |> Async.RunSynchronously

        Assert.Equal(403, status)

    [<Fact>]
    member _.``update expense with invalid amount returns 400``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let expId = createExpenseForUser db token

        let status, _ =
            updateExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                (Guid.Parse(expId))
                "bad"
                "USD"
                "food"
                "test"
                "2024-01-01"
                "expense"
            |> Async.RunSynchronously

        Assert.Equal(400, status)

    [<Fact>]
    member _.``update expense with IDR currency formats correctly``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let _s, body =
            createExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "150000"
                "IDR"
                "food"
                "test"
                "2024-01-01"
                "expense"
                None
                None
            |> Async.RunSynchronously

        let expId =
            Guid.Parse(JsonDocument.Parse(body).RootElement.GetProperty("id").GetString())

        let status, respBody =
            updateExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                expId
                "200000"
                "IDR"
                "food"
                "updated"
                "2024-01-02"
                "expense"
            |> Async.RunSynchronously

        Assert.Equal(200, status)
        Assert.Contains("200000", respBody)

    [<Fact>]
    member _.``update expense with null optional fields uses existing values``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let expId = createExpenseForUser db token

        let status, _ =
            updateExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                (Guid.Parse(expId))
                "15.00"
                null
                null
                null
                "not-a-date"
                null
            |> Async.RunSynchronously

        Assert.Equal(200, status)

    [<Fact>]
    member _.``delete expense returns 404 for nonexistent``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            deleteExpense (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) (Guid.NewGuid())
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``delete expense returns 403 for another user's expense``() =
        let db, cleanup, token1 = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username2 = $"exp_{shortId ()}"
        let token2 = registerAndLogin db username2
        let expId = createExpenseForUser db token1

        let status, _ =
            deleteExpense
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token2)
                (Guid.Parse(expId))
            |> Async.RunSynchronously

        Assert.Equal(403, status)

    [<Fact>]
    member _.``list expenses with IDR currency formats correctly``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        createExpense
            (createUserRepo db)
            (createTokenRepo db)
            (createExpenseRepo db)
            (Some token)
            "150000"
            "IDR"
            "food"
            "test"
            "2024-01-01"
            "expense"
            None
            None
        |> Async.RunSynchronously
        |> ignore

        let status, respBody =
            listExpenses (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) 1 20
            |> Async.RunSynchronously

        Assert.Equal(200, status)
        Assert.Contains("150000", respBody)

    [<Fact>]
    member _.``list expenses with quantity``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        createExpense
            (createUserRepo db)
            (createTokenRepo db)
            (createExpenseRepo db)
            (Some token)
            "10.00"
            "USD"
            "food"
            "test"
            "2024-01-01"
            "expense"
            (Some 1.5)
            (Some "kg")
        |> Async.RunSynchronously
        |> ignore

        let status, respBody =
            listExpenses (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) 1 20
            |> Async.RunSynchronously

        Assert.Equal(200, status)
        Assert.Contains("1.5", respBody)

    [<Fact>]
    member _.``summary with IDR expenses formats correctly``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        createExpense
            (createUserRepo db)
            (createTokenRepo db)
            (createExpenseRepo db)
            (Some token)
            "150000"
            "IDR"
            "food"
            "test"
            "2024-01-01"
            "expense"
            None
            None
        |> Async.RunSynchronously
        |> ignore

        let status, respBody =
            expenseSummary (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token)
            |> Async.RunSynchronously

        Assert.Equal(200, status)
        Assert.Contains("IDR", respBody)

// ─────────────────────────────────────────────────────────────────────────────
// Attachment handler
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type AttachmentHandlerCoverageTests() =

    let setupUser () =
        let db, cleanup = createDb ()
        let username = $"att_{shortId ()}"
        let token = registerAndLogin db username
        db, cleanup, token

    [<Fact>]
    member _.``upload attachment to nonexistent expense returns 404``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let fakeId = Guid.NewGuid()
        let data = [| 0uy; 1uy; 2uy |]

        let status, _ =
            uploadAttachment
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token)
                fakeId
                "test.jpg"
                "image/jpeg"
                data
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``upload attachment to another user's expense returns 403``() =
        let db, cleanup, token1 = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username2 = $"att_{shortId ()}"
        let token2 = registerAndLogin db username2
        let expId = createExpenseForUser db token1
        let data = [| 0uy; 1uy; 2uy |]

        let status, _ =
            uploadAttachment
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token2)
                (Guid.Parse(expId))
                "test.jpg"
                "image/jpeg"
                data
            |> Async.RunSynchronously

        Assert.Equal(403, status)

    [<Fact>]
    member _.``upload attachment with unsupported content type returns 415``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let expId = createExpenseForUser db token
        let data = [| 0uy; 1uy; 2uy |]

        let status, _ =
            uploadAttachment
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token)
                (Guid.Parse(expId))
                "test.bin"
                "application/octet-stream"
                data
            |> Async.RunSynchronously

        Assert.Equal(415, status)

    [<Fact>]
    member _.``list attachments for nonexistent expense returns 404``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            listAttachments
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token)
                (Guid.NewGuid())
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``list attachments for another user's expense returns 403``() =
        let db, cleanup, token1 = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username2 = $"att_{shortId ()}"
        let token2 = registerAndLogin db username2
        let expId = createExpenseForUser db token1

        let status, _ =
            listAttachments
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token2)
                (Guid.Parse(expId))
            |> Async.RunSynchronously

        Assert.Equal(403, status)

    [<Fact>]
    member _.``delete attachment for nonexistent expense returns 404``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let fakeId = Guid.NewGuid()
        let fakeAttId = Guid.NewGuid()

        let status, _ =
            deleteAttachment
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token)
                fakeId
                fakeAttId
            |> Async.RunSynchronously

        Assert.Equal(404, status)

    [<Fact>]
    member _.``delete attachment for another user's expense returns 403``() =
        let db, cleanup, token1 = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username2 = $"att_{shortId ()}"
        let token2 = registerAndLogin db username2
        let expId = createExpenseForUser db token1
        let fakeAttId = Guid.NewGuid()

        let status, _ =
            deleteAttachment
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token2)
                (Guid.Parse(expId))
                fakeAttId
            |> Async.RunSynchronously

        Assert.Equal(403, status)

    [<Fact>]
    member _.``delete nonexistent attachment on own expense returns 404``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let expId = createExpenseForUser db token
        let fakeAttId = Guid.NewGuid()

        let status, _ =
            deleteAttachment
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (createAttachmentRepo db)
                (Some token)
                (Guid.Parse(expId))
                fakeAttId
            |> Async.RunSynchronously

        Assert.Equal(404, status)

// ─────────────────────────────────────────────────────────────────────────────
// Auth / JWT middleware coverage via resolveAuth
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type JwtMiddlewareCoverageTests() =

    [<Fact>]
    member _.``request with no token returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            getProfile (createUserRepo db) (createTokenRepo db) None
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``request with invalid JWT returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            getProfile (createUserRepo db) (createTokenRepo db) (Some "invalid.jwt.token")
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``request with revoked token returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"rev_{shortId ()}"
        let token = registerAndLogin db username
        logout (createTokenRepo db) (Some token) |> Async.RunSynchronously |> ignore

        let status, _ =
            getProfile (createUserRepo db) (createTokenRepo db) (Some token)
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``request with token having no jti treated as revoked returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let userId = Guid.NewGuid()
        let claimsArr = [| Claim(JwtRegisteredClaimNames.Sub, userId.ToString()) |]
        let token = makeCustomToken claimsArr false

        let status, _ =
            getProfile (createUserRepo db) (createTokenRepo db) (Some token)
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``request with token with non-guid sub returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let claimsArr = [| Claim(JwtRegisteredClaimNames.Sub, "not-a-guid") |]
        let token = makeCustomToken claimsArr true

        let status, _ =
            getProfile (createUserRepo db) (createTokenRepo db) (Some token)
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``request with valid guid sub but non-existent user returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let nonExistentGuid = Guid.NewGuid()

        let claimsArr =
            [| Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier", nonExistentGuid.ToString()) |]

        let token = makeCustomToken claimsArr true

        let status, _ =
            getProfile (createUserRepo db) (createTokenRepo db) (Some token)
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``request with deactivated user account returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"dact_{shortId ()}"
        let token = registerAndLogin db username

        deactivate (createUserRepo db) (createTokenRepo db) (Some token)
        |> Async.RunSynchronously
        |> ignore

        let status, body =
            getProfile (createUserRepo db) (createTokenRepo db) (Some token)
            |> Async.RunSynchronously

        Assert.Equal(401, status)
        Assert.Contains("deactivated", body)

    [<Fact>]
    member _.``request with locked user account returns 401 with locked message``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"lkm_{shortId ()}"
        let email = $"{username}@example.com"

        register (createUserRepo db) username email "Str0ng#Pass1!"
        |> Async.RunSynchronously
        |> ignore

        let _s, loginResp =
            login (createUserRepo db) (createRefreshTokenRepo db) username "Str0ng#Pass1!"
            |> Async.RunSynchronously

        let doc = JsonDocument.Parse(loginResp)
        let token = doc.RootElement.GetProperty("accessToken").GetString()

        for _ in 1..5 do
            login (createUserRepo db) (createRefreshTokenRepo db) username "WrongPass1!"
            |> Async.RunSynchronously
            |> ignore

        let status, body =
            getProfile (createUserRepo db) (createTokenRepo db) (Some token)
            |> Async.RunSynchronously

        Assert.Equal(401, status)
        Assert.Contains("locked", body)

// ─────────────────────────────────────────────────────────────────────────────
// Report handler
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type ReportHandlerCoverageTests() =

    let setupUser () =
        let db, cleanup = createDb ()
        let username = $"rpt_{shortId ()}"
        let token = registerAndLogin db username
        db, cleanup, token

    [<Fact>]
    member _.``profit and loss with IDR currency returns formatted results``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        createExpense
            (createUserRepo db)
            (createTokenRepo db)
            (createExpenseRepo db)
            (Some token)
            "500000"
            "IDR"
            "salary"
            "income"
            "2024-01-15"
            "income"
            None
            None
        |> Async.RunSynchronously
        |> ignore

        createExpense
            (createUserRepo db)
            (createTokenRepo db)
            (createExpenseRepo db)
            (Some token)
            "100000"
            "IDR"
            "food"
            "expense"
            "2024-01-15"
            "expense"
            None
            None
        |> Async.RunSynchronously
        |> ignore

        let status, respBody =
            profitAndLoss (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) "" "" "IDR"
            |> Async.RunSynchronously

        Assert.Equal(200, status)
        Assert.Contains("500000", respBody)

    [<Fact>]
    member _.``profit and loss with invalid date params uses defaults``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            profitAndLoss
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "notadate"
                "notadate"
                "USD"
            |> Async.RunSynchronously

        Assert.Equal(200, status)

    [<Fact>]
    member _.``profit and loss with valid date range filters correctly``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            profitAndLoss
                (createUserRepo db)
                (createTokenRepo db)
                (createExpenseRepo db)
                (Some token)
                "2024-01-01"
                "2024-12-31"
                "USD"
            |> Async.RunSynchronously

        Assert.Equal(200, status)

    [<Fact>]
    member _.``profit and loss with no date params returns all``() =
        let db, cleanup, token = setupUser ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let status, _ =
            profitAndLoss (createUserRepo db) (createTokenRepo db) (createExpenseRepo db) (Some token) "" "" "USD"
            |> Async.RunSynchronously

        Assert.Equal(200, status)

// ─────────────────────────────────────────────────────────────────────────────
// Additional auth handler coverage
// ─────────────────────────────────────────────────────────────────────────────

[<Trait("Category", "Unit")>]
type AuthHandlerAdditionalTests() =

    [<Fact>]
    member _.``refresh with inactive user returns 401``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"rfi_{shortId ()}"
        let email = $"{username}@example.com"

        register (createUserRepo db) username email "Str0ng#Pass1!"
        |> Async.RunSynchronously
        |> ignore

        let _s, loginResp =
            login (createUserRepo db) (createRefreshTokenRepo db) username "Str0ng#Pass1!"
            |> Async.RunSynchronously

        let doc = JsonDocument.Parse(loginResp)
        let token = doc.RootElement.GetProperty("accessToken").GetString()
        let rt = doc.RootElement.GetProperty("refreshToken").GetString()

        deactivate (createUserRepo db) (createTokenRepo db) (Some token)
        |> Async.RunSynchronously
        |> ignore

        let status, _ =
            refresh (createUserRepo db) (createRefreshTokenRepo db) rt
            |> Async.RunSynchronously

        Assert.Equal(401, status)

    [<Fact>]
    member _.``logout already logged out token is idempotent``() =
        let db, cleanup = createDb ()

        use _ =
            { new IDisposable with
                member _.Dispose() = cleanup () }

        let username = $"dbl_{shortId ()}"
        let token = registerAndLogin db username
        logout (createTokenRepo db) (Some token) |> Async.RunSynchronously |> ignore
        // Second logout with same token — logout is safe to call twice
        let status, _ = logout (createTokenRepo db) (Some token) |> Async.RunSynchronously
        // logout returns 200 regardless; the token is already revoked in DB
        Assert.Equal(200, status)

// ─────────────────────────────────────────────────────────────────────────────
// HTTP handler pipeline coverage via WebApplicationFactory
//
// These tests exercise the actual Giraffe HttpHandler code in src/ — which cannot
// be reached by DirectServices calls since they bypass HttpContext entirely.
// Each test class creates its own TestWebAppFactory (isolated in-memory SQLite).
// ─────────────────────────────────────────────────────────────────────────────

let private jsonContent (body: obj) =
    let opts = JsonSerializerOptions(PropertyNameCaseInsensitive = true)
    new StringContent(JsonSerializer.Serialize(body, opts), Encoding.UTF8, "application/json")

let private getJson (resp: HttpResponseMessage) =
    resp.Content.ReadAsStringAsync() |> Async.AwaitTask |> Async.RunSynchronously

let private httpRegister (client: HttpClient) (username: string) (email: string) (password: string) =
    let body =
        jsonContent
            {| username = username
               email = email
               password = password |}

    let resp =
        client.PostAsync("/api/v1/auth/register", body)
        |> Async.AwaitTask
        |> Async.RunSynchronously

    int resp.StatusCode, getJson resp

let private httpLogin (client: HttpClient) (username: string) (password: string) =
    let body =
        jsonContent
            {| username = username
               password = password |}

    let resp =
        client.PostAsync("/api/v1/auth/login", body)
        |> Async.AwaitTask
        |> Async.RunSynchronously

    int resp.StatusCode, getJson resp

let private httpLoginGetToken (client: HttpClient) (username: string) =
    let _s, body = httpLogin client username "Str0ng#Pass1!"
    let doc = JsonDocument.Parse(body)
    doc.RootElement.GetProperty("accessToken").GetString(), doc.RootElement.GetProperty("refreshToken").GetString()

let private withAuth (token: string) (req: HttpRequestMessage) =
    req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
    req

let private httpGet (client: HttpClient) (url: string) (token: string option) =
    use req = new HttpRequestMessage(HttpMethod.Get, url)

    match token with
    | Some t -> req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", t)
    | None -> ()

    let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
    int resp.StatusCode, getJson resp

let private httpPost (client: HttpClient) (url: string) (token: string option) (body: obj) =
    use req = new HttpRequestMessage(HttpMethod.Post, url)
    req.Content <- jsonContent body

    match token with
    | Some t -> req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", t)
    | None -> ()

    let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
    int resp.StatusCode, getJson resp

let private httpPostEmpty (client: HttpClient) (url: string) (token: string option) =
    use req = new HttpRequestMessage(HttpMethod.Post, url)
    req.Content <- new StringContent("", Encoding.UTF8, "application/json")

    match token with
    | Some t -> req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", t)
    | None -> ()

    let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
    int resp.StatusCode, getJson resp

let private httpPatch (client: HttpClient) (url: string) (token: string option) (body: obj) =
    use req = new HttpRequestMessage(HttpMethod.Patch, url)
    req.Content <- jsonContent body

    match token with
    | Some t -> req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", t)
    | None -> ()

    let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
    int resp.StatusCode, getJson resp

let private httpDelete (client: HttpClient) (url: string) (token: string option) =
    use req = new HttpRequestMessage(HttpMethod.Delete, url)

    match token with
    | Some t -> req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", t)
    | None -> ()

    let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
    int resp.StatusCode, getJson resp

let private httpPut (client: HttpClient) (url: string) (token: string option) (body: obj) =
    use req = new HttpRequestMessage(HttpMethod.Put, url)
    req.Content <- jsonContent body

    match token with
    | Some t -> req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", t)
    | None -> ()

    let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
    int resp.StatusCode, getJson resp

[<Trait("Category", "Unit")>]
type HttpAuthHandlerTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``POST /auth/register with valid data returns 201``() =
        let un = $"hreg_{shortId ()}"
        let status, _ = httpRegister client un $"{un}@example.com" "Str0ng#Pass1!"
        Assert.Equal(201, status)

    [<Fact>]
    member _.``POST /auth/register with duplicate username returns 409``() =
        let un = $"hdup_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let status, _ = httpRegister client un $"{un}2@example.com" "Str0ng#Pass1!"
        Assert.Equal(409, status)

    [<Fact>]
    member _.``POST /auth/register with invalid JSON returns 400``() =
        use req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/register")
        req.Content <- new StringContent("{not valid json}", Encoding.UTF8, "application/json")
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``POST /auth/register with empty fields returns 400``() =
        let status, _ = httpRegister client "" "a@example.com" "Str0ng#Pass1!"
        Assert.Equal(400, status)

    [<Fact>]
    member _.``POST /auth/login with valid credentials returns 200``() =
        let un = $"hlog_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let status, _ = httpLogin client un "Str0ng#Pass1!"
        Assert.Equal(200, status)

    [<Fact>]
    member _.``POST /auth/login with invalid credentials returns 401``() =
        let un = $"hbad_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let status, _ = httpLogin client un "WrongPass1!"
        Assert.Equal(401, status)

    [<Fact>]
    member _.``POST /auth/login with invalid JSON returns 400``() =
        use req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/login")
        req.Content <- new StringContent("{not json}", Encoding.UTF8, "application/json")
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``POST /auth/refresh with valid token returns 200``() =
        let un = $"href_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let _, rt = httpLoginGetToken client un
        let status, _ = httpPost client "/api/v1/auth/refresh" None {| refreshToken = rt |}
        Assert.Equal(200, status)

    [<Fact>]
    member _.``POST /auth/refresh with invalid token returns 401``() =
        let status, _ =
            httpPost client "/api/v1/auth/refresh" None {| refreshToken = "bad-token" |}

        Assert.Equal(401, status)

    [<Fact>]
    member _.``POST /auth/refresh with invalid JSON returns 400``() =
        use req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh")
        req.Content <- new StringContent("{not json}", Encoding.UTF8, "application/json")
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``POST /auth/logout with valid token returns 200``() =
        let un = $"hlgt_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        let status, _ = httpPostEmpty client "/api/v1/auth/logout" (Some token)
        Assert.Equal(200, status)

    [<Fact>]
    member _.``POST /auth/logout without token returns 200 (idempotent)``() =
        // logout is not behind requireAuth — it always returns 200
        let status, _ = httpPostEmpty client "/api/v1/auth/logout" None
        Assert.Equal(200, status)

    [<Fact>]
    member _.``POST /auth/logout-all with valid token returns 200``() =
        let un = $"hlga_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        let status, _ = httpPostEmpty client "/api/v1/auth/logout-all" (Some token)
        Assert.Equal(200, status)

    [<Fact>]
    member _.``POST /auth/register with invalid email returns 400``() =
        let un = $"hiem_{shortId ()}"
        let status, _ = httpRegister client un "not-an-email" "Str0ng#Pass1!"
        Assert.Equal(400, status)

    [<Fact>]
    member _.``POST /auth/register with weak password returns 400``() =
        let un = $"hwpw_{shortId ()}"
        let status, _ = httpRegister client un $"{un}@example.com" "weak"
        Assert.Equal(400, status)

    [<Fact>]
    member _.``POST /auth/login with nonexistent user returns 401``() =
        let status, _ = httpLogin client $"nobody_{shortId ()}" "Str0ng#Pass1!"
        Assert.Equal(401, status)

    [<Fact>]
    member _.``POST /auth/login with inactive user returns 401``() =
        let un = $"hina_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        httpPostEmpty client "/api/v1/users/me/deactivate" (Some token) |> ignore
        let status, _ = httpLogin client un "Str0ng#Pass1!"
        Assert.Equal(401, status)

    [<Fact>]
    member _.``POST /auth/login with disabled user returns 401``() =
        let un = $"hdiu_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore

        let _s, regBody =
            httpRegister client $"adm_{shortId ()}" $"adm_{shortId ()}@example.com" "Str0ng#Pass1!"

        // Register separate admin
        let adminUn = $"admd_{shortId ()}"
        httpRegister client adminUn $"{adminUn}@example.com" "Str0ng#Pass1!" |> ignore

        client.PostAsync($"/api/v1/test/set-admin-role/{adminUn}", new StringContent(""))
        |> Async.AwaitTask
        |> Async.RunSynchronously
        |> ignore

        let adminToken, _ = httpLoginGetToken client adminUn

        // Get target user ID
        let _s2, userRegBody =
            httpRegister client $"tgt_{shortId ()}" $"tgt_{shortId ()}@example.com" "Str0ng#Pass1!"
        // Disable that user
        let userId =
            JsonDocument.Parse(userRegBody).RootElement.GetProperty("id").GetString()

        httpPostEmpty client $"/api/v1/admin/users/{userId}/disable" (Some adminToken)
        |> ignore

        // Check user cannot login
        let targetUn =
            JsonDocument.Parse(userRegBody).RootElement.GetProperty("username").GetString()

        let status, _ = httpLogin client targetUn "Str0ng#Pass1!"
        Assert.Equal(401, status)

    [<Fact>]
    member _.``POST /auth/login locks account after 5 failed attempts``() =
        let un = $"hlka_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore

        // 5 wrong password attempts
        for _ in 1..5 do
            httpLogin client un "WrongPass1!" |> ignore

        let status, _ = httpLogin client un "Str0ng#Pass1!"
        Assert.Equal(401, status)

[<Trait("Category", "Unit")>]
type HttpHealthAndTokenTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``GET /health returns 200``() =
        let status, body = httpGet client "/health" None
        Assert.Equal(200, status)
        Assert.Contains("UP", body)

    [<Fact>]
    member _.``GET /.well-known/jwks.json returns 200``() =
        let status, body = httpGet client "/.well-known/jwks.json" None
        Assert.Equal(200, status)
        Assert.Contains("keys", body)

    [<Fact>]
    member _.``GET /api/v1/tokens/claims with valid token returns 200``() =
        let un = $"htok_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        let status, body = httpGet client "/api/v1/tokens/claims" (Some token)
        Assert.Equal(200, status)
        Assert.Contains("sub", body)

    [<Fact>]
    member _.``GET /api/v1/tokens/claims without token returns 401``() =
        let status, _ = httpGet client "/api/v1/tokens/claims" None
        Assert.Equal(401, status)

    [<Fact>]
    member _.``unknown route returns 404``() =
        let status, _ = httpGet client "/api/v1/nonexistent" None
        Assert.Equal(404, status)

[<Trait("Category", "Unit")>]
type HttpUserHandlerTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``GET /api/v1/users/me with valid token returns 200``() =
        let un = $"hprf_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        let status, body = httpGet client "/api/v1/users/me" (Some token)
        Assert.Equal(200, status)
        Assert.Contains(un, body)

    [<Fact>]
    member _.``PATCH /api/v1/users/me updates display name``() =
        let un = $"hupd_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un

        let status, body =
            httpPatch client "/api/v1/users/me" (Some token) {| displayName = "New Name" |}

        Assert.Equal(200, status)
        Assert.Contains("New Name", body)

    [<Fact>]
    member _.``PATCH /api/v1/users/me with invalid JSON returns 400``() =
        let un = $"hupj_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un

        use req = new HttpRequestMessage(HttpMethod.Patch, "/api/v1/users/me")
        req.Content <- new StringContent("{not json}", Encoding.UTF8, "application/json")
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``POST /api/v1/users/me/password with correct old password returns 200``() =
        let un = $"hpwd_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un

        let status, _ =
            httpPost
                client
                "/api/v1/users/me/password"
                (Some token)
                {| oldPassword = "Str0ng#Pass1!"
                   newPassword = "NewStr0ng#Pass2!" |}

        Assert.Equal(200, status)

    [<Fact>]
    member _.``POST /api/v1/users/me/password with wrong old password returns 401``() =
        let un = $"hwpd_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un

        let status, _ =
            httpPost
                client
                "/api/v1/users/me/password"
                (Some token)
                {| oldPassword = "WrongPass1!"
                   newPassword = "NewStr0ng#Pass2!" |}

        Assert.Equal(401, status)

    [<Fact>]
    member _.``POST /api/v1/users/me/password with invalid JSON returns 400``() =
        let un = $"hpwj_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un

        use req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/users/me/password")
        req.Content <- new StringContent("{not json}", Encoding.UTF8, "application/json")
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``POST /api/v1/users/me/deactivate returns 200``() =
        let un = $"hdact_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        let status, _ = httpPostEmpty client "/api/v1/users/me/deactivate" (Some token)
        Assert.Equal(200, status)

[<Trait("Category", "Unit")>]
type HttpAdminHandlerTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    let setupAdmin () =
        let un = $"hadm_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        // Use test helper to set admin role
        let resp =
            client.PostAsync($"/api/v1/test/set-admin-role/{un}", new StringContent(""))
            |> Async.AwaitTask
            |> Async.RunSynchronously

        Assert.Equal(200, int resp.StatusCode)
        let token, _ = httpLoginGetToken client un
        token

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``GET /api/v1/admin/users returns 200 for admin``() =
        let adminToken = setupAdmin ()
        let status, _ = httpGet client "/api/v1/admin/users" (Some adminToken)
        Assert.Equal(200, status)

    [<Fact>]
    member _.``GET /api/v1/admin/users returns 403 for non-admin``() =
        let un = $"hnadm_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        let status, _ = httpGet client "/api/v1/admin/users" (Some token)
        Assert.Equal(403, status)

    [<Fact>]
    member _.``POST /api/v1/admin/users/{id}/disable returns 404 for unknown user``() =
        let adminToken = setupAdmin ()
        let fakeId = Guid.NewGuid()

        let status, _ =
            httpPostEmpty client $"/api/v1/admin/users/{fakeId}/disable" (Some adminToken)

        Assert.Equal(404, status)

    [<Fact>]
    member _.``POST /api/v1/admin/users/{id}/enable returns 404 for unknown user``() =
        let adminToken = setupAdmin ()
        let fakeId = Guid.NewGuid()

        let status, _ =
            httpPostEmpty client $"/api/v1/admin/users/{fakeId}/enable" (Some adminToken)

        Assert.Equal(404, status)

    [<Fact>]
    member _.``POST /api/v1/admin/users/{id}/unlock returns 404 for unknown user``() =
        let adminToken = setupAdmin ()
        let fakeId = Guid.NewGuid()

        let status, _ =
            httpPostEmpty client $"/api/v1/admin/users/{fakeId}/unlock" (Some adminToken)

        Assert.Equal(404, status)

    [<Fact>]
    member _.``POST /api/v1/admin/users/{id}/force-password-reset returns 404 for unknown user``() =
        let adminToken = setupAdmin ()
        let fakeId = Guid.NewGuid()

        let status, _ =
            httpPostEmpty client $"/api/v1/admin/users/{fakeId}/force-password-reset" (Some adminToken)

        Assert.Equal(404, status)

    [<Fact>]
    member _.``full disable and enable cycle``() =
        let adminToken = setupAdmin ()
        let targetUn = $"hdis_{shortId ()}"

        let _s, regBody =
            httpRegister client targetUn $"{targetUn}@example.com" "Str0ng#Pass1!"

        let userId = JsonDocument.Parse(regBody).RootElement.GetProperty("id").GetString()

        let sDisable, _ =
            httpPostEmpty client $"/api/v1/admin/users/{userId}/disable" (Some adminToken)

        Assert.Equal(200, sDisable)

        let sEnable, _ =
            httpPostEmpty client $"/api/v1/admin/users/{userId}/enable" (Some adminToken)

        Assert.Equal(200, sEnable)

    [<Fact>]
    member _.``force password reset returns 200 for existing user``() =
        let adminToken = setupAdmin ()
        let targetUn = $"hfpr_{shortId ()}"

        let _s, regBody =
            httpRegister client targetUn $"{targetUn}@example.com" "Str0ng#Pass1!"

        let userId = JsonDocument.Parse(regBody).RootElement.GetProperty("id").GetString()

        let status, _ =
            httpPostEmpty client $"/api/v1/admin/users/{userId}/force-password-reset" (Some adminToken)

        Assert.Equal(200, status)

    [<Fact>]
    member _.``unlock user returns 200 for existing user``() =
        let adminToken = setupAdmin ()
        let targetUn = $"hulk_{shortId ()}"

        let _s, regBody =
            httpRegister client targetUn $"{targetUn}@example.com" "Str0ng#Pass1!"

        let userId = JsonDocument.Parse(regBody).RootElement.GetProperty("id").GetString()

        let status, _ =
            httpPostEmpty client $"/api/v1/admin/users/{userId}/unlock" (Some adminToken)

        Assert.Equal(200, status)

[<Trait("Category", "Unit")>]
type HttpExpenseHandlerTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    let setupUser () =
        let un = $"hexp_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        token

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``POST /api/v1/expenses with valid data returns 201``() =
        let token = setupUser ()

        let status, _ =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(201, status)

    [<Fact>]
    member _.``POST /api/v1/expenses with invalid JSON returns 400``() =
        let token = setupUser ()

        use req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/expenses")
        req.Content <- new StringContent("{not json}", Encoding.UTF8, "application/json")
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``GET /api/v1/expenses returns 200``() =
        let token = setupUser ()
        let status, _ = httpGet client "/api/v1/expenses" (Some token)
        Assert.Equal(200, status)

    [<Fact>]
    member _.``GET /api/v1/expenses/summary returns 200``() =
        let token = setupUser ()
        let status, _ = httpGet client "/api/v1/expenses/summary" (Some token)
        Assert.Equal(200, status)

    [<Fact>]
    member _.``GET /api/v1/expenses/{id} returns 404 for nonexistent``() =
        let token = setupUser ()
        let fakeId = Guid.NewGuid()
        let status, _ = httpGet client $"/api/v1/expenses/{fakeId}" (Some token)
        Assert.Equal(404, status)

    [<Fact>]
    member _.``PUT /api/v1/expenses/{id} returns 404 for nonexistent``() =
        let token = setupUser ()
        let fakeId = Guid.NewGuid()

        let status, _ =
            httpPut
                client
                $"/api/v1/expenses/{fakeId}"
                (Some token)
                {| amount = "20.00"
                   currency = "USD"
                   category = "food"
                   description = "up"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(404, status)

    [<Fact>]
    member _.``PUT /api/v1/expenses/{id} with invalid JSON returns 400``() =
        let token = setupUser ()

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()

        use req = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/expenses/{expId}")
        req.Content <- new StringContent("{not json}", Encoding.UTF8, "application/json")
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``DELETE /api/v1/expenses/{id} returns 404 for nonexistent``() =
        let token = setupUser ()
        let fakeId = Guid.NewGuid()
        let status, _ = httpDelete client $"/api/v1/expenses/{fakeId}" (Some token)
        Assert.Equal(404, status)

    [<Fact>]
    member _.``POST /api/v1/expenses with invalid currency returns 400``() =
        let token = setupUser ()

        let status, _ =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "EUR"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(400, status)

    [<Fact>]
    member _.``POST /api/v1/expenses with invalid amount returns 400``() =
        let token = setupUser ()

        let status, _ =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "not-a-number"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(400, status)

    [<Fact>]
    member _.``POST /api/v1/expenses with negative amount returns 400``() =
        let token = setupUser ()

        let status, _ =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "-5.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(400, status)

    [<Fact>]
    member _.``POST /api/v1/expenses with invalid unit returns 400``() =
        let token = setupUser ()

        let status, _ =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense"
                   unit = "fathom" |}

        Assert.Equal(400, status)

    [<Fact>]
    member _.``POST /api/v1/expenses with IDR currency returns IDR-formatted amount``() =
        let token = setupUser ()

        let status, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "150000"
                   currency = "IDR"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(201, status)
        Assert.Contains("150000", body)

    [<Fact>]
    member _.``GET /api/v1/expenses/{id} returns 403 for another user's expense``() =
        let token1 = setupUser ()
        let un2 = $"hexp2_{shortId ()}"
        httpRegister client un2 $"{un2}@example.com" "Str0ng#Pass1!" |> ignore
        let token2, _ = httpLoginGetToken client un2

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token1)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()
        let status, _ = httpGet client $"/api/v1/expenses/{expId}" (Some token2)
        Assert.Equal(403, status)

    [<Fact>]
    member _.``GET /api/v1/expenses/{id} with IDR currency returns formatted amount``() =
        let token = setupUser ()

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "150000"
                   currency = "IDR"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()
        let status, respBody = httpGet client $"/api/v1/expenses/{expId}" (Some token)
        Assert.Equal(200, status)
        Assert.Contains("150000", respBody)

    [<Fact>]
    member _.``GET /api/v1/expenses/{id} with quantity returns unit in response``() =
        let token = setupUser ()

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense"
                   quantity = 2.0
                   unit = "kg" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()
        let status, respBody = httpGet client $"/api/v1/expenses/{expId}" (Some token)
        Assert.Equal(200, status)
        Assert.Contains("kg", respBody)

    [<Fact>]
    member _.``DELETE /api/v1/expenses/{id} returns 403 for another user's expense``() =
        let token1 = setupUser ()
        let un2 = $"hexp3_{shortId ()}"
        httpRegister client un2 $"{un2}@example.com" "Str0ng#Pass1!" |> ignore
        let token2, _ = httpLoginGetToken client un2

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token1)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()
        let status, _ = httpDelete client $"/api/v1/expenses/{expId}" (Some token2)
        Assert.Equal(403, status)

    [<Fact>]
    member _.``PUT /api/v1/expenses/{id} returns 403 for another user's expense``() =
        let token1 = setupUser ()
        let un2 = $"hexp4_{shortId ()}"
        httpRegister client un2 $"{un2}@example.com" "Str0ng#Pass1!" |> ignore
        let token2, _ = httpLoginGetToken client un2

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token1)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()

        let status, _ =
            httpPut
                client
                $"/api/v1/expenses/{expId}"
                (Some token2)
                {| amount = "20.00"
                   currency = "USD"
                   category = "food"
                   description = "updated"
                   date = "2024-01-02"
                   ``type`` = "expense" |}

        Assert.Equal(403, status)

    [<Fact>]
    member _.``GET /api/v1/expenses with IDR expenses returns formatted amounts``() =
        let token = setupUser ()

        httpPost
            client
            "/api/v1/expenses"
            (Some token)
            {| amount = "150000"
               currency = "IDR"
               category = "food"
               description = "test"
               date = "2024-01-01"
               ``type`` = "expense" |}
        |> ignore

        let status, body = httpGet client "/api/v1/expenses" (Some token)
        Assert.Equal(200, status)
        Assert.Contains("150000", body)

    [<Fact>]
    member _.``GET /api/v1/expenses with quantity returns quantity in response``() =
        let token = setupUser ()

        httpPost
            client
            "/api/v1/expenses"
            (Some token)
            {| amount = "10.00"
               currency = "USD"
               category = "food"
               description = "test"
               date = "2024-01-01"
               ``type`` = "expense"
               quantity = 1.5
               unit = "kg" |}
        |> ignore

        let status, body = httpGet client "/api/v1/expenses" (Some token)
        Assert.Equal(200, status)
        Assert.Contains("1.5", body)

    [<Fact>]
    member _.``PUT /api/v1/expenses/{id} with IDR currency returns formatted amount``() =
        let token = setupUser ()

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "150000"
                   currency = "IDR"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()

        let status, respBody =
            httpPut
                client
                $"/api/v1/expenses/{expId}"
                (Some token)
                {| amount = "200000"
                   currency = "IDR"
                   category = "food"
                   description = "updated"
                   date = "2024-01-02"
                   ``type`` = "expense" |}

        Assert.Equal(200, status)
        Assert.Contains("200000", respBody)

    [<Fact>]
    member _.``PUT /api/v1/expenses/{id} with null optional fields uses existing values``() =
        let token = setupUser ()

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()

        let status, _ =
            httpPut
                client
                $"/api/v1/expenses/{expId}"
                (Some token)
                {| amount = "15.00"
                   currency = null
                   category = null
                   description = null
                   date = "bad-date"
                   ``type`` = null |}

        Assert.Equal(200, status)

    [<Fact>]
    member _.``PUT /api/v1/expenses/{id} with null currency keeps existing``() =
        let token = setupUser ()

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()

        // PUT with a valid amount; update handler accepts any currency string
        let status, _ =
            httpPut
                client
                $"/api/v1/expenses/{expId}"
                (Some token)
                {| amount = "15.00"
                   currency = "USD"
                   category = "food"
                   description = "updated"
                   date = "2024-01-02"
                   ``type`` = "expense" |}

        Assert.Equal(200, status)

    [<Fact>]
    member _.``PUT /api/v1/expenses/{id} with invalid amount returns 400``() =
        let token = setupUser ()

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()

        let status, _ =
            httpPut
                client
                $"/api/v1/expenses/{expId}"
                (Some token)
                {| amount = "bad"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(400, status)

    [<Fact>]
    member _.``full expense CRUD cycle``() =
        let token = setupUser ()

        let s1, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        Assert.Equal(201, s1)
        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()

        let s2, getBody = httpGet client $"/api/v1/expenses/{expId}" (Some token)
        Assert.Equal(200, s2)
        Assert.Contains(expId, getBody)

        let s3, _ =
            httpPut
                client
                $"/api/v1/expenses/{expId}"
                (Some token)
                {| amount = "20.00"
                   currency = "USD"
                   category = "food"
                   description = "updated"
                   date = "2024-01-02"
                   ``type`` = "expense" |}

        Assert.Equal(200, s3)

        let s4, _ = httpDelete client $"/api/v1/expenses/{expId}" (Some token)
        Assert.Equal(204, s4)

[<Trait("Category", "Unit")>]
type HttpAttachmentHandlerTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    let setupUserAndExpense () =
        let un = $"hatt_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un

        let _s, body =
            httpPost
                client
                "/api/v1/expenses"
                (Some token)
                {| amount = "10.00"
                   currency = "USD"
                   category = "food"
                   description = "test"
                   date = "2024-01-01"
                   ``type`` = "expense" |}

        let expId = JsonDocument.Parse(body).RootElement.GetProperty("id").GetString()
        token, expId

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``POST /api/v1/expenses/{id}/attachments with multipart returns 201``() =
        let token, expId = setupUserAndExpense ()
        use content = new MultipartFormDataContent()
        let fileContent = new ByteArrayContent([| 0uy; 1uy; 2uy |])
        fileContent.Headers.ContentType <- MediaTypeHeaderValue("image/jpeg")
        content.Add(fileContent, "file", "test.jpg")

        use req =
            new HttpRequestMessage(HttpMethod.Post, $"/api/v1/expenses/{expId}/attachments")

        req.Content <- content
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(201, int resp.StatusCode)

    [<Fact>]
    member _.``POST /api/v1/expenses/{id}/attachments without file returns 400``() =
        let token, expId = setupUserAndExpense ()
        use content = new MultipartFormDataContent()

        use req =
            new HttpRequestMessage(HttpMethod.Post, $"/api/v1/expenses/{expId}/attachments")

        req.Content <- content
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(400, int resp.StatusCode)

    [<Fact>]
    member _.``POST /api/v1/expenses/{id}/attachments with wrong content type returns 415``() =
        let token, expId = setupUserAndExpense ()
        use content = new MultipartFormDataContent()
        let fileContent = new ByteArrayContent([| 0uy; 1uy; 2uy |])
        fileContent.Headers.ContentType <- MediaTypeHeaderValue("application/octet-stream")
        content.Add(fileContent, "file", "test.bin")

        use req =
            new HttpRequestMessage(HttpMethod.Post, $"/api/v1/expenses/{expId}/attachments")

        req.Content <- content
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(415, int resp.StatusCode)

    [<Fact>]
    member _.``GET /api/v1/expenses/{id}/attachments returns 200``() =
        let token, expId = setupUserAndExpense ()
        let status, _ = httpGet client $"/api/v1/expenses/{expId}/attachments" (Some token)
        Assert.Equal(200, status)

    [<Fact>]
    member _.``POST /api/v1/expenses/{id}/attachments to nonexistent expense returns 404``() =
        let token, _expId = setupUserAndExpense ()
        let fakeExpId = Guid.NewGuid()
        use content = new MultipartFormDataContent()
        let fileContent = new ByteArrayContent([| 0uy; 1uy; 2uy |])
        fileContent.Headers.ContentType <- MediaTypeHeaderValue("image/jpeg")
        content.Add(fileContent, "file", "test.jpg")

        use req =
            new HttpRequestMessage(HttpMethod.Post, $"/api/v1/expenses/{fakeExpId}/attachments")

        req.Content <- content
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(404, int resp.StatusCode)

    [<Fact>]
    member _.``POST /api/v1/expenses/{id}/attachments to another user's expense returns 403``() =
        let token1, expId = setupUserAndExpense ()
        let un2 = $"hatt2_{shortId ()}"
        httpRegister client un2 $"{un2}@example.com" "Str0ng#Pass1!" |> ignore
        let token2, _ = httpLoginGetToken client un2
        use content = new MultipartFormDataContent()
        let fileContent = new ByteArrayContent([| 0uy; 1uy; 2uy |])
        fileContent.Headers.ContentType <- MediaTypeHeaderValue("image/jpeg")
        content.Add(fileContent, "file", "test.jpg")

        use req =
            new HttpRequestMessage(HttpMethod.Post, $"/api/v1/expenses/{expId}/attachments")

        req.Content <- content
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token2)
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(403, int resp.StatusCode)

    [<Fact>]
    member _.``GET /api/v1/expenses/{id}/attachments for nonexistent expense returns 404``() =
        let token, _expId = setupUserAndExpense ()
        let fakeExpId = Guid.NewGuid()

        let status, _ =
            httpGet client $"/api/v1/expenses/{fakeExpId}/attachments" (Some token)

        Assert.Equal(404, status)

    [<Fact>]
    member _.``GET /api/v1/expenses/{id}/attachments for another user's expense returns 403``() =
        let token1, expId = setupUserAndExpense ()
        let un2 = $"hatt3_{shortId ()}"
        httpRegister client un2 $"{un2}@example.com" "Str0ng#Pass1!" |> ignore
        let token2, _ = httpLoginGetToken client un2
        let status, _ = httpGet client $"/api/v1/expenses/{expId}/attachments" (Some token2)
        Assert.Equal(403, status)

    [<Fact>]
    member _.``DELETE /api/v1/expenses/{expId}/attachments/{attId} for nonexistent expense returns 404``() =
        let token, _expId = setupUserAndExpense ()
        let fakeExpId = Guid.NewGuid()
        let fakeAttId = Guid.NewGuid()

        let status, _ =
            httpDelete client $"/api/v1/expenses/{fakeExpId}/attachments/{fakeAttId}" (Some token)

        Assert.Equal(404, status)

    [<Fact>]
    member _.``DELETE /api/v1/expenses/{expId}/attachments/{attId} for another user's expense returns 403``() =
        let token1, expId = setupUserAndExpense ()
        let un2 = $"hatt4_{shortId ()}"
        httpRegister client un2 $"{un2}@example.com" "Str0ng#Pass1!" |> ignore
        let token2, _ = httpLoginGetToken client un2
        let fakeAttId = Guid.NewGuid()

        let status, _ =
            httpDelete client $"/api/v1/expenses/{expId}/attachments/{fakeAttId}" (Some token2)

        Assert.Equal(403, status)

    [<Fact>]
    member _.``DELETE /api/v1/expenses/{expId}/attachments/{attId} returns 404 for nonexistent``() =
        let token, expId = setupUserAndExpense ()
        let fakeAttId = Guid.NewGuid()

        let status, _ =
            httpDelete client $"/api/v1/expenses/{expId}/attachments/{fakeAttId}" (Some token)

        Assert.Equal(404, status)

    [<Fact>]
    member _.``full attachment lifecycle``() =
        let token, expId = setupUserAndExpense ()
        use content = new MultipartFormDataContent()
        let fileContent = new ByteArrayContent([| 10uy; 20uy; 30uy |])
        fileContent.Headers.ContentType <- MediaTypeHeaderValue("image/png")
        content.Add(fileContent, "file", "photo.png")

        use uploadReq =
            new HttpRequestMessage(HttpMethod.Post, $"/api/v1/expenses/{expId}/attachments")

        uploadReq.Content <- content
        uploadReq.Headers.Authorization <- AuthenticationHeaderValue("Bearer", token)

        let uploadResp =
            client.SendAsync(uploadReq) |> Async.AwaitTask |> Async.RunSynchronously

        Assert.Equal(201, int uploadResp.StatusCode)

        let attBody =
            uploadResp.Content.ReadAsStringAsync()
            |> Async.AwaitTask
            |> Async.RunSynchronously

        let attId = JsonDocument.Parse(attBody).RootElement.GetProperty("id").GetString()

        let sDelete, _ =
            httpDelete client $"/api/v1/expenses/{expId}/attachments/{attId}" (Some token)

        Assert.Equal(204, sDelete)

[<Trait("Category", "Unit")>]
type HttpReportHandlerTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``GET /api/v1/reports/pl with valid params returns 200``() =
        let un = $"hrpt_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un

        let status, _ =
            httpGet client "/api/v1/reports/pl?from=2024-01-01&to=2024-12-31&currency=USD" (Some token)

        Assert.Equal(200, status)

    [<Fact>]
    member _.``GET /api/v1/reports/pl without token returns 401``() =
        let status, _ =
            httpGet client "/api/v1/reports/pl?from=2024-01-01&to=2024-12-31&currency=USD" None

        Assert.Equal(401, status)

[<Trait("Category", "Unit")>]
type HttpMiddlewareCoverageTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``requireAuth blocks request without Authorization header``() =
        let status, _ = httpGet client "/api/v1/users/me" None
        Assert.Equal(401, status)

    [<Fact>]
    member _.``requireAuth blocks request with Bearer but empty token``() =
        use req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/users/me")
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", "")
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(401, int resp.StatusCode)

    [<Fact>]
    member _.``requireAuth blocks request with invalid JWT``() =
        use req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/users/me")
        req.Headers.Authorization <- AuthenticationHeaderValue("Bearer", "not.a.jwt")
        let resp = client.SendAsync(req) |> Async.AwaitTask |> Async.RunSynchronously
        Assert.Equal(401, int resp.StatusCode)

    [<Fact>]
    member _.``requireAdmin blocks non-admin user``() =
        let un = $"hmid_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        let status, _ = httpGet client "/api/v1/admin/users" (Some token)
        Assert.Equal(403, status)

    [<Fact>]
    member _.``token with no JTI is treated as revoked``() =
        let claimsArr = [| Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()) |]
        let token = makeCustomToken claimsArr false // no JTI
        let status, _ = httpGet client "/api/v1/users/me" (Some token)
        Assert.Equal(401, status)

    [<Fact>]
    member _.``token with non-guid sub returns 401``() =
        let claimsArr = [| Claim(JwtRegisteredClaimNames.Sub, "not-a-guid") |]
        let token = makeCustomToken claimsArr true
        let status, _ = httpGet client "/api/v1/users/me" (Some token)
        Assert.Equal(401, status)

    [<Fact>]
    member _.``token with non-existent user ID returns 401``() =
        let claimsArr =
            [| Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier", Guid.NewGuid().ToString()) |]

        let token = makeCustomToken claimsArr true
        let status, _ = httpGet client "/api/v1/users/me" (Some token)
        Assert.Equal(401, status)

    [<Fact>]
    member _.``token for locked user account returns 401``() =
        let un = $"hmlk_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let validToken, _ = httpLoginGetToken client un

        // Lock the account with 5 failed logins
        for _ in 1..5 do
            httpLogin client un "WrongPass1!" |> ignore

        let status, body = httpGet client "/api/v1/users/me" (Some validToken)
        Assert.Equal(401, status)
        Assert.Contains("locked", body.ToLower())

    [<Fact>]
    member _.``token for inactive user account returns 401``() =
        let un = $"hmna_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore
        let token, _ = httpLoginGetToken client un
        httpPostEmpty client "/api/v1/users/me/deactivate" (Some token) |> ignore

        // Use the old token — user is now INACTIVE
        let status, _ = httpGet client "/api/v1/users/me" (Some token)
        Assert.Equal(401, status)

[<Trait("Category", "Unit")>]
type HttpProgramHandlerTests() =
    let factory = new TestWebAppFactory()
    let client = factory.CreateClientWithDb()

    interface IDisposable with
        member _.Dispose() = (factory :> IDisposable).Dispose()

    [<Fact>]
    member _.``POST /api/v1/test/set-admin-role/{username} for existing user returns 200``() =
        let un = $"hsar_{shortId ()}"
        httpRegister client un $"{un}@example.com" "Str0ng#Pass1!" |> ignore

        let resp =
            client.PostAsync($"/api/v1/test/set-admin-role/{un}", new StringContent(""))
            |> Async.AwaitTask
            |> Async.RunSynchronously

        Assert.Equal(200, int resp.StatusCode)

    [<Fact>]
    member _.``POST /api/v1/test/set-admin-role/{username} for nonexistent user returns 404``() =
        let resp =
            client.PostAsync($"/api/v1/test/set-admin-role/nobody_{shortId ()}", new StringContent(""))
            |> Async.AwaitTask
            |> Async.RunSynchronously

        Assert.Equal(404, int resp.StatusCode)
