;; => :pre and :post guard a function at its own front door.
(defn discount [price pct] ;; => pct must be a fraction between 0 and 1
  {:pre [(number? price) (<= 0 pct 1)] ;; => inputs checked before the body
   :post [(number? %)]} ;; => the result checked after the body
  (* price (- 1 pct))) ;; => the only line callers came for
(println (discount 100 0.2)) ;; => prints 80.0
;; => assert states an invariant anywhere; it throws AssertionError on lies.
(let [total (discount 50 0.1)] ;; => reuse the guarded function
  (assert (pos? total) "total stays positive") ;; => documents the invariant
  (println total)) ;; => prints 45.0
