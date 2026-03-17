package com.demobektkt.unit.steps

import com.demobektkt.auth.JWT_ISSUER
import com.demobektkt.domain.DomainError
import com.demobektkt.domain.DomainException
import com.demobektkt.domain.EntryType
import com.demobektkt.domain.Role
import com.demobektkt.domain.UserStatus
import com.demobektkt.domain.validateAmount
import com.demobektkt.domain.validateContentType
import com.demobektkt.domain.validateCurrency
import com.demobektkt.domain.validateDisplayName
import com.demobektkt.domain.validateEmail
import com.demobektkt.domain.validateFileSize
import com.demobektkt.domain.validatePassword
import com.demobektkt.domain.validateUnit
import com.demobektkt.domain.validateUsername
import com.demobektkt.infrastructure.repositories.CreateAttachmentRequest
import com.demobektkt.infrastructure.repositories.CreateExpenseRequest
import com.demobektkt.infrastructure.repositories.CreateUserRequest
import com.demobektkt.infrastructure.repositories.TokenType
import com.demobektkt.infrastructure.repositories.UpdateExpenseRequest
import com.demobektkt.infrastructure.repositories.UpdateUserPatch
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray

private const val MAX_FAILED_LOGINS = 5

/**
 * Dispatches unit-test actions directly to repository/domain logic, bypassing HTTP.
 *
 * Each method mirrors the corresponding Ktor route handler and returns
 * `Pair<Int, String>` (HTTP-equivalent status code, JSON body string).
 * Uses in-memory repositories via [UnitTestWorld].
 */
@Suppress("LargeClass")
object UnitServiceDispatcher {

    // -------------------------------------------------------------------------
    // Auth routes
    // -------------------------------------------------------------------------

    fun register(username: String, email: String, password: String): Pair<Int, String> =
        runBlocking {
            runCatching {
                validateUsername(username).getOrThrow()
                validateEmail(email).getOrThrow()
                validatePassword(password).getOrThrow()

                if (UnitTestWorld.userRepo.findByUsername(username) != null) {
                    throw DomainException(DomainError.Conflict("Username already exists"))
                }

                val user =
                    UnitTestWorld.userRepo.create(
                        CreateUserRequest(
                            username = username,
                            email = email,
                            displayName = username,
                            passwordHash = UnitTestWorld.passwordService.hash(password),
                            role = Role.USER,
                        )
                    )
                Pair(
                    201,
                    buildJsonObject {
                            put("id", user.id.toString())
                            put("username", user.username)
                            put("email", user.email)
                            put("displayName", user.displayName)
                        }
                        .toString(),
                )
            }
                .getOrElse { e -> domainErrorResponse(e) }
        }

    fun login(username: String, password: String): Pair<Int, String> = runBlocking {
        runCatching {
            val user =
                UnitTestWorld.userRepo.findByUsername(username)
                    ?: throw DomainException(DomainError.Unauthorized("Invalid credentials"))

            when (user.status) {
                UserStatus.INACTIVE ->
                    throw DomainException(DomainError.Unauthorized("Account is deactivated"))
                UserStatus.LOCKED ->
                    throw DomainException(DomainError.Unauthorized("Account is locked"))
                UserStatus.DISABLED ->
                    throw DomainException(DomainError.Unauthorized("Account is disabled"))
                UserStatus.ACTIVE -> {} // continue
            }

            if (!UnitTestWorld.passwordService.verify(password, user.passwordHash)) {
                val newCount = UnitTestWorld.userRepo.incrementFailedLogins(user.id)
                if (newCount >= MAX_FAILED_LOGINS) {
                    UnitTestWorld.userRepo.update(
                        user.id,
                        UpdateUserPatch(status = UserStatus.LOCKED),
                    )
                }
                throw DomainException(DomainError.Unauthorized("Invalid credentials"))
            }

            UnitTestWorld.userRepo.resetFailedLogins(user.id)

            val accessToken =
                UnitTestWorld.jwtService.generateAccessToken(user.id, user.username, user.role)
            val refreshToken = UnitTestWorld.jwtService.generateRefreshToken(user.id)

            Pair(
                200,
                buildJsonObject {
                        put("accessToken", accessToken)
                        put("refreshToken", refreshToken)
                        put("tokenType", "Bearer")
                    }
                    .toString(),
            )
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun refresh(refreshTokenStr: String): Pair<Int, String> = runBlocking {
        runCatching {
            val decoded =
                UnitTestWorld.jwtService.decodeToken(refreshTokenStr)
                    ?: throw DomainException(DomainError.Unauthorized("Invalid or expired token"))

            val tokenType = decoded.getClaim("type").asString()
            if (tokenType != "refresh") {
                throw DomainException(DomainError.Unauthorized("Invalid token"))
            }

            val jti = decoded.getClaim("jti").asString()
            if (UnitTestWorld.tokenRepo.isRevoked(jti)) {
                throw DomainException(DomainError.Unauthorized("Invalid token"))
            }

            val userId = UUID.fromString(decoded.subject)
            val user =
                UnitTestWorld.userRepo.findById(userId)
                    ?: throw DomainException(DomainError.Unauthorized("User not found"))

            if (user.status != UserStatus.ACTIVE) {
                throw DomainException(DomainError.Unauthorized("Account is deactivated"))
            }

            val expiresAt = decoded.expiresAt?.toInstant() ?: Instant.now()
            UnitTestWorld.tokenRepo.revoke(jti, userId, TokenType.REFRESH, expiresAt)

            val newAccess =
                UnitTestWorld.jwtService.generateAccessToken(userId, user.username, user.role)
            val newRefresh = UnitTestWorld.jwtService.generateRefreshToken(userId)

            Pair(
                200,
                buildJsonObject {
                        put("accessToken", newAccess)
                        put("refreshToken", newRefresh)
                        put("tokenType", "Bearer")
                    }
                    .toString(),
            )
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun logout(accessToken: String?): Pair<Int, String> = runBlocking {
        if (accessToken != null) {
            val decoded = UnitTestWorld.jwtService.decodeToken(accessToken)
            if (decoded != null) {
                val jti = decoded.getClaim("jti").asString()
                val userId = UUID.fromString(decoded.subject)
                val expiresAt = decoded.expiresAt?.toInstant() ?: Instant.now()
                UnitTestWorld.tokenRepo.revoke(jti, userId, TokenType.ACCESS, expiresAt)
            }
        }
        Pair(200, buildJsonObject { put("message", "Logged out") }.toString())
    }

    fun logoutAll(accessToken: String): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val decoded =
                UnitTestWorld.jwtService.decodeToken(accessToken)
                    ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
            val jti = decoded.getClaim("jti").asString()
            val expiresAt = decoded.expiresAt?.toInstant() ?: Instant.now()

            UnitTestWorld.tokenRepo.revoke(jti, userId, TokenType.ACCESS, expiresAt)
            UnitTestWorld.tokenRepo.revokeAllForUser(userId)

            Pair(
                200,
                buildJsonObject { put("message", "Logged out from all devices") }.toString(),
            )
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    // -------------------------------------------------------------------------
    // User routes
    // -------------------------------------------------------------------------

    fun getProfile(accessToken: String): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val user =
                UnitTestWorld.userRepo.findById(userId)
                    ?: throw DomainException(DomainError.NotFound("user"))
            Pair(
                200,
                buildJsonObject {
                        put("id", user.id.toString())
                        put("username", user.username)
                        put("email", user.email)
                        put("displayName", user.displayName)
                        put("role", user.role.name)
                        put("status", user.status.name)
                    }
                    .toString(),
            )
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun updateDisplayName(accessToken: String, displayName: String): Pair<Int, String> =
        runBlocking {
            runCatching {
                val userId = requireAuthUserId(accessToken)
                validateDisplayName(displayName).getOrThrow()

                val user =
                    UnitTestWorld.userRepo.update(
                        userId,
                        UpdateUserPatch(displayName = displayName),
                    ) ?: throw DomainException(DomainError.NotFound("user"))
                Pair(
                    200,
                    buildJsonObject {
                            put("id", user.id.toString())
                            put("username", user.username)
                            put("email", user.email)
                            put("displayName", user.displayName)
                        }
                        .toString(),
                )
            }
                .getOrElse { e -> domainErrorResponse(e) }
        }

    fun changePassword(
        accessToken: String,
        oldPassword: String,
        newPassword: String,
    ): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val user =
                UnitTestWorld.userRepo.findById(userId)
                    ?: throw DomainException(DomainError.NotFound("user"))

            if (!UnitTestWorld.passwordService.verify(oldPassword, user.passwordHash)) {
                throw DomainException(DomainError.Unauthorized("Invalid credentials"))
            }

            val newHash = UnitTestWorld.passwordService.hash(newPassword)
            UnitTestWorld.userRepo.update(userId, UpdateUserPatch(passwordHash = newHash))

            Pair(200, buildJsonObject { put("message", "Password changed") }.toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun deactivate(accessToken: String): Pair<Int, String> = runBlocking {
        runCatching {
            val decoded =
                UnitTestWorld.jwtService.decodeToken(accessToken)
                    ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
            requireActiveUser(decoded.subject)
            val userId = UUID.fromString(decoded.subject)
            val jti = decoded.getClaim("jti").asString()
            val expiresAt = decoded.expiresAt?.toInstant() ?: Instant.now()

            UnitTestWorld.userRepo.update(userId, UpdateUserPatch(status = UserStatus.INACTIVE))
            UnitTestWorld.tokenRepo.revoke(jti, userId, TokenType.ACCESS, expiresAt)
            UnitTestWorld.tokenRepo.revokeAllForUser(userId)

            Pair(200, buildJsonObject { put("message", "Account deactivated") }.toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    // -------------------------------------------------------------------------
    // Admin routes
    // -------------------------------------------------------------------------

    fun listUsers(accessToken: String, emailFilter: String? = null): Pair<Int, String> =
        runBlocking {
            runCatching {
                requireAdminUser(accessToken)

                val result = UnitTestWorld.userRepo.findAll(1, 100, emailFilter)
                val arr = buildJsonArray {
                    result.data.forEach { user ->
                        add(
                            buildJsonObject {
                                put("id", user.id.toString())
                                put("username", user.username)
                                put("email", user.email)
                                put("displayName", user.displayName)
                                put("role", user.role.name.lowercase())
                                put("status", user.status.name)
                            }
                        )
                    }
                }
                val response = buildJsonObject {
                    put("content", arr)
                    put("totalElements", result.total)
                    put("page", result.page)
                    put("pageSize", result.pageSize)
                }
                Pair(200, response.toString())
            }
                .getOrElse { e -> domainErrorResponse(e) }
        }

    @Suppress("UnusedParameter")
    fun disableUser(accessToken: String, userId: String, reason: String): Pair<Int, String> =
        runBlocking {
            runCatching {
                requireAdminUser(accessToken)
                val id =
                    runCatching { UUID.fromString(userId) }.getOrElse {
                        throw DomainException(DomainError.NotFound("user"))
                    }
                val user =
                    UnitTestWorld.userRepo.update(id, UpdateUserPatch(status = UserStatus.DISABLED))
                        ?: throw DomainException(DomainError.NotFound("user"))
                UnitTestWorld.tokenRepo.revokeAllForUser(id)
                Pair(
                    200,
                    buildJsonObject {
                            put("id", user.id.toString())
                            put("status", user.status.name)
                        }
                        .toString(),
                )
            }
                .getOrElse { e -> domainErrorResponse(e) }
        }

    fun enableUser(accessToken: String, userId: String): Pair<Int, String> = runBlocking {
        runCatching {
            requireAdminUser(accessToken)
            val id =
                runCatching { UUID.fromString(userId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("user"))
                }
            val user =
                UnitTestWorld.userRepo.update(id, UpdateUserPatch(status = UserStatus.ACTIVE))
                    ?: throw DomainException(DomainError.NotFound("user"))
            Pair(
                200,
                buildJsonObject {
                        put("id", user.id.toString())
                        put("status", user.status.name)
                    }
                    .toString(),
            )
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun unlockUser(accessToken: String, userId: String): Pair<Int, String> = runBlocking {
        runCatching {
            requireAdminUser(accessToken)
            val id =
                runCatching { UUID.fromString(userId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("user"))
                }
            val user =
                UnitTestWorld.userRepo.update(
                    id,
                    UpdateUserPatch(status = UserStatus.ACTIVE, failedLoginCount = 0),
                ) ?: throw DomainException(DomainError.NotFound("user"))
            Pair(
                200,
                buildJsonObject {
                        put("id", user.id.toString())
                        put("status", user.status.name)
                    }
                    .toString(),
            )
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun forcePasswordReset(accessToken: String, userId: String): Pair<Int, String> = runBlocking {
        runCatching {
            requireAdminUser(accessToken)
            val id =
                runCatching { UUID.fromString(userId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("user"))
                }
            UnitTestWorld.userRepo.findById(id)
                ?: throw DomainException(DomainError.NotFound("user"))
            val resetToken = UUID.randomUUID().toString()
            Pair(
                200,
                buildJsonObject {
                        put("token", resetToken)
                        put("user_id", userId)
                    }
                    .toString(),
            )
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    // -------------------------------------------------------------------------
    // Expense routes
    // -------------------------------------------------------------------------

    fun createExpense(
        accessToken: String,
        amount: String,
        currency: String,
        category: String,
        description: String,
        date: String,
        type: String,
        quantity: Double? = null,
        unit: String? = null,
    ): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)

            val validCurrency = validateCurrency(currency).getOrThrow()
            val validAmount =
                validateAmount(validCurrency, BigDecimal(amount)).getOrThrow()
            val validUnit = validateUnit(unit).getOrThrow()

            val entryType =
                runCatching { EntryType.valueOf(type.uppercase()) }.getOrNull()
                    ?: throw DomainException(
                        DomainError.ValidationError("type", "Invalid type: $type")
                    )

            val localDate =
                runCatching { LocalDate.parse(date) }.getOrNull()
                    ?: throw DomainException(
                        DomainError.ValidationError("date", "Invalid date format: $date")
                    )

            val expense =
                UnitTestWorld.expenseRepo.create(
                    CreateExpenseRequest(
                        userId = userId,
                        type = entryType,
                        amount = validAmount,
                        currency = validCurrency,
                        category = category,
                        description = description,
                        date = localDate,
                        quantity = quantity?.let { BigDecimal(it.toString()) },
                        unit = validUnit,
                    )
                )

            Pair(201, expenseToJson(expense).toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun listExpenses(accessToken: String): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val result = UnitTestWorld.expenseRepo.findAllByUser(userId, 1, 100)
            val response = buildJsonObject {
                putJsonArray("content") { result.data.forEach { add(expenseToJson(it)) } }
                put("totalElements", result.total)
                put("page", result.page)
                put("pageSize", result.pageSize)
            }
            Pair(200, response.toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun getExpenseById(accessToken: String, expenseId: String): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val id =
                runCatching { UUID.fromString(expenseId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("expense"))
                }
            val expense =
                UnitTestWorld.expenseRepo.findById(id)
                    ?: throw DomainException(DomainError.NotFound("expense"))
            if (expense.userId != userId) {
                throw DomainException(DomainError.Forbidden("Access denied"))
            }
            Pair(200, expenseToJson(expense).toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun updateExpense(
        accessToken: String,
        expenseId: String,
        amount: String,
        currency: String,
        category: String,
        description: String,
        date: String,
        type: String,
        quantity: Double? = null,
        unit: String? = null,
    ): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val id =
                runCatching { UUID.fromString(expenseId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("expense"))
                }

            val existing =
                UnitTestWorld.expenseRepo.findById(id)
                    ?: throw DomainException(DomainError.NotFound("expense"))
            if (existing.userId != userId) {
                throw DomainException(DomainError.Forbidden("Access denied"))
            }

            val validCurrency = validateCurrency(currency).getOrThrow()
            val validAmount =
                validateAmount(validCurrency, BigDecimal(amount)).getOrThrow()
            val validUnit = validateUnit(unit).getOrThrow()

            val entryType =
                runCatching { EntryType.valueOf(type.uppercase()) }.getOrNull()
                    ?: throw DomainException(
                        DomainError.ValidationError("type", "Invalid type: $type")
                    )

            val localDate =
                runCatching { LocalDate.parse(date) }.getOrNull()
                    ?: throw DomainException(
                        DomainError.ValidationError("date", "Invalid date format: $date")
                    )

            val expense =
                UnitTestWorld.expenseRepo.update(
                    id,
                    UpdateExpenseRequest(
                        type = entryType,
                        amount = validAmount,
                        currency = validCurrency,
                        category = category,
                        description = description,
                        date = localDate,
                        quantity = quantity?.let { BigDecimal(it.toString()) },
                        unit = validUnit,
                    ),
                ) ?: throw DomainException(DomainError.NotFound("expense"))

            Pair(200, expenseToJson(expense).toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun deleteExpense(accessToken: String, expenseId: String): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val id =
                runCatching { UUID.fromString(expenseId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("expense"))
                }
            val existing =
                UnitTestWorld.expenseRepo.findById(id)
                    ?: throw DomainException(DomainError.NotFound("expense"))
            if (existing.userId != userId) {
                throw DomainException(DomainError.Forbidden("Access denied"))
            }
            UnitTestWorld.expenseRepo.delete(id)
            Pair(204, "")
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun expenseSummary(accessToken: String): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val summaries = UnitTestWorld.expenseRepo.summaryByUser(userId)
            val summaryMap =
                summaries.associate { s ->
                    s.currency to formatAmount(s.currency, s.total)
                }
            val response = buildJsonObject { summaryMap.forEach { (k, v) -> put(k, v) } }
            Pair(200, response.toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    // -------------------------------------------------------------------------
    // Attachment routes
    // -------------------------------------------------------------------------

    fun uploadAttachment(
        accessToken: String,
        expenseId: String,
        filename: String,
        contentType: String,
        fileContent: ByteArray,
    ): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val id =
                runCatching { UUID.fromString(expenseId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("expense"))
                }
            val expense =
                UnitTestWorld.expenseRepo.findById(id)
                    ?: throw DomainException(DomainError.NotFound("expense"))
            if (expense.userId != userId) {
                throw DomainException(DomainError.Forbidden("Access denied"))
            }

            validateContentType(contentType).getOrThrow()
            validateFileSize(fileContent.size.toLong()).getOrThrow()

            val storedPath = "memory://${UUID.randomUUID()}/$filename"
            val attachment =
                UnitTestWorld.attachmentRepo.create(
                    CreateAttachmentRequest(
                        expenseId = id,
                        userId = userId,
                        filename = filename,
                        contentType = contentType.split(";").first().trim(),
                        sizeBytes = fileContent.size.toLong(),
                        storedPath = storedPath,
                    )
                )

            Pair(201, attachmentToJson(attachment).toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun listAttachments(accessToken: String, expenseId: String): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val id =
                runCatching { UUID.fromString(expenseId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("expense"))
                }
            val expense =
                UnitTestWorld.expenseRepo.findById(id)
                    ?: throw DomainException(DomainError.NotFound("expense"))
            if (expense.userId != userId) {
                throw DomainException(DomainError.Forbidden("Access denied"))
            }
            val attachments = UnitTestWorld.attachmentRepo.findAllByExpense(id)
            val response = buildJsonObject {
                putJsonArray("attachments") { attachments.forEach { add(attachmentToJson(it)) } }
            }
            Pair(200, response.toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun deleteAttachment(
        accessToken: String,
        expenseId: String,
        attachmentId: String,
    ): Pair<Int, String> = runBlocking {
        runCatching {
            val userId = requireAuthUserId(accessToken)
            val eid =
                runCatching { UUID.fromString(expenseId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("expense"))
                }
            val aid =
                runCatching { UUID.fromString(attachmentId) }.getOrElse {
                    throw DomainException(DomainError.NotFound("attachment"))
                }
            val expense =
                UnitTestWorld.expenseRepo.findById(eid)
                    ?: throw DomainException(DomainError.NotFound("expense"))
            if (expense.userId != userId) {
                throw DomainException(DomainError.Forbidden("Access denied"))
            }
            UnitTestWorld.attachmentRepo.findById(aid)
                ?: throw DomainException(DomainError.NotFound("attachment"))
            UnitTestWorld.attachmentRepo.delete(aid)
            Pair(204, "")
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    // -------------------------------------------------------------------------
    // Token routes
    // -------------------------------------------------------------------------

    fun tokenClaims(accessToken: String): Pair<Int, String> = runBlocking {
        runCatching {
            val decoded =
                UnitTestWorld.jwtService.decodeToken(accessToken)
                    ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))

            val jti = decoded.getClaim("jti").asString()
            if (UnitTestWorld.tokenRepo.isRevoked(jti)) {
                throw DomainException(DomainError.Unauthorized("Unauthorized"))
            }

            val subjectStr = decoded.subject
            val userId =
                runCatching { UUID.fromString(subjectStr) }.getOrElse {
                    throw DomainException(DomainError.Unauthorized("Unauthorized"))
                }
            val user =
                UnitTestWorld.userRepo.findById(userId)
                    ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
            if (user.status != UserStatus.ACTIVE) {
                throw DomainException(DomainError.Unauthorized("Unauthorized"))
            }

            val response = buildJsonObject {
                put("sub", decoded.subject)
                put("iss", decoded.issuer)
                put("jti", decoded.getClaim("jti").asString())
                put("username", decoded.getClaim("username").asString())
                put("role", decoded.getClaim("role").asString())
                decoded.expiresAt?.time?.let { put("exp", it) }
                decoded.issuedAt?.time?.let { put("iat", it) }
            }
            Pair(200, response.toString())
        }
            .getOrElse { e -> domainErrorResponse(e) }
    }

    fun jwks(): Pair<Int, String> {
        val response = buildJsonObject {
            putJsonArray("keys") {
                add(
                    buildJsonObject {
                        put("kty", "oct")
                        put("use", "sig")
                        put("alg", "HS256")
                        put("kid", "demo-be-kotlin-ktor-key-1")
                        put("iss", JWT_ISSUER)
                    }
                )
            }
        }
        return Pair(200, response.toString())
    }

    // -------------------------------------------------------------------------
    // Health check
    // -------------------------------------------------------------------------

    fun health(): Pair<Int, String> =
        Pair(200, buildJsonObject { put("status", "UP") }.toString())

    // -------------------------------------------------------------------------
    // Report routes
    // -------------------------------------------------------------------------

    fun pl(accessToken: String, from: String, to: String, currency: String): Pair<Int, String> =
        runBlocking {
            runCatching {
                val userId = requireAuthUserId(accessToken)

                val fromDate =
                    runCatching { LocalDate.parse(from) }.getOrNull()
                        ?: throw DomainException(
                            DomainError.ValidationError("from", "Invalid date format: $from")
                        )
                val toDate =
                    runCatching { LocalDate.parse(to) }.getOrNull()
                        ?: throw DomainException(
                            DomainError.ValidationError("to", "Invalid date format: $to")
                        )

                val entries =
                    UnitTestWorld.expenseRepo.findByUserAndPeriod(
                        userId,
                        fromDate,
                        toDate,
                        currency,
                    )

                val incomeEntries = entries.filter { it.type == EntryType.INCOME }
                val expenseEntries = entries.filter { it.type == EntryType.EXPENSE }

                val scale = if (currency == "IDR") 0 else 2

                val incomeTotal =
                    incomeEntries
                        .fold(BigDecimal.ZERO) { acc, e -> acc + e.amount }
                        .setScale(scale, RoundingMode.HALF_UP)
                val expenseTotal =
                    expenseEntries
                        .fold(BigDecimal.ZERO) { acc, e -> acc + e.amount }
                        .setScale(scale, RoundingMode.HALF_UP)
                val net = (incomeTotal - expenseTotal).setScale(scale, RoundingMode.HALF_UP)

                val incomeBreakdown =
                    incomeEntries
                        .groupBy { it.category }
                        .mapValues { (_, list) ->
                            list
                                .fold(BigDecimal.ZERO) { acc, e -> acc + e.amount }
                                .setScale(scale, RoundingMode.HALF_UP)
                                .toPlainString()
                        }

                val expenseBreakdown =
                    expenseEntries
                        .groupBy { it.category }
                        .mapValues { (_, list) ->
                            list
                                .fold(BigDecimal.ZERO) { acc, e -> acc + e.amount }
                                .setScale(scale, RoundingMode.HALF_UP)
                                .toPlainString()
                        }

                val response = buildJsonObject {
                    put("currency", currency)
                    put("from", fromDate.toString())
                    put("to", toDate.toString())
                    put("totalIncome", incomeTotal.toPlainString())
                    put("totalExpense", expenseTotal.toPlainString())
                    put("net", net.toPlainString())
                    put(
                        "income_breakdown",
                        buildJsonObject {
                            incomeBreakdown.forEach { (cat, amt) -> put(cat, amt) }
                        },
                    )
                    put(
                        "expense_breakdown",
                        buildJsonObject {
                            expenseBreakdown.forEach { (cat, amt) -> put(cat, amt) }
                        },
                    )
                }
                Pair(200, response.toString())
            }
                .getOrElse { e -> domainErrorResponse(e) }
        }

    // -------------------------------------------------------------------------
    // Test-support routes
    // -------------------------------------------------------------------------

    fun testResetDb(): Pair<Int, String> {
        if (!UnitTestWorld.testApiEnabled) {
            return Pair(404, buildJsonObject { put("message", "Not found") }.toString())
        }
        return runBlocking {
            UnitTestWorld.userRepo.clear()
            UnitTestWorld.tokenRepo.clear()
            UnitTestWorld.expenseRepo.clear()
            UnitTestWorld.attachmentRepo.clear()
            UnitTestWorld.userIds.clear()
            UnitTestWorld.accessTokens.clear()
            UnitTestWorld.refreshTokens.clear()
            UnitTestWorld.expenseIds.clear()
            UnitTestWorld.attachmentIds.clear()
            Pair(200, buildJsonObject { put("message", "Database reset") }.toString())
        }
    }

    fun testPromoteAdmin(username: String): Pair<Int, String> {
        if (!UnitTestWorld.testApiEnabled) {
            return Pair(404, buildJsonObject { put("message", "Not found") }.toString())
        }
        return runBlocking {
            val user =
                UnitTestWorld.userRepo.findByUsername(username)
                    ?: return@runBlocking Pair(
                        404,
                        buildJsonObject { put("message", "Not found: user") }.toString(),
                    )
            val promoted =
                UnitTestWorld.userRepo.promoteToAdmin(user.id)
                    ?: return@runBlocking Pair(
                        404,
                        buildJsonObject { put("message", "Not found: user") }.toString(),
                    )
            Pair(
                200,
                buildJsonObject {
                        put("id", promoted.id.toString())
                        put("username", promoted.username)
                        put("role", promoted.role.name)
                    }
                    .toString(),
            )
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private suspend fun requireAuthUserId(accessToken: String): UUID {
        val decoded =
            UnitTestWorld.jwtService.decodeToken(accessToken)
                ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))

        val jti = decoded.getClaim("jti").asString()
        if (UnitTestWorld.tokenRepo.isRevoked(jti)) {
            throw DomainException(DomainError.Unauthorized("Unauthorized"))
        }

        val userId =
            runCatching { UUID.fromString(decoded.subject) }.getOrElse {
                throw DomainException(DomainError.Unauthorized("Unauthorized"))
            }
        val user =
            UnitTestWorld.userRepo.findById(userId)
                ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
        if (user.status != UserStatus.ACTIVE) {
            throw DomainException(DomainError.Unauthorized("Unauthorized"))
        }
        return userId
    }

    private suspend fun requireAdminUser(accessToken: String): UUID {
        val decoded =
            UnitTestWorld.jwtService.decodeToken(accessToken)
                ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))

        val jti = decoded.getClaim("jti").asString()
        if (UnitTestWorld.tokenRepo.isRevoked(jti)) {
            throw DomainException(DomainError.Unauthorized("Unauthorized"))
        }

        val role = decoded.getClaim("role").asString()
        if (role != Role.ADMIN.name) {
            throw DomainException(DomainError.Forbidden("Admin access required"))
        }

        val userId =
            runCatching { UUID.fromString(decoded.subject) }.getOrElse {
                throw DomainException(DomainError.Unauthorized("Unauthorized"))
            }
        val user =
            UnitTestWorld.userRepo.findById(userId)
                ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
        if (user.status != UserStatus.ACTIVE) {
            throw DomainException(DomainError.Unauthorized("Unauthorized"))
        }
        return userId
    }

    private suspend fun requireActiveUser(subjectStr: String): UUID {
        val userId =
            runCatching { UUID.fromString(subjectStr) }.getOrElse {
                throw DomainException(DomainError.Unauthorized("Unauthorized"))
            }
        val user =
            UnitTestWorld.userRepo.findById(userId)
                ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
        if (user.status != UserStatus.ACTIVE) {
            throw DomainException(DomainError.Unauthorized("Unauthorized"))
        }
        return userId
    }

    private fun domainErrorResponse(e: Throwable): Pair<Int, String> {
        if (e is DomainException) {
            return when (val err = e.domainError) {
                is DomainError.ValidationError ->
                    Pair(
                        400,
                        buildJsonObject {
                                put("message", err.message)
                                put("field", err.field)
                            }
                            .toString(),
                    )
                is DomainError.NotFound ->
                    Pair(
                        404,
                        buildJsonObject { put("message", "Not found: ${err.entity}") }.toString(),
                    )
                is DomainError.Forbidden ->
                    Pair(403, buildJsonObject { put("message", err.message) }.toString())
                is DomainError.Conflict ->
                    Pair(409, buildJsonObject { put("message", err.message) }.toString())
                is DomainError.Unauthorized ->
                    Pair(401, buildJsonObject { put("message", err.message) }.toString())
                is DomainError.FileTooLarge ->
                    Pair(
                        413,
                        buildJsonObject {
                                put("message", "File size exceeds the maximum allowed limit")
                            }
                            .toString(),
                    )
                is DomainError.UnsupportedMediaType ->
                    Pair(
                        415,
                        buildJsonObject {
                                put("message", "Unsupported file type: ${err.contentType}")
                            }
                            .toString(),
                    )
            }
        }
        return Pair(
            500,
            buildJsonObject { put("message", e.message ?: "Internal error") }.toString(),
        )
    }

    // -------------------------------------------------------------------------
    // JSON serialisation helpers for domain objects
    // -------------------------------------------------------------------------

    private fun formatAmount(currency: String, amount: BigDecimal): String {
        val scale = if (currency.uppercase() == "IDR") 0 else 2
        return amount.setScale(scale, RoundingMode.HALF_UP).toPlainString()
    }

    private fun expenseToJson(
        expense: com.demobektkt.domain.Expense
    ): kotlinx.serialization.json.JsonObject = buildJsonObject {
        put("id", expense.id.toString())
        put("user_id", expense.userId.toString())
        put("type", expense.type.name.lowercase())
        put("amount", formatAmount(expense.currency, expense.amount))
        put("currency", expense.currency)
        put("category", expense.category)
        put("description", expense.description)
        put("date", expense.date.toString())
        expense.quantity?.let { put("quantity", it.toDouble()) }
        expense.unit?.let { put("unit", it) }
        put("created_at", expense.createdAt.toString())
        put("updated_at", expense.updatedAt.toString())
    }

    private fun attachmentToJson(
        attachment: com.demobektkt.domain.Attachment
    ): kotlinx.serialization.json.JsonObject = buildJsonObject {
        put("id", attachment.id.toString())
        put("expense_id", attachment.expenseId.toString())
        put("filename", attachment.filename)
        put("contentType", attachment.contentType)
        put("size_bytes", attachment.sizeBytes)
        put(
            "url",
            "/api/v1/expenses/${attachment.expenseId}/attachments/${attachment.id}",
        )
        put("created_at", attachment.createdAt.toString())
    }
}
