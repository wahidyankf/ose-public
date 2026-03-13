(ns demo-be-cjpd.config
  "Load and validate configuration from environment variables."
  (:require [malli.core :as m]
            [demo-be-cjpd.domain.schemas :as schemas]))

(defn load-config
  "Return application configuration from environment variables.
   Validates the result against schemas/Config."
  []
  (let [config {:port         (Integer/parseInt (or (System/getenv "PORT") "8201"))
                :database-url (or (System/getenv "DATABASE_URL") "jdbc:sqlite::memory:")
                :jwt-secret   (or (System/getenv "APP_JWT_SECRET") "default-dev-secret-change-in-production")}]
    (assert (m/validate schemas/Config config)
            (str "Invalid configuration: " (pr-str (m/explain schemas/Config config))))
    config))
