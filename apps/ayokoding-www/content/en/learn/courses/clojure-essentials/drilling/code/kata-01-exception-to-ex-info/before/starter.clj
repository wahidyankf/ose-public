;; => Kata 1 starter: stringly failures force callers to parse messages.
(defn withdraw [balance amount] ;; => subtract or fail
  (if (>= balance amount) ;; => enough funds
    (- balance amount) ;; => the new balance
    (throw (RuntimeException. (str "need " amount " have " balance))))) ;; => message only
(println (withdraw 100 30)) ;; => prints 70, the happy path works
