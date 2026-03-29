module OrganicLeverBe.Infrastructure.AppDbContext

open System
open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema
open Microsoft.EntityFrameworkCore

[<CLIMutable>]
[<Table("users")>]
type UserEntity =
    { [<Key>]
      [<Column("id")>]
      Id: Guid
      [<Column("email")>]
      Email: string
      [<Column("name")>]
      Name: string
      [<Column("avatar_url")>]
      AvatarUrl: string
      [<Column("google_id")>]
      GoogleId: string
      [<Column("created_at")>]
      CreatedAt: DateTime
      [<Column("updated_at")>]
      UpdatedAt: DateTime }

[<CLIMutable>]
[<Table("refresh_tokens")>]
type RefreshTokenEntity =
    { [<Key>]
      [<Column("id")>]
      Id: Guid
      [<Column("user_id")>]
      UserId: Guid
      [<Column("token_hash")>]
      TokenHash: string
      [<Column("expires_at")>]
      ExpiresAt: DateTime
      [<Column("created_at")>]
      CreatedAt: DateTime }

type AppDbContext(options: DbContextOptions<AppDbContext>) =
    inherit DbContext(options)

    [<DefaultValue(false)>]
    val mutable users: DbSet<UserEntity>

    member this.Users
        with get () = this.users
        and set v = this.users <- v

    [<DefaultValue(false)>]
    val mutable refreshTokens: DbSet<RefreshTokenEntity>

    member this.RefreshTokens
        with get () = this.refreshTokens
        and set v = this.refreshTokens <- v

    override this.OnModelCreating(modelBuilder: ModelBuilder) =
        modelBuilder.Entity<UserEntity>().HasIndex(fun u -> u.Email :> obj).IsUnique()
        |> ignore

        modelBuilder.Entity<UserEntity>().HasIndex(fun u -> u.GoogleId :> obj).IsUnique()
        |> ignore

        modelBuilder.Entity<RefreshTokenEntity>().HasIndex(fun t -> t.TokenHash :> obj).IsUnique()
        |> ignore

        modelBuilder.Entity<UserEntity>().Property(fun u -> u.AvatarUrl).IsRequired(false)
        |> ignore

        base.OnModelCreating(modelBuilder)
