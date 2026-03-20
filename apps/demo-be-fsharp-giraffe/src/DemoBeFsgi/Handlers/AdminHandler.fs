module DemoBeFsgi.Handlers.AdminHandler

open System
open System.Linq
open System.Text.Json
open Giraffe
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Domain.Types
open DemoBeFsgi.Contracts.ContractWrappers

let listUsers: HttpHandler =
    fun next ctx ->
        task {
            let db = ctx.GetService<AppDbContext>()
            let pageParam = ctx.TryGetQueryStringValue("page") |> Option.defaultValue "1"
            let sizeParam = ctx.TryGetQueryStringValue("size") |> Option.defaultValue "20"
            let emailFilter = ctx.TryGetQueryStringValue("search")

            let page =
                Math.Max(
                    1,
                    try
                        int pageParam
                    with _ ->
                        1
                )

            let size =
                Math.Max(
                    1,
                    try
                        int sizeParam
                    with _ ->
                        20
                )

            let query =
                match emailFilter with
                | Some search -> db.Users.Where(fun u -> u.Username.Contains(search) || u.Email.Contains(search))
                | None -> db.Users :> IQueryable<UserEntity>

            let! total = query.CountAsync()
            let offset = (page - 1) * size

            let! users = query.Skip(offset).Take(size).ToListAsync()

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

            return!
                json
                    {| content = userData
                       totalElements = total
                       page = page
                       size = size |}
                    next
                    ctx
        }

let disableUser (userId: Guid) : HttpHandler =
    fun next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let _req =
                try
                    JsonSerializer.Deserialize<DisableRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

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
                        Status = statusToString Disabled
                        UpdatedAt = DateTime.UtcNow }

                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync()

                return!
                    json
                        {| message = "User disabled"
                           id = userId
                           status = statusToString Disabled |}
                        next
                        ctx
        }

let enableUser (userId: Guid) : HttpHandler =
    fun next ctx ->
        task {
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
                        Status = statusToString Active
                        UpdatedAt = DateTime.UtcNow }

                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync()

                return!
                    json
                        {| message = "User enabled"
                           id = userId
                           status = statusToString Active |}
                        next
                        ctx
        }

let unlockUser (userId: Guid) : HttpHandler =
    fun next ctx ->
        task {
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
                        Status = statusToString Active
                        FailedLoginAttempts = 0
                        UpdatedAt = DateTime.UtcNow }

                db.Users.Update(updated) |> ignore
                let! _ = db.SaveChangesAsync()

                return!
                    json
                        {| message = "User unlocked"
                           id = userId
                           status = statusToString Active |}
                        next
                        ctx
        }

let forcePasswordReset (userId: Guid) : HttpHandler =
    fun next ctx ->
        task {
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
                let resetToken = Guid.NewGuid().ToString("N")

                return!
                    json
                        {| message = "Password reset token generated"
                           token = resetToken |}
                        next
                        ctx
        }
