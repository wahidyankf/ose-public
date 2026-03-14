package com.demobektkt.infrastructure

import com.demobektkt.domain.Page
import com.demobektkt.domain.Role
import com.demobektkt.domain.User
import com.demobektkt.domain.UserStatus
import com.demobektkt.infrastructure.repositories.CreateUserRequest
import com.demobektkt.infrastructure.repositories.UpdateUserPatch
import com.demobektkt.infrastructure.repositories.UserRepository
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class InMemoryUserRepository : UserRepository {
  private val store = ConcurrentHashMap<UUID, User>()

  override suspend fun findByUsername(username: String): User? =
    store.values.find { it.username == username }

  override suspend fun findById(id: UUID): User? = store[id]

  override suspend fun findByEmail(email: String): User? = store.values.find { it.email == email }

  override suspend fun create(request: CreateUserRequest): User {
    val now = Instant.now()
    val user =
      User(
        id = UUID.randomUUID(),
        username = request.username,
        email = request.email,
        displayName = request.displayName,
        passwordHash = request.passwordHash,
        role = request.role,
        status = UserStatus.ACTIVE,
        failedLoginCount = 0,
        createdAt = now,
        updatedAt = now,
      )
    store[user.id] = user
    return user
  }

  override suspend fun update(id: UUID, patch: UpdateUserPatch): User? {
    val user = store[id] ?: return null
    val updated =
      user.copy(
        displayName = patch.displayName ?: user.displayName,
        passwordHash = patch.passwordHash ?: user.passwordHash,
        status = patch.status ?: user.status,
        failedLoginCount = patch.failedLoginCount ?: user.failedLoginCount,
        updatedAt = Instant.now(),
      )
    store[id] = updated
    return updated
  }

  override suspend fun incrementFailedLogins(id: UUID): Int {
    val user = store[id] ?: return 0
    val newCount = user.failedLoginCount + 1
    store[id] = user.copy(failedLoginCount = newCount, updatedAt = Instant.now())
    return newCount
  }

  override suspend fun resetFailedLogins(id: UUID) {
    val user = store[id] ?: return
    store[id] = user.copy(failedLoginCount = 0, updatedAt = Instant.now())
  }

  override suspend fun findAll(page: Int, pageSize: Int, emailFilter: String?): Page<User> {
    val filtered =
      if (emailFilter != null) {
        store.values.filter { it.email.contains(emailFilter, ignoreCase = true) }
      } else {
        store.values.toList()
      }
    val sorted = filtered.sortedBy { it.createdAt }
    val total = sorted.size.toLong()
    val offset = (page - 1) * pageSize
    val items = sorted.drop(offset).take(pageSize)
    return Page(data = items, total = total, page = page, pageSize = pageSize)
  }

  fun clear() {
    store.clear()
  }

  fun promoteToAdmin(id: UUID): User? {
    val user = store[id] ?: return null
    val updated = user.copy(role = Role.ADMIN, updatedAt = Instant.now())
    store[id] = updated
    return updated
  }

  fun createAdmin(username: String, email: String, passwordHash: String): User {
    val now = Instant.now()
    val user =
      User(
        id = UUID.randomUUID(),
        username = username,
        email = email,
        displayName = username,
        passwordHash = passwordHash,
        role = Role.ADMIN,
        status = UserStatus.ACTIVE,
        failedLoginCount = 0,
        createdAt = now,
        updatedAt = now,
      )
    store[user.id] = user
    return user
  }
}
