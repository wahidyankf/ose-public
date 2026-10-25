(require '[clojure.test :refer [deftest is run-tests]]) ;; => the standard test vocabulary
;; => deftest names a test; is asserts facts; run-tests reports counts as data.
(deftest adds ;; => first test: two small arithmetic facts
  (is (= 4 (+ 2 2))) ;; => two and two make four
  (is (= 0 (+ 1 -1)))) ;; => opposites cancel
(deftest divides ;; => second test: exact division stays exact
  (is (= 2 (/ 4 2)))) ;; => four over two is two
(let [{:keys [test pass fail error]} (run-tests)] ;; => run everything defined above
  (println "tests:" test "pass:" pass "fail:" fail "error:" error)) ;; => prints tests: 2 pass: 3 fail: 0 error: 0
