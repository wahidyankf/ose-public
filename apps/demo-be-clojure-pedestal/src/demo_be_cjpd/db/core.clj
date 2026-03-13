(ns demo-be-cjpd.db.core
  "Database connection pool management."
  (:require [next.jdbc :as jdbc])
  (:import (com.zaxxer.hikari HikariConfig HikariDataSource)))

(defn create-datasource
  "Create a HikariCP connection pool from a JDBC URL."
  [database-url]
  (let [config (HikariConfig.)]
    (.setJdbcUrl config database-url)
    (when (.startsWith database-url "jdbc:postgresql")
      (.setUsername config (or (System/getenv "DB_USER") "demo_be_cjpd"))
      (.setPassword config (or (System/getenv "DB_PASSWORD") "demo_be_cjpd")))
    (.setMaximumPoolSize config 2)
    (.setMinimumIdle config 1)
    (.setConnectionTimeout config 30000)
    (.setIdleTimeout config 600000)
    (.setMaxLifetime config 1800000)
    (HikariDataSource. config)))

(defn get-connection
  "Get a connection from the datasource."
  [ds]
  (jdbc/get-connection ds))

(defn sqlite?
  "Return true if the database URL is for SQLite."
  [database-url]
  (.startsWith database-url "jdbc:sqlite"))
