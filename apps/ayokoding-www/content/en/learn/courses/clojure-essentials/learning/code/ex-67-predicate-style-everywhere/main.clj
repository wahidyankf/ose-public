;; => Predicates end in ? and read as questions; every? lifts them over collections.
(println (odd? 7)) ;; => prints true
(println (every? odd? [1 3 5])) ;; => prints true
(println (some even? [1 2 3])) ;; => prints true, the witness found
(defn adult? [age] (>= age 18)) ;; => domain predicate in the same shape
(println (adult? 20)) ;; => prints true
(println (filter adult? [16 20 15 21])) ;; => prints (20 21)
