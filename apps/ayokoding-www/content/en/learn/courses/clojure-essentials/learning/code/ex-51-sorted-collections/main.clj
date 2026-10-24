;; => sorted-map traverses by key; subseq slices ranges without scanning.
(def by-age (sorted-map 30 "ada" 25 "ben" 40 "cid")) ;; => ordered by key
(println by-age) ;; => prints {25 "ben", 30 "ada", 40 "cid"}
(println (subseq by-age >= 30)) ;; => prints the senior slice
(println (sort [3 1 2])) ;; => prints (1 2 3)
(println (sort-by :age [{:age 30} {:age 25}])) ;; => prints youngest first
