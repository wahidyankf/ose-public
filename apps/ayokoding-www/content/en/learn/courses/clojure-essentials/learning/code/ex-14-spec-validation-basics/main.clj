(require '[clojure.spec.alpha :as s]) ;; => the standard validation vocabulary
;; => s/def names a predicate; s/valid? answers true or false, never throws.
(s/def ::port (s/and int? #(<= 1 % 65535))) ;; => ports are ints in range
(println (s/valid? ::port 8080)) ;; => prints true
(println (s/valid? ::port 99999)) ;; => prints false
(println (s/valid? ::port "http")) ;; => prints false, wrong type
;; => explain-data counts problems as data; print the count, not prose.
(println "problems:" (count (:clojure.spec.alpha/problems (s/explain-data ::port 0)))) ;; => prints problems: 1
