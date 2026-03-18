package com.demobektkt.routes

import com.demobektkt.domain.DomainError
import com.demobektkt.domain.DomainException
import com.demobektkt.domain.validateContentType
import com.demobektkt.domain.validateFileSize
import com.demobektkt.infrastructure.repositories.AttachmentRepository
import com.demobektkt.infrastructure.repositories.CreateAttachmentRequest
import com.demobektkt.infrastructure.repositories.ExpenseRepository
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.PartData
import io.ktor.http.content.forEachPart
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.request.receiveMultipart
import io.ktor.server.response.respond
import io.ktor.server.routing.RoutingCall
import io.ktor.utils.io.readRemaining
import java.util.UUID
import kotlin.io.encoding.ExperimentalEncodingApi
import kotlinx.io.readByteArray
import kotlinx.serialization.Serializable
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

@Serializable data class AttachmentListResponse(val attachments: List<AttachmentWithUrl>)

object AttachmentRoutes : KoinComponent {
  private val attachmentRepository: AttachmentRepository by inject()
  private val expenseRepository: ExpenseRepository by inject()

  private fun requireUserId(call: RoutingCall): UUID {
    val principal =
      call.principal<JWTPrincipal>()
        ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
    return UUID.fromString(principal.payload.subject)
  }

  @OptIn(ExperimentalEncodingApi::class)
  suspend fun upload(call: RoutingCall) {
    val userId = requireUserId(call)
    val expenseId =
      call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        ?: throw DomainException(DomainError.NotFound("expense"))

    val expense =
      expenseRepository.findById(expenseId)
        ?: throw DomainException(DomainError.NotFound("expense"))

    if (expense.userId != userId) {
      throw DomainException(DomainError.Forbidden("Access denied"))
    }

    val multipart = call.receiveMultipart(formFieldLimit = 20 * 1024 * 1024)
    var filename: String? = null
    var contentType: String? = null
    var fileBytes: ByteArray? = null

    multipart.forEachPart { part ->
      when (part) {
        is PartData.FileItem -> {
          filename = part.originalFileName ?: "upload"
          contentType = part.contentType?.toString() ?: "application/octet-stream"
          val bytes = part.provider().readRemaining().readByteArray()
          fileBytes = bytes
        }
        else -> {}
      }
      part.dispose()
    }

    val actualFilename =
      filename ?: throw DomainException(DomainError.ValidationError("file", "No file uploaded"))
    val actualContentType = contentType ?: "application/octet-stream"
    val actualBytes =
      fileBytes ?: throw DomainException(DomainError.ValidationError("file", "No file data"))

    validateContentType(actualContentType).getOrThrow()
    validateFileSize(actualBytes.size.toLong()).getOrThrow()

    val storedPath = "memory://${UUID.randomUUID()}/$actualFilename"

    val attachment =
      attachmentRepository.create(
        CreateAttachmentRequest(
          expenseId = expenseId,
          userId = userId,
          filename = actualFilename,
          contentType = actualContentType.split(";").first().trim(),
          sizeBytes = actualBytes.size.toLong(),
          storedPath = storedPath,
        )
      )

    call.respond(HttpStatusCode.Created, attachment.toAttachmentWithUrl(expenseId))
  }

  suspend fun list(call: RoutingCall) {
    val userId = requireUserId(call)
    val expenseId =
      call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        ?: throw DomainException(DomainError.NotFound("expense"))

    val expense =
      expenseRepository.findById(expenseId)
        ?: throw DomainException(DomainError.NotFound("expense"))

    if (expense.userId != userId) {
      throw DomainException(DomainError.Forbidden("Access denied"))
    }

    val attachments = attachmentRepository.findAllByExpense(expenseId)
    val response = AttachmentListResponse(attachments.map { it.toAttachmentWithUrl(expenseId) })
    call.respond(response)
  }

  suspend fun delete(call: RoutingCall) {
    val userId = requireUserId(call)
    val expenseId =
      call.parameters["id"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        ?: throw DomainException(DomainError.NotFound("expense"))

    val attachmentId =
      call.parameters["aid"]?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        ?: throw DomainException(DomainError.NotFound("attachment"))

    val expense =
      expenseRepository.findById(expenseId)
        ?: throw DomainException(DomainError.NotFound("expense"))

    if (expense.userId != userId) {
      throw DomainException(DomainError.Forbidden("Access denied"))
    }

    attachmentRepository.findById(attachmentId)
      ?: throw DomainException(DomainError.NotFound("attachment"))

    attachmentRepository.delete(attachmentId)
    call.respond(HttpStatusCode.NoContent)
  }
}
