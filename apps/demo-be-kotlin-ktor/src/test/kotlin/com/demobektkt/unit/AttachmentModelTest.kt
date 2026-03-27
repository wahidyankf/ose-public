package com.demobektkt.unit

import com.demobektkt.domain.Attachment
import com.demobektkt.infrastructure.repositories.CreateAttachmentRequest
import java.time.Instant
import java.util.UUID
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for Attachment and CreateAttachmentRequest equals/hashCode implementations. These are
 * required because ByteArray fields need custom comparison via contentEquals/contentHashCode.
 */
class AttachmentModelTest {

  private val expenseId = UUID.randomUUID()
  private val id = UUID.randomUUID()
  private val now = Instant.now()
  private val data = byteArrayOf(1, 2, 3)

  @Test
  fun `Attachment equals same instance`() {
    val a = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, data, now)
    assertTrue(a == a)
  }

  @Test
  fun `Attachment equals equal instances`() {
    val a = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, data, now)
    val b = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, byteArrayOf(1, 2, 3), now)
    assertEquals(a, b)
  }

  @Test
  fun `Attachment not equals different data`() {
    val a = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, data, now)
    val b = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, byteArrayOf(4, 5, 6), now)
    assertNotEquals(a, b)
  }

  @Test
  fun `Attachment not equals null`() {
    val a = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, data, now)
    assertNotEquals(a, null)
  }

  @Test
  fun `Attachment not equals different type`() {
    val a = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, data, now)
    assertNotEquals(a, "string")
  }

  @Test
  fun `Attachment hashCode is consistent`() {
    val a = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, data, now)
    val b = Attachment(id, expenseId, "file.jpg", "image/jpeg", 3L, byteArrayOf(1, 2, 3), now)
    assertEquals(a.hashCode(), b.hashCode())
  }

  @Test
  fun `CreateAttachmentRequest equals same instance`() {
    val req = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, data)
    assertTrue(req == req)
  }

  @Test
  fun `CreateAttachmentRequest equals equal instances`() {
    val a = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, data)
    val b = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, byteArrayOf(1, 2, 3))
    assertEquals(a, b)
  }

  @Test
  fun `CreateAttachmentRequest not equals different data`() {
    val a = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, data)
    val b = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, byteArrayOf(9, 9, 9))
    assertNotEquals(a, b)
  }

  @Test
  fun `CreateAttachmentRequest not equals null`() {
    val req = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, data)
    assertNotEquals(req, null)
  }

  @Test
  fun `CreateAttachmentRequest not equals different type`() {
    val req = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, data)
    assertNotEquals(req, "string")
  }

  @Test
  fun `CreateAttachmentRequest hashCode is consistent`() {
    val a = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, data)
    val b = CreateAttachmentRequest(expenseId, "file.jpg", "image/jpeg", 3L, byteArrayOf(1, 2, 3))
    assertEquals(a.hashCode(), b.hashCode())
  }
}
