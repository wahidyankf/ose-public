;; => Records print their type; maps print bare; both answer keyword lookup.
(defrecord Point [x y]) ;; => named type with two fields
(let [p (->Point 1 2)] ;; => one point
  (println p) ;; => prints the type with its fields
  (println (:x p) (:y p)) ;; => prints 1 2, lookup works
  (println (= p (->Point 1 2)))) ;; => prints true, value equality
