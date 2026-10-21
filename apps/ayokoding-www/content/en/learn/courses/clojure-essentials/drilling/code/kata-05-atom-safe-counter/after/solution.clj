;; => Kata 5 solution: swap! with a pure function keeps concurrent bumps exact.
(def hits (atom 0)) ;; => shared counter, guarded
(dotimes [_ 100] (swap! hits inc)) ;; => one hundred atomic bumps
(println @hits) ;; => prints 100
(println (swap! hits + 50)) ;; => prints 150, swap! returns the new value
