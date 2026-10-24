;; => Refs coordinate across identities: dosync retries the transaction to commit.
(def balance-a (ref 100)) ;; => first account
(def balance-b (ref 50)) ;; => second account
(dosync ;; => both updates commit together or not at all
  (alter balance-a - 30) ;; => debit thirty
  (alter balance-b + 30)) ;; => credit thirty
(println @balance-a @balance-b) ;; => prints 70 80
