module DemoBeFsgi.Handlers.UserHandler

open System
open System.Text.Json
open Giraffe
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Infrastructure.PasswordHasher
open DemoBeFsgi.Domain.Types
open DemoBeFsgi.Contracts.ContractWrappers

let getProfile: HttpHandler =
    fun next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let db = ctx.GetService<AppDbContext>()

            let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)

            if obj.ReferenceEquals(user, null) then
                ctx.Response.StatusCode <- 404

                return!
                    json
                        {| error = "Not Found"
                           message = "User not found" |}
                        earlyReturn
                        ctx
            else
                return!
                    json
                        {| id = user.Id
                           username = user.Username
                           email = user.Email
                           displayName = user.DisplayName
                           role = user.Role
                           status = user.Status |}
                        next
                        ctx
        }

let updateProfile: HttpHandler =
    fun next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let req =
                try
                    JsonSerializer.Deserialize<UpdateProfileRequest>(
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
                let userId = ctx.Items["UserId"] :?> Guid
                let db = ctx.GetService<AppDbContext>()

                let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)

                if obj.ReferenceEquals(user, null) then
                    ctx.Response.StatusCode <- 404

                    return!
                        json
                            {| error = "Not Found"
                               message = "User not found" |}
                            earlyReturn
                            ctx
                else
                    let updated =
                        { user with
                            DisplayName =
                                if r.displayName <> null then
                                    r.displayName
                                else
                                    user.DisplayName
                            UpdatedAt = DateTime.UtcNow }

                    db.Users.Update(updated) |> ignore
                    let! _ = db.SaveChangesAsync()

                    return!
                        json
                            {| id = updated.Id
                               username = updated.Username
                               email = updated.Email
                               displayName = updated.DisplayName |}
                            next
                            ctx
        }

let changePassword: HttpHandler =
    fun next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let req =
                try
                    JsonSerializer.Deserialize<ChangePasswordRequest>(
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
                let userId = ctx.Items["UserId"] :?> Guid
                let db = ctx.GetService<AppDbContext>()

                let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)

                if obj.ReferenceEquals(user, null) then
                    ctx.Response.StatusCode <- 404

                    return!
                        json
                            {| error = "Not Found"
                               message = "User not found" |}
                            earlyReturn
                            ctx
                elif not (verifyPassword r.oldPassword user.PasswordHash) then
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
                            PasswordHash = hashPassword r.newPassword
                            UpdatedAt = DateTime.UtcNow }

                    db.Users.Update(updated) |> ignore
                    let! _ = db.SaveChangesAsync()

                    return! json {| message = "Password changed successfully" |} next ctx
        }

let deactivate: HttpHandler =
    fun next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let db = ctx.GetService<AppDbContext>()

            let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = userId)

            if obj.ReferenceEquals(user, null) then
                ctx.Response.StatusCode <- 404

                return!
                    json
                        {| error = "Not Found"
                           message = "User not found" |}
                        earlyReturn
                        ctx
            else
                let updated =
                    { user with
                        Status = statusToString Inactive
                        UpdatedAt = DateTime.UtcNow }

                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync()

                return! json {| message = "Account deactivated" |} next ctx
        }
