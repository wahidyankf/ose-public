package com.demobektkt.plugins

import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import java.math.BigDecimal
import kotlinx.datetime.LocalDate
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual

/** Serializer for [java.math.BigDecimal] as a plain string. */
object BigDecimalSerializer : KSerializer<BigDecimal> {
  override val descriptor: SerialDescriptor =
    PrimitiveSerialDescriptor("BigDecimal", PrimitiveKind.DOUBLE)

  override fun serialize(encoder: Encoder, value: BigDecimal) {
    encoder.encodeDouble(value.stripTrailingZeros().toDouble())
  }

  override fun deserialize(decoder: Decoder): BigDecimal =
    BigDecimal(decoder.decodeDouble().toString())
}

/** Serializer for [kotlin.time.Instant] (kotlinx-datetime) as ISO-8601. */
object KotlinInstantSerializer : KSerializer<kotlin.time.Instant> {
  override val descriptor: SerialDescriptor =
    PrimitiveSerialDescriptor("kotlin.time.Instant", PrimitiveKind.STRING)

  override fun serialize(encoder: Encoder, value: kotlin.time.Instant) {
    encoder.encodeString(value.toString())
  }

  override fun deserialize(decoder: Decoder): kotlin.time.Instant =
    kotlin.time.Instant.parse(decoder.decodeString())
}

val contractSerializersModule = SerializersModule {
  contextual(BigDecimalSerializer)
  contextual(KotlinInstantSerializer)
  contextual(LocalDate.serializer())
}

fun Application.configureSerialization() {
  install(ContentNegotiation) {
    json(
      Json {
        prettyPrint = false
        isLenient = true
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = false
        serializersModule = contractSerializersModule
      }
    )
  }
}
