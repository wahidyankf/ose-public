module OrganicLeverBe.Infrastructure.Repositories.RepositoryTypes

open System
open System.Threading.Tasks
open OrganicLeverBe.Infrastructure.AppDbContext

/// Repository for user operations.
type UserRepository =
    { FindById: Guid -> Task<UserEntity option>
      FindByGoogleId: string -> Task<UserEntity option>
      Create: UserEntity -> Task<UserEntity>
      Update: UserEntity -> Task<UserEntity> }

/// Repository for refresh token operations (single-use rotation model).
type RefreshTokenRepository =
    { Create: RefreshTokenEntity -> Task<RefreshTokenEntity>
      FindByTokenHash: string -> Task<RefreshTokenEntity option>
      DeleteByUserId: Guid -> Task<unit>
      Delete: Guid -> Task<unit> }
