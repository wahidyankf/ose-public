(require '[clojure.test :refer [deftest is run-tests]]) ;; => red first, then green
;; => Write the failing assertion first; watch it fail; then earn the pass.
(defn total [items] (reduce + 0 (map :price items))) ;; => sums prices, empty is zero
(deftest totals-right ;; => the expectation stated before the code existed
  (is (= 30 (total [{:price 10} {:price 20}]))) ;; => two lines sum to thirty
  (is (= 0 (total [])))) ;; => empty sums to zero, not nil
(let [{:keys [fail error]} (run-tests)] ;; => the settled run is green
  (println "green:" (zero? (+ fail error)))) ;; => prints green: true
