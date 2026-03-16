(ns demo-be-cjpd.handlers.admin
  "Admin handlers for user management."
  (:require [cheshire.core :as json]
            [clojure.string :as str]
            [demo-be-cjpd.auth.jwt :as jwt]
            [demo-be-cjpd.db.user-repo :as user-repo]
            [demo-be-cjpd.db.token-repo :as token-repo]))

(defn- kebab->camel [s]
  (let [parts (str/split s #"-")]
    (str (first parts)
         (apply str (map str/capitalize (rest parts))))))

(defn- json-response [status body]
  {:status  status
   :headers {"Content-Type" "application/json"}
   :body    (json/generate-string body {:key-fn #(kebab->camel (name %))})})

(defn- error-response [status message]
  {:status  status
   :headers {"Content-Type" "application/json"}
   :body    (json/generate-string {:message message})})

(defn- user->public [user]
  (dissoc user :password-hash :failed-login-attempts))

(defn list-users-handler
  "GET /api/v1/admin/users — List all users with pagination and optional search."
  [ds]
  (fn [request]
    (let [params  (:query-params request)
          search  (or (:search params) (:email params)
                      (get params "search") (get params "email"))
          page    (Integer/parseInt (or (some-> params :page str) (get params "page") "1"))
          size    (Integer/parseInt (or (some-> params :size str) (get params "size") "20"))
          result  (user-repo/list-users ds {:search search :page page :size size})]
      (json-response 200 {:content       (mapv user->public (:data result))
                          :total-elements (:total result)
                          :page           (:page result)
                          :size           (:size result)}))))

(defn disable-user-handler
  "POST /api/v1/admin/users/:id/disable — Disable a user account."
  [ds]
  (fn [request]
    (let [user-id (get-in request [:path-params :id])
          user    (user-repo/find-by-id ds user-id)]
      (if-not user
        (error-response 404 "User not found")
        (let [updated (user-repo/update-status! ds user-id "DISABLED")]
          (token-repo/revoke-all-for-user! ds user-id)
          (json-response 200 (user->public updated)))))))

(defn enable-user-handler
  "POST /api/v1/admin/users/:id/enable — Enable a disabled user account."
  [ds]
  (fn [request]
    (let [user-id (get-in request [:path-params :id])
          user    (user-repo/find-by-id ds user-id)]
      (if-not user
        (error-response 404 "User not found")
        (let [updated (user-repo/update-status! ds user-id "ACTIVE")]
          (json-response 200 (user->public updated)))))))

(defn unlock-user-handler
  "POST /api/v1/admin/users/:id/unlock — Unlock a locked user account."
  [ds]
  (fn [request]
    (let [user-id (get-in request [:path-params :id])
          user    (user-repo/find-by-id ds user-id)]
      (if-not user
        (error-response 404 "User not found")
        (do
          (user-repo/update-status! ds user-id "ACTIVE")
          (user-repo/reset-failed-attempts! ds user-id)
          (let [updated (user-repo/find-by-id ds user-id)]
            (json-response 200 (user->public updated))))))))

(defn force-password-reset-handler
  "POST /api/v1/admin/users/:id/force-password-reset — Generate reset token."
  [config ds]
  (fn [request]
    (let [user-id (get-in request [:path-params :id])
          user    (user-repo/find-by-id ds user-id)]
      (if-not user
        (error-response 404 "User not found")
        (let [reset-token (jwt/sign-access-token (:jwt-secret config)
                                                  user-id
                                                  (:username user)
                                                  "RESET")]
          (json-response 200 {:token   reset-token
                              :user-id user-id}))))))
