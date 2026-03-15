package com.demobektkt.routes

import com.demobektkt.domain.DomainError
import com.demobektkt.domain.DomainException
import com.demobektkt.domain.EntryType
import com.demobektkt.infrastructure.repositories.ExpenseRepository
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.RoutingCall
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.UUID
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

object ReportRoutes : KoinComponent {
  private val expenseRepository: ExpenseRepository by inject()

  private fun requireParam(params: io.ktor.http.Parameters, name: String): String =
    params[name]
      ?: throw DomainException(DomainError.ValidationError(name, "$name parameter is required"))

  private fun parseDate(value: String, param: String): LocalDate =
    runCatching { LocalDate.parse(value) }.getOrNull()
      ?: throw DomainException(
        DomainError.ValidationError(param, "Invalid date format: $value")
      )

  private fun buildBreakdown(
    entries: List<com.demobektkt.domain.Expense>,
    scale: Int,
    type: String,
  ) = buildJsonArray {
    entries
      .groupBy { it.category }
      .forEach { (cat, list) ->
        val total =
          list
            .fold(BigDecimal.ZERO) { acc, e -> acc + e.amount }
            .setScale(scale, RoundingMode.HALF_UP)
            .toPlainString()
        add(buildJsonObject {
          put("category", cat)
          put("type", type)
          put("total", total)
        })
      }
  }

  suspend fun pl(call: RoutingCall) {
    val principal =
      call.principal<JWTPrincipal>()
        ?: throw DomainException(DomainError.Unauthorized("Unauthorized"))
    val userId = UUID.fromString(principal.payload.subject)
    val params = call.request.queryParameters

    val fromStr = requireParam(params, "startDate")
    val toStr = requireParam(params, "endDate")
    val currency = requireParam(params, "currency")
    val from = parseDate(fromStr, "startDate")
    val to = parseDate(toStr, "endDate")

    val entries = expenseRepository.findByUserAndPeriod(userId, from, to, currency)
    val incomeEntries = entries.filter { it.type == EntryType.INCOME }
    val expenseEntries = entries.filter { it.type == EntryType.EXPENSE }
    val scale = if (currency == "IDR") 0 else 2

    val incomeTotal =
      incomeEntries.fold(BigDecimal.ZERO) { acc, e -> acc + e.amount }
        .setScale(scale, RoundingMode.HALF_UP)
    val expenseTotal =
      expenseEntries.fold(BigDecimal.ZERO) { acc, e -> acc + e.amount }
        .setScale(scale, RoundingMode.HALF_UP)
    val net = (incomeTotal - expenseTotal).setScale(scale, RoundingMode.HALF_UP)

    call.respond(buildJsonObject {
      put("currency", currency)
      put("totalIncome", incomeTotal.toPlainString())
      put("totalExpense", expenseTotal.toPlainString())
      put("net", net.toPlainString())
      put("incomeBreakdown", buildBreakdown(incomeEntries, scale, "income"))
      put("expenseBreakdown", buildBreakdown(expenseEntries, scale, "expense"))
    })
  }
}
