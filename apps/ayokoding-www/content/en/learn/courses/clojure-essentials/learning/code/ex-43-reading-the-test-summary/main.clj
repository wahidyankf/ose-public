(require '[clojure.test :refer [deftest is run-tests]]) ;; => the summary rides the return value
;; => run-tests returns its summary; select the fields the transcript needs.
(deftest some-maths ;; => two passing facts for the tally
  (is (= 2 (+ 1 1))) ;; => one plus one
  (is (= 6 (* 2 3)))) ;; => two times three
(let [summary (run-tests)] ;; => the summary map is the return value
  (println "summary:" (select-keys summary [:test :pass :fail :error]))) ;; => prints the tally
