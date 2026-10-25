(require '[clojure.test :refer [deftest is run-tests]]) ;; => the standard vocabulary
;; => Kata 2 solution: the test states the contract; the suite proves it.
(defn discount [price pct] ;; => the function under test
  (* price (- 1 pct))) ;; => unchanged implementation, now pinned
(deftest discount-maths ;; => two facts pin the behavior
  (is (= 90.0 (discount 100 0.1))) ;; => ten percent off one hundred
  (is (= 0.0 (discount 0 0.5)))) ;; => half off zero stays zero
(let [{:keys [fail error]} (run-tests)] ;; => run the suite
  (println "green:" (zero? (+ fail error)))) ;; => prints green: true
