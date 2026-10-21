;; => = compares values structurally across types; identical? checks identity.
(println (= [1 2] '(1 2))) ;; => prints true, different types, same values
(println (= {:a 1} {:a 1})) ;; => prints true
(println (identical? [1 2] [1 2])) ;; => prints false, two distinct objects
(let [v [1 2]] (println (identical? v v))) ;; => prints true, same reference
(println (= #{1 2} #{2 1})) ;; => prints true, order never mattered
