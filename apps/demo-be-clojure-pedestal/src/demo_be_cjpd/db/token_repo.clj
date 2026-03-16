(ns demo-be-cjpd.db.token-repo
  "Revoked token repository operations."
  (:require [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs])
  (:import (java.util UUID)))

(defn- now-str []
  (.format java.time.format.DateTimeFormatter/ISO_INSTANT
           (java.time.Instant/now)))

(defn revoke-token!
  "Revoke a token by its JTI for a user."
  [ds jti user-id]
  (let [id  (str (UUID/randomUUID))
        now (now-str)]
    (jdbc/execute! ds
                   ["INSERT INTO revoked_tokens (id, jti, user_id, revoked_at)
                     VALUES (?, ?, ?, ?)
                     ON CONFLICT(jti) DO NOTHING"
                    id jti user-id now])))

(defn revoked?
  "Return true if the given JTI has been revoked."
  [ds jti]
  (let [row (jdbc/execute-one! ds
                               ["SELECT id FROM revoked_tokens WHERE jti = ?" jti]
                               {:builder-fn rs/as-unqualified-maps})]
    (some? row)))

(defn revoke-all-for-user!
  "Revoke all tokens for a given user by inserting a special wildcard marker."
  [ds user-id]
  (let [id  (str (UUID/randomUUID))
        now (now-str)
        sentinel-jti (str "ALL:" user-id ":" now)]
    (jdbc/execute! ds
                   ["INSERT INTO revoked_tokens (id, jti, user_id, revoked_at)
                     VALUES (?, ?, ?, ?)"
                    id sentinel-jti user-id now])))

(defn all-revoked-for-user?
  "Return true if a logout-all has been issued for the user after the given iat timestamp."
  [ds user-id iat]
  (let [rows (jdbc/execute! ds
                            ["SELECT revoked_at FROM revoked_tokens WHERE user_id = ? AND jti LIKE 'ALL:%'"
                             user-id]
                            {:builder-fn rs/as-unqualified-maps})]
    (boolean
     (some (fn [row]
             (let [revoked-epoch (-> (:revoked_at row)
                                     java.time.Instant/parse
                                     .getEpochSecond)]
               (>= revoked-epoch iat)))
           rows))))
