(require '[clojure.string :as str]) ;; => join and upper-case for the pipeline
;; => Thread-first threads each result as the first argument of the next form.
(println (-> {:a 1} (assoc :b 2) (:b))) ;; => prints 2
;; => Thread-last suits sequence pipelines: data flows into the last slot.
(println (->> [1 2 3 4] (map inc) (filter even?) sort vec)) ;; => prints [2 4]
;; => as-> names the thread when neither first nor last position fits.
(println (as-> [1 2 3] xs (str/join "," xs) (str "<" xs ">"))) ;; => prints <1,2,3>
