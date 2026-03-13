(ns demo-be-cjpd.interceptors.auth
  "Authentication interceptors for Pedestal.
   Identity schema: see domain.schemas/Identity."
  (:require [clojure.string :as str]
            [malli.core :as m]
            [demo-be-cjpd.auth.jwt :as jwt]
            [demo-be-cjpd.db.token-repo :as token-repo]
            [demo-be-cjpd.db.user-repo :as user-repo]
            [demo-be-cjpd.domain.schemas :as schemas]))

(defn- extract-bearer-token [request]
  (let [auth-header (get-in request [:headers "authorization"] "")]
    (when (str/starts-with? auth-header "Bearer ")
      (subs auth-header 7))))

(defn require-auth
  "Interceptor factory that validates JWT and attaches identity to request.
   The identity map conforms to schemas/Identity.
   Takes app config and datasource."
  [config ds]
  {:name  ::require-auth
   :enter (fn [ctx]
            (let [request (:request ctx)
                  token   (extract-bearer-token request)]
              (if-not token
                (assoc ctx :response
                       {:status  401
                        :headers {"Content-Type" "application/json"}
                        :body    "{\"error\":\"Missing or invalid authorization token\"}"})
                (let [claims (jwt/verify-token (:jwt-secret config) token)]
                  (if-not claims
                    (assoc ctx :response
                           {:status  401
                            :headers {"Content-Type" "application/json"}
                            :body    "{\"error\":\"Invalid or expired token\"}"})
                    (let [jti     (:jti claims)
                          user-id (:sub claims)
                          iat     (or (:iat claims) 0)]
                      (if (token-repo/revoked? ds jti)
                        (assoc ctx :response
                               {:status  401
                                :headers {"Content-Type" "application/json"}
                                :body    "{\"error\":\"Token has been revoked\"}"})
                        (if (token-repo/all-revoked-for-user? ds user-id iat)
                          (assoc ctx :response
                                 {:status  401
                                  :headers {"Content-Type" "application/json"}
                                  :body    "{\"error\":\"Token has been revoked\"}"})
                          (let [user (user-repo/find-by-id ds user-id)]
                            (if-not user
                              (assoc ctx :response
                                     {:status  401
                                      :headers {"Content-Type" "application/json"}
                                      :body    "{\"error\":\"User not found\"}"})
                              (if (not= "ACTIVE" (:status user))
                                (assoc ctx :response
                                       {:status  401
                                        :headers {"Content-Type" "application/json"}
                                        :body    "{\"error\":\"User account is not active\"}"})
                                (let [identity {:user-id  user-id
                                                :username (:username claims)
                                                :role     (:role claims)
                                                :jti      jti
                                                :iat      iat}]
                                  (assert (m/validate schemas/Identity identity)
                                          (str "Invalid identity: " (pr-str (m/explain schemas/Identity identity))))
                                  (assoc-in ctx [:request :identity] identity)))))))))))))})
