;; => Kata 7 starter: an explicit accumulation loop over prices.
(defn total-over [min-price rows] ;; => sum prices above the floor
  (loop [left rows acc 0] ;; => left consumes, acc accumulates
    (if (empty? left) ;; => nothing left
      acc ;; => the total
      (let [p (:price (first left))] ;; => inspect the head row
        (recur (rest left) (if (and p (> p min-price)) (+ acc p) acc)))))) ;; => add or skip
(println (total-over 0 [{:price 10} {:price -5} {:price 20}])) ;; => prints 30
