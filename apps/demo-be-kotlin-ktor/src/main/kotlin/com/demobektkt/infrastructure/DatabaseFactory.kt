package com.demobektkt.infrastructure

import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database

object DatabaseFactory {
  fun init(jdbcUrl: String, user: String, password: String) {
    Flyway.configure().dataSource(jdbcUrl, user, password).load().migrate()
    Database.connect(url = jdbcUrl, user = user, password = password)
  }
}
