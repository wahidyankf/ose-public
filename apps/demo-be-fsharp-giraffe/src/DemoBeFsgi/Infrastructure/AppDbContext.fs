module DemoBeFsgi.Infrastructure.AppDbContext

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
      [<Column("username")>]
      Username: string
      [<Column("email")>]
      Email: string
      [<Column("display_name")>]
      DisplayName: string
      [<Column("password_hash")>]
      PasswordHash: string
      [<Column("role")>]
      Role: string
      [<Column("status")>]
      Status: string
      [<Column("failed_login_attempts")>]
      FailedLoginAttempts: int
      [<Column("created_at")>]
      CreatedAt: DateTime
      [<Column("updated_at")>]
      UpdatedAt: DateTime }

[<CLIMutable>]
[<Table("expenses")>]
type ExpenseEntity =
    { [<Key>]
      [<Column("id")>]
      Id: Guid
      [<Column("user_id")>]
      UserId: Guid
      [<Column("amount")>]
      Amount: decimal
      [<Column("currency")>]
      Currency: string
      [<Column("category")>]
      Category: string
      [<Column("description")>]
      Description: string
      [<Column("date")>]
      Date: DateTime
      [<Column("type")>]
      Type: string
      [<Column("quantity")>]
      Quantity: Nullable<decimal>
      [<Column("unit")>]
      Unit: string
      [<Column("created_at")>]
      CreatedAt: DateTime
      [<Column("updated_at")>]
      UpdatedAt: DateTime }

[<CLIMutable>]
[<Table("attachments")>]
type AttachmentEntity =
    { [<Key>]
      [<Column("id")>]
      Id: Guid
      [<Column("expense_id")>]
      ExpenseId: Guid
      [<Column("filename")>]
      Filename: string
      [<Column("content_type")>]
      ContentType: string
      [<Column("size")>]
      Size: int64
      [<Column("data")>]
      Data: byte[]
      [<Column("url")>]
      Url: string
      [<Column("created_at")>]
      CreatedAt: DateTime }

[<CLIMutable>]
[<Table("revoked_tokens")>]
type RevokedTokenEntity =
    { [<Key>]
      [<Column("id")>]
      Id: Guid
      [<Column("jti")>]
      Jti: string
      [<Column("user_id")>]
      UserId: Guid
      [<Column("revoked_at")>]
      RevokedAt: DateTime }

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
      CreatedAt: DateTime
      [<Column("revoked")>]
      Revoked: bool }

type AppDbContext(options: DbContextOptions<AppDbContext>) =
    inherit DbContext(options)

    [<DefaultValue(false)>]
    val mutable users: DbSet<UserEntity>

    member this.Users
        with get () = this.users
        and set v = this.users <- v

    [<DefaultValue(false)>]
    val mutable expenses: DbSet<ExpenseEntity>

    member this.Expenses
        with get () = this.expenses
        and set v = this.expenses <- v

    [<DefaultValue(false)>]
    val mutable attachments: DbSet<AttachmentEntity>

    member this.Attachments
        with get () = this.attachments
        and set v = this.attachments <- v

    [<DefaultValue(false)>]
    val mutable revokedTokens: DbSet<RevokedTokenEntity>

    member this.RevokedTokens
        with get () = this.revokedTokens
        and set v = this.revokedTokens <- v

    [<DefaultValue(false)>]
    val mutable refreshTokens: DbSet<RefreshTokenEntity>

    member this.RefreshTokens
        with get () = this.refreshTokens
        and set v = this.refreshTokens <- v

    override this.OnModelCreating(modelBuilder: ModelBuilder) =
        modelBuilder.Entity<UserEntity>().HasIndex(fun u -> u.Username :> obj).IsUnique()
        |> ignore

        modelBuilder.Entity<UserEntity>().HasIndex(fun u -> u.Email :> obj).IsUnique()
        |> ignore

        modelBuilder.Entity<RevokedTokenEntity>().HasIndex(fun t -> t.Jti :> obj).IsUnique()
        |> ignore

        modelBuilder.Entity<RefreshTokenEntity>().HasIndex(fun t -> t.TokenHash :> obj).IsUnique()
        |> ignore

        modelBuilder.Entity<ExpenseEntity>().Property(fun e -> e.Unit).IsRequired(false)
        |> ignore

        base.OnModelCreating(modelBuilder)
