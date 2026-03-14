package com.demobektkt.unit.steps

import com.demobektkt.auth.JwtService
import com.demobektkt.auth.PasswordService
import com.demobektkt.infrastructure.InMemoryAttachmentRepository
import com.demobektkt.infrastructure.InMemoryExpenseRepository
import com.demobektkt.infrastructure.InMemoryTokenRepository
import com.demobektkt.infrastructure.InMemoryUserRepository
import java.util.concurrent.ConcurrentHashMap

const val UNIT_JWT_SECRET = "test-secret-key-at-least-32-characters-long"

/** Shared mutable test state for unit-level Cucumber step definitions. */
object UnitTestWorld {
  var lastResponseStatus: Int = 0
  var lastResponseBody: String = ""
  val accessTokens: ConcurrentHashMap<String, String> = ConcurrentHashMap()
  val refreshTokens: ConcurrentHashMap<String, String> = ConcurrentHashMap()
  val userIds: ConcurrentHashMap<String, String> = ConcurrentHashMap()
  val expenseIds: ConcurrentHashMap<String, String> = ConcurrentHashMap()
  val attachmentIds: ConcurrentHashMap<String, String> = ConcurrentHashMap()
  var jwtService: JwtService = JwtService(UNIT_JWT_SECRET)
  val passwordService: PasswordService = PasswordService()

  // In-memory repos shared across all step definitions
  val userRepo = InMemoryUserRepository()
  val tokenRepo = InMemoryTokenRepository()
  val expenseRepo = InMemoryExpenseRepository()
  val attachmentRepo = InMemoryAttachmentRepository()

  var testApiEnabled: Boolean = true

  fun reset() {
    lastResponseStatus = 0
    lastResponseBody = ""
    accessTokens.clear()
    refreshTokens.clear()
    userIds.clear()
    expenseIds.clear()
    attachmentIds.clear()
    jwtService = JwtService(UNIT_JWT_SECRET)
    userRepo.clear()
    tokenRepo.clear()
    expenseRepo.clear()
    attachmentRepo.clear()
    testApiEnabled = true
  }
}
