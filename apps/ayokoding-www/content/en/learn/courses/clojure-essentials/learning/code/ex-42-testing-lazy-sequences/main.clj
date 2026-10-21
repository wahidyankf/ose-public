(require '[clojure.test :refer [deftest is run-tests]]) ;; => realize before asserting
;; => Lazy seqs assert on realized values; take bounds the infinite.
(deftest finite-lazy ;; => squares of naturals, first three only
  (is (= [0 1 2] (take 3 (map #(* % %) (range)))))) ;; => bounded before compared
(deftest infinite-safe ;; => tenth element of the counting series
  (is (= 10 (nth (iterate inc 0) 10)))) ;; => spot check without realizing all
(let [{:keys [test pass fail error]} (run-tests)] ;; => run both
  (println "tests:" test "pass:" pass "fail:" fail "error:" error)) ;; => prints 2 2 0 0
