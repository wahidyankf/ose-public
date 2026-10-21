;; => Docstrings document functions; ;; comments explain why lines exist.
(defn total
  "Sums :price over items; empty input totals zero." ;; => the contract in one line
  [items] ;; => a collection of maps with :price
  (reduce + 0 (map :price items))) ;; => the whole implementation
(println (:doc (meta #'total))) ;; => prints the docstring back
(println (total [{:price 5}])) ;; => prints 5
