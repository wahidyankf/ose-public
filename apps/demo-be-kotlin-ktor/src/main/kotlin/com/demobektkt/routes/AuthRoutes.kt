package com.demobektkt.routes

import com.demobektkt.auth.JwtService
import com.demobektkt.auth.PasswordService
import com.demobektkt.domain.DomainError
import com.demobektkt.domain.DomainException
import com.demobektkt.domain.Role
import com.demobektkt.domain.UserStatus
import com.demobektkt.domain.validateEmail
import com.demobektkt.domain.validatePassword
import com.demobektkt.domain.validateUsername
import com.demobektkt.infrastructure.repositories.CreateUserRequest
import com.demobektkt.infrastructure.repositories.TokenRepository
import com.demobektkt.infrastructure.repositories.TokenType
import com.demobektkt.infrastructure.repositories.UpdateUserPatch
import com.demobektkt.infrastructure.repositories.UserRepository
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.RoutingCall
import java.time.Instant
import java.util.UUID
import kotlinx.serialization.Serializable
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

private const val MAX_FAILED_LOGINS = 5

@Serializable
data class RegisterRequest(val username: String, val email: String, val password: String)

@Serializable data class LoginRequest(val username: String, val password: String)

@Serializable data class RefreshRequest(val refreshToken: String)

@Serializable data class LogoutRequest(val access_token: String? = null)

object AuthRoutes : KoinComponent {
  private val userRepository: UserRepository by inject()
  private val tokenRepository: TokenRepository by inject()
  private val jwtService: JwtService by inject()
  private val passwordService: PasswordService by inject()

  suspend fun register(call: RoutingCall) {
    val request = call.receive<RegisterRequest>()

    validateUsername(request.username).getOrThrow()
    validateEmail(request.email).getOrThrow()
    validatePassword(request.password).getOrThrow()

    val existingUser = userRepository.findByUsername(request.username)
    if (existingUser != null) {
      throw DomainException(DomainError.Conflict("Username already exists"))
    }

    val user =
      userRepository.create(
        CreateUserRequest(
          username = request.username,
          email = request.email,
          displayName = request.username,
          passwordHash = passwordService.hash(request.password),
          role = Role.USER,
        )
      )

    call.respond(
      HttpStatusCode.Created,
      mapOf(
        "id" to user.id.toString(),
        "username" to user.username,
        "email" to user.email,
        "display_name" to user.displayName,
      ),
    )
  }

  suspend fun login(call: RoutingCall) {
    val request = call.receive<LoginRequest>()

    val user =
      userRepository.findByUsername(request.username)
        ?: throw DomainException(DomainError.Unauthorized("Invalid credentials"))

    if (user.status == UserStatus.INACTIVE) {
      throw DomainException(DomainError.Unauthorized("Account is deactivated"))
    }

    if (user.status == UserStatus.LOCKED) {
      throw DomainException(DomainError.Unauthorized("Account is locked"))
    }

    if (user.status == UserStatus.DISABLED) {
      throw DomainException(DomainError.Unauthorized("Account is disabled"))
    }

    if (!passwordService.verify(request.password, user.passwordHash)) {
      val newCount = userRepository.incrementFailedLogins(user.id)
      if (newCount >= MAX_FAILED_LOGINS) {
        userRepository.update(user.id, UpdateUserPatch(status = UserStatus.LOCKED))
      }
      throw DomainException(DomainError.Unauthorized("Invalid credentials"))
    }

    userRepository.resetFailedLogins(user.id)

    val accessToken = jwtService.generateAccessToken(user.id, user.username, user.role)
    val refreshToken = jwtService.generateRefreshToken(user.id)

    call.respond(
      mapOf(
        "accessToken" to accessToken,
        "refreshToken" to refreshToken,
        "token_type" to "Bearer",
      )
    )
  }

  suspend fun refresh(call: RoutingCall) {
    val request = call.receive<RefreshRequest>()
    val refreshToken = request.refreshToken

    val decoded =
      jwtService.decodeToken(refreshToken)
        ?: throw DomainException(DomainError.Unauthorized("Invalid or expired token"))

    val tokenType = decoded.getClaim("type").asString()
    if (tokenType != "refresh") {
      throw DomainException(DomainError.Unauthorized("Invalid token"))
    }

    val jti = decoded.getClaim("jti").asString()
    if (tokenRepository.isRevoked(jti)) {
      throw DomainException(DomainError.Unauthorized("Invalid token"))
    }

    val userId = UUID.fromString(decoded.subject)
    val user =
      userRepository.findById(userId)
        ?: throw DomainException(DomainError.Unauthorized("User not found"))

    if (user.status != UserStatus.ACTIVE) {
      throw DomainException(DomainError.Unauthorized("Account is deactivated"))
    }

    // Revoke old refresh token (rotation)
    val expiresAt = decoded.expiresAt?.toInstant() ?: Instant.now()
    tokenRepository.revoke(jti, userId, TokenType.REFRESH, expiresAt)

    val newAccessToken = jwtService.generateAccessToken(userId, user.username, user.role)
    val newRefreshToken = jwtService.generateRefreshToken(userId)

    call.respond(
      mapOf(
        "accessToken" to newAccessToken,
        "refreshToken" to newRefreshToken,
        "token_type" to "Bearer",
      )
    )
  }

  suspend fun logout(call: RoutingCall) {
    val authHeader = call.request.headers["Authorization"]
    val token =
      authHeader?.removePrefix("Bearer ")
        ?: run {
          call.respond(HttpStatusCode.OK, mapOf("message" to "Logged out"))
          return
        }

    val decoded = jwtService.decodeToken(token)
    if (decoded != null) {
      val jti = decoded.getClaim("jti").asString()
      val userId = UUID.fromString(decoded.subject)
      val expiresAt = decoded.expiresAt?.toInstant() ?: Instant.now()
      tokenRepository.revoke(jti, userId, TokenType.ACCESS, expiresAt)
    }

    call.respond(HttpStatusCode.OK, mapOf("message" to "Logged out"))
  }

  suspend fun logoutAll(call: RoutingCall) {
    val principal =
      call.principal<JWTPrincipal>()
        ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
    val userId = UUID.fromString(principal.payload.subject)
    val jti = principal.payload.getClaim("jti").asString()
    val expiresAt = principal.payload.expiresAt?.toInstant() ?: Instant.now()

    tokenRepository.revoke(jti, userId, TokenType.ACCESS, expiresAt)
    tokenRepository.revokeAllForUser(userId)

    call.respond(HttpStatusCode.OK, mapOf("message" to "Logged out from all devices"))
  }
}
