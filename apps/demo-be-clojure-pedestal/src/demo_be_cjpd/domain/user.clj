(ns demo-be-cjpd.domain.user
  "User domain model, validation, and business rules.
   Status/role enums defined in domain.schemas (UserStatus, UserRole)."
  (:require [clojure.string :as str]
            [malli.core :as m]
            [demo-be-cjpd.domain.schemas :as schemas]))

(def max-failed-attempts 5)

(def Email
  "Schema: valid email address."
  [:re #"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"])

(def Username
  "Schema: 3-50 chars of letters, numbers, underscores, hyphens."
  [:re #"^[a-zA-Z0-9_\-]{3,50}$"])

(def password-rules
  "Ordered password validation rules with paired error messages."
  [[[:fn {:description "at least 12 characters"} #(>= (count %) 12)]
    "password must be at least 12 characters"]
   [[:fn {:description "has uppercase"} #(boolean (re-find #"[A-Z]" %))]
    "password must contain at least one uppercase letter"]
   [[:fn {:description "has lowercase"} #(boolean (re-find #"[a-z]" %))]
    "password must contain at least one lowercase letter"]
   [[:fn {:description "has digit"} #(boolean (re-find #"[0-9]" %))]
    "password must contain at least one digit"]
   [[:fn {:description "has special char"} #(boolean (re-find #"[^a-zA-Z0-9]" %))]
    "password must contain at least one special character"]])

(defn valid-email?
  "Return true if the email address is valid."
  [email]
  (boolean (m/validate Email (or email ""))))

(defn valid-username?
  "Return true if the username is 3-50 chars of letters, numbers, underscores, hyphens."
  [username]
  (boolean (m/validate Username (or username ""))))

(defn valid-status?
  "Return true if the status string is a valid UserStatus."
  [status]
  (m/validate schemas/UserStatus status))

(defn valid-role?
  "Return true if the role string is a valid UserRole."
  [role]
  (m/validate schemas/UserRole role))

(defn validate-password-strength
  "Validate password complexity rules. Returns nil on success or error map on failure."
  [password]
  (if (or (nil? password) (str/blank? password))
    {:field "password" :message "password is required"}
    (some (fn [[schema message]]
            (when-not (m/validate schema password)
              {:field "password" :message message}))
          password-rules)))

(defn should-lock?
  "Return true if the failed attempt count exceeds the threshold."
  [failed-attempts]
  (>= failed-attempts max-failed-attempts))
