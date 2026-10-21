(require '[clojure.edn :as edn]) ;; => versions live in data files
;; => Exact pins reproduce; a range would resolve differently next month.
(let [deps (:deps (edn/read-string (slurp "deps.edn")))] ;; => reuse the project fixture
  (println (get-in deps ['org.clojure/test.check :mvn/version]))) ;; => prints 1.1.3
;; => The drift check is a string comparison, not a feeling.
(let [deps (:deps (edn/read-string (slurp "deps.edn")))] ;; => read the pins again
  (println (= "1.1.3" (get-in deps ['org.clojure/test.check :mvn/version])))) ;; => prints true
