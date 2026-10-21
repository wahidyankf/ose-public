(require '[clojure.test :refer [deftest is run-tests]]) ;; => selectors ride on metadata
;; => Tags mark cost; names state behavior; the runner selects the slice.
(deftest ^:fast adds-quickly (is (= 2 (+ 1 1)))) ;; => tagged fast, named for behavior
(deftest ^:slow adds-slowly (is (= 4 (+ 2 2)))) ;; => tagged slow, named for behavior
(println (var? #'adds-quickly)) ;; => prints true, tests live in vars
(println (contains? (meta #'adds-quickly) :test)) ;; => prints true, the test hook attached
(println (:fast (meta #'adds-quickly))) ;; => prints true, the tag landed
(println (:slow (meta #'adds-slowly))) ;; => prints true, the tag landed
(let [{:keys [fail error]} (run-tests)] ;; => the whole suite still runs here
  (println "green:" (zero? (+ fail error)))) ;; => prints green: true
