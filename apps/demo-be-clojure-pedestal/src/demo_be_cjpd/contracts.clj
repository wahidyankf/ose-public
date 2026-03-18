(ns demo-be-cjpd.contracts
  "Contract validation against generated OpenAPI Malli schemas."
  (:require [malli.core :as m]
            [openapi-codegen.schemas.auth-tokens :as s-auth-tokens]
            [openapi-codegen.schemas.health-response :as s-health]
            [openapi-codegen.schemas.user :as s-user]
            [openapi-codegen.schemas.user-list-response :as s-user-list]
            [openapi-codegen.schemas.expense :as s-expense]
            [openapi-codegen.schemas.expense-list-response :as s-expense-list]
            [openapi-codegen.schemas.attachment :as s-attachment]
            [openapi-codegen.schemas.pl-report :as s-pl-report]
            [openapi-codegen.schemas.token-claims :as s-token-claims]
            [openapi-codegen.schemas.jwks-response :as s-jwks]
            [openapi-codegen.schemas.password-reset-response :as s-pw-reset]))

(def schemas
  "Registry of schema name -> Malli schema form."
  {:auth-tokens     s-auth-tokens/schema
   :health-response s-health/schema
   :user            s-user/schema
   :user-list       s-user-list/schema
   :expense         s-expense/schema
   :expense-list    s-expense-list/schema
   :attachment      s-attachment/schema
   :pl-report       s-pl-report/schema
   :token-claims    s-token-claims/schema
   :jwks-response   s-jwks/schema
   :password-reset  s-pw-reset/schema})

(defn valid?
  "Check if data validates against the named contract schema."
  [schema-key data]
  (when-let [s (get schemas schema-key)]
    (m/validate s data)))
