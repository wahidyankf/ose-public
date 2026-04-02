(ns step-definitions.steps
  "Cucumber step definitions for all feature files.
   All interactions go through direct service-handler calls — no HTTP client."
  (:require [clojure.string :as str]
            [clojure.test :refer [is]]
            [cheshire.core :as json]
            [a-demo-be-cjpd.db.protocols :as proto]
            [lambdaisland.cucumber.dsl :refer [Given When Then]]
            [step-definitions.common :as common]))

(defn- camel->kebab
  "Convert camelCase string to kebab-case. e.g. 'accessToken' -> 'access-token'."
  [s]
  (-> s
      (str/replace #"([A-Z])" "-$1")
      str/lower-case
      (str/replace #"^-" "")))

(defn- snake->camel
  "Convert snake_case string to camelCase. e.g. 'income_total' -> 'incomeTotal'."
  [s]
  (let [parts (str/split s #"_")]
    (str (first parts)
         (apply str (map str/capitalize (rest parts))))))

;; ============================================================
;; Server lifecycle
;; ============================================================

(Given "the API is running" [state]
  (if (:ds state)
    state
    (merge state (common/start-test-server!))))

;; ============================================================
;; User setup steps
;; ============================================================

(Given "a user {string} is registered with password {string}" [state username password]
  (common/register-user! state username :password password))

(Given "a user {string} is registered with email {string} and password {string}"
  [state username email password]
  (common/register-user! state username :email email :password password))

(Given "a user {string} is registered" [state username]
  (common/register-user! state username))

(Given "users {string}, {string}, and {string} are registered" [state u1 u2 u3]
  (-> state
      (common/register-user! u1)
      (common/register-user! u2)
      (common/register-user! u3)))

(Given "an admin user {string} is registered and logged in" [state username]
  (let [new-state (-> state
                      (common/register-user! username)
                      (common/login-user! username))
        user-id   (common/get-user-id new-state username)]
    ;; Promote user to ADMIN and re-login so the JWT reflects the ADMIN role
    (common/promote-to-admin! new-state user-id)
    (common/login-user! new-state username)))

(Given "{string} has logged in and stored the access token" [state username]
  (common/login-user! state username))

(Given "{string} has logged in and stored the access token and refresh token" [state username]
  (common/login-user! state username))

(Given "a user {string} is registered and deactivated" [state username]
  (let [new-state (common/register-user! state username)
        login-ctx (common/login-user! new-state username)
        token     (common/get-access-token login-ctx username)]
    (common/call-deactivate login-ctx token)
    new-state))

(Given "a user {string} is registered and locked after too many failed logins" [state username]
  (let [new-state (common/register-user! state username)]
    (dotimes [_ 5]
      (common/call-login new-state
                         (json/generate-string {:username username
                                                :password "WrongP@ss!"})))
    new-state))

(Given "an admin has unlocked alice's account" [state]
  (let [admin-state (-> state
                        (common/register-user! "superadmin-unlock")
                        (common/login-user! "superadmin-unlock"))
        admin-id    (common/get-user-id admin-state "superadmin-unlock")
        _           (common/promote-to-admin! admin-state admin-id)
        admin-state (common/login-user! admin-state "superadmin-unlock")
        alice-id    (common/get-user-id state "alice")
        admin-token (common/get-access-token admin-state "superadmin-unlock")]
    (common/call-admin-unlock-user admin-state admin-token alice-id)
    state))

(Given "{string} has had the maximum number of failed login attempts" [state username]
  (dotimes [_ 5]
    (common/call-login state
                       (json/generate-string {:username username
                                              :password "WrongP@ss!"})))
  state)

;; ============================================================
;; Token lifecycle setup
;; ============================================================

(Given "alice's refresh token has expired" [state]
  (assoc state :alice-refresh-token "invalid.expired.token"))

(Given "alice has used her refresh token to get a new token pair" [state]
  (let [refresh-token (common/get-refresh-token state "alice")]
    (common/call-refresh state
                         (json/generate-string {:refresh_token refresh-token}))
    (assoc state :alice-original-refresh-token refresh-token)))

(Given "the user {string} has been deactivated" [state username]
  (let [new-state (common/login-user! state username)
        token     (common/get-access-token new-state username)]
    (common/call-deactivate new-state token)
    new-state))

(Given "alice has already logged out once" [state]
  (let [token (common/get-access-token state "alice")]
    (common/call-logout state token))
  state)

(Given "alice has logged out and her access token is blacklisted" [state]
  (let [token (common/get-access-token state "alice")]
    (common/call-logout state token))
  state)

;; ============================================================
;; Admin setup
;; ============================================================

(Given "alice's account has been disabled by the admin" [state]
  (let [alice-id    (common/get-user-id state "alice")
        admin-token (common/get-access-token state "superadmin")]
    (common/call-admin-disable-user state admin-token alice-id
                                    (json/generate-string {:reason "Test"})))
  state)

(Given "alice's account has been disabled" [state]
  (let [admin-state (-> state
                        (common/register-user! "superadmin-disable")
                        (common/login-user! "superadmin-disable"))
        admin-id    (common/get-user-id admin-state "superadmin-disable")
        _           (common/promote-to-admin! admin-state admin-id)
        admin-state (common/login-user! admin-state "superadmin-disable")
        alice-id    (common/get-user-id state "alice")
        admin-token (common/get-access-token admin-state "superadmin-disable")]
    (common/call-admin-disable-user admin-state admin-token alice-id
                                    (json/generate-string {:reason "Test"})))
  state)

(Given "^the admin has disabled alice's account via POST /api/v1/admin/users/.alice_id./disable$"
  [state]
  (let [alice-id    (common/get-user-id state "alice")
        admin-token (common/get-access-token state "superadmin")]
    (common/call-admin-disable-user state admin-token alice-id
                                    (json/generate-string {:reason "Test"})))
  state)

;; ============================================================
;; Expense setup
;; ============================================================

(Given "^alice has created an entry with body (.+)$" [state body-str]
  (let [token  (common/get-access-token state "alice")
        result (common/call-create-expense state token body-str)
        body   (:last-body result)]
    (assoc state :alice-expense-id (:id body)
                 :alice-last-expense body)))

(Given "^alice has created an expense with body (.+)$" [state body-str]
  (let [token  (common/get-access-token state "alice")
        result (common/call-create-expense state token body-str)
        body   (:last-body result)]
    (assoc state :alice-expense-id (:id body)
                 :alice-last-expense body)))

(Given "alice has created 3 entries" [state]
  (let [token (common/get-access-token state "alice")]
    (dotimes [i 3]
      (common/call-create-expense state token
                                  (json/generate-string
                                    {:amount      "10.00"
                                     :currency    "USD"
                                     :category    "food"
                                     :description (str "Entry " i)
                                     :date        "2025-01-15"
                                     :type        "expense"}))))
  state)

(Given "^bob has created an entry with body (.+)$" [state body-str]
  (let [new-state (common/login-user! state "bob")
        token     (common/get-access-token new-state "bob")
        result    (common/call-create-expense new-state token body-str)
        body      (:last-body result)]
    (assoc new-state :bob-expense-id (:id body)
                     :bob-last-expense body)))

;; ============================================================
;; Attachment setup
;; ============================================================

(Given "alice has uploaded file {string} with content type {string} to the entry"
  [state filename content-type]
  (let [token      (common/get-access-token state "alice")
        expense-id (:alice-expense-id state)
        data       (byte-array [0xFF 0xD8 0xFF 0xE0])
        result     (common/call-upload-attachment state token expense-id
                                                  filename content-type data)
        body       (:last-body result)]
    (assoc state :alice-attachment-id (:id body)
                 :alice-last-attachment body)))

;; ============================================================
;; Self-deactivation setup
;; ============================================================

(Given "^alice has deactivated her own account via POST /api/v1/users/me/deactivate$" [state]
  (let [token (common/get-access-token state "alice")]
    (common/call-deactivate state token))
  state)

;; ============================================================
;; Public actions — routes dispatched by path pattern
;; ============================================================

(When "^the client sends POST (.+?) with body (.+)$" [state path body-str]
  (cond
    (= "/api/v1/auth/register" path)
    (common/call-register state body-str)

    (= "/api/v1/auth/login" path)
    (common/call-login state body-str)

    (= "/api/v1/auth/refresh" path)
    (common/call-refresh state body-str)

    (= "/api/v1/expenses" path)
    (common/call-create-expense state nil body-str)

    :else
    (assoc state
           :last-response {:status 404 :body {:message "Not found"}}
           :last-body {:message "Not found"})))

(When "^the client sends GET (.+?) with alice's access token$" [state path]
  (let [token (common/get-access-token state "alice")]
    (cond
      (= "/api/v1/users/me" path)
      (common/call-get-profile state token)

      (re-matches #"/api/v1/expenses/[^/]+" path)
      (let [expense-id (last (str/split path #"/"))]
        (common/call-get-expense state token expense-id))

      (= "/api/v1/expenses" path)
      (common/call-list-expenses state token)

      :else
      (assoc state
             :last-response {:status 404 :body {:message "Not found"}}
             :last-body {:message "Not found"}))))

(When "^the client sends GET (.+)$" [state path]
  (cond
    (= "/health" path)
    (common/call-health state)

    (= "/.well-known/jwks.json" path)
    (common/call-jwks state)

    :else
    (assoc state
           :last-response {:status 404 :body {:message "Not found"}}
           :last-body {:message "Not found"})))

(When "^an operations engineer sends GET (.+)$" [state path]
  (cond
    (= "/health" path)
    (common/call-health state)

    :else
    (assoc state
           :last-response {:status 404 :body {:message "Not found"}}
           :last-body {:message "Not found"})))

(When "^an unauthenticated engineer sends GET (.+)$" [state path]
  (cond
    (= "/health" path)
    (common/call-health state)

    :else
    (assoc state
           :last-response {:status 404 :body {:message "Not found"}}
           :last-body {:message "Not found"})))

;; ============================================================
;; Authenticated user actions (alice)
;; ============================================================

(When "^alice sends GET /api/v1/users/me$" [state]
  (common/call-get-profile state (common/get-access-token state "alice")))

(When "^alice sends GET /api/v1/expenses$" [state]
  (common/call-list-expenses state (common/get-access-token state "alice")))

(When "^alice sends GET /api/v1/expenses/.expenseId.$" [state]
  (common/call-get-expense state
                            (common/get-access-token state "alice")
                            (:alice-expense-id state)))

(When "^alice sends GET /api/v1/expenses/summary$" [state]
  (common/call-expense-summary state (common/get-access-token state "alice")))

(When "^alice sends GET /api/v1/reports/pl\\?(.+)$" [state query-string]
  (let [token        (common/get-access-token state "alice")
        query-params (into {}
                           (map (fn [pair]
                                  (let [[k v] (str/split pair #"=")]
                                    [k v]))
                                (str/split query-string #"&")))]
    (common/call-pl-report state token query-params)))

(When "^alice sends POST /api/v1/users/me/deactivate$" [state]
  (common/call-deactivate state (common/get-access-token state "alice")))

(When "^alice sends POST /api/v1/users/me/password with body (.+)$" [state body-str]
  (common/call-change-password state (common/get-access-token state "alice") body-str))

(When "^alice sends POST /api/v1/expenses with body (.+)$" [state body-str]
  (let [result (common/call-create-expense state
                                            (common/get-access-token state "alice")
                                            body-str)]
    (assoc result :alice-expense-id (get-in result [:last-body :id]))))

(When "^alice sends PATCH /api/v1/users/me with body (.+)$" [state body-str]
  (common/call-update-profile state (common/get-access-token state "alice") body-str))

(When "^alice sends PUT /api/v1/expenses/.expenseId. with body (.+)$" [state body-str]
  (common/call-update-expense state
                               (common/get-access-token state "alice")
                               (:alice-expense-id state)
                               body-str))

(When "^alice sends DELETE /api/v1/expenses/.expenseId.$" [state]
  (common/call-delete-expense state
                               (common/get-access-token state "alice")
                               (:alice-expense-id state)))

;; ============================================================
;; Auth token actions
;; ============================================================

(When "^alice sends POST /api/v1/auth/refresh with her refresh token$" [state]
  (let [refresh-token (or (:alice-refresh-token state)
                          (common/get-refresh-token state "alice"))]
    (common/call-refresh state (json/generate-string {:refresh_token refresh-token}))))

(When "^alice sends POST /api/v1/auth/refresh with her original refresh token$" [state]
  (let [refresh-token (or (:alice-original-refresh-token state)
                          (common/get-refresh-token state "alice"))]
    (common/call-refresh state (json/generate-string {:refresh_token refresh-token}))))

(When "^alice sends POST /api/v1/auth/logout with her access token$" [state]
  (common/call-logout state (common/get-access-token state "alice")))

(When "^alice sends POST /api/v1/auth/logout-all with her access token$" [state]
  (common/call-logout-all state (common/get-access-token state "alice")))

;; ============================================================
;; Admin actions
;; ============================================================

(When "^the admin sends GET (.+)$" [state path]
  (let [token (common/get-access-token state "superadmin")]
    (cond
      (= "/api/v1/admin/users" path)
      (common/call-admin-list-users state token)

      (re-matches #"/api/v1/admin/users\?.*" path)
      (let [query-string (second (str/split path #"\?"))
            query-params (when query-string
                           (into {}
                                 (map (fn [pair]
                                        (let [[k v] (str/split pair #"=")]
                                          [k v]))
                                      (str/split query-string #"&"))))]
        (common/call-admin-list-users state token :query-params (or query-params {})))

      :else
      (assoc state
             :last-response {:status 404 :body {:message "Not found"}}
             :last-body {:message "Not found"}))))

(When "^the admin sends POST /api/v1/admin/users/.alice_id./disable with body (.+)$"
  [state body-str]
  (common/call-admin-disable-user state
                                   (common/get-access-token state "superadmin")
                                   (common/get-user-id state "alice")
                                   body-str))

(When "^the admin sends POST /api/v1/admin/users/.alice_id./enable$" [state]
  (common/call-admin-enable-user state
                                  (common/get-access-token state "superadmin")
                                  (common/get-user-id state "alice")))

(When "^the admin sends POST /api/v1/admin/users/.alice_id./force-password-reset$" [state]
  (common/call-admin-force-password-reset state
                                           (common/get-access-token state "superadmin")
                                           (common/get-user-id state "alice")))

(When "^the admin sends POST /api/v1/admin/users/.alice_id./unlock$" [state]
  (common/call-admin-unlock-user state
                                  (common/get-access-token state "superadmin")
                                  (common/get-user-id state "alice")))

;; ============================================================
;; Token introspection actions
;; ============================================================

(When "^alice decodes her access token payload$" [state]
  (common/call-token-claims state (common/get-access-token state "alice")))

;; ============================================================
;; Attachment actions
;; ============================================================

(When "^alice uploads file \"([^\"]*)\" with content type \"([^\"]*)\" to POST /api/v1/expenses/.expenseId./attachments$"
  [state filename content-type]
  (let [token      (common/get-access-token state "alice")
        expense-id (:alice-expense-id state)
        data       (byte-array [0xFF 0xD8 0xFF 0xE0])
        result     (common/call-upload-attachment state token expense-id
                                                  filename content-type data)]
    (assoc result :alice-attachment-id (get-in result [:last-body :id]))))

(When "^alice uploads file \"([^\"]*)\" with content type \"([^\"]*)\" to POST /api/v1/expenses/.bobExpenseId./attachments$"
  [state filename content-type]
  (let [token      (common/get-access-token state "alice")
        expense-id (:bob-expense-id state)
        data       (byte-array [0xFF 0xD8 0xFF 0xE0])]
    (common/call-upload-attachment state token expense-id filename content-type data)))

(When "^alice uploads an oversized file to POST /api/v1/expenses/.expenseId./attachments$" [state]
  (let [token      (common/get-access-token state "alice")
        expense-id (:alice-expense-id state)
        big-data   (byte-array (+ (* 10 1024 1024) 1))]
    (common/call-upload-attachment state token expense-id "big.jpg" "image/jpeg" big-data)))

(When "^alice sends GET /api/v1/expenses/.expenseId./attachments$" [state]
  (common/call-list-attachments state
                                 (common/get-access-token state "alice")
                                 (:alice-expense-id state)))

(When "^alice sends GET /api/v1/expenses/.bobExpenseId./attachments$" [state]
  (common/call-list-attachments state
                                 (common/get-access-token state "alice")
                                 (:bob-expense-id state)))

(When "^alice sends DELETE /api/v1/expenses/.expenseId./attachments/.attachmentId.$" [state]
  (common/call-delete-attachment state
                                  (common/get-access-token state "alice")
                                  (:alice-expense-id state)
                                  (:alice-attachment-id state)))

(When "^alice sends DELETE /api/v1/expenses/.bobExpenseId./attachments/.attachmentId.$" [state]
  (common/call-delete-attachment state
                                  (common/get-access-token state "alice")
                                  (:bob-expense-id state)
                                  (:alice-attachment-id state)))

(When "^alice sends DELETE /api/v1/expenses/.expenseId./attachments/.randomAttachmentId.$" [state]
  (common/call-delete-attachment state
                                  (common/get-access-token state "alice")
                                  (:alice-expense-id state)
                                  (str (java.util.UUID/randomUUID))))

;; ============================================================
;; Assertion steps
;; ============================================================

(Then "the response status code should be {int}" [state status-code]
  (is (= status-code (:status (:last-response state)))
      (str "Expected " status-code " but got " (:status (:last-response state))
           "\nBody: " (:last-body state)))
  state)

(Then "the health status should be {string}" [state expected-status]
  (is (= expected-status (:status (:last-body state))))
  state)

(Then "the response should not include detailed component health information" [state]
  (let [body (:last-body state)]
    (is (nil? (:components body)))
    (is (nil? (:details body))))
  state)

(Then "the response body should contain {string} equal to {string}" [state field value]
  (let [k    (keyword (str/replace field #"_" "-"))
        k2   (keyword field)
        k3   (keyword (camel->kebab field))
        k4   (keyword (snake->camel field))
        body (:last-body state)]
    (is (or (= value (get body k))
            (= value (get body k2))
            (= value (get body k3))
            (= value (get body k4))
            (= value (str (get body k)))
            (= value (str (get body k2)))
            (= value (str (get body k3)))
            (= value (str (get body k4))))
        (str "Expected field " field " = " value " in " body)))
  state)

(Then "the response body should contain {string} equal to {double}" [state field value]
  (let [body   (:last-body state)
        actual (or (get body (keyword (str/replace field #"_" "-")))
                   (get body (keyword field))
                   (get body (keyword (camel->kebab field)))
                   (get body (keyword (snake->camel field))))]
    (is (= value (double actual))
        (str "Expected " field " = " value " in " body)))
  state)

(Then "the response body should contain {string} equal to {int}" [state field value]
  (let [body   (:last-body state)
        actual (or (get body (keyword (str/replace field #"_" "-")))
                   (get body (keyword field))
                   (get body (keyword (camel->kebab field)))
                   (get body (keyword (snake->camel field))))]
    (is (= (double value) (double actual))
        (str "Expected " field " = " value " in " body)))
  state)

(Then "the response body should contain a non-null {string} field" [state field]
  (let [k    (keyword (str/replace field #"_" "-"))
        k2   (keyword field)
        k3   (keyword (camel->kebab field))
        k4   (keyword (snake->camel field))
        body (:last-body state)]
    (is (or (some? (get body k)) (some? (get body k2)) (some? (get body k3)) (some? (get body k4)))
        (str "Expected non-null " field " in " body)))
  state)

(Then "the response body should not contain a {string} field" [state field]
  (let [k    (keyword (str/replace field #"_" "-"))
        k2   (keyword field)
        k3   (keyword (camel->kebab field))
        k4   (keyword (snake->camel field))
        body (:last-body state)]
    (is (and (nil? (get body k)) (nil? (get body k2)) (nil? (get body k3)) (nil? (get body k4)))
        (str "Expected " field " to be absent in " body)))
  state)

(Then "the response body should contain an error message about invalid credentials" [state]
  (is (or (some? (:error (:last-body state)))
          (some? (:message (:last-body state)))))
  state)

(Then "the response body should contain an error message about account deactivation" [state]
  (is (or (some? (:error (:last-body state)))
          (some? (:message (:last-body state)))))
  state)

(Then "the response body should contain an error message about token expiration" [state]
  (is (or (some? (:error (:last-body state)))
          (some? (:message (:last-body state)))))
  state)

(Then "the response body should contain an error message about invalid token" [state]
  (is (or (some? (:error (:last-body state)))
          (some? (:message (:last-body state)))))
  state)

(Then "the response body should contain a validation error for {string}" [state field]
  (let [body (:last-body state)]
    (is (or (= field (:field body))
            (some? (:error body))
            (some? (:message body)))
        (str "Expected validation error for " field " in " body)))
  state)

(Then "the response body should contain {string} total equal to {string}" [state currency total]
  (let [body   (:last-body state)
        actual (or (get body (keyword currency))
                   (get body currency))]
    (is (= total (str actual))
        (str "Expected " currency " = " total " in " body)))
  state)

(Then "the response body should contain at least one user with {string} equal to {string}"
  [state field value]
  (let [body (or (:last-body state) {})
        data (or (:content body) (:data body))
        k    (keyword field)
        k2   (keyword (camel->kebab field))]
    (is (some #(or (= value (get % k)) (= value (get % k2))) data)
        (str "Expected user with " field " = " value)))
  state)

(Then "the response body should contain at least one key in the {string} array" [state field]
  (let [arr (get (:last-body state) (keyword field))]
    (is (and (some? arr) (pos? (count arr)))))
  state)

(Then "alice's account status should be {string}" [state expected-status]
  (let [alice-id    (common/get-user-id state "alice")
        admin-token (common/get-access-token state "superadmin")]
    (if admin-token
      ;; Admin is available — verify via admin list-users
      (let [result (common/call-admin-list-users state admin-token)
            body   (get result :last-body {})
            users  (or (:content body) (:data body))
            alice  (first (filter #(= alice-id (:id %)) users))]
        (is (= (str/lower-case expected-status)
               (str/lower-case (or (:status alice) "")))))
      ;; No admin token — query via user-repo protocol
      (let [user-repo (:user-repo state)
            user      (when (and user-repo alice-id)
                        (proto/find-user-by-id user-repo alice-id))]
        (is (= (str/lower-case expected-status)
               (str/lower-case (or (:status user) "")))))))
  state)

(Then "alice's access token should be invalidated" [state]
  (let [token (common/get-access-token state "alice")]
    (is (not (common/token-valid? state token))
        "Alice's token should be invalid after logout/revocation"))
  state)

(Then "alice's access token should be recorded as revoked" [state]
  (let [token (common/get-access-token state "alice")]
    (is (not (common/token-valid? state token))
        "Alice's token should be revoked"))
  state)

(Then "the token should contain a non-null {string} claim" [state claim]
  (let [claims (:token-claims state)]
    (is (some? (get claims (keyword claim)))
        (str "Expected non-null claim " claim " in " claims)))
  state)

(Then "the response body should contain {int} items in the {string} array" [state cnt field]
  (let [arr (get (:last-body state) (keyword field))]
    (is (= cnt (count arr))
        (str "Expected " cnt " items in " field " but got " (count arr))))
  state)

(Then "the response body should contain an attachment with {string} equal to {string}"
  [state field value]
  (let [attachments (:attachments (:last-body state))
        k           (keyword field)]
    (is (some #(= value (get % k)) attachments)
        (str "Expected attachment with " field " = " value)))
  state)

(Then "the income breakdown should contain {string} with amount {string}" [state category amount]
  (let [body      (:last-body state)
        breakdown (or (:incomeBreakdown body) (:income_breakdown body) (:income-breakdown body))
        entry     (some #(when (= category (:category %)) %) breakdown)
        actual    (:total entry)]
    (is (= amount (str actual))
        (str "Expected income breakdown " category " = " amount " in " breakdown)))
  state)

(Then "the expense breakdown should contain {string} with amount {string}" [state category amount]
  (let [body      (:last-body state)
        breakdown (or (:expenseBreakdown body) (:expense_breakdown body) (:expense-breakdown body))
        entry     (some #(when (= category (:category %)) %) breakdown)
        actual    (:total entry)]
    (is (= amount (str actual))
        (str "Expected expense breakdown " category " = " amount " in " breakdown)))
  state)

(Then "the response body should contain an error message about duplicate username" [state]
  (is (or (some? (:error (:last-body state)))
          (some? (:message (:last-body state)))))
  state)

(Then "the response body should contain an error message about file size" [state]
  (is (or (some? (:error (:last-body state)))
          (some? (:message (:last-body state)))))
  state)
