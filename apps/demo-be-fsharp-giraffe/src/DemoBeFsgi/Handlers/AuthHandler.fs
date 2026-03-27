module DemoBeFsgi.Handlers.AuthHandler

open System
open System.Linq
open System.Text.Json
open Giraffe
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Infrastructure.PasswordHasher
open DemoBeFsgi.Domain.User
open DemoBeFsgi.Domain.Types
open DemoBeFsgi.Auth.JwtService
open DemoBeFsgi.Contracts.ContractWrappers

let private maxFailedAttempts = 5

let register: HttpHandler =
    fun _next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let req =
                try
                    JsonSerializer.Deserialize<RegisterRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

            match req with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Invalid request body" |}
                        earlyReturn
                        ctx
            | Some r ->
                let usernameResult = validateUsername (if r.username = null then "" else r.username)
                let emailResult = validateEmail (if r.email = null then "" else r.email)
                let passwordResult = validatePassword (if r.password = null then "" else r.password)

                match usernameResult, emailResult, passwordResult with
                | Error(ValidationError(f, m)), _, _ ->
                    ctx.Response.StatusCode <- 400

                    return!
                        json
                            {| error = "Validation Error"
                               field = f
                               message = m |}
                            earlyReturn
                            ctx
                | _, Error(ValidationError(f, m)), _ ->
                    ctx.Response.StatusCode <- 400

                    return!
                        json
                            {| error = "Validation Error"
                               field = f
                               message = m |}
                            earlyReturn
                            ctx
                | _, _, Error(ValidationError(f, m)) ->
                    ctx.Response.StatusCode <- 400

                    return!
                        json
                            {| error = "Validation Error"
                               field = f
                               message = m |}
                            earlyReturn
                            ctx
                | Ok _, Ok _, Ok _ ->
                    let db = ctx.GetService<AppDbContext>()

                    let! existingUser = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Username = r.username)

                    if not (obj.ReferenceEquals(existingUser, null)) then
                        ctx.Response.StatusCode <- 409

                        return!
                            json
                                {| error = "Conflict"
                                   message = "Username already exists" |}
                                earlyReturn
                                ctx
                    else
                        let now = DateTime.UtcNow
                        let userId = Guid.NewGuid()

                        let entity: UserEntity =
                            { Id = userId
                              Username = r.username
                              Email = r.email
                              DisplayName = r.username
                              PasswordHash = hashPassword r.password
                              Role = roleToString User
                              Status = statusToString Active
                              FailedLoginAttempts = 0
                              CreatedAt = now
                              UpdatedAt = now }

                        db.Users.Add(entity) |> ignore
                        let! _ = db.SaveChangesAsync()

                        ctx.Response.StatusCode <- 201

                        return!
                            json
                                {| id = userId
                                   username = entity.Username
                                   email = entity.Email
                                   displayName = entity.DisplayName |}
                                earlyReturn
                                ctx
                | _ ->
                    ctx.Response.StatusCode <- 400

                    return!
                        json
                            {| error = "Bad Request"
                               message = "Validation failed" |}
                            earlyReturn
                            ctx
        }

let login: HttpHandler =
    fun _next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let req =
                try
                    JsonSerializer.Deserialize<LoginRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

            match req with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Invalid request body" |}
                        earlyReturn
                        ctx
            | Some r ->
                let db = ctx.GetService<AppDbContext>()

                let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Username = r.username)

                if obj.ReferenceEquals(user, null) then
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Invalid credentials" |}
                            earlyReturn
                            ctx
                elif user.Status = statusToString Locked then
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Account is locked after too many failed attempts" |}
                            earlyReturn
                            ctx
                elif user.Status = statusToString Inactive then
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Account has been deactivated" |}
                            earlyReturn
                            ctx
                elif user.Status = statusToString Disabled then
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Account has been disabled" |}
                            earlyReturn
                            ctx
                elif not (verifyPassword r.password user.PasswordHash) then
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

                    db.Users.Update(updated) |> ignore
                    let! _ = db.SaveChangesAsync()

                    if newAttempts >= maxFailedAttempts then
                        ctx.Response.StatusCode <- 401

                        return!
                            json
                                {| error = "Unauthorized"
                                   message = "Account is locked after too many failed attempts" |}
                                earlyReturn
                                ctx
                    else
                        ctx.Response.StatusCode <- 401

                        return!
                            json
                                {| error = "Unauthorized"
                                   message = "Invalid credentials" |}
                                earlyReturn
                                ctx
                else
                    let updated =
                        { user with
                            FailedLoginAttempts = 0
                            UpdatedAt = DateTime.UtcNow }

                    db.Users.Update(updated) |> ignore
                    let! _ = db.SaveChangesAsync()

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
                    let! _ = db.SaveChangesAsync()

                    return!
                        json
                            {| accessToken = accessToken
                               refreshToken = refreshTokenStr
                               tokenType = "Bearer" |}
                            earlyReturn
                            ctx
        }

let refresh: HttpHandler =
    fun _next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let req =
                try
                    JsonSerializer.Deserialize<RefreshRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

            match req with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Invalid request body" |}
                        earlyReturn
                        ctx
            | Some r ->
                let db = ctx.GetService<AppDbContext>()

                let! rtEntity =
                    db.RefreshTokens
                        .AsNoTracking()
                        .FirstOrDefaultAsync(fun rt -> rt.TokenHash = r.refreshToken && not rt.Revoked)

                if obj.ReferenceEquals(rtEntity, null) then
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Invalid or already used token" |}
                            earlyReturn
                            ctx
                elif rtEntity.ExpiresAt < DateTime.UtcNow then
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Token has expired" |}
                            earlyReturn
                            ctx
                else
                    let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = rtEntity.UserId)

                    if obj.ReferenceEquals(user, null) then
                        ctx.Response.StatusCode <- 401

                        return!
                            json
                                {| error = "Unauthorized"
                                   message = "User not found" |}
                                earlyReturn
                                ctx
                    elif user.Status <> statusToString Active then
                        ctx.Response.StatusCode <- 401

                        return!
                            json
                                {| error = "Unauthorized"
                                   message = "Account has been deactivated" |}
                                earlyReturn
                                ctx
                    else
                        let revokedRt = { rtEntity with Revoked = true }
                        db.RefreshTokens.Update(revokedRt) |> ignore
                        let! _ = db.SaveChangesAsync()

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
                        let! _ = db.SaveChangesAsync()

                        return!
                            json
                                {| accessToken = accessToken
                                   refreshToken = newRefreshToken
                                   tokenType = "Bearer" |}
                                earlyReturn
                                ctx
        }

let logout: HttpHandler =
    fun next ctx ->
        task {
            let authHeader = ctx.Request.Headers["Authorization"].ToString()

            let token =
                if authHeader.StartsWith("Bearer ", StringComparison.Ordinal) then
                    authHeader.Substring(7)
                else
                    ""

            let db = ctx.GetService<AppDbContext>()
            let jti = getTokenJti token

            match jti with
            | Some j ->
                let! exists = db.RevokedTokens.AnyAsync(fun rt -> rt.Jti = j)

                if not exists then
                    let userId =
                        if ctx.Items.ContainsKey("UserId") then
                            ctx.Items["UserId"] :?> Guid
                        else
                            Guid.Empty

                    let revokedEntity: RevokedTokenEntity =
                        { Id = Guid.NewGuid()
                          Jti = j
                          UserId = userId
                          RevokedAt = DateTime.UtcNow }

                    db.RevokedTokens.Add(revokedEntity) |> ignore
                    let! _ = db.SaveChangesAsync()
                    ()
            | None -> ()

            return! json {| message = "Logged out successfully" |} next ctx
        }

let logoutAll: HttpHandler =
    fun next ctx ->
        task {
            let db = ctx.GetService<AppDbContext>()
            let authHeader = ctx.Request.Headers["Authorization"].ToString()

            let token =
                if authHeader.StartsWith("Bearer ", StringComparison.Ordinal) then
                    authHeader.Substring(7)
                else
                    ""

            let jti = getTokenJti token

            let userId =
                if ctx.Items.ContainsKey("UserId") then
                    ctx.Items["UserId"] :?> Guid
                else
                    Guid.Empty

            match jti with
            | Some j ->
                let! exists = db.RevokedTokens.AnyAsync(fun rt -> rt.Jti = j)

                if not exists then
                    let revokedEntity: RevokedTokenEntity =
                        { Id = Guid.NewGuid()
                          Jti = j
                          UserId = userId
                          RevokedAt = DateTime.UtcNow }

                    db.RevokedTokens.Add(revokedEntity) |> ignore
                    let! _ = db.SaveChangesAsync()
                    ()
            | None -> ()

            let! activeTokens =
                db.RefreshTokens.AsNoTracking().Where(fun rt -> rt.UserId = userId && not rt.Revoked).ToListAsync()

            for rt in activeTokens do
                db.RefreshTokens.Update({ rt with Revoked = true }) |> ignore

            let! _ = db.SaveChangesAsync()

            return! json {| message = "All sessions logged out" |} next ctx
        }
