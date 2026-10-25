;; => Kata 2 starter: a discount function with no tests at all.
(defn discount [price pct] ;; => ten percent off should be exact
  (* price (- 1 pct))) ;; => the implementation, unverified
(println (discount 100 0.1)) ;; => prints 90.0, trust without proof
