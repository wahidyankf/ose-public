(require '[clojure.test.check :as tc] '[clojure.test.check.generators :as gen] '[clojure.test.check.properties :as prop]) ;; => property vocabulary, locked and pinned
;; => Properties hold over all inputs; the fixed seed makes the run reproducible.
(let [prop (prop/for-all [v (gen/vector gen/small-integer)] (= (count v) (count (reverse v)))) ;; => reverse keeps length
      result (tc/quick-check 100 prop :seed 42)] ;; => one hundred cases, fixed seed
  (println "cases:" (:num-tests result)) ;; => prints cases: 100
  (println "pass:" (true? (:result result)))) ;; => prints pass: true
