;; => ex-info pairs a message with a data map; ex-data reads the map back.
(defn load-user [id users] ;; => look up one user or fail informatively
  (or (get users id) ;; => happy path returns the user map
      (throw (ex-info "unknown user" {:id id :known (sort (keys users))})))) ;; => failure carries context
(println (load-user :ada {:ada {:role :admin}})) ;; => prints the user map
(println (ex-data (try (load-user :bob {:ada 1}) (catch clojure.lang.ExceptionInfo e e)))) ;; => prints the data map
