module OrganicLeverBe.Infrastructure.Repositories.EfRepositories

open System
open System.Linq
open Microsoft.EntityFrameworkCore
open OrganicLeverBe.Infrastructure.AppDbContext
open OrganicLeverBe.Infrastructure.Repositories.RepositoryTypes

let createUserRepo (db: AppDbContext) : UserRepository =
    { FindById =
        fun id ->
            task {
                let! entity = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = id)
                return entity |> Option.ofObj
            }
      FindByGoogleId =
        fun googleId ->
            task {
                let! entity = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.GoogleId = googleId)
                return entity |> Option.ofObj
            }
      Create =
        fun entity ->
            task {
                db.Users.Add(entity) |> ignore
                let! _ = db.SaveChangesAsync()
                return entity
            }
      Update =
        fun entity ->
            task {
                db.ChangeTracker.Clear()
                db.Users.Update(entity) |> ignore
                let! _ = db.SaveChangesAsync()
                return entity
            } }

let createRefreshTokenRepo (db: AppDbContext) : RefreshTokenRepository =
    { Create =
        fun entity ->
            task {
                db.RefreshTokens.Add(entity) |> ignore
                let! _ = db.SaveChangesAsync()
                return entity
            }
      FindByTokenHash =
        fun tokenHash ->
            task {
                let now = DateTime.UtcNow

                let! entity =
                    db.RefreshTokens
                        .AsNoTracking()
                        .FirstOrDefaultAsync(fun rt -> rt.TokenHash = tokenHash && rt.ExpiresAt > now)

                return entity |> Option.ofObj
            }
      DeleteByUserId =
        fun userId ->
            task {
                let! tokens = db.RefreshTokens.Where(fun rt -> rt.UserId = userId).ToListAsync()

                for token in tokens do
                    db.RefreshTokens.Remove(token) |> ignore

                let! _ = db.SaveChangesAsync()
                return ()
            }
      Delete =
        fun tokenId ->
            task {
                let! entity = db.RefreshTokens.FirstOrDefaultAsync(fun rt -> rt.Id = tokenId)

                if not (obj.ReferenceEquals(entity, null)) then
                    db.RefreshTokens.Remove(entity) |> ignore
                    let! _ = db.SaveChangesAsync()
                    ()

                return ()
            } }
