(require '[clojure.string :as str]) ;; => the pipeline under study
;; => Read pipelines inside out or top down: name each stage before judging it.
(def sample [{:name "ada" :age 30} {:name "ben" :age 25} {:name "cid" :age 40}]) ;; => fixed people
(println (->> sample (map :age) (filter #(> % 26)) sort vec)) ;; => prints [30 40]
;; => The reading order: collection first, then one transform per line.
(println (str/join ", " (map :name (filter #(> (:age %) 26) sample)))) ;; => prints ada, cid
