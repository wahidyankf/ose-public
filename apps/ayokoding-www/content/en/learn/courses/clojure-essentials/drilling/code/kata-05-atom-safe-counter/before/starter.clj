;; => Kata 5 starter: a var mutation that races under concurrency.
(def hits 0) ;; => shared counter, unguarded
(dotimes [_ 5] (def hits (inc hits))) ;; => rebind five times, races in threads
(println hits) ;; => prints 5, correct only while single-threaded
