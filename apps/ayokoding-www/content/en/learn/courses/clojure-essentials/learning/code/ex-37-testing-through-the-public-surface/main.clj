(require '[clojure.test :refer [deftest is run-tests]]) ;; => same vocabulary, private target
;; => Test private helpers through the public function, never around it.
(defn- square [x] (* x x)) ;; => private: the dash hides it from other namespaces
(defn area [r] (* Math/PI (square r))) ;; => public entry over the private helper
(deftest area-rounds ;; => behavior proves the helper without naming it
  (is (< 3.13 (area 1) 3.15))) ;; => pi area with tolerance, not brittle digits
(let [{:keys [fail error]} (run-tests)] ;; => run the suite
  (println "green:" (zero? (+ fail error)))) ;; => prints green: true
