;; => Kata 1 solution: ex-info carries the shortfall as data, not prose.
(defn withdraw [balance amount] ;; => subtract or fail with context
  (if (>= balance amount) ;; => enough funds
    (- balance amount) ;; => the new balance
    (throw (ex-info "insufficient funds" {:balance balance :amount amount :short (- amount balance)})))) ;; => data, not drama
(println (withdraw 100 30)) ;; => prints 70
(println (ex-data (try (withdraw 10 30) (catch clojure.lang.ExceptionInfo e e)))) ;; => prints the shortfall map
