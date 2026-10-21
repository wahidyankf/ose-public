(require '[clojure.string :as str]) ;; => join for the string finish
;; => first, map, and reduce cross vectors, sets, strings, and maps alike.
(println (map inc [1 2 3])) ;; => vector in, seq out: (2 3 4)
(println (sort (filter odd? #{1 2 3 4}))) ;; => set in, sorted seq out: (1 3)
(println (map count ["ab" "cde"])) ;; => strings measure by count: (2 3)
(println (reduce + (map val {:a 1 :b 2}))) ;; => map entries sum through val: 3
(println (str/join (take 3 (cycle "ab")))) ;; => prints aba, infinite tamed
