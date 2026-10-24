(require '[clojure.test :refer [deftest is run-tests]]) ;; => with-redefs swaps bindings
;; => with-redefs replaces the var only inside its body; outside stays real.
(defn fetch-rate [] 1.5) ;; => stands in for a network call
(defn price [usd] (* usd (fetch-rate))) ;; => converts through the rate
(deftest pinned-rate ;; => the stubbed rate makes the math exact
  (with-redefs [fetch-rate (fn [] 2.0)] ;; => fixed rate for this test only
    (is (= 10.0 (price 5))))) ;; => five units at two each
(let [{:keys [fail error]} (run-tests)] ;; => run the suite
  (println "stubbed:" (price 5) "green:" (zero? (+ fail error)))) ;; => prints stubbed: 7.5 green: true
