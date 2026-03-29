module OrganicLeverBe.Tests.InMemory.InMemoryRepositories

open System
open System.Collections.Concurrent
open OrganicLeverBe.Infrastructure.AppDbContext
open OrganicLeverBe.Infrastructure.Repositories.RepositoryTypes

let createUserRepo () : UserRepository =
    let store = ConcurrentDictionary<Guid, UserEntity>()

    { FindById =
        fun id ->
            task {
                return
                    match store.TryGetValue(id) with
                    | true, v -> Some v
                    | _ -> None
            }
      FindByGoogleId = fun googleId -> task { return store.Values |> Seq.tryFind (fun u -> u.GoogleId = googleId) }
      Create =
        fun entity ->
            task {
                store.[entity.Id] <- entity
                return entity
            }
      Update =
        fun entity ->
            task {
                store.[entity.Id] <- entity
                return entity
            } }

let createRefreshTokenRepo () : RefreshTokenRepository =
    let store = ConcurrentDictionary<Guid, RefreshTokenEntity>()

    { Create =
        fun entity ->
            task {
                store.[entity.Id] <- entity
                return entity
            }
      FindByTokenHash =
        fun tokenHash ->
            task {
                let now = DateTime.UtcNow

                return
                    store.Values
                    |> Seq.tryFind (fun rt -> rt.TokenHash = tokenHash && rt.ExpiresAt > now)
            }
      DeleteByUserId =
        fun userId ->
            task {
                let toDelete =
                    store.Values |> Seq.filter (fun rt -> rt.UserId = userId) |> Seq.toList

                for token in toDelete do
                    store.TryRemove(token.Id) |> ignore

                return ()
            }
      Delete =
        fun tokenId ->
            task {
                store.TryRemove(tokenId) |> ignore
                return ()
            } }
