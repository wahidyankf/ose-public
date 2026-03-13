(ns demo-be-cjpd.handlers.auth
  "Authentication handlers: register, login, refresh, logout, logout-all.
   Request/response schemas: see domain.schemas (RegisterRequest, LoginRequest,
   RefreshRequest, TokenResponse)."
  (:require [cheshire.core :as json]
            [clojure.string :as str]
            [demo-be-cjpd.auth.jwt :as jwt]
            [demo-be-cjpd.auth.password :as password]
            [demo-be-cjpd.db.token-repo :as token-repo]
            [demo-be-cjpd.db.user-repo :as user-repo]
            [demo-be-cjpd.domain.user :as user-domain]))

(defn- json-response [status body]
  {:status  status
   :headers {"Content-Type" "application/json"}
   :body    (json/generate-string body {:key-fn #(str/replace (name %) #"-" "_")})})

(defn- error-response [status message]
  {:status  status
   :headers {"Content-Type" "application/json"}
   :body    (json/generate-string {:message message})})

(defn- user->public [user]
  (dissoc user :password-hash :failed-login-attempts))

(defn register-handler
  "POST /api/v1/auth/register — Register a new user."
  [_config ds]
  (fn [request]
    (let [params   (:json-params request)
          username (:username params)
          email    (:email params)
          password (:password params)]
      (cond
        (not (user-domain/valid-username? username))
        (error-response 400 "Invalid username format")

        (not (user-domain/valid-email? email))
        {:status  400
         :headers {"Content-Type" "application/json"}
         :body    (json/generate-string {:message "Invalid email format" :field "email"})}

        :else
        (let [pw-error (user-domain/validate-password-strength password)]
          (if pw-error
            {:status  400
             :headers {"Content-Type" "application/json"}
             :body    (json/generate-string {:message (:message pw-error) :field "password"})}
            (do
              (when (user-repo/find-by-username ds username)
                (throw (ex-info "Username already exists"
                                {:status 409
                                 :message "Username already exists"})))
              (when (user-repo/find-by-email ds email)
                (throw (ex-info "Email already exists"
                                {:status 409
                                 :message "Email already registered"})))
              (let [count  (user-repo/count-users ds)
                    role   (if (zero? count) "ADMIN" "USER")
                    hash   (password/hash-password password)
                    user   (user-repo/create-user! ds
                                                   {:username      username
                                                    :email         email
                                                    :password-hash hash
                                                    :display-name  username
                                                    :role          role
                                                    :status        "ACTIVE"})]
                (json-response 201 (user->public user))))))))))

(defn login-handler
  "POST /api/v1/auth/login — Authenticate a user and return tokens."
  [config ds]
  (fn [request]
    (let [params   (:json-params request)
          username (:username params)
          pw       (:password params)
          user     (user-repo/find-by-username ds username)]
      (cond
        (nil? user)
        (error-response 401 "Invalid credentials")

        (= "INACTIVE" (:status user))
        (error-response 401 "User account is deactivated")

        (= "DISABLED" (:status user))
        (error-response 403 "User account is disabled")

        (= "LOCKED" (:status user))
        (error-response 401 "Account is locked due to too many failed login attempts")

        (not (password/verify-password pw (:password-hash user)))
        (let [updated (user-repo/increment-failed-attempts! ds (:id user))]
          (if (= "LOCKED" (:status updated))
            (error-response 401 "Account is locked due to too many failed login attempts")
            (error-response 401 "Invalid credentials")))

        :else
        (do
          (user-repo/reset-failed-attempts! ds (:id user))
          (let [access-token  (jwt/sign-access-token (:jwt-secret config)
                                                     (:id user)
                                                     (:username user)
                                                     (:role user))
                refresh-token (jwt/sign-refresh-token (:jwt-secret config) (:id user))]
            (json-response 200 {:access_token  access-token
                                :refresh_token refresh-token
                                :token_type    "Bearer"
                                :user          (user->public user)})))))))

(defn refresh-handler
  "POST /api/v1/auth/refresh — Refresh tokens using a refresh token."
  [config ds]
  (fn [request]
    (let [params        (:json-params request)
          refresh-token (or (:refresh_token params) (:refresh-token params))
          claims        (jwt/verify-token (:jwt-secret config) refresh-token)]
      (if-not claims
        (error-response 401 "Token has expired or is invalid")
        (let [jti     (:jti claims)
              user-id (:sub claims)
              type    (:type claims)]
          (if (not= "refresh" type)
            (error-response 401 "Invalid token type")
            (if (token-repo/revoked? ds jti)
              (error-response 401 "Token is invalid or already used")
              (let [user (user-repo/find-by-id ds user-id)]
                (if-not user
                  (error-response 401 "User not found")
                  (cond
                    (= "INACTIVE" (:status user))
                    (error-response 401 "User account is deactivated")

                    (= "DISABLED" (:status user))
                    (error-response 401 "User account is disabled")

                    (= "LOCKED" (:status user))
                    (error-response 401 "Account is locked")

                    :else
                    (do
                      (token-repo/revoke-token! ds jti user-id)
                      (let [new-access  (jwt/sign-access-token (:jwt-secret config)
                                                               user-id
                                                               (:username user)
                                                               (:role user))
                            new-refresh (jwt/sign-refresh-token (:jwt-secret config) user-id)]
                        (json-response 200 {:access_token  new-access
                                            :refresh_token new-refresh
                                            :token_type    "Bearer"})))))))))))))

(defn logout-handler
  "POST /api/v1/auth/logout — Revoke the provided access token."
  [config ds]
  (fn [request]
    (let [params     (:json-params request)
          auth-token (or (some-> (get-in request [:headers "authorization"])
                                 (str/replace #"^Bearer " ""))
                         (:access_token params))
          claims     (when auth-token (jwt/verify-token (:jwt-secret config) auth-token))]
      (when claims
        (token-repo/revoke-token! ds (:jti claims) (:sub claims)))
      {:status  200
       :headers {"Content-Type" "application/json"}
       :body    "{\"message\":\"Logged out successfully\"}"})))

(defn logout-all-handler
  "POST /api/v1/auth/logout-all — Revoke all tokens for the authenticated user."
  [_config ds]
  (fn [request]
    (let [identity (:identity request)
          user-id  (:user-id identity)
          jti      (:jti identity)]
      (token-repo/revoke-all-for-user! ds user-id)
      (token-repo/revoke-token! ds jti user-id)
      {:status  200
       :headers {"Content-Type" "application/json"}
       :body    "{\"message\":\"Logged out from all devices\"}"})))
