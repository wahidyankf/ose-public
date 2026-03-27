package com.demobektkt.infrastructure

import com.demobektkt.infrastructure.repositories.TokenRecord
import com.demobektkt.infrastructure.repositories.TokenRepository
import com.demobektkt.infrastructure.repositories.TokenType
import com.demobektkt.infrastructure.tables.RefreshTokensTable
import com.demobektkt.infrastructure.tables.RevokedTokensTable
import java.time.Instant
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.update

class ExposedTokenRepository : TokenRepository {
  override suspend fun revoke(jti: String, userId: UUID, tokenType: TokenType, expiresAt: Instant) {
    newSuspendedTransaction(Dispatchers.IO) {
      val exists = RevokedTokensTable.selectAll().where { RevokedTokensTable.jti eq jti }.count() > 0
      if (!exists) {
        RevokedTokensTable.insert {
          it[RevokedTokensTable.jti] = jti
          it[RevokedTokensTable.userId] = userId
          it[revokedAt] = Instant.now()
        }
      }
    }
  }

  override suspend fun isRevoked(jti: String): Boolean =
    newSuspendedTransaction(Dispatchers.IO) {
      RevokedTokensTable.selectAll().where { RevokedTokensTable.jti eq jti }.count() > 0
    }

  override suspend fun revokeAllForUser(userId: UUID) {
    newSuspendedTransaction(Dispatchers.IO) {
      RefreshTokensTable.update({ RefreshTokensTable.userId eq userId }) {
        it[revoked] = true
      }
    }
  }

  override suspend fun findByJti(jti: String): TokenRecord? =
    newSuspendedTransaction(Dispatchers.IO) {
      RevokedTokensTable.selectAll()
        .where { RevokedTokensTable.jti eq jti }
        .map { row ->
          TokenRecord(
            jti = row[RevokedTokensTable.jti],
            userId = row[RevokedTokensTable.userId],
            tokenType = TokenType.ACCESS,
            expiresAt = Instant.now(),
            revokedAt = row[RevokedTokensTable.revokedAt],
          )
        }
        .singleOrNull()
    }
}
