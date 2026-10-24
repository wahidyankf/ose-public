(require '[clojure.test :refer [deftest is run-tests use-fixtures]]) ;; => fixtures wrap tests
;; => Fixtures set up and tear down around each test; the log proves the order.
(def log (atom [])) ;; => records every setup, test, and teardown step
(use-fixtures :each (fn [t] (swap! log conj :setup) (t) (swap! log conj :teardown))) ;; => wrap the test
(deftest only-fact ;; => one test keeps the transcript order fixed
  (swap! log conj :test) ;; => the test leaves its own mark
  (is (= 1 1))) ;; => the fact itself is trivial on purpose
(run-tests) ;; => runs through the fixture; the report prints as usual
(println (vec @log)) ;; => prints [:setup :test :teardown]
