/// Direct service layer for integration tests.
///
/// Each function mirrors a Giraffe handler but works entirely via AppDbContext —
/// no HTTP, no HttpContext, no WebApplicationFactory. Each function returns a
/// (status: int * body: string) pair that the step definitions treat as a
/// simulated HTTP response, preserving the HTTP-oriented Gherkin language.
module DemoBeFsgi.Tests.DirectServices

open System
open System.Linq
open System.Text.Json
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Infrastructure.PasswordHasher
open DemoBeFsgi.Domain.Types
open DemoBeFsgi.Domain.User
open DemoBeFsgi.Domain.Expense
open DemoBeFsgi.Domain.Attachment
open DemoBeFsgi.Auth.JwtService

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let private opts = JsonSerializerOptions(PropertyNameCaseInsensitive = true)

let private ok (payload: obj) =
    200, JsonSerializer.Serialize(payload, opts)

let private created (payload: obj) =
    201, JsonSerializer.Serialize(payload, opts)

let private noContent () = 204, ""

let private badRequest (message: string) =
    400,
    JsonSerializer.Serialize(
        {| error = "Bad Request"
           message = message |},
        opts
    )

let private validationError (field: string) (message: string) =
    400,
    JsonSerializer.Serialize(
        {| error = "Validation Error"
           field = field
           message = message |},
        opts
    )

let private unauthorized (message: string) =
    401,
    JsonSerializer.Serialize(
        {| error = "Unauthorized"
           message = message |},
        opts
    )

let private forbidden (message: string) =
    403,
    JsonSerializer.Serialize(
        {| error = "Forbidden"
           message = message |},
        opts
    )

let private notFound (message: string) =
    404,
    JsonSerializer.Serialize(
        {| error = "Not Found"
           message = message |},
        opts
    )

let private conflict (message: string) =
    409,
    JsonSerializer.Serialize(
        {| error = "Conflict"
           message = message |},
        opts
    )

let private unsupportedMediaType (field: string) (message: string) =
    415,
    JsonSerializer.Serialize(
        {| error = "Unsupported Media Type"
           field = field
           message = message |},
        opts
    )

let private fileTooLarge (limit: int64) =
    413,
    JsonSerializer.Serialize(
        {| error = "File Too Large"
           message = $"File exceeds maximum size of {limit} bytes" |},
        opts
    )

let private parseAmount (s: string) =
    if String.IsNullOrEmpty(s) then
        Error(ValidationError("amount", "Amount is required"))
    else
        match Decimal.TryParse(s, Globalization.NumberStyles.Any, Globalization.CultureInfo.InvariantCulture) with
        | true, v -> Ok v
        | _ -> Error(ValidationError("amount", "Invalid amount format"))

// ─────────────────────────────────────────────────────────────────────────────
// Token auth — resolves a JWT to a UserId (replaces requireAuth middleware)
// ─────────────────────────────────────────────────────────────────────────────

/// Validates the JWT token string against the DB.
/// Returns Ok userId or Error (status, body).
let resolveAuth (db: AppDbContext) (token: string option) : Async<Result<Guid, int * string>> =
    async {
        match token with
        | None -> return Error(unauthorized "Missing or invalid Authorization header")
        | Some t ->
            let principal = validateToken t

            match principal with
            | None -> return Error(unauthorized "Invalid or expired token")
            | Some claims ->
                let jti = getTokenJti t

                let! isRevoked =
                    match jti with
                    | None -> async { return true }
                    | Some j ->
                        db.RevokedTokens.AsNoTracking().AnyAsync(fun rt -> rt.TokenJti = j)
                        |> Async.AwaitTask

                if isRevoked then
                    return Error(unauthorized "Token has been revoked")
                else
                    let sub =
                        claims.FindFirst(fun c ->
                            c.Type = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")

                    let sub2 =
                        if sub = null then
                            claims.FindFirst(fun c -> c.Type = "sub")
                        else
                            sub

                    if sub2 = null then
                        return Error(unauthorized "Invalid token claims")
                    else
                        let userId =
                            try
                                Guid.Parse(sub2.Value) |> Some
                            with _ ->
                                None

                        match userId with
                        | None -> return Error(unauthorized "Invalid user ID in token")
                        | Some uid ->
                            let! user =
                                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = uid)
                                |> Async.AwaitTask

                            if obj.ReferenceEquals(user, null) then
                                return Error(unauthorized "User not found")
                            elif user.Status = statusToString Locked then
                                return Error(unauthorized "Account is locked after too many failed attempts")
                            elif user.Status = statusToString Inactive then
                                return Error(unauthorized "Account has been deactivated")
                            elif user.Status = statusToString Disabled then
                                return Error(unauthorized "Account has been disabled by an administrator")
                            elif user.Status <> statusToString Active then
                                return Error(unauthorized "Account is not active")
                            else
                                return Ok uid
    }

/// Validates the JWT token string and additionally checks that the user is admin.
let resolveAdmin (db: AppDbContext) (token: string option) : Async<Result<Guid, int * string>> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return Error e
        | Ok uid ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = uid)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return Error(forbidden "User not found")
            elif user.Role <> roleToString Admin then
                return Error(forbidden "Admin role required")
            else
                return Ok uid
    }

// ─────────────────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────────────────

let health () : int * string = ok {| status = "UP" |}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

let register (db: AppDbContext) (username: string) (email: string) (password: string) : Async<int * string> =
    async {
        let usernameResult = validateUsername (if username = null then "" else username)
        let emailResult = validateEmail (if email = null then "" else email)
        let passwordResult = validatePassword (if password = null then "" else password)

        match usernameResult, emailResult, passwordResult with
        | Error(ValidationError(f, m)), _, _ -> return validationError f m
        | _, Error(ValidationError(f, m)), _ -> return validationError f m
        | _, _, Error(ValidationError(f, m)) -> return validationError f m
        | Ok _, Ok _, Ok _ ->
            let! existing =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Username = username)
                |> Async.AwaitTask

            if not (obj.ReferenceEquals(existing, null)) then
                return conflict "Username already exists"
            else
                let now = DateTime.UtcNow
                let userId = Guid.NewGuid()

                let entity: UserEntity =
                    { Id = userId
                      Username = username
                      Email = email
                      DisplayName = username
                      PasswordHash = hashPassword password
                      Role = roleToString User
                      Status = statusToString Active
                      FailedLoginAttempts = 0
                      CreatedAt = now
                      UpdatedAt = now }

                db.Users.Add(entity) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                return
                    created
                        {| id = userId
                           username = entity.Username
                           email = entity.Email
                           displayName = entity.DisplayName |}
        | _ -> return badRequest "Validation failed"
    }

let private maxFailedAttempts = 5

let login (db: AppDbContext) (username: string) (password: string) : Async<int * string> =
    async {
        let! user =
            db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Username = username)
            |> Async.AwaitTask

        if obj.ReferenceEquals(user, null) then
            return unauthorized "Invalid credentials"
        elif user.Status = statusToString Locked then
            return unauthorized "Account is locked after too many failed attempts"
        elif user.Status = statusToString Inactive then
            return unauthorized "Account has been deactivated"
        elif user.Status = statusToString Disabled then
            return unauthorized "Account has been disabled"
        elif not (verifyPassword password user.PasswordHash) then
            let newAttempts = user.FailedLoginAttempts + 1

            let newStatus =
                if newAttempts >= maxFailedAttempts then
                    statusToString Locked
                else
                    user.Status

            let updated =
                { user with
                    FailedLoginAttempts = newAttempts
                    Status = newStatus
                    UpdatedAt = DateTime.UtcNow }

            // Detach any tracked entity with same Id so Update does not conflict
            db.ChangeTracker.Clear()
            db.Users.Update(updated) |> ignore
            let! _ = db.SaveChangesAsync() |> Async.AwaitTask

            if newAttempts >= maxFailedAttempts then
                return unauthorized "Account is locked after too many failed attempts"
            else
                return unauthorized "Invalid credentials"
        else
            let updated =
                { user with
                    FailedLoginAttempts = 0
                    UpdatedAt = DateTime.UtcNow }

            // Detach any tracked entity with same Id so Update does not conflict
            db.ChangeTracker.Clear()
            db.Users.Update(updated) |> ignore
            let! _ = db.SaveChangesAsync() |> Async.AwaitTask

            let accessToken = generateAccessToken user.Id user.Username user.Email user.Role
            let refreshTokenStr = generateRefreshToken user.Id
            let now = DateTime.UtcNow

            let rtEntity: RefreshTokenEntity =
                { Id = Guid.NewGuid()
                  UserId = user.Id
                  TokenHash = refreshTokenStr
                  ExpiresAt = now.AddDays(7.0)
                  CreatedAt = now
                  Revoked = false }

            db.RefreshTokens.Add(rtEntity) |> ignore
            let! _ = db.SaveChangesAsync() |> Async.AwaitTask

            return
                ok
                    {| accessToken = accessToken
                       refreshToken = refreshTokenStr
                       tokenType = "Bearer" |}
    }

let refresh (db: AppDbContext) (refreshTokenStr: string) : Async<int * string> =
    async {
        let! rtEntity =
            db.RefreshTokens
                .AsNoTracking()
                .FirstOrDefaultAsync(fun rt -> rt.TokenHash = refreshTokenStr && not rt.Revoked)
            |> Async.AwaitTask

        if obj.ReferenceEquals(rtEntity, null) then
            return unauthorized "Invalid or already used token"
        elif rtEntity.ExpiresAt < DateTime.UtcNow then
            return unauthorized "Token has expired"
        else
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = rtEntity.UserId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return unauthorized "User not found"
            elif user.Status <> statusToString Active then
                return unauthorized "Account has been deactivated"
            else
                let revokedRt = { rtEntity with Revoked = true }
                db.ChangeTracker.Clear()
                db.RefreshTokens.Update(revokedRt) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                let accessToken = generateAccessToken user.Id user.Username user.Email user.Role
                let newRefreshToken = generateRefreshToken user.Id
                let now = DateTime.UtcNow

                let newRtEntity: RefreshTokenEntity =
                    { Id = Guid.NewGuid()
                      UserId = user.Id
                      TokenHash = newRefreshToken
                      ExpiresAt = now.AddDays(7.0)
                      CreatedAt = now
                      Revoked = false }

                db.RefreshTokens.Add(newRtEntity) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                return
                    ok
                        {| accessToken = accessToken
                           refreshToken = newRefreshToken
                           tokenType = "Bearer" |}
    }

let logout (db: AppDbContext) (token: string option) : Async<int * string> =
    async {
        let tokenStr = token |> Option.defaultValue ""
        let jti = getTokenJti tokenStr
        let expiry = getTokenExpiry tokenStr

        match jti with
        | Some j ->
            let! exists = db.RevokedTokens.AnyAsync(fun rt -> rt.TokenJti = j) |> Async.AwaitTask

            if not exists then
                // Resolve userId from token (best-effort; use Guid.Empty if not available)
                let userId =
                    try
                        let handler = System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler()
                        let jwt = handler.ReadJwtToken(tokenStr)

                        let sub =
                            jwt.Claims
                            |> Seq.tryFind (fun c ->
                                c.Type = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
                                || c.Type = "sub")

                        sub
                        |> Option.map (fun c -> Guid.Parse(c.Value))
                        |> Option.defaultValue Guid.Empty
                    with _ ->
                        Guid.Empty

                let revokedEntity: RevokedTokenEntity =
                    { Id = Guid.NewGuid()
                      TokenJti = j
                      UserId = userId
                      RevokedAt = DateTime.UtcNow
                      ExpiresAt = expiry |> Option.defaultValue DateTime.UtcNow }

                db.RevokedTokens.Add(revokedEntity) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask
                ()
        | None -> ()

        return ok {| message = "Logged out successfully" |}
    }

let logoutAll (db: AppDbContext) (token: string option) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let tokenStr = token |> Option.defaultValue ""
            let jti = getTokenJti tokenStr
            let expiry = getTokenExpiry tokenStr

            match jti with
            | Some j ->
                let! exists = db.RevokedTokens.AnyAsync(fun rt -> rt.TokenJti = j) |> Async.AwaitTask

                if not exists then
                    let revokedEntity: RevokedTokenEntity =
                        { Id = Guid.NewGuid()
                          TokenJti = j
                          UserId = userId
                          RevokedAt = DateTime.UtcNow
                          ExpiresAt = expiry |> Option.defaultValue DateTime.UtcNow }

                    db.RevokedTokens.Add(revokedEntity) |> ignore
                    let! _ = db.SaveChangesAsync() |> Async.AwaitTask
                    ()
            | None -> ()

            let! activeTokens =
                db.RefreshTokens.AsNoTracking().Where(fun rt -> rt.UserId = userId && not rt.Revoked).ToListAsync()
                |> Async.AwaitTask

            db.ChangeTracker.Clear()

            for rt in activeTokens do
                db.RefreshTokens.Update({ rt with Revoked = true }) |> ignore

            let! _ = db.SaveChangesAsync() |> Async.AwaitTask

            return ok {| message = "All sessions logged out" |}
    }

// ─────────────────────────────────────────────────────────────────────────────
// User profile
// ─────────────────────────────────────────────────────────────────────────────

let getProfile (db: AppDbContext) (token: string option) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            else
                return
                    ok
                        {| id = user.Id
                           username = user.Username
                           email = user.Email
                           displayName = user.DisplayName
                           role = user.Role
                           status = user.Status |}
    }

let updateProfile (db: AppDbContext) (token: string option) (displayName: string) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            else
                let updated =
                    { user with
                        DisplayName =
                            if displayName <> null then
                                displayName
                            else
                                user.DisplayName
                        UpdatedAt = DateTime.UtcNow }

                db.ChangeTracker.Clear()
                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                return
                    ok
                        {| id = updated.Id
                           username = updated.Username
                           email = updated.Email
                           displayName = updated.DisplayName |}
    }

let changePassword
    (db: AppDbContext)
    (token: string option)
    (oldPassword: string)
    (newPassword: string)
    : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            elif not (verifyPassword oldPassword user.PasswordHash) then
                return unauthorized "Invalid credentials"
            else
                let updated =
                    { user with
                        PasswordHash = hashPassword newPassword
                        UpdatedAt = DateTime.UtcNow }

                db.ChangeTracker.Clear()
                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask
                return ok {| message = "Password changed successfully" |}
    }

let deactivate (db: AppDbContext) (token: string option) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            else
                let updated =
                    { user with
                        Status = statusToString Inactive
                        UpdatedAt = DateTime.UtcNow }

                db.ChangeTracker.Clear()
                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask
                return ok {| message = "Account deactivated" |}
    }

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

let listUsers
    (db: AppDbContext)
    (token: string option)
    (page: int)
    (size: int)
    (emailFilter: string option)
    : Async<int * string> =
    async {
        let! authResult = resolveAdmin db token

        match authResult with
        | Error e -> return e
        | Ok _ ->
            let p = Math.Max(1, page)
            let s = Math.Max(1, size)

            let query =
                match emailFilter with
                | Some email -> db.Users.Where(fun u -> u.Email = email)
                | None -> db.Users :> IQueryable<UserEntity>

            let! total = query.CountAsync() |> Async.AwaitTask
            let offset = (p - 1) * s
            let! users = query.Skip(offset).Take(s).ToListAsync() |> Async.AwaitTask

            let userData =
                users
                |> Seq.map (fun u ->
                    {| id = u.Id
                       username = u.Username
                       email = u.Email
                       displayName = u.DisplayName
                       role = u.Role
                       status = u.Status |})
                |> Seq.toArray

            return
                ok
                    {| content = userData
                       totalElements = total
                       page = p
                       size = s |}
    }

let disableUser (db: AppDbContext) (token: string option) (targetUserId: Guid) : Async<int * string> =
    async {
        let! authResult = resolveAdmin db token

        match authResult with
        | Error e -> return e
        | Ok _ ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = targetUserId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            else
                let updated =
                    { user with
                        Status = statusToString Disabled
                        UpdatedAt = DateTime.UtcNow }

                db.ChangeTracker.Clear()
                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                return
                    ok
                        {| message = "User disabled"
                           id = targetUserId
                           status = statusToString Disabled |}
    }

let enableUser (db: AppDbContext) (token: string option) (targetUserId: Guid) : Async<int * string> =
    async {
        let! authResult = resolveAdmin db token

        match authResult with
        | Error e -> return e
        | Ok _ ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = targetUserId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            else
                let updated =
                    { user with
                        Status = statusToString Active
                        UpdatedAt = DateTime.UtcNow }

                db.ChangeTracker.Clear()
                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                return
                    ok
                        {| message = "User enabled"
                           id = targetUserId
                           status = statusToString Active |}
    }

let unlockUser (db: AppDbContext) (token: string option) (targetUserId: Guid) : Async<int * string> =
    async {
        let! authResult = resolveAdmin db token

        match authResult with
        | Error e -> return e
        | Ok _ ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = targetUserId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            else
                let updated =
                    { user with
                        Status = statusToString Active
                        FailedLoginAttempts = 0
                        UpdatedAt = DateTime.UtcNow }

                db.ChangeTracker.Clear()
                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                return
                    ok
                        {| message = "User unlocked"
                           id = targetUserId
                           status = statusToString Active |}
    }

let forcePasswordReset (db: AppDbContext) (token: string option) (targetUserId: Guid) : Async<int * string> =
    async {
        let! authResult = resolveAdmin db token

        match authResult with
        | Error e -> return e
        | Ok _ ->
            let! user =
                db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = targetUserId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(user, null) then
                return notFound "User not found"
            else
                let resetToken = Guid.NewGuid().ToString("N")

                return
                    ok
                        {| message = "Password reset token generated"
                           token = resetToken |}
    }

/// Test-only: set a user's role to ADMIN without authentication.
let setAdminRole (db: AppDbContext) (username: string) : Async<int * string> =
    async {
        let! user =
            db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Username = username)
            |> Async.AwaitTask

        if obj.ReferenceEquals(user, null) then
            return notFound "User not found"
        else
            let updated = { user with Role = roleToString Admin }
            db.ChangeTracker.Clear()
            db.Users.Update(updated) |> ignore
            let! _ = db.SaveChangesAsync() |> Async.AwaitTask
            return ok {| message = "Role set to admin" |}
    }

// ─────────────────────────────────────────────────────────────────────────────
// Expenses
// ─────────────────────────────────────────────────────────────────────────────

let createExpense
    (db: AppDbContext)
    (token: string option)
    (amount: string)
    (currency: string)
    (category: string)
    (description: string)
    (date: string)
    (entryType: string)
    (quantity: float option)
    (unit: string option)
    : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let currencyResult = parseCurrency (if currency = null then "" else currency)

            match currencyResult with
            | Error(ValidationError(f, m)) -> return validationError f m
            | Error _ -> return validationError "currency" "Invalid currency"
            | Ok _ ->
                let amountResult = parseAmount amount

                match amountResult with
                | Error(ValidationError(f, m)) -> return validationError f m
                | Error _ -> return validationError "amount" "Invalid amount"
                | Ok amt ->
                    let amountValidation = validateAmount amt

                    match amountValidation with
                    | Error(ValidationError(f, m)) -> return validationError f m
                    | Error _ -> return validationError "amount" "Invalid amount"
                    | Ok validAmount ->
                        let unitOpt = if unit = None || unit = Some "" then None else unit
                        let unitResult = validateUnit unitOpt

                        match unitResult with
                        | Error(ValidationError(f, m)) -> return validationError f m
                        | Error _ -> return validationError "unit" "Invalid unit"
                        | Ok validUnit ->
                            let dateVal =
                                match DateTime.TryParse(date) with
                                | true, d -> DateTime.SpecifyKind(d, DateTimeKind.Utc)
                                | _ -> DateTime.UtcNow

                            let now = DateTime.UtcNow
                            let expenseId = Guid.NewGuid()

                            let entity: ExpenseEntity =
                                { Id = expenseId
                                  UserId = userId
                                  Amount = validAmount
                                  Currency = currency.ToUpperInvariant()
                                  Category = if category = null then "" else category
                                  Description = if description = null then "" else description
                                  Date = dateVal
                                  EntryType =
                                    if entryType = null then
                                        "EXPENSE"
                                    else
                                        entryType.ToUpperInvariant()
                                  Quantity =
                                    match quantity with
                                    | Some q -> Nullable(decimal q)
                                    | None -> Nullable()
                                  Unit =
                                    match validUnit with
                                    | Some u -> u
                                    | None -> null
                                  CreatedAt = now
                                  UpdatedAt = now }

                            db.Expenses.Add(entity) |> ignore
                            let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                            let formattedAmount =
                                match currency.ToUpperInvariant() with
                                | "IDR" -> validAmount.ToString("0")
                                | _ -> validAmount.ToString("0.00")

                            return
                                created
                                    {| id = expenseId
                                       amount = formattedAmount
                                       currency = entity.Currency
                                       category = entity.Category
                                       description = entity.Description
                                       date = entity.Date.ToString("yyyy-MM-dd")
                                       ``type`` = entity.EntryType.ToLowerInvariant() |}
    }

let listExpenses (db: AppDbContext) (token: string option) (page: int) (size: int) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let p = Math.Max(1, page)
            let s = Math.Max(1, size)
            let query = db.Expenses.Where(fun e -> e.UserId = userId)
            let! total = query.CountAsync() |> Async.AwaitTask
            let offset = (p - 1) * s

            let! expenses =
                query.OrderByDescending(fun e -> e.Date).Skip(offset).Take(s).ToListAsync()
                |> Async.AwaitTask

            let data =
                expenses
                |> Seq.map (fun e ->
                    let formattedAmount =
                        match e.Currency with
                        | "IDR" -> e.Amount.ToString("0")
                        | _ -> e.Amount.ToString("0.00")

                    let qtyOpt =
                        if e.Quantity.HasValue then
                            Some(float e.Quantity.Value)
                        else
                            None

                    {| id = e.Id
                       amount = formattedAmount
                       currency = e.Currency
                       category = e.Category
                       description = e.Description
                       date = e.Date.ToString("yyyy-MM-dd")
                       ``type`` = e.EntryType.ToLowerInvariant()
                       quantity = qtyOpt
                       unit = if e.Unit = null then None else Some e.Unit |})
                |> Seq.toArray

            return
                ok
                    {| content = data
                       totalElements = total
                       page = p |}
    }

let getExpenseById (db: AppDbContext) (token: string option) (expenseId: Guid) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! expense =
                db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(expense, null) then
                return notFound "Expense not found"
            elif expense.UserId <> userId then
                return forbidden "Access denied"
            else
                let formattedAmount =
                    match expense.Currency with
                    | "IDR" -> expense.Amount.ToString("0")
                    | _ -> expense.Amount.ToString("0.00")

                let qtyOpt =
                    if expense.Quantity.HasValue then
                        Some(float expense.Quantity.Value)
                    else
                        None

                return
                    ok
                        {| id = expense.Id
                           amount = formattedAmount
                           currency = expense.Currency
                           category = expense.Category
                           description = expense.Description
                           date = expense.Date.ToString("yyyy-MM-dd")
                           ``type`` = expense.EntryType.ToLowerInvariant()
                           quantity = qtyOpt
                           unit = if expense.Unit = null then None else Some expense.Unit |}
    }

let updateExpense
    (db: AppDbContext)
    (token: string option)
    (expenseId: Guid)
    (amount: string)
    (currency: string)
    (category: string)
    (description: string)
    (date: string)
    (entryType: string)
    : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! expense =
                db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(expense, null) then
                return notFound "Expense not found"
            elif expense.UserId <> userId then
                return forbidden "Access denied"
            else
                let amountResult = parseAmount amount

                match amountResult with
                | Error(ValidationError(f, m)) -> return validationError f m
                | Error _ -> return validationError "amount" "Invalid amount"
                | Ok amt ->
                    let dateVal =
                        match DateTime.TryParse(date) with
                        | true, d -> DateTime.SpecifyKind(d, DateTimeKind.Utc)
                        | _ -> expense.Date

                    let updated =
                        { expense with
                            Amount = amt
                            Currency =
                                if currency <> null then
                                    currency.ToUpperInvariant()
                                else
                                    expense.Currency
                            Category = if category <> null then category else expense.Category
                            Description =
                                if description <> null then
                                    description
                                else
                                    expense.Description
                            Date = dateVal
                            EntryType =
                                if entryType <> null then
                                    entryType.ToUpperInvariant()
                                else
                                    expense.EntryType
                            UpdatedAt = DateTime.UtcNow }

                    db.ChangeTracker.Clear()
                    db.Expenses.Update(updated) |> ignore
                    let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                    let formattedAmount =
                        match updated.Currency with
                        | "IDR" -> updated.Amount.ToString("0")
                        | _ -> updated.Amount.ToString("0.00")

                    return
                        ok
                            {| id = updated.Id
                               amount = formattedAmount
                               currency = updated.Currency
                               category = updated.Category
                               description = updated.Description
                               date = updated.Date.ToString("yyyy-MM-dd")
                               ``type`` = updated.EntryType.ToLowerInvariant() |}
    }

let deleteExpense (db: AppDbContext) (token: string option) (expenseId: Guid) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! expense =
                db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(expense, null) then
                return notFound "Expense not found"
            elif expense.UserId <> userId then
                return forbidden "Access denied"
            else
                db.ChangeTracker.Clear()
                db.Expenses.Remove(expense) |> ignore
                let! _ = db.SaveChangesAsync() |> Async.AwaitTask
                return noContent ()
    }

let expenseSummary (db: AppDbContext) (token: string option) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! expenses =
                db.Expenses.Where(fun e -> e.UserId = userId && e.EntryType = "EXPENSE").ToListAsync()
                |> Async.AwaitTask

            let grouped =
                expenses
                |> Seq.groupBy (fun e -> e.Currency)
                |> Seq.map (fun (currency, items) ->
                    let total = items |> Seq.sumBy (fun e -> e.Amount)

                    let formattedTotal =
                        match currency with
                        | "IDR" -> total.ToString("0")
                        | _ -> total.ToString("0.00")

                    currency, formattedTotal)
                |> Map.ofSeq

            return ok grouped
    }

// ─────────────────────────────────────────────────────────────────────────────
// Attachments
// ─────────────────────────────────────────────────────────────────────────────

let uploadAttachment
    (db: AppDbContext)
    (token: string option)
    (expenseId: Guid)
    (filename: string)
    (contentType: string)
    (data: byte[])
    : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! expense =
                db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(expense, null) then
                return notFound "Expense not found"
            elif expense.UserId <> userId then
                return forbidden "Access denied"
            else
                match validateContentType contentType with
                | Error(UnsupportedMediaType m) -> return unsupportedMediaType "file" m
                | Error _ -> return unsupportedMediaType "file" "Unsupported content type"
                | Ok _ ->
                    match validateFileSize (int64 data.Length) with
                    | Error(FileTooLarge limit) -> return fileTooLarge limit
                    | Error _ -> return fileTooLarge maxFileSize
                    | Ok _ ->
                        let attachmentId = Guid.NewGuid()
                        let now = DateTime.UtcNow
                        let url = $"/api/v1/expenses/{expenseId}/attachments/{attachmentId}/file"

                        let entity: AttachmentEntity =
                            { Id = attachmentId
                              ExpenseId = expenseId
                              Filename = filename
                              ContentType = contentType
                              FileSize = int64 data.Length
                              Data = data
                              Url = url
                              CreatedAt = now }

                        db.Attachments.Add(entity) |> ignore
                        let! _ = db.SaveChangesAsync() |> Async.AwaitTask

                        return
                            created
                                {| id = attachmentId
                                   filename = entity.Filename
                                   contentType = entity.ContentType
                                   file_size = entity.FileSize
                                   url = entity.Url |}
    }

let listAttachments (db: AppDbContext) (token: string option) (expenseId: Guid) : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! expense =
                db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(expense, null) then
                return notFound "Expense not found"
            elif expense.UserId <> userId then
                return forbidden "Access denied"
            else
                let! attachments =
                    db.Attachments.Where(fun a -> a.ExpenseId = expenseId).ToListAsync()
                    |> Async.AwaitTask

                let data =
                    attachments
                    |> Seq.map (fun a ->
                        {| id = a.Id
                           filename = a.Filename
                           contentType = a.ContentType
                           file_size = a.FileSize
                           url = a.Url |})
                    |> Seq.toArray

                return ok {| attachments = data |}
    }

let deleteAttachment
    (db: AppDbContext)
    (token: string option)
    (expenseId: Guid)
    (attachmentId: Guid)
    : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! expense =
                db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)
                |> Async.AwaitTask

            if obj.ReferenceEquals(expense, null) then
                return notFound "Expense not found"
            elif expense.UserId <> userId then
                return forbidden "Access denied"
            else
                let! attachment =
                    db.Attachments
                        .AsNoTracking()
                        .FirstOrDefaultAsync(fun a -> a.Id = attachmentId && a.ExpenseId = expenseId)
                    |> Async.AwaitTask

                if obj.ReferenceEquals(attachment, null) then
                    return notFound "Attachment not found"
                else
                    db.ChangeTracker.Clear()
                    db.Attachments.Remove(attachment) |> ignore
                    let! _ = db.SaveChangesAsync() |> Async.AwaitTask
                    return noContent ()
    }

// ─────────────────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────────────────

let profitAndLoss
    (db: AppDbContext)
    (token: string option)
    (fromDate: string)
    (toDate: string)
    (currency: string)
    : Async<int * string> =
    async {
        let! authResult = resolveAuth db token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let from =
                match DateTime.TryParse(fromDate) with
                | true, d -> DateTime.SpecifyKind(d, DateTimeKind.Utc)
                | _ -> DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Utc)

            let ``to`` =
                match DateTime.TryParse(toDate) with
                | true, d -> DateTime.SpecifyKind(d.AddDays(1.0).AddSeconds(-1.0), DateTimeKind.Utc)
                | _ -> DateTime.SpecifyKind(DateTime.MaxValue, DateTimeKind.Utc)

            let curr = currency.ToUpperInvariant()

            let! entries =
                db.Expenses
                    .Where(fun e -> e.UserId = userId && e.Currency = curr && e.Date >= from && e.Date <= ``to``)
                    .ToListAsync()
                |> Async.AwaitTask

            let incomeEntries = entries |> Seq.filter (fun e -> e.EntryType = "INCOME")
            let expenseEntries = entries |> Seq.filter (fun e -> e.EntryType = "EXPENSE")

            let incomeTotal = incomeEntries |> Seq.sumBy (fun e -> e.Amount)
            let expenseTotal = expenseEntries |> Seq.sumBy (fun e -> e.Amount)
            let net = incomeTotal - expenseTotal

            let formatAmount (a: decimal) =
                match curr with
                | "IDR" -> a.ToString("0")
                | _ -> a.ToString("0.00")

            let incomeBreakdown =
                incomeEntries
                |> Seq.groupBy (fun e -> e.Category)
                |> Seq.map (fun (cat, items) ->
                    {| category = cat
                       ``type`` = "income"
                       total = formatAmount (items |> Seq.sumBy (fun e -> e.Amount)) |})
                |> Seq.toArray

            let expenseBreakdown =
                expenseEntries
                |> Seq.groupBy (fun e -> e.Category)
                |> Seq.map (fun (cat, items) ->
                    {| category = cat
                       ``type`` = "expense"
                       total = formatAmount (items |> Seq.sumBy (fun e -> e.Amount)) |})
                |> Seq.toArray

            return
                ok
                    {| totalIncome = formatAmount incomeTotal
                       totalExpense = formatAmount expenseTotal
                       net = formatAmount net
                       currency = curr
                       incomeBreakdown = incomeBreakdown
                       expenseBreakdown = expenseBreakdown |}
    }

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────

let getTokenClaims (token: string option) : int * string =
    let tokenStr = token |> Option.defaultValue ""
    let handler = System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler()

    let claimsData =
        try
            let jwt = handler.ReadJwtToken(tokenStr)
            jwt.Claims |> Seq.map (fun c -> c.Type, c.Value) |> Map.ofSeq |> Some
        with _ ->
            None

    match claimsData with
    | None -> badRequest "Cannot decode token"
    | Some claimsMap -> ok claimsMap

let getJwks () : int * string =
    ok (DemoBeFsgi.Auth.JwtService.getJwks ())
